/**
 * Type definitions for GitHub API interactions.
 *
 * These types represent the domain objects used by the review bot
 * when interacting with GitHub's REST and GraphQL APIs via Octokit.
 */

/**
 * Parameters for creating a GitHub pull request review.
 */
export interface CreateReviewParams {
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body: string;
  comments: Array<{
    path: string;
    line: number;
    body: string;
    side?: 'LEFT' | 'RIGHT';
  }>;
}

/**
 * Essential pull request information extracted from the GitHub API response.
 */
export interface PrInfo {
  number: number;
  headSha: string;
  baseRef: string;
  title: string;
  body: string | null;
  isDraft: boolean;
  user: string;
  additions: number;
  deletions: number;
  changedFiles: number;
}

/**
 * Represents a bot comment found on a PR issue.
 */
export interface BotComment {
  id: number;
  body: string;
}

/**
 * Result of filtering inline comments against valid diff lines.
 */
export interface FilterResult<T> {
  valid: T[];
  skipped: T[];
}
