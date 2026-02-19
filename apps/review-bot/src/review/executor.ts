/**
 * Review Posting Executor
 *
 * Orchestrates the complete sequence of GitHub API calls required to post
 * a code review. This module is the main entry point for the review posting
 * pipeline, coordinating cleanup, response processing, validation, and
 * submission of the review.
 *
 * Execution sequence:
 * 1. Delete stale pending reviews (prevents HTTP 422 "one pending review" errors)
 * 2. Dismiss previous bot reviews (superseded by new review)
 * 3. Process responses to existing comment threads (reply + optional resolve)
 * 4. Validate new inline comments against the actual diff
 * 5. Build and upsert the main bot comment (the editable review body)
 * 6. Submit the formal GitHub review (verdict + inline comments)
 */

import type { Octokit } from '@octokit/rest';

import {
  createGithubReview,
  deletePendingReviews,
  dismissPreviousReviews,
  filterValidComments,
  findReviewThreadId,
  getPrDiff,
  getValidDiffLines,
  replyToComment,
  resolveReviewThread,
  upsertBotComment,
} from '../github/api.js';
import type { InlineCommentNew } from '../prompt/output-schema.js';
import { buildReviewComment, buildStatusSection, formatCommentWithSuggestion } from './poster.js';
import type { PostReviewOptions, PostReviewResult } from './types.js';

// =============================================================================
// Logging
// =============================================================================

function log(message: string): void {
  console.log(`[review-poster] ${message}`);
}

function logError(message: string): void {
  console.error(`[review-poster] ERROR: ${message}`);
}

// =============================================================================
// Main Executor
// =============================================================================

/**
 * Posts a complete review to GitHub.
 *
 * This is the main entry point for the review posting pipeline. It
 * coordinates all the steps required to post a review, from cleaning
 * up stale state to submitting the formal review verdict.
 *
 * Error handling:
 * - Individual inline comment response failures are logged and skipped
 * - Thread resolution failures are logged and skipped
 * - Comment upsert failure is logged but execution continues to formal review
 * - Formal review creation failure causes the function to throw
 *
 * @throws If the formal GitHub review cannot be created after retries
 */
export async function postReview(options: PostReviewOptions): Promise<PostReviewResult> {
  const { octokit, owner, repo, prNumber, reviewOutput } = options;

  log(`Posting review for ${owner}/${repo}#${prNumber}`);
  log(`Outcome: ${reviewOutput.pr_review_outcome}`);
  log(`Inline comments (new): ${reviewOutput.inline_comments_new.length}`);
  log(`Inline comments (responses): ${reviewOutput.inline_comments_responses?.length ?? 0}`);

  // -------------------------------------------------------------------------
  // Step 1: Delete stale pending reviews
  // -------------------------------------------------------------------------
  // GitHub only allows one pending review per user per PR. Stale pending
  // reviews from crashed previous runs must be cleaned up first.
  await deletePendingReviews(octokit, owner, repo, prNumber);

  // -------------------------------------------------------------------------
  // Step 2: Dismiss previous bot reviews
  // -------------------------------------------------------------------------
  // Previous APPROVED or CHANGES_REQUESTED reviews are superseded by the
  // new review. Dismissing them ensures only the latest verdict is active.
  await dismissPreviousReviews(octokit, owner, repo, prNumber);

  // -------------------------------------------------------------------------
  // Step 3: Process responses to existing comment threads
  // -------------------------------------------------------------------------
  await processCommentResponses(octokit, owner, repo, prNumber, options);

  // -------------------------------------------------------------------------
  // Step 4: Validate new inline comments against the actual diff
  // -------------------------------------------------------------------------
  const { validComments, skippedComments, formattedComments } = await validateAndFormatComments(
    octokit,
    owner,
    repo,
    prNumber,
    reviewOutput.inline_comments_new
  );

  // -------------------------------------------------------------------------
  // Step 5: Build and upsert the main bot comment
  // -------------------------------------------------------------------------
  const commentId = await upsertMainComment(
    octokit,
    owner,
    repo,
    prNumber,
    reviewOutput,
    skippedComments
  );

  // -------------------------------------------------------------------------
  // Step 6: Submit the formal GitHub review
  // -------------------------------------------------------------------------
  const reviewId = await submitFormalReview(
    octokit,
    owner,
    repo,
    prNumber,
    reviewOutput,
    formattedComments,
    commentId
  );

  const result: PostReviewResult = {
    reviewId,
    commentId,
    inlineCommentsPosted: validComments.length,
    inlineCommentsSkipped: skippedComments.length,
  };

  log(`Review posted successfully. Review ID: ${reviewId}, Comment ID: ${commentId}`);
  log(
    `Inline comments: ${result.inlineCommentsPosted} posted, ${result.inlineCommentsSkipped} skipped`
  );

  return result;
}

