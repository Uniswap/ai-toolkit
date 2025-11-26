# PR Title & Description Generation Guidelines

You are generating a PR title and description for a pull request. Your goal is to create clear, informative metadata that helps reviewers understand the changes at a glance.

## Your Task

1. **Analyze the PR changes** - Read the diff and understand what was modified
2. **Learn from repository patterns** - Study the commit history and recent PRs provided in the context
3. **Generate appropriate title** - Following conventional commit format and repository conventions
4. **Generate comprehensive description** - Following the template patterns observed from recent PRs

## Repository Context

**IMPORTANT**: Before generating, check for CLAUDE.md files in this repository:

1. **Root guidelines**: `CLAUDE.md` at repository root
2. **Package-specific guidelines**: `CLAUDE.md` files in relevant directories

These files may contain repository-specific conventions for PR titles and descriptions. **Prioritize repository conventions over these general guidelines.**

## PR Title Guidelines

### Conventional Commit Format

Follow the conventional commit specification:

```
<type>(<scope>): <description>
```

### Types

Choose the most appropriate type:

- **feat**: New feature or capability
- **fix**: Bug fix
- **chore**: Maintenance tasks, dependency updates
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or external dependency changes
- **ci**: CI/CD configuration changes
- **revert**: Reverting a previous commit

### Scope

Derive the scope from the primary area of change:

- Use package names for monorepos: `feat(auth-service):`
- Use feature areas: `fix(login):`
- Use file types for broad changes: `docs(readme):`
- Omit scope if changes span multiple areas: `chore: update dependencies`

### Description

Write a concise, imperative description:

- **Do**: `add user authentication flow`
- **Don't**: `added user authentication flow` (past tense)
- **Don't**: `adds user authentication flow` (third person)
- Maximum 72 characters total for the entire title
- No period at the end
- Lowercase first word after the colon

### Examples from Analysis

Study the recent commit messages provided in the context. Look for:

- Scoping conventions (what scopes are commonly used?)
- Description style (how verbose are they?)
- Any special patterns (issue references, ticket numbers, etc.)

## PR Description Guidelines

### Structure

Analyze the recent merged PR descriptions and identify the template pattern. Common elements include:

1. **Summary Section**: Brief overview of the changes
2. **Changes List**: Bullet points of key modifications
3. **Breaking Changes**: If applicable
4. **Testing Notes**: How to verify the changes
5. **Related Issues**: Links to tickets/issues

### Content Guidelines

- **Be specific**: List actual files/functions changed, not vague descriptions
- **Explain the "why"**: Not just what changed, but why it was needed
- **Highlight risks**: Breaking changes, migration requirements, dependencies
- **Keep it scannable**: Use headers, bullets, and formatting
- **Reference context**: Link to issues, discussions, or related PRs if applicable

### Template Adaptation

If the recent PRs follow a consistent template, adapt your description to match:

- Use similar section headers
- Follow the same level of detail
- Include similar metadata (checkboxes, labels, etc.)

If no clear template exists, use this default structure:

```markdown
## Summary

[Brief 1-2 sentence overview of the PR purpose]

## Changes

- [Key change 1]
- [Key change 2]
- [Key change 3]

## Notes

[Any additional context, breaking changes, or testing instructions]
```

## Analysis Steps

1. **Read the PR diff**: Use `git diff` to understand what changed
2. **Review commit history**: Look at the provided recent commits for title patterns
3. **Review PR descriptions**: Analyze recent merged PRs for description templates
4. **Identify the primary change type**: What's the main purpose of this PR?
5. **Determine the scope**: What area of the codebase is primarily affected?
6. **Generate title**: Apply conventions and patterns learned
7. **Generate description**: Follow the template pattern with specific details

## Important Notes

- **Don't be verbose**: Concise is better than comprehensive
- **Don't guess**: If you're unsure about something, be conservative
- **Don't add features**: Describe what exists, don't suggest additions
- **Do match patterns**: Consistency with existing conventions is key
- **Do be specific**: Vague descriptions are not helpful

## Output Requirements

After completing your analysis, you must create two files:

1. `.claude-pr-title.txt` - Single line with the PR title (no quotes, no markdown)
2. `.claude-pr-description.md` - Full PR description in markdown format

These files will be used by the workflow to update the PR automatically.
