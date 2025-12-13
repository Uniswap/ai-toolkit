#!/usr/bin/env npx tsx
/**
 * Build Prompt Script
 *
 * Assembles the PR review prompt from modular section files. This script
 * handles template variable substitution, section overrides, conditional
 * section inclusion, and HTML comment tag wrapping for cross-referencing.
 *
 * The prompt is assembled from files in .github/prompts/pr-review/:
 *   - fixed/       : Always-included sections (1-3, 13-15, 17-19)
 *   - overridable/ : Sections that can be replaced (4-12, 16)
 *
 * Section Order (1-19):
 *   1-3:   Fixed early (review context, diff instructions, repository context)
 *   4-12:  Overridable (priorities, files to skip, communication, patterns,
 *          initial review process, avoid patterns, verdict rules)
 *   13-15: Fixed late (inline comment rules, important notes, comment examples)
 *   16-18: Conditional (re-review process, existing comments, fast review mode)
 *   19:    Fixed final (output guidance)
 *
 * @usage
 *   npx tsx .github/scripts/build-prompt.ts \
 *     --prompt-dir ".github/prompts/pr-review" \
 *     --output "/tmp/final-prompt.txt" \
 *     --repo-owner "Uniswap" \
 *     --repo-name "ai-toolkit" \
 *     --pr-number "123" \
 *     --base-ref "main" \
 *     --patch-id "abc123" \
 *     --base-sha "def456" \
 *     --lines-changed "50" \
 *     --changed-files "src/foo.ts\nsrc/bar.ts" \
 *     --pr-diff "diff content..." \
 *     --existing-comment-count "0" \
 *     --is-trivial "false"
 *
 * @environment
 *   OVERRIDE_REVIEW_PRIORITIES - Path to custom review priorities file
 *   OVERRIDE_FILES_TO_SKIP - Path to custom files-to-skip file
 *   OVERRIDE_COMMUNICATION_STYLE - Path to custom communication style file
 *   OVERRIDE_PATTERN_RECOGNITION - Path to custom pattern recognition file
 *   OVERRIDE_INITIAL_REVIEW_PROCESS - Path to custom initial review process file
 *   OVERRIDE_AVOID_PATTERNS - Path to custom avoid patterns file
 *   OVERRIDE_VERDICT_APPROVE - Path to custom APPROVE verdict criteria file
 *   OVERRIDE_VERDICT_REQUEST_CHANGES - Path to custom REQUEST_CHANGES verdict criteria file
 *   OVERRIDE_VERDICT_COMMENT - Path to custom COMMENT verdict criteria file
 *   OVERRIDE_RE_REVIEW_PROCESS - Path to custom re-review process file
 *
 * @output
 *   Writes assembled prompt to --output file
 *   Exits with 0 on success, 1 on failure
 */

import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { parseArgs } from 'node:util';
import { randomBytes } from 'node:crypto';

// =============================================================================
// Types
// =============================================================================

export interface TemplateVariables {
  REPO_OWNER: string;
  REPO_NAME: string;
  PR_NUMBER: string;
  BASE_REF: string;
  PATCH_ID: string;
  MERGE_BASE: string; // Merge base commit SHA (common ancestor where PR branch diverged)
  LINES_CHANGED: string;
  CHANGED_FILES: string;
  PR_DIFF: string;
  EXISTING_COMMENTS_JSON: string;
}

export interface PromptBuildOptions {
  promptDir: string;
  variables: TemplateVariables;
  overrides?: {
    reviewPriorities?: string;
    filesToSkip?: string;
    communicationStyle?: string;
    patternRecognition?: string;
    initialReviewProcess?: string;
    avoidPatterns?: string;
    verdictApprove?: string;
    verdictRequestChanges?: string;
    verdictComment?: string;
    reReviewProcess?: string;
  };
  existingCommentCount: number;
  isTrivial: boolean;
}

export interface PromptBuildResult {
  prompt: string;
  sectionsIncluded: string[];
  overridesApplied: string[];
  errors: string[];
}

// =============================================================================
// Section Definitions
// =============================================================================