// =============================================================================
// Step Implementations
// =============================================================================

/**
 * Processes responses to existing comment threads.
 *
 * For each response in Claude's output:
 * 1. Replies to the existing comment with the response body
 * 2. If should_resolve is true, finds the thread ID and resolves it
 */
async function processCommentResponses(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  options: PostReviewOptions
): Promise<void> {
  const responses = options.reviewOutput.inline_comments_responses;

  if (!responses || responses.length === 0) {
    log('No comment responses to process');
    return;
  }

  log(`Processing ${responses.length} response(s) to existing comments...`);

  for (const response of responses) {
    try {
      // Reply to the existing comment
      await replyToComment(octokit, owner, repo, prNumber, response.comment_id, response.body);

      // If marked for resolution, resolve the thread via GraphQL
      if (response.should_resolve) {
        try {
          const threadId = await findReviewThreadId(
            octokit,
            owner,
            repo,
            prNumber,
            response.comment_id
          );

          if (threadId) {
            await resolveReviewThread(octokit, threadId);
            log(`Comment ${response.comment_id} replied to and thread resolved`);
          } else {
            log(`Comment ${response.comment_id} replied to but thread not found for resolution`);
          }
        } catch (resolveError) {
          logError(
            `Failed to resolve thread for comment ${response.comment_id}: ${String(resolveError)}`
          );
        }
      }
    } catch (error) {
      logError(`Failed to reply to comment ${response.comment_id}: ${String(error)}`);
      // Continue processing other responses
    }
  }
}

/**
 * Validates inline comments against the PR diff and formats suggestions.
 *
 * Steps:
 * 1. Fetch the PR diff content
 * 2. Parse valid line numbers from the diff
 * 3. Filter comments to only those on valid diff lines
 * 4. Format suggestion blocks for comments with suggestions
 */
async function validateAndFormatComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  inlineComments: InlineCommentNew[]
): Promise<{
  validComments: InlineCommentNew[];
  skippedComments: InlineCommentNew[];
  formattedComments: Array<{
    path: string;
    line: number;
    body: string;
    side: 'LEFT' | 'RIGHT';
  }>;
}> {
  if (inlineComments.length === 0) {
    log('No new inline comments to validate');
    return { validComments: [], skippedComments: [], formattedComments: [] };
  }

  // Fetch and parse the diff
  const diffContent = await getPrDiff(octokit, owner, repo, prNumber);
  const validLines = getValidDiffLines(diffContent);

  // Filter comments against valid diff lines
  const { valid: validComments, skipped: skippedComments } = filterValidComments(
    inlineComments,
    validLines
  );

  // Format comments with suggestion blocks
  const formattedComments = validComments.map((comment) => ({
    path: comment.path,
    line: comment.line,
    body: formatCommentWithSuggestion(comment.body, comment.suggestion),
    side: (comment.side ?? 'RIGHT') as 'LEFT' | 'RIGHT',
  }));

  log(
    `Validated inline comments: ${validComments.length} valid, ${skippedComments.length} skipped`
  );

  return { validComments, skippedComments, formattedComments };
}

