/**
 * GitHub API helper functions using Octokit.
 *
 * Each function takes an Octokit instance as its first parameter,
 * enabling use with installation-scoped authentication. This module
 * replaces the previous `gh` CLI-based approach with direct REST
 * and GraphQL API calls.
 *
 * Key behaviors ported from post-review.ts:
 * - Marker-based bot comment detection
 * - Pending review cleanup
 * - Previous review dismissal (skipping COMMENTED reviews)
 * - Retry logic for review creation (GitHub 500 quirk)
 * - Diff parsing for inline comment validation
 * - GraphQL thread resolution
 */

import type { RequestError } from '@octokit/request-error';
import type { Octokit } from '@octokit/rest';

import type { BotComment, CreateReviewParams, FilterResult, PrInfo } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** HTML comment marker used to identify the bot's review comment */
const REVIEW_COMMENT_MARKER = '<!-- claude-pr-review-bot -->';

/** Maximum retry attempts for review creation */
const MAX_REVIEW_RETRIES = 3;

/** Delay in ms between review creation retries */
const RETRY_DELAY_MS = 5000;

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[github-api] ${message}`);
}

function logError(message: string): void {
  console.error(`[github-api] ERROR: ${message}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRequestError(error: unknown): error is RequestError {
  return error instanceof Error && 'status' in error;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ---------------------------------------------------------------------------
// PR Operations
// ---------------------------------------------------------------------------

/**
 * Fetches pull request details from the GitHub API.
 */
export async function getPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PrInfo> {
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return {
    number: data.number,
    headSha: data.head.sha,
    baseRef: data.base.ref,
    title: data.title,
    body: data.body,
    isDraft: data.draft ?? false,
    user: data.user?.login ?? 'unknown',
    additions: data.additions,
    deletions: data.deletions,
    changedFiles: data.changed_files,
  };
}

/**
 * Fetches the raw unified diff for a pull request.
 *
 * Uses the `diff` media type to get the raw diff content
 * instead of the structured JSON response.
 */
export async function getPrDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  const response = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: 'diff' },
  });

  // When requesting diff format, the response data is a string
  return response.data as unknown as string;
}

/**
 * Gets the merge base SHA between two refs.
 *
 * Uses the compare commits endpoint to determine the common
 * ancestor between the PR base branch and head commit.
 */
export async function getMergeBase(
  octokit: Octokit,
  owner: string,
  repo: string,
  baseRef: string,
  headSha: string
): Promise<string> {
  const { data } = await octokit.rest.repos.compareCommits({
    owner,
    repo,
    base: baseRef,
    head: headSha,
  });

  return data.merge_base_commit.sha;
}

// ---------------------------------------------------------------------------
// Comment Operations
// ---------------------------------------------------------------------------

/**
 * Lists all issue comments on a PR with pagination.
 *
 * Returns all comments, not just bot comments. Use `findBotComment`
 * for locating the specific bot review comment.
 */
export async function getExistingComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<Array<{ id: number; body: string; user: string }>> {
  const comments: Array<{ id: number; body: string; user: string }> = [];

  for await (const response of octokit.paginate.iterator(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  })) {
    for (const comment of response.data) {
      comments.push({
        id: comment.id,
        body: comment.body ?? '',
        user: comment.user?.login ?? '',
      });
    }
  }

  return comments;
}

/**
 * Finds the bot's existing review comment on a PR.
 *
 * Searches issue comments for the HTML marker.
 * Returns the first matching comment's ID and body, or null if none found.
 */
export async function findBotComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<BotComment | null> {
  for await (const response of octokit.paginate.iterator(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  })) {
    for (const comment of response.data) {
      if (comment.body?.includes(REVIEW_COMMENT_MARKER)) {
        return {
          id: comment.id,
          body: comment.body,
        };
      }
    }
  }

  return null;
}

/**
 * Creates or updates the bot's review comment on a PR.
 *
 * If a comment with the bot marker already exists, it is updated.
 * Otherwise, a new comment is created. Returns the comment ID.
 *
 * @param body - The full comment body including markers
 * @returns The comment ID of the created or updated comment
 */
