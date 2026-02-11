---
description: Fix PR issues including review comments and CI failures. Use when user says "fix the failing CI on my PR", "address the review comments on PR #123", "my PR has failing checks", "help me resolve the feedback on my pull request", "the build is failing on my PR", or "make my PR merge-ready".
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch, WebSearch, Task, mcp__github__pull_request_read, mcp__github__get_file_contents, mcp__github__pull_request_review_write, mcp__github__add_issue_comment
model: opus
---

# PR Issue Resolver

Review GitHub pull requests, address all review comments, and fix CI/CD pipeline failures to make PRs merge-ready.

## When to Activate

- User mentions PR review comments to address
- CI/CD checks are failing on a PR
- User wants to fix a pull request
- User needs to respond to reviewer feedback
- Build or tests failing on a PR
- User says "fix my PR" or "address the comments"

## Quick Process

1. **Gather Context**: Get PR details, comments, and CI status
2. **Analyze Issues**: Categorize by type (CI, code review, discussion)
3. **Prioritize**: Fix CI first (blocks merge), then code issues
4. **Execute Fixes**: Apply changes, run local tests
5. **Report**: Provide summary of actions taken

## Input Parsing

Extract from user's request:

- `pr_number`: The PR number (required)
- `owner`: Repository owner (optional, infer from git)
- `repo`: Repository name (optional, infer from git)

## Issue Categories

| Category              | Priority | Action                   |
| --------------------- | -------- | ------------------------ |
| CI/CD Failures        | High     | Fix immediately          |
| Code Review (simple)  | Medium   | Fix directly             |
| Code Review (complex) | Medium   | Create plan first        |
| Discussion/Questions  | Low      | Respond with explanation |

## Execution Flow

```
1. Fetch PR → 2. Get Comments → 3. Check CI Status
                                        ↓
4. Fix CI Issues → 5. Address Comments → 6. Verify Locally
                                        ↓
                               7. Report Summary
```

## Commit Policy

**Always ask user before committing changes.** Never auto-commit.

## Output Summary

Provide structured report:

- PR status (title, author, CI status)
- Comments addressed (fixed, planned, responded)
- CI fixes applied
- Files modified
- Next steps
- Verification checklist

## Detailed Reference

For GitHub MCP setup, comment handling, and CI troubleshooting, see [pr-guide.md](pr-guide.md).
