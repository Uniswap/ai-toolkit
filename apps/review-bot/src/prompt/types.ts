/**
 * Template variables for prompt substitution.
 * These are replaced in section content using ${VARIABLE} syntax.
 */
export interface TemplateVariables {
  REPO_OWNER: string;
  REPO_NAME: string;
  PR_NUMBER: string;
  BASE_REF: string;
  PATCH_ID: string;
  MERGE_BASE: string;
  LINES_CHANGED: string;
  CHANGED_FILES: string;
  PR_DIFF: string;
  EXISTING_COMMENTS_JSON: string;
}

/**
 * Options for building the assembled prompt.
 */
export interface PromptBuildOptions {
  /** Path to the sections directory (containing fixed/ and overridable/) */
  promptDir: string;
  /** Template variables for substitution */
  variables: TemplateVariables;
  /** Override content strings keyed by section override key */
  overrides?: Record<string, string>;
  /** Number of existing review comments on the PR */
  existingCommentCount: number;
  /** Whether the PR is considered trivial (< 20 lines) */
  isTrivial: boolean;
}

/**
 * Result of building the assembled prompt.
 */
export interface PromptBuildResult {
  /** The fully assembled prompt string */
  prompt: string;
  /** List of included section filenames */
  sections: string[];
  /** List of overridden section override keys */
  overridesApplied: string[];
}

/** Section category determines ordering and behavior */
export type SectionCategory =
  | 'fixedEarly'
  | 'overridable'
  | 'fixedLate'
  | 'conditional'
  | 'fixedFinal';

/**
 * Configuration for a single prompt section.
 */
export interface SectionConfig {
  /** The markdown filename (e.g., "1-review-context.md") */
  filename: string;
  /** Which category this section belongs to */
  category: SectionCategory;
  /** Override key for overridable sections (e.g., "reviewPriorities") */
  overrideKey?: string;
  /** Condition function for conditional sections */
  condition?: (options: PromptBuildOptions) => boolean;
}
