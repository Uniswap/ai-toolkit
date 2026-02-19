/**
 * Type definitions for the review posting module.
 *
 * These types define the inputs and outputs of the review posting
 * pipeline, including the options passed to the executor and the
 * result returned after posting.
 */

import type { Octokit } from '@octokit/rest';

import type { ReviewOutput } from '../prompt/output-schema.js';
import type { ThreadedComment } from '../prompt/thread-utils.js';

// =============================================================================
// Input Types
// =============================================================================

/**
 * Options for the review posting executor.
 *
 * Contains all dependencies and data needed to post a complete
 * review to GitHub, including the Octokit instance, PR identifiers,
 * Claude's structured output, and any existing comment threads.
 */
export interface PostReviewOptions {
  /** Authenticated Octokit instance for GitHub API calls */
  octokit: Octokit;
  /** Repository owner (organization or user) */
  owner: string;
  /** Repository name */
  repo: string;
  /** Pull request number */
  prNumber: number;
  /** HEAD commit SHA of the pull request */
  headSha: string;
  /** Base branch ref (e.g., "main") */
  baseRef: string;
  /** Claude's structured review output */
  reviewOutput: ReviewOutput;
  /** Existing threaded comments on the PR for response matching */
  existingThreads: ThreadedComment[];
}

// =============================================================================
// Output Types
// =============================================================================

/**
 * Result of posting a review to GitHub.
 *
 * Contains the IDs of created resources and counts of
 * inline comments that were posted or skipped.
 */
export interface PostReviewResult {
  /** ID of the formal GitHub review that was created */
  reviewId: number;
  /** ID of the bot's issue comment (the main review body) */
  commentId: number;
  /** Number of new inline comments successfully posted */
  inlineCommentsPosted: number;
  /** Number of inline comments skipped (not on valid diff lines) */
  inlineCommentsSkipped: number;
}

// =============================================================================
// Status Section Types
// =============================================================================

/**
 * A section of metadata displayed in the bot's status footer.
 *
 * Status sections appear at the bottom of the review comment
 * and contain metadata like files reviewed, model used, etc.
 */
export interface StatusSection {
  /** Display label for the section (e.g., "Files Reviewed") */
  label: string;
  /** Content value for the section */
  value: string;
}
