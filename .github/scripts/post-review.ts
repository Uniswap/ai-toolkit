#!/usr/bin/env npx tsx
/**
 * Post Review Script
 *
 * Takes Claude's structured JSON review output (from --json-schema) and posts
 * it to GitHub using the GitHub API. All actions appear as `github-actions[bot]`.
 *
 * The workflow uses --json-schema flag with claude-code-action, which returns
 * validated JSON directly via `structured_output`. This script expects clean
 * JSON input (no preamble text or code fences needed).
 *
 * @usage
 *   npx tsx .github/scripts/post-review.ts \
 *     --owner "Uniswap" \
 *     --repo "ai-toolkit" \
 *     --pr-number 123
 *
 * @environment
 *   GITHUB_TOKEN - GitHub token for API authentication (required)
 *   REVIEW_JSON_FILE - Path to file containing review JSON (preferred)
 *   REVIEW_JSON - Direct JSON content (alternative to file)
 *
 * @input The review JSON must match this schema:
 *   {
 *     "pr_review_body": string,        // Markdown review content
 *     "pr_review_outcome": string,     // "APPROVE" | "REQUEST_CHANGES" | "COMMENT"
 *     "inline_comments_new": array,    // Inline comments on specific lines
 *     "inline_comments_responses"?: array,  // Responses to existing comments
 *     "files_reviewed"?: string[],     // List of reviewed files
 *     "confidence"?: number            // 0.0-1.0 confidence level
 *   }
 *
 * @output
 *   Exits with 0 on success, 1 on failure
 *   Outputs review URL on success
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

// =============================================================================
// Types
// =============================================================================

interface InlineCommentNew {
  path: string;
  line: number;
  body: string;
  suggestion?: string;
  side?: 'LEFT' | 'RIGHT';
}

interface InlineCommentResponse {
  comment_id: number;
  body: string;
  should_resolve?: boolean;
}

interface ReviewOutput {
  pr_review_body: string;
  pr_review_outcome: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES';
  inline_comments_new: InlineCommentNew[];
  inline_comments_responses?: InlineCommentResponse[];
  files_reviewed?: string[];
  confidence?: number;
}

interface CreateReviewParams {
  owner: string;
  repo: string;
  pull_number: number;
  body: string;
  event: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES';
  comments: Array<{
    path: string;
    line: number;
    body: string;
    side?: 'LEFT' | 'RIGHT';
  }>;
}

// =============================================================================
// Utilities
// =============================================================================

function log(message: string): void {
  console.log(`[post-review] ${message}`);
}

function logError(message: string): void {
  console.error(`[post-review] ERROR: ${message}`);
}

interface GhOptions {
  input?: string;
  /** Custom token to use instead of GITHUB_TOKEN (e.g., for GraphQL operations) */
  token?: string;
}

