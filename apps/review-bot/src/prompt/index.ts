// Types
export type {
  TemplateVariables,
  PromptBuildOptions,
  PromptBuildResult,
  SectionCategory,
  SectionConfig,
} from './types.js';

// Builder
export {
  substituteVariables,
  deriveSectionTagName,
  wrapSectionWithTags,
  buildPrompt,
  ALL_SECTIONS,
} from './builder.js';

// Thread utilities
export type { RawComment, CommentReply, ThreadedComment } from './thread-utils.js';
export {
  isBot,
  filterBotReplies,
  hasGenuineBackAndForth,
  hasActiveDiscussion,
  restructureCommentsIntoThreads,
} from './thread-utils.js';

// Output schema
export type { ReviewOutput, InlineCommentNew, InlineCommentResponse } from './output-schema.js';
export {
  inlineCommentNewSchema,
  inlineCommentResponseSchema,
  reviewOutputSchema,
  reviewOutputToJsonSchema,
} from './output-schema.js';
