/**
 * Anthropic Claude API client for structured code review requests.
 *
 * Uses the tool_use pattern to get structured JSON output from Claude:
 * 1. Defines a `submit_review` tool whose input_schema matches ReviewOutput
 * 2. Forces tool use with tool_choice: { type: "tool", name: "submit_review" }
 * 3. Parses the tool_use block from the response
 * 4. Validates the result against the Zod schema for type safety
 */

import Anthropic from '@anthropic-ai/sdk';
import { reviewOutputSchema, reviewOutputToJsonSchema } from '../prompt/output-schema.js';
import type { ReviewOutput } from '../prompt/output-schema.js';

/**
 * Parameters for requesting a code review from Claude.
 */
export interface ClaudeReviewRequest {
  /** The fully assembled prompt including diff, PR context, and instructions */
  prompt: string;
  /** The Claude model identifier (e.g., 'claude-sonnet-4-20250514') */
  model: string;
  /** Maximum tokens for the response. Defaults to 16384. */
  maxTokens?: number;
}

/**
 * Structured response from a Claude code review request.
 */
export interface ClaudeReviewResponse {
  /** The parsed and validated review output */
  output: ReviewOutput;
  /** Number of input tokens consumed */
  promptTokens: number;
  /** Number of output tokens generated */
  completionTokens: number;
  /** Wall-clock duration of the API call in milliseconds */
  durationMs: number;
}

/**
 * Creates an authenticated Anthropic client instance.
 *
 * @param apiKey - The Anthropic API key
 * @returns A configured Anthropic client
 */
export function createClaudeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

/**
 * Builds the Anthropic tool input_schema from the Zod schema.
 *
 * The Zod schema in `output-schema.ts` is the single source of truth.
 * We convert it to JSON Schema via `zodToJsonSchema` and assert the
 * required `type: 'object'` shape that the Anthropic SDK expects.
 * This is safe because `reviewOutputSchema` is always a `z.object()`.
 */
function getToolInputSchema(): Anthropic.Tool.InputSchema {
  const jsonSchema = reviewOutputToJsonSchema();
  return {
    ...jsonSchema,
    type: 'object' as const,
  };
}

/**
 * Sends a code review request to Claude using the tool_use pattern
 * for structured output.
 *
 * The function:
 * 1. Defines a `submit_review` tool with the ReviewOutput JSON Schema
 * 2. Forces Claude to use it via tool_choice
 * 3. Extracts and validates the structured response via Zod
 *
 * @param client - An authenticated Anthropic client
 * @param request - The review request parameters
 * @returns A validated, structured review response with token usage metrics
 * @throws {Error} If Claude does not return a tool_use block
 * @throws {ZodError} If the tool output fails schema validation
 */
export async function requestReview(
  client: Anthropic,
  request: ClaudeReviewRequest
): Promise<ClaudeReviewResponse> {
  const startTime = Date.now();

  const response = await client.messages.create({
    model: request.model,
    max_tokens: request.maxTokens ?? 16384,
    tools: [
      {
        name: 'submit_review',
        description:
          'Submit the completed code review as structured JSON. ' +
          'You MUST call this tool exactly once with your full review.',
        input_schema: getToolInputSchema(),
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_review' },
    messages: [
      {
        role: 'user',
        content: request.prompt,
      },
    ],
  });

  const toolUseBlock = response.content.find((block) => block.type === 'tool_use');

  if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
    throw new Error(
      'Claude did not return a tool_use response block. ' +
        `Received ${response.content.length} content block(s) with types: ` +
        `[${response.content.map((b) => b.type).join(', ')}]. ` +
        `Stop reason: ${response.stop_reason}`
    );
  }

  // toolUseBlock.input is typed as `unknown` by the SDK,
  // which is exactly what Zod's .parse() accepts.
  const parsed = reviewOutputSchema.parse(toolUseBlock.input);

  const durationMs = Date.now() - startTime;

  return {
    output: parsed,
    promptTokens: response.usage.input_tokens,
    completionTokens: response.usage.output_tokens,
    durationMs,
  };
}
