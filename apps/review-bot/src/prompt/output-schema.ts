/**
 * Output Schema
 *
 * Zod schema for Claude's structured review output. Defines the expected
 * shape of the review response including inline comments, thread responses,
 * and the overall verdict.
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// =============================================================================
// Sub-schemas
// =============================================================================

/** Schema for a new inline comment on a specific diff line */
export const inlineCommentNewSchema = z.object({
  path: z.string(),
  line: z.number().int().positive(),
  body: z.string(),
  suggestion: z.string().optional(),
  side: z.enum(['LEFT', 'RIGHT']).optional(),
});

/** Schema for a response to an existing review comment thread */
export const inlineCommentResponseSchema = z.object({
  comment_id: z.number().int(),
  body: z.string(),
  should_resolve: z.boolean().optional(),
});

// =============================================================================
// Main Review Output Schema
// =============================================================================

/** Complete schema for Claude's structured review output */
export const reviewOutputSchema = z.object({
  pr_review_body: z.string(),
  pr_review_outcome: z.enum(['COMMENT', 'APPROVE', 'REQUEST_CHANGES']),
  inline_comments_new: z.array(inlineCommentNewSchema),
  inline_comments_responses: z.array(inlineCommentResponseSchema).optional().default([]),
  files_reviewed: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1).optional(),
});

// =============================================================================
// Inferred Types
// =============================================================================

export type ReviewOutput = z.infer<typeof reviewOutputSchema>;
export type InlineCommentNew = z.infer<typeof inlineCommentNewSchema>;
export type InlineCommentResponse = z.infer<typeof inlineCommentResponseSchema>;

// =============================================================================
// JSON Schema Conversion
// =============================================================================

/**
 * Converts the review output Zod schema to a JSON Schema object.
 * Useful for the Anthropic tool_use API which requires JSON Schema definitions.
 *
 * @returns JSON Schema representation of the review output schema
 */
export function reviewOutputToJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(reviewOutputSchema, {
    target: 'openApi3',
  }) as Record<string, unknown>;
}
