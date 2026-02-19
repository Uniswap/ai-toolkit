/**
 * Review Pipeline - Inngest Durable Function
 *
 * Orchestrates the complete PR review lifecycle as a 9-step durable function.
 * Each step is independently retriable and creates fresh connections to external
 * services (DB, GitHub, Claude) to ensure serializability.
 *
 * Pipeline steps:
 *   1. Fetch PR metadata (title, body, author, draft status)
 *   2. Fetch and size-check the diff
 *   3. Create a review record in the database
 *   4. Post "review in progress" status comment
 *   5. Fetch existing comments for thread context
 *   6. Build the review prompt with overrides
 *   7. Call Claude for the review
 *   8. Post the review to GitHub
 *   9. Finalize - update DB record with results
 */

import { join } from 'node:path';

import { createClaudeClient, requestReview } from '../claude/client.js';
import { getEnv } from '../config/env.js';
import { createDb } from '../db/connection.js';
import { and, eq } from 'drizzle-orm';

import {
  createReview,
  createReviewComments,
  getLatestReview,
  getOverridesForRepo,
  updateReviewStatus,
} from '../db/queries.js';
import { repositories } from '../db/schema.js';
import {
  getExistingComments,
  getInstallationOctokit,
  getMergeBase,
  getGitHubApp,
  getPrDiff,
  getPullRequest,
  upsertBotComment,
} from '../github/index.js';
import { buildPrompt } from '../prompt/builder.js';
import { reviewOutputSchema } from '../prompt/output-schema.js';
import { restructureCommentsIntoThreads } from '../prompt/thread-utils.js';
import type { TemplateVariables } from '../prompt/types.js';
import { postReview } from '../review/executor.js';
import { inngest } from './client.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOT_COMMENT_MARKER = '<!-- claude-pr-review-bot -->';