export async function upsertBotComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<number> {
  const existing = await findBotComment(octokit, owner, repo, prNumber);

  if (existing) {
    log(`Updating existing bot comment ${existing.id}`);
    const { data } = await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    return data.id;
  }

  log('Creating new bot comment');
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
  return data.id;
}

// ---------------------------------------------------------------------------
// Review Management
// ---------------------------------------------------------------------------

/**
 * Deletes any pending (not yet submitted) bot reviews on a PR.
 *
 * GitHub only allows one pending review per user per PR. If a previous
 * workflow run crashed before submitting its review, a stale PENDING
 * review will block future reviews with HTTP 422.
 */
export async function deletePendingReviews(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  log('Checking for pending bot reviews to delete...');

  const { data: reviewList } = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  const authenticatedUser = await getAuthenticatedLogin(octokit);

  const pendingReviews = reviewList.filter(
    (r) => r.state === 'PENDING' && r.user?.login === authenticatedUser
  );

  if (pendingReviews.length === 0) {
    log('No pending bot reviews to delete');
    return;
  }

  log(`Found ${pendingReviews.length} pending bot review(s) to delete`);

  for (const review of pendingReviews) {
    try {
      await octokit.rest.pulls.deletePendingReview({
        owner,
        repo,
        pull_number: prNumber,
        review_id: review.id,
      });
      log(`Deleted pending review ${review.id}`);
    } catch (error) {
      if (isRequestError(error)) {
        if (error.status === 404) {
          log(`Pending review ${review.id} already deleted or does not exist`);
        } else if (error.status === 403) {
          log(`Could not delete pending review ${review.id} (insufficient permissions)`);
        } else {
          log(`Could not delete pending review ${review.id}: ${error.message}`);
        }
      } else {
        log(`Could not delete pending review ${review.id}: ${String(error)}`);
      }
    }
  }
}

/**
 * Dismisses previous non-DISMISSED bot reviews on a PR.
 *
 * Skips COMMENTED reviews, which cause HTTP 422 errors when
 * attempting to dismiss (GitHub does not allow dismissing
 * COMMENTED-state reviews).
 */
export async function dismissPreviousReviews(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  log('Checking for previous bot reviews to dismiss...');

  const { data: reviewList } = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  const authenticatedUser = await getAuthenticatedLogin(octokit);

  // Only dismiss APPROVED and CHANGES_REQUESTED reviews.
  // COMMENTED reviews cause 422 errors when dismissing.
  // DISMISSED reviews are already dismissed.
  // PENDING reviews should be deleted, not dismissed.
  const dismissableReviews = reviewList.filter(
    (r) =>
      r.user?.login === authenticatedUser &&
      (r.state === 'APPROVED' || r.state === 'CHANGES_REQUESTED')
  );

  if (dismissableReviews.length === 0) {
    log('No previous bot reviews to dismiss');
    return;
  }

  log(`Found ${dismissableReviews.length} previous bot review(s) to dismiss`);

  for (const review of dismissableReviews) {
    try {
      await octokit.rest.pulls.dismissReview({
        owner,
        repo,
        pull_number: prNumber,
        review_id: review.id,
        message: 'Superseded by new review after PR update',
      });
      log(`Dismissed review ${review.id}`);
    } catch (error) {
      if (isRequestError(error)) {
        if (error.status === 422) {
          log(`Review ${review.id} already dismissed or in non-dismissable state`);
        } else if (error.status === 403) {
          log(`Could not dismiss review ${review.id} (insufficient permissions)`);
        } else {
          log(`Could not dismiss review ${review.id}: ${error.message}`);
        }
      } else {
        log(`Could not dismiss review ${review.id}: ${String(error)}`);
      }
    }
  }
}

/**
 * Creates a GitHub pull request review with retry logic.
 *
 * Implements up to 3 attempts with 5-second delays between failures.
 * After an HTTP 500, checks if the review was actually created (a known
 * GitHub quirk where the API returns 500 but the review is created).
 *
 * @returns The review ID on success
 */
