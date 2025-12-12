# GitHub Actions Prompt Templates

## Purpose

Markdown prompt templates used by GitHub Actions workflows to customize Claude AI's behavior for specific tasks like code reviews, changelog generation, and release notes.

## Prompt Files

### Code Review

- **pr-review/** - Modular PR review prompt sections (see [PR Review Modular Architecture](#pr-review-modular-architecture) below)
  - `fixed/` - Always-included sections (numbered 1-3, 13-15, 17-19)
  - `overridable/` - Sections consumers can replace (numbered 4-12, 16)
- **validation-review.md** - N+1 validation agent guidelines for reviewing another agent's code review output

### PR Metadata Generation

- **generate-pr-title-description.md** - Guidelines for generating PR titles and descriptions

### Changelog Generation

- **release-changelog.md** - Standard release changelog format
- **production-release-changelog.md** - Production release notes with stakeholder focus
- **hotfix-changelog.md** - Hotfix-specific changelog format

### Digest & Reporting

- **weekly-digest.md** - Weekly activity digest format

## Usage

### In Workflows

The `_claude-code-review.yml` workflow assembles the PR review prompt from modular section files in `pr-review/`. Consumers can customize specific sections using `prompt_override_*` inputs:

```yaml
- uses: ./.github/workflows/_claude-code-review.yml
  with:
    pr_number: ${{ github.event.pull_request.number }}
    prompt_override_review_priorities: '.claude/prompts/review-priorities.md'
    prompt_override_files_to_skip: '.claude/prompts/files-to-skip.md'
```

### In Other Reusable Workflows

Some workflows (like changelog generation) accept custom prompt paths:

```yaml
inputs:
  custom_prompt_file:
    description: 'Path to custom prompt file'
    type: string
    default: '.github/prompts/release-changelog.md'
```

## Prompt Structure

### Standard Format

Each prompt follows a consistent structure:

```markdown
# [Task Name]

## Objective

[Clear statement of what Claude should do]

## Context

[Background information needed]

## Instructions

[Step-by-step guidance]

## Output Format

[Expected output structure]

## Examples

[Optional: Sample outputs]
```

### Variables

Prompts may reference workflow variables:

- `${{ env.BRANCH }}` - Branch name
- `${{ env.COMMIT_RANGE }}` - Git commit range
- `${{ env.PR_TITLE }}` - Pull request title

Variables are replaced by workflows before sending to Claude.

## Customization

### Creating New Prompts

1. Copy an existing prompt as a template
2. Update objective and instructions
3. Test with manual workflow dispatch
4. Document in this file
5. Reference from workflow YAML

### Modifying Existing Prompts

**CAUTION**: Prompts affect production workflows. Changes will impact:

- Code review quality and focus
- Changelog formatting and content
- Release note tone and structure

**Best Practice**: Test prompt changes in a branch-specific workflow before merging to `main`.

## Prompt Guidelines

### Writing Effective Prompts

- **Be specific**: Clear, actionable instructions
- **Provide context**: Background info Claude needs
- **Set constraints**: Output format, length, tone
- **Include examples**: Show desired output
- **Consider edge cases**: Handle unusual scenarios

### Common Patterns

#### Code Review Prompts

Focus areas:

- Architecture and design patterns
- Security vulnerabilities
- Performance issues
- Code quality and maintainability
- Test coverage

#### PR Review Modular Architecture

The PR review prompt is assembled from modular section files in `pr-review/`. This architecture provides:

- **Clear separation**: Each section has its own file for easy editing
- **Selective overrides**: Consumers can replace specific sections without forking
- **Template variables**: Dynamic content via `${VAR}` syntax with `envsubst`

**Directory Structure:**

```text
pr-review/
├── fixed/
│   ├── 1-review-context.md          # PR metadata (repo, PR number, etc.)
│   ├── 2-diff-instructions.md       # How to interpret the diff
│   ├── 3-repository-context.md      # CLAUDE.md lookup instructions
│   ├── 13-inline-comment-rules.md   # Line number validation rules
│   ├── 14-important-notes.md        # Key review guidelines
│   ├── 15-comment-examples.md       # Good inline comment examples
│   ├── 17-existing-comments.md      # Re-review context (conditional)
│   ├── 18-fast-review-mode.md       # Trivial PR instructions (conditional)
│   └── 19-output-guidance.md        # JSON output field guidance
│
└── overridable/
    ├── 4-review-priorities.md       # What to focus on during review
    ├── 5-files-to-skip.md           # Files/patterns to exclude
    ├── 6-communication-style.md     # How to phrase feedback
    ├── 7-pattern-recognition.md     # Red flags and good practices
    ├── 8-initial-review-process.md  # Step-by-step initial review process
    ├── 9-avoid-patterns.md          # Anti-patterns to avoid
    ├── 10-verdict-approve.md        # APPROVE verdict criteria
    ├── 11-verdict-request-changes.md # REQUEST_CHANGES verdict criteria
    ├── 12-verdict-comment.md        # COMMENT verdict criteria
    └── 16-re-review-process.md      # Re-review process (conditional)
```

**Overridable Sections:**

| Section File                    | Workflow Input                            | Purpose                           |
| ------------------------------- | ----------------------------------------- | --------------------------------- |
| `4-review-priorities.md`        | `prompt_override_review_priorities`       | What to focus on during review    |
| `5-files-to-skip.md`            | `prompt_override_files_to_skip`           | Files/patterns to exclude         |
| `6-communication-style.md`      | `prompt_override_communication_style`     | How to phrase feedback            |
| `7-pattern-recognition.md`      | `prompt_override_pattern_recognition`     | Code patterns to flag             |
| `8-initial-review-process.md`   | `prompt_override_initial_review_process`  | Initial review steps              |
| `9-avoid-patterns.md`           | `prompt_override_avoid_patterns`          | Anti-patterns to avoid            |
| `10-verdict-approve.md`         | `prompt_override_verdict_approve`         | APPROVE verdict criteria          |
| `11-verdict-request-changes.md` | `prompt_override_verdict_request_changes` | REQUEST_CHANGES verdict criteria  |
| `12-verdict-comment.md`         | `prompt_override_verdict_comment`         | COMMENT verdict criteria          |
| `16-re-review-process.md`       | `prompt_override_re_review_process`       | Re-review steps (when applicable) |

**Override File Requirements:**

- Each `prompt_override_*` input takes a **file path** (not inline content)
- The file must exist in the consumer's repository
- The file should contain properly formatted markdown for that section

**Example Override File** (`.claude/prompts/review-files-to-skip.md`):

```markdown
# Files to Skip

**Project-specific exclusions:**

- `*.generated.ts` - Auto-generated TypeScript
- `**/migrations/**` - Database migrations
```

**Template Variables:**

Files in `fixed/` may use template variables that are substituted at runtime:

| Variable                    | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `${REPO_OWNER}`             | Repository owner                                          |
| `${REPO_NAME}`              | Repository name                                           |
| `${PR_NUMBER}`              | Pull request number                                       |
| `${BASE_REF}`               | Base branch name                                          |
| `${PATCH_ID}`               | Stable patch identifier                                   |
| `${MERGE_BASE}`             | Merge base SHA (common ancestor where PR branch diverged) |
| `${CHANGED_FILES}`          | List of changed files                                     |
| `${PR_DIFF}`                | Full PR diff content                                      |
| `${EXISTING_COMMENTS_JSON}` | Existing review comments (JSON)                           |
| `${LINES_CHANGED}`          | Number of lines changed                                   |

**HTML Comment Tags:**

All sections are wrapped with HTML comment tags for cross-referencing:

```html
<!-- pr-review-review-context-start -->
[Section Content]
<!-- pr-review-review-context-end -->
```

This allows override sections to reference other sections' content (e.g., `<!-- pr-review-output-guidance -->`).

**Important:**

- Fixed sections (1-3, 13-15, 17-19) are always included and cannot be overridden
- Section 16 (re-review process) and 17 (existing comments) are conditional - included when PR has existing review comments
- Section 18 (fast review mode) is conditional - included when PR is trivial
- See `_claude-code-review.yml` workflow for usage with `prompt_override_*` inputs

#### Changelog Prompts

Elements to include:

- Categorization (features, fixes, breaking changes)
- User-facing impact
- Migration guidance
- Attribution to contributors

#### Release Note Prompts

Considerations:

- Target audience (developers vs. stakeholders)
- Technical depth
- Marketing tone (production releases)
- Urgency indicators (hotfixes)

#### PR Metadata Generation Prompts

Focus areas:

- Conventional commit format for titles
- Learning patterns from repository commit history
- Adapting templates from recent merged PR descriptions
- Scope derivation from affected files/packages

## Examples

### Simple Review Prompt

```markdown
# Code Review: Security Focus

Review this PR with emphasis on:

- SQL injection vulnerabilities
- XSS attack vectors
- Authentication/authorization issues
- Sensitive data exposure
```

### Detailed Changelog Prompt

```markdown
# Release Changelog

Generate a changelog with these sections:

## Features

- List new functionality

## Bug Fixes

- List resolved issues

## Breaking Changes

- Highlight incompatible changes with migration steps

Format: Markdown with links to PRs and issues.
```

## Prompt Testing

### Manual Testing

Use `workflow_dispatch` to test prompts:

```bash
gh workflow run _generate-changelog.yml \
  -f before_sha=abc123 \
  -f after_sha=def456 \
  -f custom_prompt_file='.github/prompts/test-prompt.md'
```

### Validation

Check prompt outputs for:

- Completeness (all instructions followed)
- Format consistency
- Appropriate tone
- Correct information

## Related Documentation

- Workflows using prompts: `../.github/workflows/CLAUDE.md`
- Workflow examples: `../.github/workflows/examples/CLAUDE.md`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
