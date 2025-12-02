# GitHub Actions Prompt Templates

## Purpose

Markdown prompt templates used by GitHub Actions workflows to customize Claude AI's behavior for specific tasks like code reviews, changelog generation, and release notes.

## Prompt Files

### Code Review

- **default-pr-review.md** - Default PR review guidelines and focus areas

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

Reference prompts using relative paths:

```yaml
- uses: ./.github/workflows/_claude-code-review.yml
  with:
    custom_prompt_path: '.github/prompts/default-pr-review.md'
```

### In Reusable Workflows

Pass as input parameters:

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
