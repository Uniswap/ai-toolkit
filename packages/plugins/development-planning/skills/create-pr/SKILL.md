---
description: Create or update pull requests with conventional commits. Use when user says "create a PR for these changes", "submit this for review", "open a pull request", "push these changes and create a PR", "I'm ready to submit this work", or "create PR and link to issue #123".
allowed-tools: Bash(git:*), Bash(gt:*), Bash(gh:*), Read, Glob, Grep, Task(subagent_type:pr-creator-agent), Task(subagent_type:commit-message-generator-agent)
model: opus
---

# PR Creator

Create or update pull requests with auto-generated conventional commits and descriptions. Supports both standard Git + GitHub CLI (default) and Graphite workflows.

## What It Does

1. **Analyze Diff**: Run `git diff origin/<target>...HEAD` to inspect all changed files
2. **Detect Change Type**: Classify as feat, fix, refactor, etc. based on the diff
3. **Generate Commit**: Use `commit-message-generator-agent` to draft a conventional commit message, then ask user to confirm before staging/committing
4. **Create PR Title**: `<type>(<scope>): <description>`
5. **Write Description**: Comprehensive PR body (summary, modified files, testing notes, linked issues)
6. **Submit**: Use `gt submit` (Graphite) or `gh pr create` (default)

## Error Handling

- **No changes / no commits ahead of target**: Stop and inform the user — there is nothing to submit
- **PR already exists for this branch**: Switch to update mode; run `git push` to publish the latest commits (use `gt submit` for Graphite), then `gh pr edit` if the PR title or body also need updating
- **User rejects commit message**: Re-generate with user-provided guidance, then confirm again before proceeding

## Conventional Commit Types

| Type       | Use              |
| ---------- | ---------------- |
| `feat`     | New feature      |
| `fix`      | Bug fix          |
| `docs`     | Documentation    |
| `style`    | Formatting       |
| `refactor` | Code restructure |
| `perf`     | Performance      |
| `test`     | Tests            |
| `build`    | Build system     |
| `ci`       | CI config        |
| `chore`    | Maintenance      |

## PR Description Includes

- Summary of changes
- List of modified files with rationale
- Testing information
- Related issues

## Commit Policy

**Always asks user before committing.** Never auto-commits.

## Options

- Custom target branch (default: main)
- Breaking change detection
- Issue linking
- PR creation method: standard git + GitHub CLI (default) or Graphite (`--use-graphite`)
- Stack-aware creation (only with Graphite)
- Update existing vs create new

## Examples

```
"Create a PR for these changes"
"Submit this for review"
"Create PR and link to issue #123"
"Mark as breaking change due to API updates"
```

## Output

Provides PR URL after creation for review.
