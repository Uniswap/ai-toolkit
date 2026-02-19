/**
 * Prompt Builder
 *
 * Assembles the PR review prompt from modular section files. Handles template
 * variable substitution, section overrides, conditional section inclusion,
 * and HTML comment tag wrapping for cross-referencing.
 *
 * Section Order (1-19):
 *   1-3:   Fixed early (review context, diff instructions, repository context)
 *   4-12:  Overridable (priorities, files to skip, communication, patterns,
 *          initial review process, avoid patterns, verdict rules)
 *   13-15: Fixed late (inline comment rules, important notes, comment examples)
 *   16-18: Conditional (re-review process, existing comments, fast review mode)
 *   19:    Fixed final (output guidance)
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  PromptBuildOptions,
  PromptBuildResult,
  SectionConfig,
  TemplateVariables,
} from './types.js';

// =============================================================================
// Section Definitions
// =============================================================================

/** Fixed sections always included at the start (in order) */
const FIXED_SECTIONS_EARLY: SectionConfig[] = [
  { filename: '1-review-context.md', category: 'fixedEarly' },
  { filename: '2-diff-instructions.md', category: 'fixedEarly' },
  { filename: '3-repository-context.md', category: 'fixedEarly' },
];

/** Overridable sections (in order) with their override keys */
const OVERRIDABLE_SECTIONS: SectionConfig[] = [
  {
    filename: '4-review-priorities.md',
    category: 'overridable',
    overrideKey: 'reviewPriorities',
  },
  {
    filename: '5-files-to-skip.md',
    category: 'overridable',
    overrideKey: 'filesToSkip',
  },
  {
    filename: '6-communication-style.md',
    category: 'overridable',
    overrideKey: 'communicationStyle',
  },
  {
    filename: '7-pattern-recognition.md',
    category: 'overridable',
    overrideKey: 'patternRecognition',
  },
  {
    filename: '8-initial-review-process.md',
    category: 'overridable',
    overrideKey: 'initialReviewProcess',
  },
  {
    filename: '9-avoid-patterns.md',
    category: 'overridable',
    overrideKey: 'avoidPatterns',
  },
  {
    filename: '10-verdict-approve.md',
    category: 'overridable',
    overrideKey: 'verdictApprove',
  },
  {
    filename: '11-verdict-request-changes.md',
    category: 'overridable',
    overrideKey: 'verdictRequestChanges',
  },
  {
    filename: '12-verdict-comment.md',
    category: 'overridable',
    overrideKey: 'verdictComment',
  },
];

/** Fixed sections that come after overridable sections (in order) */
const FIXED_SECTIONS_LATE: SectionConfig[] = [
  { filename: '13-inline-comment-rules.md', category: 'fixedLate' },
  { filename: '14-important-notes.md', category: 'fixedLate' },
  { filename: '15-comment-examples.md', category: 'fixedLate' },
];

/** Conditional sections (included based on PR state) */
const CONDITIONAL_SECTIONS: SectionConfig[] = [
  {
    filename: '16-re-review-process.md',
    category: 'conditional',
    overrideKey: 'reReviewProcess',
    condition: (opts) => opts.existingCommentCount > 0,
  },
  {
    filename: '17-existing-comments.md',
    category: 'conditional',
    condition: (opts) => opts.existingCommentCount > 0,
  },
  {
    filename: '18-fast-review-mode.md',
    category: 'conditional',
    condition: (opts) => opts.isTrivial === true,
  },
];

/** Final fixed sections (always included, at the end) */
const FIXED_SECTIONS_FINAL: SectionConfig[] = [
  { filename: '19-output-guidance.md', category: 'fixedFinal' },
];

/**
 * All sections in assembly order.
 * Exported for testing.
 */
export const ALL_SECTIONS: readonly SectionConfig[] = [
  ...FIXED_SECTIONS_EARLY,
  ...OVERRIDABLE_SECTIONS,
  ...FIXED_SECTIONS_LATE,
  ...CONDITIONAL_SECTIONS,
  ...FIXED_SECTIONS_FINAL,
];

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Substitutes template variables in content using ${VARIABLE} syntax.
 *
 * Performs a single pass only (no recursive substitution) to prevent
 * injection attacks where variable values contain template syntax.
 * Unknown variables are left unchanged.
 *
 * @param content - The template content with ${VARIABLE} placeholders
 * @param variables - The variable values to substitute
 * @returns Content with variables replaced
 */