/** Path to the prompt sections directory, resolved relative to CWD or dist. */
function getPromptDir(): string {
  // In production builds, sections are alongside the compiled output.
  // In development, they're in the src directory.
  // We use a relative path from the project root.
  return join(process.cwd(), 'src', 'prompts', 'sections');
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[review-pipeline] ${message}`);
}

function logError(message: string): void {
  console.error(`[review-pipeline] ERROR: ${message}`);
}

// ---------------------------------------------------------------------------
// Pipeline Result Types
// ---------------------------------------------------------------------------

interface PipelineSkipped {
  status: 'skipped';
  reason: string;
}

interface PipelineCompleted {
  status: 'completed';
  reviewId: string;
}

interface PipelineFailed {
  status: 'failed';
  error: string;
}

type PipelineResult = PipelineSkipped | PipelineCompleted | PipelineFailed;

// ---------------------------------------------------------------------------
// Step Return Types (must be serializable)
// ---------------------------------------------------------------------------

interface PrMetadata {
  prTitle: string;
  prBody: string | null;
  prAuthor: string;
  headSha: string;
  baseRef: string;
  mergeBaseSha: string;
  isDraft: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
}

interface DiffResult {
  tooLarge: boolean;
  lineCount: number;
  diff: string;
}

interface ReviewRecord {
  id: string;
  repositoryId: number;
}

interface ThreadContext {
  threadsJson: string;
  commentCount: number;
}

interface PromptResult {
  prompt: string;
  sections: string[];
  overridesApplied: string[];
}

interface ClaudeResult {
  outputJson: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
}

interface PostResult {
  reviewId: number;
  commentId: number;
  inlineCommentsPosted: number;
  inlineCommentsSkipped: number;
}

// ---------------------------------------------------------------------------
// Pipeline Function
// ---------------------------------------------------------------------------

export const reviewPipeline = inngest.createFunction(
  {
    id: 'review-pipeline',
    retries: 2,
    onFailure: async ({ error, event }) => {
      // In Inngest failure handlers, the original event is nested inside
      // the failure envelope at event.data.event
      const originalEvent = event.data.event;
      const { owner, repo: repoName, prNumber } = originalEvent.data;

      logError(`Pipeline failed for ${owner}/${repoName}#${prNumber}: ${String(error)}`);

      // Attempt to mark the review as failed in the DB
      try {
        const env = getEnv();
        const db = createDb(env.DATABASE_URL);

        // Try to find the review and mark it as failed
        // We don't have the review ID here, so we try to update by PR info
        const repoRecord = await db.query.repositories.findFirst({
          where: (repos, { and, eq }) => and(eq(repos.owner, owner), eq(repos.name, repoName)),
        });

        if (repoRecord) {
          // Get the latest pending/in_progress review for this PR
          const latest = await getLatestReview(db, repoRecord.id, prNumber);

          if (latest && (latest.status === 'pending' || latest.status === 'in_progress')) {
            await updateReviewStatus(db, latest.id, 'failed', {
              errorMessage: String(error),
            });
            log(`Marked review ${latest.id} as failed`);
          }
        }
      } catch (dbError) {
        logError(`Could not mark review as failed in DB: ${String(dbError)}`);
      }
    },
  },
  { event: 'review-bot/pr.review-requested' },
  async ({ event, step }): Promise<PipelineResult> => {
    const { installationId, owner, repo, prNumber, trigger, senderLogin } = event.data;

    log(`Starting review pipeline for ${owner}/${repo}#${prNumber} (trigger: ${trigger})`);

    // -----------------------------------------------------------------------
    // Step 1: Fetch PR metadata
    // -----------------------------------------------------------------------
    const prMeta = await step.run('fetch-pr-metadata', async (): Promise<PrMetadata> => {
      log(`Step 1: Fetching PR metadata for ${owner}/${repo}#${prNumber}`);

      const env = getEnv();
      const app = getGitHubApp(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
      const octokit = await getInstallationOctokit(app, installationId);

      const prInfo = await getPullRequest(octokit, owner, repo, prNumber);

      // For comment-triggered reviews, the webhook may not have the head SHA.
      // Always use the fresh PR data.
      const mergeBaseSha = await getMergeBase(octokit, owner, repo, prInfo.baseRef, prInfo.headSha);

      log(
        `Step 1 complete: PR "${prInfo.title}" by ${prInfo.user}, ` +
          `${prInfo.additions}+ ${prInfo.deletions}-, ${prInfo.changedFiles} files`
      );

      return {
        prTitle: prInfo.title,
        prBody: prInfo.body,
        prAuthor: prInfo.user,
        headSha: prInfo.headSha,
        baseRef: prInfo.baseRef,
        mergeBaseSha,
        isDraft: prInfo.isDraft,
        additions: prInfo.additions,
        deletions: prInfo.deletions,
        changedFiles: prInfo.changedFiles,
      };
    });

    // Skip draft PRs
    if (prMeta.isDraft) {
      log(`Skipping draft PR #${prNumber}`);
      return { status: 'skipped', reason: 'draft' };
    }

    // -----------------------------------------------------------------------
    // Step 2: Fetch and size-check the diff
    // -----------------------------------------------------------------------
    const diffResult = await step.run('fetch-diff', async (): Promise<DiffResult> => {
      log(`Step 2: Fetching diff for ${owner}/${repo}#${prNumber}`);

      const env = getEnv();
      const app = getGitHubApp(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
      const octokit = await getInstallationOctokit(app, installationId);

      const diff = await getPrDiff(octokit, owner, repo, prNumber);
      const lineCount = diff.split('\n').length;

      log(`Step 2 complete: ${lineCount} lines in diff (max: ${env.MAX_DIFF_LINES})`);

      if (lineCount > env.MAX_DIFF_LINES) {
        return { tooLarge: true, lineCount, diff: '' };
      }

      return { tooLarge: false, lineCount, diff };
    });

    if (diffResult.tooLarge) {
      // Post a comment explaining the PR is too large, then skip
      await step.run('post-too-large-comment', async (): Promise<void> => {
        log(`PR #${prNumber} is too large (${diffResult.lineCount} lines), posting skip comment`);

        const env = getEnv();
        const app = getGitHubApp(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
        const octokit = await getInstallationOctokit(app, installationId);

        const body =
          `${BOT_COMMENT_MARKER}\n` +
          `## Claude Code Review\n\n` +
          `> **Skipped** - PR diff is too large for automated review ` +
          `(${diffResult.lineCount} lines, max ${env.MAX_DIFF_LINES}).\n\n` +
          `Consider breaking this PR into smaller, focused changes for better review coverage.`;

        await upsertBotComment(octokit, owner, repo, prNumber, body);
      });

      return { status: 'skipped', reason: 'too_large' };
    }

    // -----------------------------------------------------------------------
    // Step 3: Create review record in DB
    // -----------------------------------------------------------------------
    const reviewRecord = await step.run('create-review-record', async (): Promise<ReviewRecord> => {
      log(`Step 3: Creating review record for ${owner}/${repo}#${prNumber}`);

      const env = getEnv();
      const db = createDb(env.DATABASE_URL);

      // Look up the repository that was already created by the webhook handler
      const [repoRecord] = await db
        .select()
        .from(repositories)
        .where(and(eq(repositories.owner, owner), eq(repositories.name, repo)))
        .limit(1);

      if (!repoRecord) {
        throw new Error(`Repository ${owner}/${repo} not found in database`);
      }

      const review = await createReview(db, {
        repositoryId: repoRecord.id,
        prNumber,
        headSha: prMeta.headSha,
        baseRef: prMeta.baseRef,
        trigger,
      });

      await updateReviewStatus(db, review.id, 'in_progress', {
        mergeBaseSha: prMeta.mergeBaseSha,
      });

      log(`Step 3 complete: Created review ${review.id}`);

      return { id: review.id, repositoryId: repoRecord.id };
    });

    // -----------------------------------------------------------------------
    // Step 4: Post "review in progress" status comment
    // -----------------------------------------------------------------------
    await step.run('post-in-progress', async (): Promise<void> => {
      log(`Step 4: Posting "in progress" comment for ${owner}/${repo}#${prNumber}`);

      const env = getEnv();
      const app = getGitHubApp(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
      const octokit = await getInstallationOctokit(app, installationId);

      const body =
        `${BOT_COMMENT_MARKER}\n` +
        `## Claude Code Review\n\n` +
        `> **Review in progress...** Analyzing ${prMeta.changedFiles} ` +
        `file${prMeta.changedFiles === 1 ? '' : 's'} ` +
        `(${prMeta.additions}+ ${prMeta.deletions}-)\n\n` +
        `_Started by ${trigger === 'comment' ? 'comment request' : 'PR event'} ` +
        `from @${senderLogin}_`;

      await upsertBotComment(octokit, owner, repo, prNumber, body);
      log('Step 4 complete');
    });

    // -----------------------------------------------------------------------
    // Step 5: Fetch existing comments for thread context
    // -----------------------------------------------------------------------
    const threadContext = await step.run(
      'fetch-existing-comments',
      async (): Promise<ThreadContext> => {
        log(`Step 5: Fetching existing comments for ${owner}/${repo}#${prNumber}`);

        const env = getEnv();
        const app = getGitHubApp(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
        const octokit = await getInstallationOctokit(app, installationId);

        const comments = await getExistingComments(octokit, owner, repo, prNumber);

        // Convert to the format expected by thread-utils
        const rawComments = comments.map((c) => ({
          id: c.id,
          path: '', // Issue comments don't have paths
          line: null as number | null,
          body: c.body,
          user: c.user,
          in_reply_to_id: null as number | null,
          created_at: new Date().toISOString(), // We don't get timestamps from getExistingComments
        }));

        const threads = restructureCommentsIntoThreads(rawComments);

        log(`Step 5 complete: ${comments.length} comments, ${threads.length} threads`);

        return {
          threadsJson: JSON.stringify(threads),
          commentCount: comments.length,
        };
      }
    );

    // -----------------------------------------------------------------------
    // Step 6: Build the review prompt
    // -----------------------------------------------------------------------
    const promptResult = await step.run('build-prompt', async (): Promise<PromptResult> => {
      log(`Step 6: Building prompt for ${owner}/${repo}#${prNumber}`);

      const env = getEnv();
      const db = createDb(env.DATABASE_URL);

      // Fetch overrides for this repository
      const overrideRecords = await getOverridesForRepo(db, reviewRecord.repositoryId);
      const overrides: Record<string, string> = {};
      for (const override of overrideRecords) {
        overrides[override.sectionKey] = override.content;
      }

      // Calculate a patch ID for cross-referencing
      const patchId = `${prMeta.headSha.substring(0, 8)}-${Date.now()}`;

      // Determine line counts
      const linesChanged = prMeta.additions + prMeta.deletions;
      const isTrivial = linesChanged < 20;

      const variables: TemplateVariables = {
        REPO_OWNER: owner,
        REPO_NAME: repo,
        PR_NUMBER: String(prNumber),
        BASE_REF: prMeta.baseRef,
        PATCH_ID: patchId,
        MERGE_BASE: prMeta.mergeBaseSha,
        LINES_CHANGED: String(linesChanged),
        CHANGED_FILES: String(prMeta.changedFiles),
        PR_DIFF: diffResult.diff,
        EXISTING_COMMENTS_JSON: threadContext.threadsJson,
      };

      const promptDir = getPromptDir();
      const result = await buildPrompt({
        promptDir,
        variables,
        overrides,
        existingCommentCount: threadContext.commentCount,
        isTrivial,
      });

      // Update the review record with the patch ID
      await updateReviewStatus(db, reviewRecord.id, 'in_progress', {
        patchId,
      });

      log(
        `Step 6 complete: ${result.sections.length} sections, ` +
          `${result.overridesApplied.length} overrides, ` +
          `prompt length: ${result.prompt.length} chars`
      );

      return {
        prompt: result.prompt,
        sections: result.sections,
        overridesApplied: result.overridesApplied,
      };
    });

    // -----------------------------------------------------------------------
    // Step 7: Call Claude
    // -----------------------------------------------------------------------
    const claudeResult = await step.run('call-claude', async (): Promise<ClaudeResult> => {
      log(`Step 7: Calling Claude for ${owner}/${repo}#${prNumber}`);

      const env = getEnv();
      const client = createClaudeClient(env.ANTHROPIC_API_KEY);

      const response = await requestReview(client, {
        prompt: promptResult.prompt,
        model: env.ANTHROPIC_MODEL,
      });

      log(
        `Step 7 complete: ${response.output.pr_review_outcome} ` +
          `(confidence: ${response.output.confidence ?? 'n/a'}, ` +
          `${response.output.inline_comments_new.length} inline comments, ` +
          `${response.promptTokens} prompt tokens, ` +
          `${response.completionTokens} completion tokens, ` +
          `${response.durationMs}ms)`
      );

      return {
        outputJson: JSON.stringify(response.output),
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        durationMs: response.durationMs,
      };
    });

    // -----------------------------------------------------------------------
    // Step 8: Post review to GitHub
    // -----------------------------------------------------------------------
    const postResult = await step.run('post-review', async (): Promise<PostResult> => {
      log(`Step 8: Posting review for ${owner}/${repo}#${prNumber}`);

      const env = getEnv();
      const app = getGitHubApp(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
      const octokit = await getInstallationOctokit(app, installationId);

      const reviewOutput = reviewOutputSchema.parse(JSON.parse(claudeResult.outputJson));

      // Parse thread context for the existing threads
      const existingThreads = JSON.parse(threadContext.threadsJson) as ReturnType<
        typeof JSON.parse
      >;

      const result = await postReview({
        octokit,
        owner,
        repo,
        prNumber,
        headSha: prMeta.headSha,
        baseRef: prMeta.baseRef,
        reviewOutput,
        existingThreads,
      });

      log(
        `Step 8 complete: Review ID ${result.reviewId}, ` +
          `${result.inlineCommentsPosted} comments posted, ` +
          `${result.inlineCommentsSkipped} skipped`
      );

      return {
        reviewId: result.reviewId,
        commentId: result.commentId,
        inlineCommentsPosted: result.inlineCommentsPosted,
        inlineCommentsSkipped: result.inlineCommentsSkipped,
      };
    });

    // -----------------------------------------------------------------------
    // Step 9: Finalize - update DB record
    // -----------------------------------------------------------------------
    await step.run('finalize', async (): Promise<void> => {
      log(`Step 9: Finalizing review ${reviewRecord.id}`);

      const env = getEnv();
      const db = createDb(env.DATABASE_URL);

      const reviewOutput = reviewOutputSchema.parse(JSON.parse(claudeResult.outputJson));

      await updateReviewStatus(db, reviewRecord.id, 'completed', {
        model: env.ANTHROPIC_MODEL,
        outcome: reviewOutput.pr_review_outcome,
        confidence: reviewOutput.confidence,
        reviewBody: reviewOutput.pr_review_body,
        inlineCommentCount: reviewOutput.inline_comments_new.length,
        responseJson: reviewOutput,
        promptTokens: claudeResult.promptTokens,
        completionTokens: claudeResult.completionTokens,
        durationMs: claudeResult.durationMs,
        githubReviewId: BigInt(postResult.reviewId),
        githubCommentId: BigInt(postResult.commentId),
        completedAt: new Date(),
      });

      // Save inline comments to the reviewComments table
      if (reviewOutput.inline_comments_new.length > 0) {
        const commentsToSave = reviewOutput.inline_comments_new.map((c) => ({
          reviewId: reviewRecord.id,
          path: c.path,
          line: c.line,
          body: c.body,
          suggestion: c.suggestion,
          side: c.side ?? 'RIGHT',
        }));

        await createReviewComments(db, commentsToSave);
        log(`Saved ${commentsToSave.length} inline comments to DB`);
      }

      log(`Step 9 complete: Review ${reviewRecord.id} marked as completed`);
    });

    log(`Pipeline complete for ${owner}/${repo}#${prNumber}`);
    return { status: 'completed', reviewId: reviewRecord.id };
  }
);