export async function createGithubReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  params: CreateReviewParams
): Promise<number> {
  log(`Creating review with ${params.comments.length} inline comments...`);
  log(`Review event: ${params.event}`);

  const comments = params.comments.map((c) => ({
    path: c.path,
    line: c.line,
    body: c.body,
    side: (c.side ?? 'RIGHT') as 'LEFT' | 'RIGHT',
  }));

  for (let attempt = 1; attempt <= MAX_REVIEW_RETRIES; attempt++) {
    log(`Review creation attempt ${attempt}/${MAX_REVIEW_RETRIES}`);

    try {
      const { data } = await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        body: params.body,
        event: params.event,
        comments,
      });

      log(`Review successfully created with ID: ${data.id}`);
      return data.id;
    } catch (error) {
      logError(`Review creation attempt ${attempt} failed: ${String(error)}`);

      // Check if the review was actually created despite the error (GitHub 500 quirk)
      if (isRequestError(error) && error.status === 500) {
        log('Checking if review was created despite HTTP 500...');
        const existingReview = await findRecentBotReview(octokit, owner, repo, prNumber);
        if (existingReview !== null) {
          log(`Review WAS created despite error! ID: ${existingReview}`);
          return existingReview;
        }
        log('No recent bot review found - the error was a real failure');
      }

      if (attempt < MAX_REVIEW_RETRIES) {
        log(`Waiting ${RETRY_DELAY_MS}ms before retry...`);
        await delay(RETRY_DELAY_MS);
      } else {
        throw error;
      }
    }
  }

  // Should never reach here, but TypeScript requires it
  throw new Error('Failed to create review after all retries');
}

// ---------------------------------------------------------------------------
// Comment Interactions
// ---------------------------------------------------------------------------

/**
 * Replies to an existing pull request review comment.
 */
export async function replyToComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  commentId: number,
  body: string
): Promise<void> {
  log(`Replying to comment ${commentId}...`);

  await octokit.rest.pulls.createReplyForReviewComment({
    owner,
    repo,
    pull_number: prNumber,
    comment_id: commentId,
    body,
  });
}

/**
 * Resolves a review thread using the GraphQL API.
 *
 * The REST API does not expose review thread resolution, so this
 * uses the `resolveReviewThread` GraphQL mutation.
 *
 * @param threadId - The GraphQL node ID of the review thread
 */
export async function resolveReviewThread(octokit: Octokit, threadId: string): Promise<void> {
  log(`Resolving review thread ${threadId}...`);

  await octokit.graphql<{ resolveReviewThread: { thread: { id: string; isResolved: boolean } } }>(
    `
    mutation($threadId: ID!) {
      resolveReviewThread(input: { threadId: $threadId }) {
        thread {
          id
          isResolved
        }
      }
    }
    `,
    { threadId }
  );

  log('Successfully resolved review thread');
}

/**
 * Finds the GraphQL node ID of the review thread containing a specific comment.
 *
 * Queries all review threads for the PR and matches by the comment's
 * REST API database ID.
 *
 * @param commentDatabaseId - The REST API numeric ID of the comment
 * @returns The thread's GraphQL node ID, or null if not found
 */