function gh(args: string[], options?: GhOptions | string): string {
  // Support legacy signature: gh(args, input)
  const opts: GhOptions = typeof options === 'string' ? { input: options } : options || {};

  log(`Executing: gh ${args.join(' ')}`);

  try {
    // Build environment, optionally overriding GH_TOKEN for GraphQL permissions
    const env = { ...process.env };
    if (opts.token) {
      env.GH_TOKEN = opts.token;
    }

    // When stdin input is needed, use a temp file instead of stdin piping
    // This is more reliable in CI environments where stdin handling can be inconsistent
    if (opts.input !== undefined) {
      // Create a unique temp file for this invocation
      const tempFile = join(
        tmpdir(),
        `gh-input-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
      );

      // Enhanced logging for debugging JSON input issues
      log(`[DEBUG] Input string length: ${opts.input.length} bytes`);
      log(`[DEBUG] Input first 100 chars: ${opts.input.substring(0, 100)}`);
      log(
        `[DEBUG] Input last 100 chars: ${opts.input.substring(
          Math.max(0, opts.input.length - 100)
        )}`
      );

      // Validate JSON before writing
      try {
        JSON.parse(opts.input);
        log(`[DEBUG] Input JSON validation: PASSED`);
      } catch (jsonErr) {
        logError(`[DEBUG] Input JSON validation: FAILED - ${(jsonErr as Error).message}`);
        logError(`[DEBUG] Full input for debugging:\n${opts.input}`);
      }

      // Write input to temp file
      writeFileSync(tempFile, opts.input, 'utf-8');
      log(`[DEBUG] Wrote to temp file: ${tempFile}`);

      // Verify the file was written correctly by reading it back
      const readBack = readFileSync(tempFile, 'utf-8');
      log(`[DEBUG] Read back ${readBack.length} bytes from temp file`);
      log(`[DEBUG] Write/read match: ${opts.input === readBack ? 'YES' : 'NO (MISMATCH!)'}`);

      if (opts.input !== readBack) {
        logError(`[DEBUG] MISMATCH DETAILS:`);
        logError(`[DEBUG]   Original length: ${opts.input.length}`);
        logError(`[DEBUG]   Read back length: ${readBack.length}`);
        // Find first diff position
        let firstDiff = -1;
        for (let i = 0; i < Math.max(opts.input.length, readBack.length); i++) {
          if (opts.input[i] !== readBack[i]) {
            firstDiff = i;
            break;
          }
        }
        logError(`[DEBUG]   First diff position: ${firstDiff}`);
      }

      // Validate read-back JSON
      try {
        JSON.parse(readBack);
        log(`[DEBUG] Read-back JSON validation: PASSED`);
      } catch (jsonErr) {
        logError(`[DEBUG] Read-back JSON validation: FAILED - ${(jsonErr as Error).message}`);
      }

      // Replace --input - with the temp file path in args
      const modifiedArgs = args.map((arg, i) => {
        // If previous arg was --input and this is -, replace with temp file
        if (args[i - 1] === '--input' && arg === '-') {
          return tempFile;
        }
        return arg;
      });

      log(`[DEBUG] Modified command: gh ${modifiedArgs.join(' ')}`);

      // Also log the gh CLI version for debugging
      try {
        const ghVersion = execFileSync('gh', ['--version'], { encoding: 'utf-8', env });
        log(`[DEBUG] gh CLI version: ${ghVersion.split('\n')[0]}`);
      } catch {
        log(`[DEBUG] Could not get gh version`);
      }

      let commandSucceeded = false;
      try {
        const result = execFileSync('gh', modifiedArgs, {
          encoding: 'utf-8',
          env,
          maxBuffer: 10 * 1024 * 1024,
        });
        log(`[DEBUG] gh command succeeded, response length: ${result.length} bytes`);
        commandSucceeded = true;
        return result.trim();
      } catch (execError) {
        const err = execError as { stdout?: string; stderr?: string; message?: string };

        // On failure, log diagnostic information
        // Note: retry logic for review creation is handled in createReview()
        try {
          const fileOnError = readFileSync(tempFile, 'utf-8');
          logError(`[DEBUG] Temp file still exists on error, length: ${fileOnError.length} bytes`);
          // Only log full contents for small files to avoid log spam
          if (fileOnError.length < 2000) {
            logError(`[DEBUG] Temp file contents on error:\n${fileOnError}`);
          }
        } catch (readErr) {
          logError(`[DEBUG] Could not read temp file on error: ${(readErr as Error).message}`);
        }

        // Log the error details
        if (err.stdout) {
          logError(`[DEBUG] stdout: ${err.stdout.substring(0, 1000)}`);
        }
        if (err.stderr) {
          logError(`[DEBUG] stderr: ${err.stderr.substring(0, 500)}`);
        }

        throw execError;
      } finally {
        // Only clean up if command succeeded, preserve on failure for debugging
        if (commandSucceeded) {
          try {
            unlinkSync(tempFile);
            log(`[DEBUG] Cleaned up temp file: ${tempFile}`);
          } catch {
            // Ignore cleanup errors
          }
        } else {
          log(`[DEBUG] Preserving temp file for debugging: ${tempFile}`);
        }
      }
    }

    // For commands without stdin input, use execFileSync directly
    const result = execFileSync('gh', args, {
      encoding: 'utf-8',
      env,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large responses
    });
    return result.trim();
  } catch (error) {
    const execError = error as { stderr?: string; message?: string; stdout?: string };
    logError(`gh command failed: ${execError.stderr || execError.message}`);
    if (execError.stdout) {
      logError(`[DEBUG] stdout from failed command: ${execError.stdout}`);
    }
    throw error;
  }
}

function formatSuggestion(body: string, suggestion?: string): string {
  if (!suggestion) return body;

  // GitHub's special suggestion syntax
  return `${body}

\`\`\`suggestion
${suggestion}
\`\`\``;
}

// =============================================================================
// Constants
// =============================================================================

/** HTML comment marker used to identify and update the bot's review comment */
const REVIEW_COMMENT_MARKER = '<!-- claude-pr-review-bot -->';

/** Footer added to the main review comment explaining how to trigger a re-review */
const REVIEW_FOOTER = `
---

<sub>💡 **Want a fresh review?** Add a comment containing \`@request-claude-review\` to trigger a new review at any time.</sub>`;

// =============================================================================
// GitHub API Functions
// =============================================================================

/**
 * Finds an existing PR comment from the bot by looking for the marker.
 * Returns the comment ID if found, null otherwise.
 */
function findExistingBotComment(owner: string, repo: string, prNumber: number): number | null {
  log('Searching for existing bot review comment...');

  try {
    const result = gh([
      'api',
      `repos/${owner}/${repo}/issues/${prNumber}/comments`,
      '--jq',
      `.[] | select(.user.login == "github-actions[bot]") | select(.body | contains("${REVIEW_COMMENT_MARKER}")) | .id`,
    ]);

    if (result) {
      // May return multiple IDs if somehow there are duplicates, take the first
      const commentId = parseInt(result.split('\n')[0], 10);
      if (!isNaN(commentId)) {
        log(`Found existing bot comment: ${commentId}`);
        return commentId;
      }
    }

    log('No existing bot review comment found');
    return null;
  } catch {
    log('No existing bot review comment found (query returned empty)');
    return null;
  }
}

/**
 * Creates or updates the main review comment on the PR.
 * This is an editable issue comment (not a review) that persists across reviews.
 *
 * @returns The comment URL
 */
function upsertReviewComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): { id: number; html_url: string } {
  // Prepend the marker to the body
  const markedBody = `${REVIEW_COMMENT_MARKER}\n${body}`;

  const existingCommentId = findExistingBotComment(owner, repo, prNumber);

  if (existingCommentId) {
    log(`Updating existing comment ${existingCommentId}...`);

    const result = gh(
      [
        'api',
        '--method',
        'PATCH',
        `repos/${owner}/${repo}/issues/comments/${existingCommentId}`,
        '--input',
        '-',
      ],
      JSON.stringify({ body: markedBody })
    );

    try {
      const response = JSON.parse(result) as { id: number; html_url: string };
      log(`Comment updated: ${response.html_url}`);
      return response;
    } catch {
      logError('Failed to parse comment update response');
      throw new Error('Failed to update comment');
    }
  } else {
    log('Creating new review comment...');

    const result = gh(
      [
        'api',
        '--method',
        'POST',
        `repos/${owner}/${repo}/issues/${prNumber}/comments`,
        '--input',
        '-',
      ],
      JSON.stringify({ body: markedBody })
    );

    try {
      const response = JSON.parse(result) as { id: number; html_url: string };
      log(`Comment created: ${response.html_url}`);
      return response;
    } catch {
      logError('Failed to parse comment creation response');
      throw new Error('Failed to create comment');
    }
  }
}

/**
 * Helper function to check if a recent bot review exists on the PR.
 * Used to detect if a review was created despite a 500 error from GitHub.
 *
 * @returns The review object if found within maxAgeMs, null otherwise
 */
function findRecentBotReview(
  owner: string,
  repo: string,
  prNumber: number,
  maxAgeMs: number = 5000
): { id: number; html_url: string; state: string; submitted_at: string } | null {
  try {
    const reviewsResult = execFileSync(
      'gh',
      [
        'api',
        `repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
        '--jq',
        '[.[] | select(.user.login == "github-actions[bot]")] | sort_by(.submitted_at) | last',
      ],
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    if (reviewsResult.trim()) {
      const lastReview = JSON.parse(reviewsResult.trim());
      const submittedAt = new Date(lastReview.submitted_at);
      const now = new Date();
      const ageMs = now.getTime() - submittedAt.getTime();

      if (ageMs < maxAgeMs) {
        return lastReview;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function createReview(params: CreateReviewParams): { id: number; html_url: string } {
  log(`Creating review with ${params.comments.length} inline comments...`);
  log(`Review event: ${params.event}`);

  // Build the API request body
  const requestBody = {
    body: params.body,
    event: params.event,
    comments: params.comments.map((c) => ({
      path: c.path,
      line: c.line,
      body: c.body,
      side: c.side || 'RIGHT',
    })),
  };

  // Enhanced logging for debugging review creation
  log(`[DEBUG] Review body length: ${params.body.length} chars`);
  log(`[DEBUG] Review comments count: ${requestBody.comments.length}`);
  if (requestBody.comments.length > 0) {
    for (let i = 0; i < requestBody.comments.length; i++) {
      const c = requestBody.comments[i];
      log(
        `[DEBUG] Comment ${i}: path=${c.path}, line=${c.line}, body_length=${c.body.length}, side=${c.side}`
      );
      log(`[DEBUG] Comment ${i} body preview: ${c.body.substring(0, 200)}...`);
    }
  }

  const jsonPayload = JSON.stringify(requestBody);
  log(`[DEBUG] Full review JSON payload length: ${jsonPayload.length} bytes`);
  log(`[DEBUG] Full review JSON payload:\n${jsonPayload}`);

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    log(`[DEBUG] Review creation attempt ${attempt}/${MAX_RETRIES}`);

    try {
      // Use gh api with JSON input
      const result = gh(
        [
          'api',
          '--method',
          'POST',
          `repos/${params.owner}/${params.repo}/pulls/${params.pull_number}/reviews`,
          '--input',
          '-',
        ],
        jsonPayload
      );

      try {
        const response = JSON.parse(result) as { id: number; html_url: string };
        log(`Review successfully created with ID: ${response.id}`);
        return response;
      } catch {
        logError('Failed to parse review creation response');
        logError(`[DEBUG] Raw response from gh: ${result}`);
        throw new Error('Failed to create review');
      }
    } catch (error) {
      logError(`[DEBUG] Review creation attempt ${attempt} failed: ${(error as Error).message}`);

      // Check if the review was actually created despite the error (GitHub 500 quirk)
      log(`[DEBUG] Checking if review was created despite error...`);
      const existingReview = findRecentBotReview(
        params.owner,
        params.repo,
        params.pull_number,
        5000 // 5 seconds
      );

      if (existingReview) {
        log(
          `[DEBUG] ✅ Review WAS created despite error! ID: ${existingReview.id}, state: ${existingReview.state}`
        );
        log(`[DEBUG] Review submitted at: ${existingReview.submitted_at}`);
        return { id: existingReview.id, html_url: existingReview.html_url };
      }

      log(`[DEBUG] No recent bot review found - the error was a real failure`);

      // If this wasn't the last attempt, wait and retry
      if (attempt < MAX_RETRIES) {
        log(`[DEBUG] Waiting ${RETRY_DELAY_MS}ms before retry...`);
        // Use synchronous sleep since we're in a sync function
        const start = Date.now();
        while (Date.now() - start < RETRY_DELAY_MS) {
          // Busy wait - not ideal but works for sync context
        }
        log(`[DEBUG] Retrying...`);
      } else {
        // Last attempt failed, throw the error
        throw error;
      }
    }
  }

  // Should never reach here, but TypeScript needs this
  throw new Error('Failed to create review after all retries');
}

function replyToComment(
  owner: string,
  repo: string,
  prNumber: number,
  commentId: number,
  body: string
): void {
  log(`Replying to comment ${commentId}...`);

  // Use --input with JSON.stringify to avoid shell injection from markdown content
  gh(
    [
      'api',
      '--method',
      'POST',
      `repos/${owner}/${repo}/pulls/${prNumber}/comments/${commentId}/replies`,
      '--input',
      '-',
    ],
    JSON.stringify({ body })
  );
}

/**
 * Resolves a review thread containing the given comment ID.
 *
 * This requires GraphQL because the REST API doesn't expose review thread resolution.
 * We need to:
 * 1. Query all review threads for the PR
 * 2. Find the thread containing our comment (by matching databaseId)
 * 3. Resolve that thread using the GraphQL mutation
 *
 * NOTE: The resolveReviewThread GraphQL mutation requires elevated permissions that
 * the default GITHUB_TOKEN in Actions doesn't have. We use GH_TOKEN_FOR_GRAPHQL
 * (which should be set to WORKFLOW_PAT) for this operation.
 *
 * @see https://stackoverflow.com/questions/71421045/how-to-resolve-a-github-pull-request-conversation-comment-thread-using-github
 */
function resolveReviewThread(
  owner: string,
  repo: string,
  prNumber: number,
  commentId: number
): boolean {
  log(`Resolving review thread containing comment ${commentId}...`);

  // Use GH_TOKEN_FOR_GRAPHQL for GraphQL operations that require elevated permissions
  // Falls back to undefined (which means gh will use GITHUB_TOKEN or GH_TOKEN from env)
  const graphqlToken = process.env.GH_TOKEN_FOR_GRAPHQL;

  if (!graphqlToken) {
    log('Warning: GH_TOKEN_FOR_GRAPHQL not set, using default token');
  }

  // Step 1: Query review threads to find the one containing this comment
  // We need to match by databaseId (REST API ID) since that's what we have
  const queryResult = gh(['api', 'graphql', '--input', '-'], {
    input: JSON.stringify({
      query: `
        query($owner: String!, $repo: String!, $pr: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $pr) {
              reviewThreads(first: 100) {
                nodes {
                  id
                  isResolved
                  comments(first: 100) {
                    nodes {
                      databaseId
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: { owner, repo, pr: prNumber },
    }),
    token: graphqlToken,
  });

  let threadId: string | null = null;

  try {
    const data = JSON.parse(queryResult) as {
      data?: {
        repository?: {
          pullRequest?: {
            reviewThreads?: {
              nodes: Array<{
                id: string;
                isResolved: boolean;
                comments: { nodes: Array<{ databaseId: number }> };
              }>;
            };
          };
        };
      };
    };

    const threads = data.data?.repository?.pullRequest?.reviewThreads?.nodes || [];

    // Find the thread containing our comment
    for (const thread of threads) {
      const hasComment = thread.comments.nodes.some((c) => c.databaseId === commentId);
      if (hasComment) {
        if (thread.isResolved) {
          log(`Thread is already resolved`);
          return true;
        }
        threadId = thread.id;
        break;
      }
    }

    if (!threadId) {
      log(`Could not find review thread containing comment ${commentId}`);
      return false;
    }
  } catch (err) {
    logError(`Failed to query review threads: ${(err as Error).message}`);
    return false;
  }

  // Step 2: Resolve the thread using GraphQL mutation
  try {
    gh(['api', 'graphql', '--input', '-'], {
      input: JSON.stringify({
        query: `
          mutation($threadId: ID!) {
            resolveReviewThread(input: {threadId: $threadId}) {
              thread {
                id
                isResolved
              }
            }
          }
        `,
        variables: { threadId },
      }),
      token: graphqlToken,
    });

    log(`Successfully resolved review thread`);
    return true;
  } catch (err) {
    logError(`Failed to resolve review thread: ${(err as Error).message}`);
    return false;
  }
}

function dismissPreviousBotReviews(owner: string, repo: string, prNumber: number): void {
  log('Checking for previous bot reviews to dismiss...');

  const result = gh([
    'api',
    `repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
    '--jq',
    '[.[] | select(.user.login == "github-actions[bot]" and (.state == "APPROVED" or .state == "CHANGES_REQUESTED" or .state == "COMMENTED"))]',
  ]);

  if (!result) {
    log('No previous bot reviews found');
    return;
  }

  try {
    const reviews = JSON.parse(result) as Array<{ id: number }>;

    if (reviews.length === 0) {
      log('No previous bot reviews to dismiss');
      return;
    }

    log(`Found ${reviews.length} previous bot review(s) to dismiss`);

    for (const review of reviews) {
      try {
        gh([
          'api',
          '--method',
          'PUT',
          `repos/${owner}/${repo}/pulls/${prNumber}/reviews/${review.id}/dismissals`,
          '-f',
          'message=Superseded by new review after PR update',
        ]);
        log(`Dismissed review ${review.id}`);
      } catch (error) {
        // Distinguish between different error types for clearer logging
        const errorMsg = (error as Error).message || '';
        if (errorMsg.includes('422')) {
          // 422 typically means the review is already dismissed or in a non-dismissable state
          log(`Review ${review.id} already dismissed or in non-dismissable state`);
        } else if (errorMsg.includes('403')) {
          log(`Could not dismiss review ${review.id} (insufficient permissions)`);
        } else {
          log(`Could not dismiss review ${review.id}: ${errorMsg}`);
        }
      }
    }
  } catch {
    log('No reviews to dismiss');
  }
}

// =============================================================================
// Diff Validation
// =============================================================================

/**
 * Parses the PR diff to determine which lines are valid for inline comments.
 * GitHub's API only accepts comments on lines that are part of the diff.
 *
 * @returns Map of file paths to Set of valid line numbers
 */
function getValidDiffLines(
  owner: string,
  repo: string,
  prNumber: number
): Map<string, Set<number>> {
  log('Fetching PR diff to validate inline comment line numbers...');

  const validLines = new Map<string, Set<number>>();

  try {
    const diff = gh(['pr', 'diff', prNumber.toString(), '--repo', `${owner}/${repo}`]);

    if (!diff) {
      log('Empty diff returned');
      return validLines;
    }

    let currentFile: string | null = null;

    for (const line of diff.split('\n')) {
      // New file header: +++ b/path/to/file.ts
      if (line.startsWith('+++ b/')) {
        currentFile = line.substring(6);
        if (!validLines.has(currentFile)) {
          validLines.set(currentFile, new Set<number>());
        }
        continue;
      }

      // Hunk header: @@ -old_start,old_count +new_start,new_count @@
      if (line.startsWith('@@') && currentFile) {
        const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
        if (match) {
          const start = parseInt(match[1], 10);
          const count = match[2] ? parseInt(match[2], 10) : 1;
          const fileLines = validLines.get(currentFile)!;
          for (let i = start; i < start + count; i++) {
            fileLines.add(i);
          }
        }
      }
    }

    let totalLines = 0;
    for (const lines of Array.from(validLines.values())) {
      totalLines += lines.size;
    }
    log(`Parsed diff: ${validLines.size} files, ${totalLines} valid line positions`);

    // Log detailed valid lines for debugging
    for (const [file, lines] of Array.from(validLines.entries())) {
      const sortedLines = Array.from(lines).sort((a, b) => a - b);
      log(`[DEBUG] Valid lines for ${file}: [${sortedLines.join(', ')}]`);
    }

    return validLines;
  } catch (err) {
    log(`Warning: Could not fetch diff: ${(err as Error).message}`);
    return validLines;
  }
}

/**
 * Filters inline comments to only include those on valid diff lines.
 */
function filterValidComments(
  comments: InlineCommentNew[],
  validLines: Map<string, Set<number>>
): { valid: InlineCommentNew[]; skipped: InlineCommentNew[] } {
  const valid: InlineCommentNew[] = [];
  const skipped: InlineCommentNew[] = [];

  if (validLines.size === 0) {
    log('No diff validation available, attempting all comments');
    return { valid: comments, skipped: [] };
  }

  for (const comment of comments) {
    const fileLines = validLines.get(comment.path);

    if (!fileLines) {
      log(`Skipping comment: ${comment.path}:${comment.line} - file not in diff`);
      skipped.push(comment);
      continue;
    }

    if (!fileLines.has(comment.line)) {
      log(`Skipping comment: ${comment.path}:${comment.line} - line not in diff hunk`);
      skipped.push(comment);
      continue;
    }

    valid.push(comment);
  }

  if (skipped.length > 0) {
    log(`Filtered out ${skipped.length} comment(s) on lines not in the diff`);
  }

  return { valid, skipped };
}

// =============================================================================
// Validation
// =============================================================================

function validateReviewOutput(data: unknown): ReviewOutput {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Review output must be an object');
  }

  const review = data as Record<string, unknown>;

  // Required fields
  if (typeof review.pr_review_body !== 'string') {
    throw new Error('pr_review_body must be a string');
  }

  const validOutcomes = ['COMMENT', 'APPROVE', 'REQUEST_CHANGES'];
  if (!validOutcomes.includes(review.pr_review_outcome as string)) {
    throw new Error(`pr_review_outcome must be one of: ${validOutcomes.join(', ')}`);
  }

  if (!Array.isArray(review.inline_comments_new)) {
    throw new Error('inline_comments_new must be an array');
  }

  // Validate each inline comment
  for (const comment of review.inline_comments_new) {
    if (typeof comment !== 'object' || comment === null) {
      throw new Error('Each inline comment must be an object');
    }

    const c = comment as Record<string, unknown>;

    if (typeof c.path !== 'string' || !c.path) {
      throw new Error('Each inline comment must have a path (string)');
    }

    if (typeof c.line !== 'number' || c.line < 1) {
      throw new Error('Each inline comment must have a line (positive number)');
    }

    if (typeof c.body !== 'string' || !c.body) {
      throw new Error('Each inline comment must have a body (string)');
    }
  }

  // Validate optional inline_comments_responses
  if (review.inline_comments_responses !== undefined) {
    if (!Array.isArray(review.inline_comments_responses)) {
      throw new Error('inline_comments_responses must be an array');
    }

    for (const response of review.inline_comments_responses) {
      if (typeof response !== 'object' || response === null) {
        throw new Error('Each comment response must be an object');
      }

      const r = response as Record<string, unknown>;

      if (typeof r.comment_id !== 'number') {
        throw new Error('Each comment response must have a comment_id (number)');
      }

      if (typeof r.body !== 'string' || !r.body) {
        throw new Error('Each comment response must have a body (string)');
      }
    }
  }

  return review as unknown as ReviewOutput;
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  // Parse command line arguments
  const { values } = parseArgs({
    options: {
      owner: { type: 'string' },
      repo: { type: 'string' },
      'pr-number': { type: 'string' },
      'review-json': { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
    strict: true,
  });

  const owner = values.owner;
  const repo = values.repo;
  const prNumber = parseInt(values['pr-number'] || '', 10);
  const dryRun = values['dry-run'];

  // Validate required inputs
  if (!owner || !repo || isNaN(prNumber)) {
    logError('Missing required arguments: --owner, --repo, --pr-number');
    process.exit(1);
  }

  // Get review JSON from sources (priority order):
  // 1. REVIEW_JSON_FILE env var (preferred - file path from workflow)
  // 2. --review-json CLI flag
  // 3. REVIEW_JSON env var (direct content)
  let reviewJsonInput: string | undefined;

  if (process.env.REVIEW_JSON_FILE) {
    try {
      reviewJsonInput = readFileSync(process.env.REVIEW_JSON_FILE, 'utf-8');
      log(`Read review JSON from file: ${process.env.REVIEW_JSON_FILE}`);
    } catch (err) {
      logError(`Failed to read REVIEW_JSON_FILE: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  if (!reviewJsonInput) {
    reviewJsonInput = values['review-json'] || process.env.REVIEW_JSON;
  }

  if (!reviewJsonInput) {
    logError(
      'Missing review JSON. Provide via REVIEW_JSON_FILE, --review-json, or REVIEW_JSON env'
    );
    process.exit(1);
  }

  log(`Processing review for ${owner}/${repo}#${prNumber}`);

  // Parse and validate the review JSON
  // With --json-schema, the input is already clean JSON (no preamble or code fences)
  let reviewOutput: ReviewOutput;
  try {
    const parsed = JSON.parse(reviewJsonInput.trim());
    reviewOutput = validateReviewOutput(parsed);
    log('Review JSON parsed and validated successfully');
  } catch (error) {
    logError(`Failed to parse review JSON: ${(error as Error).message}`);
    log('Raw input (first 500 chars):');
    console.log(reviewJsonInput.substring(0, 500));
    process.exit(1);
  }

  if (dryRun) {
    log('DRY RUN - Would post the following review:');
    console.log(JSON.stringify(reviewOutput, null, 2));
    process.exit(0);
  }

  // Dismiss previous bot reviews
  dismissPreviousBotReviews(owner, repo, prNumber);

  // Process responses to existing comments first
  if (reviewOutput.inline_comments_responses?.length) {
    log(
      `Processing ${reviewOutput.inline_comments_responses.length} responses to existing comments...`
    );

    for (const response of reviewOutput.inline_comments_responses) {
      try {
        // Reply to the comment first
        replyToComment(owner, repo, prNumber, response.comment_id, response.body);

        // If marked for resolution, resolve the thread via GraphQL
        if (response.should_resolve) {
          const resolved = resolveReviewThread(owner, repo, prNumber, response.comment_id);
          if (resolved) {
            log(`Comment ${response.comment_id} replied to and thread resolved`);
          } else {
            log(`Comment ${response.comment_id} replied to but thread resolution failed`);
          }
        }
      } catch (error) {
        logError(`Failed to reply to comment ${response.comment_id}: ${(error as Error).message}`);
      }
    }
  }

  // Validate comments against the actual diff to avoid 422 errors
  const validDiffLines = getValidDiffLines(owner, repo, prNumber);
  const { valid: validComments, skipped: skippedComments } = filterValidComments(
    reviewOutput.inline_comments_new,
    validDiffLines
  );

  // Build inline comments with suggestions formatted
  const formattedComments = validComments.map((comment) => ({
    path: comment.path,
    line: comment.line,
    body: formatSuggestion(comment.body, comment.suggestion),
    side: comment.side || ('RIGHT' as const),
  }));

  // Build the full review body for the editable comment
  let reviewBody = reviewOutput.pr_review_body;
  if (skippedComments.length > 0) {
    const skippedSection = `\n\n---\n\n<details>\n<summary>ℹ️ ${
      skippedComments.length
    } comment(s) on unchanged code</summary>\n\nThe following feedback is on lines that weren't modified in this PR:\n\n${skippedComments
      .map(
        (c) =>
          `**${c.path}:${c.line}**\n${
            c.body.length > 200 ? c.body.substring(0, 200) + '...' : c.body
          }`
      )
      .join('\n\n')}\n\n</details>`;
    reviewBody += skippedSection;
  }

  // Add footer with instructions for triggering a re-review
  reviewBody += REVIEW_FOOTER;

  // HYBRID APPROACH:
  // 1. Create/update an editable PR comment with the full review content
  // 2. Submit a minimal formal review with just the verdict (and inline comments)
  //
  // This ensures:
  // - Only ONE main review comment exists at any time (editable)
  // - Formal review verdict is still recorded for branch protection
  // - Inline comments are attached to specific lines

  let commentResult: { id: number; html_url: string } | null = null;
  let reviewResult: { id: number; html_url: string } | null = null;

  // Step 1: Create or update the main review comment (editable)
  try {
    commentResult = upsertReviewComment(owner, repo, prNumber, reviewBody);
    log(`Review comment ${commentResult.id} saved at: ${commentResult.html_url}`);
  } catch (error) {
    logError(`Failed to upsert review comment: ${(error as Error).message}`);
    // Continue to try formal review even if comment fails
  }

  // Step 2: Submit the formal review with minimal body (verdict + inline comments)
  // The body just references the main comment to avoid duplication
  try {
    const minimalReviewBody = commentResult
      ? `📋 **Review verdict: ${reviewOutput.pr_review_outcome}**\n\n` +
        `👆 The [main review comment](${commentResult.html_url}) above is the **source of truth** for this PR review. ` +
        `It is automatically updated on each review cycle, so always refer to it for the most current feedback.\n\n` +
        `_This formal review submission is for the verdict only._` +
        (formattedComments.length > 0
          ? ` _${formattedComments.length} inline comment(s) are attached below._`
          : '')
      : reviewBody; // Fallback to full body if comment failed

    reviewResult = createReview({
      owner,
      repo,
      pull_number: prNumber,
      body: minimalReviewBody,
      event: reviewOutput.pr_review_outcome,
      comments: formattedComments,
    });

    log(`Formal review posted successfully!`);
    log(`Review URL: ${reviewResult.html_url}`);
  } catch (error) {
    logError(`Failed to create formal review: ${(error as Error).message}`);
    // Formal review is required for branch protection rules to receive a verdict.
    // Always fail if we couldn't create it, even if the comment was posted.
    logError(
      'CRITICAL: Formal review is required for branch protection. ' +
        (commentResult
          ? `The main comment was posted at ${commentResult.html_url} but the formal verdict was not recorded.`
          : 'Neither the comment nor the formal review were created.')
    );
    process.exit(1);
  }

  // Output summary
  console.log('\n=== Review Summary ===');
  console.log(`Outcome: ${reviewOutput.pr_review_outcome}`);
  console.log(`Inline comments posted: ${formattedComments.length}`);
  if (skippedComments.length > 0) {
    console.log(`Comments on unchanged code (in summary): ${skippedComments.length}`);
  }
  if (reviewOutput.files_reviewed?.length) {
    console.log(`Files reviewed: ${reviewOutput.files_reviewed.length}`);
  }
  if (reviewOutput.confidence !== undefined) {
    console.log(`Confidence: ${(reviewOutput.confidence * 100).toFixed(0)}%`);
  }
  if (commentResult) {
    console.log(`Main comment ID: ${commentResult.id}`);
    console.log(`Main comment URL: ${commentResult.html_url}`);
  }
  if (reviewResult) {
    console.log(`Review ID: ${reviewResult.id}`);
    console.log(`Review URL: ${reviewResult.html_url}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logError(`Unexpected error: ${message}`);
  process.exit(1);
});
