---
description: Review pull requests for quality, security, and performance. Use when user says "review my changes before I merge", "do a code review on this PR", "check if this is ready to merge", "review the diff for any issues", "give me feedback on these changes", or "is this PR ready for review".
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git log:*), Bash(git show:*), Task, Read, Grep
model: opus
---

# PR Reviewer

Orchestrate comprehensive PR review through multi-agent coordination.

## When to Activate

- User wants changes reviewed before merge
- Code review requested
- PR quality check needed
- User asks "is this ready?"
- Pre-merge validation

## Quick Process

1. **Gather Context**: Get diff, changed files, commit messages
2. **Analyze**: Understand intent and scope
3. **Multi-Agent Review**: Architecture, security, performance, style
4. **Generate Fixes**: Actionable improvements
5. **Summarize**: Recommendation with action items

## Review Depth

| Depth             | Agents | Focus                            |
| ----------------- | ------ | -------------------------------- |
| **Standard**      | 4      | Quick validation of key concerns |
| **Comprehensive** | 8+     | Deep multi-phase analysis        |

## Review Categories

- **Architecture**: Pattern compliance, SOLID, dependencies
- **Security**: Vulnerabilities, auth, injection risks
- **Performance**: Complexity, queries, caching
- **Maintainability**: Complexity, coverage, duplication
- **Testing**: Coverage gaps, test quality

## Output Format

Provides:

- Summary with intent, scope, risk assessment
- Findings by severity (critical, major, minor)
- Architecture/Security/Performance reports
- Test coverage analysis
- Actionable patches with diffs
- Must-fix, should-fix, consider lists

## Recommendation

Returns: `approve`, `request-changes`, or `comment`