export async function findReviewThreadId(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  commentDatabaseId: number
): Promise<string | null> {
  interface ThreadQueryResponse {
    repository: {
      pullRequest: {
        reviewThreads: {
          nodes: Array<{
            id: string;
            isResolved: boolean;
            comments: {
              nodes: Array<{ databaseId: number }>;
            };
          }>;
        };
      };
    };
  }

  const data = await octokit.graphql<ThreadQueryResponse>(
    `
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
    { owner, repo, pr: prNumber }
  );

  for (const thread of data.repository.pullRequest.reviewThreads.nodes) {
    const hasComment = thread.comments.nodes.some((c) => c.databaseId === commentDatabaseId);
    if (hasComment) {
      if (thread.isResolved) {
        log(`Thread containing comment ${commentDatabaseId} is already resolved`);
        return null;
      }
      return thread.id;
    }
  }

  log(`Could not find review thread containing comment ${commentDatabaseId}`);
  return null;
}

// ---------------------------------------------------------------------------
// Diff Analysis
// ---------------------------------------------------------------------------

/**
 * Parses a unified diff to extract valid line numbers for inline comments.
 *
 * GitHub's API only accepts inline comments on lines that appear in the
 * diff hunks. This function parses the diff format to build a map of
 * file paths to sets of valid line numbers.
 *
 * @param diff - The raw unified diff string
 * @returns Map from file path to Set of valid line numbers
 */
export function getValidDiffLines(diff: string): Map<string, Set<number>> {
  const validLines = new Map<string, Set<number>>();

  if (!diff) {
    log('Empty diff provided');
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
      const match = /@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
      if (match) {
        const start = parseInt(match[1], 10);
        const count = match[2] ? parseInt(match[2], 10) : 1;
        const fileLines = validLines.get(currentFile);
        if (fileLines) {
          for (let i = start; i < start + count; i++) {
            fileLines.add(i);
          }
        }
      }
    }
  }

  let totalLines = 0;
  for (const lines of validLines.values()) {
    totalLines += lines.size;
  }
  log(`Parsed diff: ${validLines.size} files, ${totalLines} valid line positions`);

  return validLines;
}

/**
 * Filters inline comments to only include those on valid diff lines.
 *
 * Comments targeting lines not present in the diff will cause GitHub
 * API errors (422). This function separates valid comments from those
 * that would be rejected.
 *
 * @param comments - Array of inline comments with path and line fields
 * @param validLines - Map of valid lines from `getValidDiffLines`
 * @returns Object with `valid` and `skipped` arrays
 */
export function filterValidComments<T extends { path: string; line: number }>(
  comments: T[],
  validLines: Map<string, Set<number>>
): FilterResult<T> {
  const valid: T[] = [];
  const skipped: T[] = [];

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

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/** Cache for authenticated login per Octokit instance. */
const loginCache = new WeakMap<Octokit, string>();

/**
 * Gets the authenticated user's login name.
 *
 * For GitHub App installations, this returns the app's bot login
 * (e.g., "my-app[bot]"). Caches the result per Octokit instance
 * to avoid repeated API calls.
 */
async function getAuthenticatedLogin(octokit: Octokit): Promise<string> {
  const cached = loginCache.get(octokit);
  if (cached !== undefined) {
    return cached;
  }

  try {
    // For GitHub App installations, /user returns the bot user
    const { data } = await octokit.rest.users.getAuthenticated();
    const login = data.login;
    loginCache.set(octokit, login);
    return login;
  } catch {
    // If we can't get the authenticated user (e.g., app token without user scope),
    // try getting the app info instead
    try {
      const response = await octokit.rest.apps.getAuthenticated();
      const slug = response.data?.slug ?? 'app';
      const login = `${slug}[bot]`;
      loginCache.set(octokit, login);
      return login;
    } catch {
      logError('Could not determine authenticated user login');
      throw new Error('Unable to determine GitHub App bot login');
    }
  }
}

/**
 * Checks if a recent bot review exists on the PR.
 *
 * Used to detect if a review was created despite a 500 error from GitHub.
 * Looks for reviews submitted within the last 10 seconds by the bot.
 *
 * @returns The review ID if a recent review is found, null otherwise
 */
async function findRecentBotReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  maxAgeMs: number = 10000
): Promise<number | null> {
  try {
    const { data: reviewList } = await octokit.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    const authenticatedUser = await getAuthenticatedLogin(octokit);
    const now = Date.now();

    // Find the most recent review from the bot
    const botReviews = reviewList
      .filter((r) => r.user?.login === authenticatedUser)
      .filter((r) => {
        if (!r.submitted_at) return false;
        const submittedAt = new Date(r.submitted_at).getTime();
        return now - submittedAt < maxAgeMs;
      });

    if (botReviews.length > 0) {
      // Return the most recent one (last in the list since GitHub returns chronologically)
      const lastReview = botReviews[botReviews.length - 1];
      return lastReview.id;
    }

    return null;
  } catch {
    return null;
  }
}