export function substituteVariables(content: string, variables: TemplateVariables): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    // Handle ${VAR} syntax. The negative lookahead prevents partial matches
    // on $VAR syntax (e.g., $REPO_OWNER should not match inside $REPO_OWNER_EXTRA)
    const regex = new RegExp(`\\$\\{${key}\\}|\\$${key}(?![A-Z_])`, 'g');
    result = result.replace(regex, value ?? '');
  }

  return result;
}

/**
 * Derives a tag name from a section filename by stripping numeric prefix and extension.
 *
 * @example
 * deriveSectionTagName("1-review-context.md") // "review-context"
 * deriveSectionTagName("16-re-review-process.md") // "re-review-process"
 *
 * @param filename - The section filename
 * @returns The derived tag name in kebab-case
 */
export function deriveSectionTagName(filename: string): string {
  const base = filename.replace(/\.md$/, '');
  const withoutPrefix = base.replace(/^\d+-/, '');
  return withoutPrefix;
}

/**
 * Wraps section content with HTML comment tags for cross-referencing.
 *
 * @param content - The section content to wrap
 * @param tagName - The tag name (derived from filename)
 * @returns Content wrapped with start and end comment tags
 */
export function wrapSectionWithTags(content: string, tagName: string): string {
  return `<!-- pr-review-${tagName}-start -->\n${content}\n<!-- pr-review-${tagName}-end -->`;
}

/**
 * Resolves the filesystem path for a section file.
 *
 * Fixed and conditional sections without overrideKey live in fixed/.
 * Overridable sections and conditional sections with overrideKey live in overridable/.
 */
function resolveSectionPath(promptDir: string, config: SectionConfig): string {
  if (
    config.category === 'overridable' ||
    (config.category === 'conditional' && config.overrideKey !== undefined)
  ) {
    return join(promptDir, 'overridable', config.filename);
  }
  return join(promptDir, 'fixed', config.filename);
}

/**
 * Builds the complete prompt from modular section files.
 *
 * Each section is wrapped with HTML comment tags for cross-referencing.
 * Overridable sections can be replaced with custom content strings passed
 * in options.overrides. Conditional sections are only included when their
 * condition function returns true.
 *
 * @param options - Build configuration
 * @returns The assembled prompt with metadata
 */
export async function buildPrompt(options: PromptBuildOptions): Promise<PromptBuildResult> {
  const { promptDir, variables, overrides = {}, existingCommentCount, isTrivial } = options;

  const result: PromptBuildResult = {
    prompt: '',
    sections: [],
    overridesApplied: [],
  };

  const parts: string[] = [];

  for (const config of ALL_SECTIONS) {
    // Skip conditional sections whose condition is not met
    if (
      config.category === 'conditional' &&
      config.condition !== undefined &&
      !config.condition({ promptDir, variables, overrides, existingCommentCount, isTrivial })
    ) {
      continue;
    }

    let content: string;
    let isOverride = false;

    // Check if this section has an override
    if (config.overrideKey !== undefined && overrides[config.overrideKey] !== undefined) {
      content = overrides[config.overrideKey];
      isOverride = true;
    } else {
      // Read from file
      const filePath = resolveSectionPath(promptDir, config);
      content = await readFile(filePath, 'utf-8');
    }

    // Substitute template variables (single pass, no recursion)
    const substituted = substituteVariables(content, variables);

    // Wrap with section tags
    const tagName = deriveSectionTagName(config.filename);
    const wrapped = wrapSectionWithTags(substituted, tagName);

    parts.push(wrapped);
    parts.push(''); // Blank line between sections
    result.sections.push(config.filename);

    if (isOverride && config.overrideKey !== undefined) {
      result.overridesApplied.push(config.overrideKey);
    }
  }

  result.prompt = parts.join('\n');
  return result;
}