/**
 * Fixed sections that are always included at the start (in order)
 */
export const FIXED_SECTIONS_EARLY = [
  '1-review-context.md',
  '2-diff-instructions.md',
  '3-repository-context.md',
];

/**
 * Overridable sections (in order) with their override keys.
 * Consumers can replace these by providing a custom file path.
 */
export const OVERRIDABLE_SECTIONS = [
  { file: '4-review-priorities.md', overrideKey: 'reviewPriorities' },
  { file: '5-files-to-skip.md', overrideKey: 'filesToSkip' },
  { file: '6-communication-style.md', overrideKey: 'communicationStyle' },
  { file: '7-pattern-recognition.md', overrideKey: 'patternRecognition' },
  { file: '8-initial-review-process.md', overrideKey: 'initialReviewProcess' },
  { file: '9-avoid-patterns.md', overrideKey: 'avoidPatterns' },
  { file: '10-verdict-approve.md', overrideKey: 'verdictApprove' },
  { file: '11-verdict-request-changes.md', overrideKey: 'verdictRequestChanges' },
  { file: '12-verdict-comment.md', overrideKey: 'verdictComment' },
] as const;

/**
 * Fixed sections that come after overridable sections (in order)
 */
export const FIXED_SECTIONS_LATE = [
  '13-inline-comment-rules.md',
  '14-important-notes.md',
  '15-comment-examples.md',
];

/**
 * Conditional sections (included based on PR state)
 */
export const CONDITIONAL_SECTIONS = {
  /** Included when existingCommentCount > 0 (re-reviews) */
  reReviewProcess: '16-re-review-process.md',
  /** Included when existingCommentCount > 0 (re-reviews) */
  existingComments: '17-existing-comments.md',
  /** Included when isTrivial is true */
  fastReviewMode: '18-fast-review-mode.md',
};

/**
 * Final fixed sections (always included, at the end)
 */
export const FIXED_SECTIONS_FINAL = ['19-output-guidance.md'];

/**
 * Critical sections that MUST be included for a valid prompt.
 * If any of these are missing, the build will fail.
 */
export const CRITICAL_SECTIONS = [
  '10-verdict-approve.md',
  '11-verdict-request-changes.md',
  '12-verdict-comment.md',
  '19-output-guidance.md',
];

// =============================================================================
// Security Utilities
// =============================================================================

/**
 * Validates that an override path is safe (no path traversal, within repository)
 * @param overridePath - The path to validate
 * @param baseDir - The base directory paths must be relative to (defaults to cwd)
 * @returns An object with isValid flag and optional error message
 */
