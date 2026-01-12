---
name: pr-creator
description: Create or update pull requests with conventional commits. Use when user says "create a PR for these changes", "submit this for review", "open a pull request", "push these changes and create a PR", "I'm ready to submit this work", or "create PR and link to issue #123".
user-invocable: true
allowed-tools: Bash(git:*), Bash(gt:*), Bash(gh:*), Read, Glob, Grep, Task(subagent_type:pr-creator), Task(subagent_type:commit-message-generator)
model: opus
---

# PR Creator

Create or update Graphite PRs with auto-generated conventional commits and descriptions.

## When to Activate

- User wants to create a PR
- Changes ready for review
- User says "submit" or "push for review"
- PR update needed
- User mentions Graphite or PR creation

## What It Does

1. **Analyze Diff**: Compare current branch to target
2. **Detect Change Type**: feat, fix, refactor, etc.
3. **Generate Commit**: Create conventional commit (with user confirmation)
4. **Create PR Title**: `<type>(<scope>): <description>`
5. **Write Description**: Comprehensive PR body
6. **Submit**: Use `gt submit` or `gh pr create`

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
- Stack-aware creation with Graphite
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