/**
 * Builds and upserts the main bot comment on the PR.
 *
 * The bot comment is the editable issue comment that contains the full
 * review body. It uses marker-based structure for status/content sections
 * that can be updated independently across review cycles.
 *
 * @returns The comment ID
 */
async function upsertMainComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  reviewOutput: PostReviewOptions['reviewOutput'],
  skippedComments: InlineCommentNew[]
): Promise<number> {
  // Build review content with optional skipped comments section
  let reviewContent = reviewOutput.pr_review_body;

  if (skippedComments.length > 0) {
    const skippedSection = buildSkippedCommentsSection(skippedComments);
    reviewContent += skippedSection;
  }

  // Build status sections
  const statusSections = buildStatusSection(
    reviewOutput.files_reviewed ?? [],
    'claude',
    reviewOutput.confidence ?? 0,
    reviewOutput.pr_review_outcome
  );

  // Build the full comment
  const commentBody = buildReviewComment(reviewContent, statusSections);

  // Upsert the comment (create or update)
  try {
    const commentId = await upsertBotComment(octokit, owner, repo, prNumber, commentBody);
    log(`Bot comment upserted: ${commentId}`);
    return commentId;
  } catch (error) {
    logError(`Failed to upsert bot comment: ${String(error)}`);
    // Return 0 to indicate failure but allow formal review to proceed
    return 0;
  }
}

/**
 * Submits the formal GitHub review with verdict and inline comments.
 *
 * The formal review is a lightweight submission that:
 * - Records the verdict (APPROVE/REQUEST_CHANGES/COMMENT) for branch protection
 * - Attaches inline comments to specific diff lines
 * - References the main bot comment as the source of truth
 *
 * @throws If the review cannot be created after retries
 */
async function submitFormalReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  reviewOutput: PostReviewOptions['reviewOutput'],
  formattedComments: Array<{
    path: string;
    line: number;
    body: string;
    side: 'LEFT' | 'RIGHT';
  }>,
  commentId: number
): Promise<number> {
  // Build a minimal review body that references the main comment
  const minimalReviewBody =
    commentId > 0
      ? `Review verdict: ${reviewOutput.pr_review_outcome}\n\n` +
        `The main review comment above is the source of truth for this PR review. ` +
        `It is automatically updated on each review cycle, so always refer to it for the most current feedback.\n\n` +
        `_This formal review submission is for the verdict only._` +
        (formattedComments.length > 0
          ? ` _${formattedComments.length} inline comment(s) are attached below._`
          : '')
      : reviewOutput.pr_review_body; // Fallback if comment upsert failed

  const reviewId = await createGithubReview(octokit, owner, repo, prNumber, {
    body: minimalReviewBody,
    event: reviewOutput.pr_review_outcome,
    comments: formattedComments,
  });

  log(`Formal review submitted: ${reviewId}`);
  return reviewId;
}

// =============================================================================
// Helpers
// =============================================================================

const MAX_BODY_PREVIEW_LENGTH = 200;

/**
 * Builds a collapsible section listing inline comments that were skipped
 * because they target lines not present in the diff.
 */
function buildSkippedCommentsSection(skippedComments: InlineCommentNew[]): string {
  const commentEntries = skippedComments
    .map((c) => {
      const bodyPreview =
        c.body.length > MAX_BODY_PREVIEW_LENGTH
          ? c.body.substring(0, MAX_BODY_PREVIEW_LENGTH) + '...'
          : c.body;
      return `**${c.path}:${c.line}**\n${bodyPreview}`;
    })
    .join('\n\n');

  return (
    `\n\n---\n\n<details>\n<summary>${skippedComments.length} comment(s) on unchanged code</summary>\n\n` +
    `The following feedback is on lines that weren't modified in this PR:\n\n` +
    `${commentEntries}\n\n</details>`
  );
}