export function validateOverridePath(
  overridePath: string,
  baseDir: string = process.cwd()
): { isValid: boolean; error: string | null } {
  // Empty or null paths are valid (means no override)
  if (!overridePath) {
    return { isValid: true, error: null };
  }

  // Reject absolute paths
  if (isAbsolute(overridePath)) {
    return {
      isValid: false,
      error: `Absolute paths not allowed for overrides: ${overridePath}`,
    };
  }

  // Resolve the path and check it's within the base directory
  const resolvedPath = resolve(baseDir, overridePath);
  const relativePath = relative(baseDir, resolvedPath);

  // Check for path traversal (resolved path is outside base directory)
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return {
      isValid: false,
      error: `Path traversal detected - override path is outside repository: ${overridePath}`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Generates a unique delimiter for GITHUB_OUTPUT to prevent injection attacks
 * @returns A unique delimiter string
 */
export function generateUniqueDelimiter(): string {
  const timestamp = Date.now();
  const randomPart = randomBytes(8).toString('hex');
  return `PROMPT_DELIMITER_${timestamp}_${randomPart}`;
}

// =============================================================================
// Tag Utilities
// =============================================================================

/**
 * Derives a tag name from a section filename by stripping numeric prefix and extension.
 * Examples:
 *   "1-review-context.md" -> "review-context"
 *   "8-initial-review-process.md" -> "initial-review-process"
 *   "16-re-review-process.md" -> "re-review-process"
 *
 * @param filename - The section filename
 * @returns The derived tag name in kebab-case
 */
export function deriveSectionTagName(filename: string): string {
  // Remove .md extension
  const base = filename.replace(/\.md$/, '');
  // Remove numeric prefix (e.g., "1-", "16-")
  const withoutPrefix = base.replace(/^\d+-/, '');
  return withoutPrefix;
}

/**
 * Wraps section content with HTML comment tags for cross-referencing.
 * The tags allow other sections to reference this section's location.
 *
 * @param content - The section content to wrap
 * @param tagName - The tag name (derived from filename)
 * @returns Content wrapped with start and end comment tags
 */
export function wrapSectionWithTags(content: string, tagName: string): string {
  return `<!-- pr-review-${tagName}-start -->\n${content}\n<!-- pr-review-${tagName}-end -->`;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Substitutes template variables in content using ${VAR} syntax
 */
export function substituteVariables(content: string, variables: TemplateVariables): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    // Handle both ${VAR} and $VAR syntax
    const regex = new RegExp(`\\$\\{${key}\\}|\\$${key}(?![A-Z_])`, 'g');
    result = result.replace(regex, value ?? '');
  }

  return result;
}

/**
 * Reads a section file and returns its content
 */
export function readSectionFile(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Processes a section: reads file, substitutes variables, returns content
 */
export function processSection(
  filePath: string,
  variables: TemplateVariables
): { content: string | null; error: string | null } {
  const content = readSectionFile(filePath);

  if (content === null) {
    return { content: null, error: `Section file not found: ${filePath}` };
  }

  const substituted = substituteVariables(content, variables);
  return { content: substituted, error: null };
}

/**
 * Builds the complete prompt from modular sections.
 * Each section is wrapped with HTML comment tags for cross-referencing.
 */
export function buildPrompt(options: PromptBuildOptions): PromptBuildResult {
  const { promptDir, variables, overrides = {}, existingCommentCount, isTrivial } = options;

  const result: PromptBuildResult = {
    prompt: '',
    sectionsIncluded: [],
    overridesApplied: [],
    errors: [],
  };

  const sections: string[] = [];

  // Helper to add a section with tag wrapping
  const addSection = (name: string, content: string) => {
    const tagName = deriveSectionTagName(name);
    const wrappedContent = wrapSectionWithTags(content, tagName);
    sections.push(wrappedContent);
    sections.push(''); // Blank line between sections
    result.sectionsIncluded.push(name);
  };

  // Helper to process an overridable section with override path support
  const processOverridableSection = (
    file: string,
    overrideKey: string,
    overridePath: string | undefined
  ) => {
    let filePath: string;
    let isOverride = false;

    // Validate override path for security (prevent path traversal)
    if (overridePath) {
      const validation = validateOverridePath(overridePath);
      if (!validation.isValid && validation.error) {
        result.errors.push(validation.error);
        // Fall back to default section on security error
        filePath = join(promptDir, 'overridable', file);
      } else {
        // Resolve the path relative to cwd for file existence check
        const resolvedOverridePath = resolve(process.cwd(), overridePath);
        if (existsSync(resolvedOverridePath)) {
          // Use consumer's override file (path validated)
          filePath = resolvedOverridePath;
          isOverride = true;
        } else {
          // Override path specified but file doesn't exist - fall back to default
          filePath = join(promptDir, 'overridable', file);
        }
      }
    } else {
      // Use default from ai-toolkit
      filePath = join(promptDir, 'overridable', file);
    }

    const { content, error } = processSection(filePath, variables);

    if (error) {
      result.errors.push(error);
    } else if (content) {
      addSection(file, content);
      if (isOverride) {
        result.overridesApplied.push(overrideKey);
      }
    }
  };

  // 1. Early fixed sections (1-3)
  for (const sectionFile of FIXED_SECTIONS_EARLY) {
    const filePath = join(promptDir, 'fixed', sectionFile);
    const { content, error } = processSection(filePath, variables);

    if (error) {
      result.errors.push(error);
    } else if (content) {
      addSection(sectionFile, content);
    }
  }

  // 2. Overridable sections (4-12)
  for (const { file, overrideKey } of OVERRIDABLE_SECTIONS) {
    const overridePath = overrides[overrideKey as keyof typeof overrides];
    processOverridableSection(file, overrideKey, overridePath);
  }

  // 3. Late fixed sections (13-15)
  for (const sectionFile of FIXED_SECTIONS_LATE) {
    const filePath = join(promptDir, 'fixed', sectionFile);
    const { content, error } = processSection(filePath, variables);

    if (error) {
      result.errors.push(error);
    } else if (content) {
      addSection(sectionFile, content);
    }
  }

  // 4. Conditional section: re-review process (only for re-reviews)
  if (existingCommentCount > 0) {
    const overridePath = overrides.reReviewProcess;
    processOverridableSection(
      CONDITIONAL_SECTIONS.reReviewProcess,
      'reReviewProcess',
      overridePath
    );
  }

  // 5. Conditional section: existing comments (only for re-reviews)
  if (existingCommentCount > 0) {
    const filePath = join(promptDir, 'fixed', CONDITIONAL_SECTIONS.existingComments);
    const { content, error } = processSection(filePath, variables);

    if (error) {
      result.errors.push(error);
    } else if (content) {
      addSection(CONDITIONAL_SECTIONS.existingComments, content);
    }
  }

  // 6. Conditional section: fast review mode (only for trivial PRs)
  if (isTrivial) {
    const filePath = join(promptDir, 'fixed', CONDITIONAL_SECTIONS.fastReviewMode);
    const { content, error } = processSection(filePath, variables);

    if (error) {
      result.errors.push(error);
    } else if (content) {
      addSection(CONDITIONAL_SECTIONS.fastReviewMode, content);
    }
  }

  // 7. Final fixed sections (19)
  for (const sectionFile of FIXED_SECTIONS_FINAL) {
    const filePath = join(promptDir, 'fixed', sectionFile);
    const { content, error } = processSection(filePath, variables);

    if (error) {
      result.errors.push(error);
    } else if (content) {
      addSection(sectionFile, content);
    }
  }

  result.prompt = sections.join('\n');

  // Validate that critical sections were included
  for (const criticalSection of CRITICAL_SECTIONS) {
    if (!result.sectionsIncluded.includes(criticalSection)) {
      result.errors.push(`CRITICAL: Required section missing: ${criticalSection}`);
    }
  }

  return result;
}

// =============================================================================
// CLI
// =============================================================================

function main() {
  const { values } = parseArgs({
    options: {
      'prompt-dir': { type: 'string', default: '.github/prompts/pr-review' },
      output: { type: 'string', default: '/tmp/final-prompt.txt' },
      'repo-owner': { type: 'string', default: '' },
      'repo-name': { type: 'string', default: '' },
      'pr-number': { type: 'string', default: '' },
      'base-ref': { type: 'string', default: '' },
      'patch-id': { type: 'string', default: '' },
      'base-sha': { type: 'string', default: '' },
      'lines-changed': { type: 'string', default: '0' },
      'changed-files': { type: 'string', default: '' },
      'pr-diff': { type: 'string', default: '' },
      'existing-comments-json': { type: 'string', default: '[]' },
      'existing-comment-count': { type: 'string', default: '0' },
      'is-trivial': { type: 'string', default: 'false' },
      // Files to read content from (alternative to inline args)
      'changed-files-file': { type: 'string' },
      'pr-diff-file': { type: 'string' },
      'existing-comments-file': { type: 'string' },
    },
    strict: true,
  });

  // Read content from files if specified
  let changedFiles = values['changed-files'] || '';
  let prDiff = values['pr-diff'] || '';
  let existingCommentsJson = values['existing-comments-json'] || '[]';

  if (values['changed-files-file'] && existsSync(values['changed-files-file'])) {
    changedFiles = readFileSync(values['changed-files-file'], 'utf-8');
  }

  if (values['pr-diff-file'] && existsSync(values['pr-diff-file'])) {
    prDiff = readFileSync(values['pr-diff-file'], 'utf-8');
  }

  if (values['existing-comments-file'] && existsSync(values['existing-comments-file'])) {
    existingCommentsJson = readFileSync(values['existing-comments-file'], 'utf-8');
  }

  // Note: --base-sha receives the merge base commit SHA (common ancestor where PR branch diverged)
  const variables: TemplateVariables = {
    REPO_OWNER: values['repo-owner'] || '',
    REPO_NAME: values['repo-name'] || '',
    PR_NUMBER: values['pr-number'] || '',
    BASE_REF: values['base-ref'] || '',
    PATCH_ID: values['patch-id'] || '',
    MERGE_BASE: values['base-sha'] || '', // Merge base commit SHA
    LINES_CHANGED: values['lines-changed'] || '0',
    CHANGED_FILES: changedFiles,
    PR_DIFF: prDiff,
    EXISTING_COMMENTS_JSON: existingCommentsJson,
  };

  // Read overrides from environment variables
  const overrides = {
    reviewPriorities: process.env.OVERRIDE_REVIEW_PRIORITIES,
    filesToSkip: process.env.OVERRIDE_FILES_TO_SKIP,
    communicationStyle: process.env.OVERRIDE_COMMUNICATION_STYLE,
    patternRecognition: process.env.OVERRIDE_PATTERN_RECOGNITION,
    initialReviewProcess: process.env.OVERRIDE_INITIAL_REVIEW_PROCESS,
    avoidPatterns: process.env.OVERRIDE_AVOID_PATTERNS,
    verdictApprove: process.env.OVERRIDE_VERDICT_APPROVE,
    verdictRequestChanges: process.env.OVERRIDE_VERDICT_REQUEST_CHANGES,
    verdictComment: process.env.OVERRIDE_VERDICT_COMMENT,
    reReviewProcess: process.env.OVERRIDE_RE_REVIEW_PROCESS,
  };

  const options: PromptBuildOptions = {
    promptDir: resolve(values['prompt-dir'] || '.github/prompts/pr-review'),
    variables,
    overrides,
    existingCommentCount: parseInt(values['existing-comment-count'] || '0', 10),
    isTrivial: values['is-trivial'] === 'true',
  };

  console.log('📝 Building prompt from modular section files');
  console.log(`   Prompt directory: ${options.promptDir}`);

  const result = buildPrompt(options);

  // Report results
  console.log(`✅ Included ${result.sectionsIncluded.length} sections`);

  if (result.overridesApplied.length > 0) {
    console.log(
      `✅ Applied ${result.overridesApplied.length} override(s): ${result.overridesApplied.join(
        ', '
      )}`
    );
  }

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.warn(`⚠️  ${error}`);
    }
  }

  // Write output
  const outputPath = resolve(values.output || '/tmp/final-prompt.txt');
  writeFileSync(outputPath, result.prompt, 'utf-8');
  console.log(`✅ Wrote prompt to ${outputPath} (${result.prompt.length} characters)`);

  // Also output to GITHUB_OUTPUT if available
  // Use a unique delimiter to prevent injection attacks if prompt content
  // contains the delimiter string
  if (process.env.GITHUB_OUTPUT) {
    const delimiter = generateUniqueDelimiter();
    const output = `final_prompt<<${delimiter}\n${result.prompt}\n${delimiter}\n`;
    appendFileSync(process.env.GITHUB_OUTPUT, output);
    console.log('✅ Exported to GITHUB_OUTPUT');
  }

  // Exit with error if there were critical errors
  const hasCriticalErrors = result.errors.some((e) => e.startsWith('CRITICAL:'));
  if (hasCriticalErrors) {
    console.error('❌ Critical sections missing - prompt build failed');
    for (const error of result.errors.filter((e) => e.startsWith('CRITICAL:'))) {
      console.error(`   ${error}`);
    }
    process.exit(1);
  }

  if (result.errors.length > 0 && result.sectionsIncluded.length === 0) {
    console.error('❌ No sections were included - prompt build failed');
    process.exit(1);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main();
}
