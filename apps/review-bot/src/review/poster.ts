/**
 * Comment Formatting and Parsing Utilities
 *
 * Provides functions for building, parsing, and formatting the bot's
 * review comments on GitHub PRs. Uses HTML comment markers to identify
 * and update bot comments across review cycles.
 *
 * Structure of a bot comment:
 * ```
 * <!-- claude-pr-review-bot -->
 * <!-- claude-pr-review-status-start -->
 * {status header}
 * <!-- claude-pr-review-status-end -->
 * <!-- claude-pr-review-content-start -->
 * {review body content}
 * <!-- claude-pr-review-content-end -->
 * {footer}
 * ```
 */

import type { StatusSection } from './types.js';

// =============================================================================
// Markers
// =============================================================================

/** HTML comment marker used to identify the bot's review comment */
export const REVIEW_COMMENT_MARKER = '<!-- claude-pr-review-bot -->';

/** Start delimiter for the status section within the comment */
export const STATUS_START_MARKER = '<!-- claude-pr-review-status-start -->';

/** End delimiter for the status section within the comment */
export const STATUS_END_MARKER = '<!-- claude-pr-review-status-end -->';

/** Start delimiter for the content section within the comment */
export const CONTENT_START_MARKER = '<!-- claude-pr-review-content-start -->';

/** End delimiter for the content section within the comment */
export const CONTENT_END_MARKER = '<!-- claude-pr-review-content-end -->';

// =============================================================================
// Constants
// =============================================================================

/** Footer added to the main review comment explaining how to trigger a re-review */
const REVIEW_FOOTER = `

---

<sub>Want a fresh review? Add a comment containing \`@request-claude-review\` to trigger a new review at any time.</sub>`;

// =============================================================================
// Parsed Comment Structure
// =============================================================================

/**
 * Represents the parsed structure of a review comment.
 */
export interface ParsedReviewComment {
  /** Content of the status section (between status markers) */
  status: string;
  /** Content of the review section (between content markers) */
  content: string;
  /** Whether the comment had valid marker structure */
  hasValidStructure: boolean;
}

// =============================================================================
// Formatting Functions
// =============================================================================

/**
 * Wraps a code suggestion in GitHub's suggestion block syntax.
 *
 * GitHub renders suggestion blocks as proposed code changes that
 * can be applied with a single click from the PR UI.
 *
 * @param suggestion - The suggested code replacement
 * @returns The suggestion wrapped in a GitHub suggestion code fence
 */
export function formatSuggestion(suggestion: string): string {
  return `\`\`\`suggestion
${suggestion}
\`\`\``;
}

/**
 * Formats a comment body with an optional suggestion block appended.
 *
 * If a suggestion is provided, it is formatted as a GitHub suggestion
 * block and appended after the body text.
 *
 * @param body - The comment body text
 * @param suggestion - Optional code suggestion to append
 * @returns The formatted comment body
 */
export function formatCommentWithSuggestion(body: string, suggestion?: string): string {
  if (!suggestion) return body;

  return `${body}

${formatSuggestion(suggestion)}`;
}

// =============================================================================
// Status Section Builder
// =============================================================================

/**
 * Builds the metadata status section for the review comment.
 *
 * This section appears in the review header and contains metadata
 * about the review such as files reviewed, model, confidence, and outcome.
 *
 * @param filesReviewed - List of file paths that were reviewed
 * @param model - The AI model used for the review
 * @param confidence - Confidence score from 0.0 to 1.0
 * @param outcome - The review verdict (APPROVE, REQUEST_CHANGES, COMMENT)
 * @returns Array of StatusSection objects for the footer
 */
export function buildStatusSection(
  filesReviewed: string[],
  model: string,
  confidence: number,
  outcome: string
): StatusSection[] {
  const sections: StatusSection[] = [];

  sections.push({
    label: 'Outcome',
    value: outcome,
  });

  sections.push({
    label: 'Confidence',
    value: `${(confidence * 100).toFixed(0)}%`,
  });

  sections.push({
    label: 'Model',
    value: model,
  });

  if (filesReviewed.length > 0) {
    sections.push({
      label: 'Files Reviewed',
      value: `${filesReviewed.length} file${filesReviewed.length === 1 ? '' : 's'}`,
    });
  }

  return sections;
}

// =============================================================================
// Comment Building
// =============================================================================

/**
 * Assembles the full bot comment with marker structure.
 *
 * Creates a comment with the following structure:
 * 1. Bot identification marker
 * 2. Status section (between status markers)
 * 3. Content section (between content markers)
 * 4. Footer
 *
 * @param reviewBody - The review body content (Claude's review)
 * @param statusSections - Array of status metadata sections for the header
 * @returns The complete comment body ready for posting
 */
export function buildReviewComment(reviewBody: string, statusSections: StatusSection[]): string {
  const statusHeader = formatStatusHeader(statusSections);

  return `${REVIEW_COMMENT_MARKER}
${STATUS_START_MARKER}
${statusHeader}
${STATUS_END_MARKER}
${CONTENT_START_MARKER}
${reviewBody}
${CONTENT_END_MARKER}${REVIEW_FOOTER}`;
}

// =============================================================================
// Comment Parsing
// =============================================================================

/**
 * Parses an existing bot comment body to extract status and content sections.
 *
 * Looks for the marker-based structure and extracts the content between
 * each pair of markers. Returns default empty values if markers are not
 * found or are in incorrect order.
 *
 * @param body - The raw comment body to parse
 * @returns Parsed sections with validity flag
 */
export function parseReviewComment(body: string): ParsedReviewComment {
  const statusStartIdx = body.indexOf(STATUS_START_MARKER);
  const statusEndIdx = body.indexOf(STATUS_END_MARKER);
  const contentStartIdx = body.indexOf(CONTENT_START_MARKER);
  const contentEndIdx = body.indexOf(CONTENT_END_MARKER);

  // Check if all markers are present and in correct order
  const hasValidStructure =
    statusStartIdx !== -1 &&
    statusEndIdx !== -1 &&
    contentStartIdx !== -1 &&
    contentEndIdx !== -1 &&
    statusStartIdx < statusEndIdx &&
    statusEndIdx < contentStartIdx &&
    contentStartIdx < contentEndIdx;

  if (!hasValidStructure) {
    return {
      status: '',
      content: '',
      hasValidStructure: false,
    };
  }

  const status = body.substring(statusStartIdx + STATUS_START_MARKER.length, statusEndIdx).trim();

  const content = body
    .substring(contentStartIdx + CONTENT_START_MARKER.length, contentEndIdx)
    .trim();

  return {
    status,
    content,
    hasValidStructure: true,
  };
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Formats status sections into a header string for the review comment.
 */
function formatStatusHeader(sections: StatusSection[]): string {
  if (sections.length === 0) {
    return '## Claude Code Review\n\n> Review complete';
  }

  const outcomeSection = sections.find((s) => s.label === 'Outcome');
  const outcome = outcomeSection?.value ?? 'COMMENT';

  const outcomeEmoji =
    outcome === 'APPROVE'
      ? 'Approved'
      : outcome === 'REQUEST_CHANGES'
      ? 'Changes Requested'
      : 'Reviewed';

  const metadataItems = sections
    .filter((s) => s.label !== 'Outcome')
    .map((s) => `**${s.label}:** ${s.value}`)
    .join(' | ');

  return `## Claude Code Review

> **${outcomeEmoji}**${metadataItems ? ` | ${metadataItems}` : ''}`;
}
