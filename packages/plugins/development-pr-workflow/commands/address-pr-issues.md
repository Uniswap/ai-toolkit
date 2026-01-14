---
description: Reviews a GitHub PR, addresses comments, and fixes CI issues
argument-hint: <pr-number> [--owner=<owner>] [--repo=<repo>]
allowed-tools: Bash(*), Read(*), Write(*), Edit(*), MultiEdit(*), Grep(*), Glob(*), WebFetch(*), WebSearch(*), Task(*), mcp__github__get_pull_request(*), mcp__github__get_pull_request_files(*), mcp__github__get_pull_request_comments(*), mcp__github__get_pull_request_reviews(*), mcp__github__get_file_contents(*), mcp__github__create_pull_request_review(*), mcp__github__add_issue_comment(*)
---

# /address-pr-issues Command

## Description

This command reviews a GitHub pull request, addresses all review comments (with plans or direct fixes), and resolves CI/CD pipeline failures. It provides comprehensive PR management by analyzing feedback, implementing changes, and ensuring all checks pass.

## Usage

```text
/address-pr-issues <pr-number> [--owner=<owner>] [--repo=<repo>]
```

## Arguments

- `pr-number`: The PR number to review and fix (required)
- `--owner`: Repository owner (optional, defaults to current repo owner)
- `--repo`: Repository name (optional, defaults to current repo)

## Instructions

You are the /address-pr-issues command. Your task is to comprehensively review and fix a GitHub pull request by addressing all comments and CI issues.

## Inputs

Parse the user's input to extract:

1. **PR Number** (required): The pull request number to review
2. **Owner** (optional): Repository owner, default to inferring from current repo
3. **Repo** (optional): Repository name, default to inferring from current repo

Examples of valid inputs:

- `/address-pr-issues 123`
- `/address-pr-issues 456 --owner=acme-corp --repo=backend`
- `/address-pr-issues 789 --repo=frontend`

## Task

Review the specified pull request, address all review comments, and fix any CI/CD pipeline failures to make the PR ready for merge.

## Process

1. **Gather Context**:

   - If owner/repo not provided, infer from current git repository
   - Validate that the PR exists and is accessible
   - If at any point it becomes clear the user has not installed the GitHub MCP, direct them to the following Notion page where they can follow a tutorial for how to correctly install the GitHub MCP on Claude Code: <https://www.notion.so/uniswaplabs/Using-a-GitHub-MCP-with-Claude-Code-270c52b2548b8015b11ee5e905796cb5>

2. **Analyze PR**:

   - Fetch PR details, files changed, and diff
   - Get all review comments and conversations
   - Check CI/CD status and identify failures
   - Categorize issues by type and severity

3. **Create Action Plan**:

   - Group related comments and issues
   - Prioritize CI fixes (they block merging)
   - Determine which comments need plans vs direct fixes
   - Identify dependencies between fixes

4. **Delegate to Agent**:
   Invoke **review-executor** agent with parameters:

   ```json
   {
     "pr_number": "<extracted_pr_number>",
     "owner": "<owner_or_inferred>",
     "repo": "<repo_or_inferred>",
     "mode": "comprehensive",
     "auto_fix": true,
     "test_locally": true
   }
   ```

5. **Execute Fixes**:
   The review-executor agent will:
   - Fix CI/CD issues first (compilation, tests, linting)
   - Address simple review comments directly
   - Create plans for complex changes
   - Run tests locally to verify fixes
   - Prepare responses for discussion items

## Output

Return a structured summary of actions taken:

```markdown
# PR #<number> Review and Fix Summary

## PR Status

- **Title**: <pr_title>
- **Author**: <author>
- **CI Status**: ✅ Passing / ❌ Failing (fixed)
- **Review Status**: <n> comments addressed

## Comments Addressed

### Fixed Directly (n items)

- Comment: <summary> → Fix: <what_was_done>
- ...

### Requires Plan (n items)

- Comment: <summary>
  - Plan: <detailed_steps>
- ...

### Responded (n items)

- Question: <summary>
  - Response: <explanation>
- ...

## CI/CD Fixes Applied

- ❌ <failure_description> → ✅ <fix_applied>
- ...

## Files Modified

- `path/to/file.ext`: <change_summary>
- ...

## Next Steps

1. <recommended_action>
2. ...

## Verification

- [ ] All CI checks passing
- [ ] All comments addressed
- [ ] Tests added/updated
- [ ] Code style compliant
```

## Error Handling

- **No PR access**: Request proper GitHub token or permissions
- **PR not found**: Verify PR number and repository details
- **CI logs unavailable**: List known failures and suggest manual investigation
- **Merge conflicts**: Identify conflicts and provide resolution steps
- **Complex changes**: Create detailed plan for review before implementing

## Examples

### Example 1: Basic PR fix

```text
/address-pr-issues 123
```

This will:

- Infer repository from current directory
- Review PR #123
- Fix all CI issues
- Address all review comments
- Provide comprehensive summary

### Example 2: Cross-repo PR fix

```text
/address-pr-issues 456 --owner=acme-corp --repo=frontend
```

This will:

- Review PR #456 in acme-corp/frontend repository
- Fix CI/CD pipeline issues
- Address review feedback
- Ensure PR is merge-ready

### Example 3: PR with complex review comments

```text
/address-pr-issues 789
```

For complex architectural feedback, this will:

- Create detailed implementation plans
- Group related changes
- Suggest phased implementation
- Provide risk assessment

## Implementation Notes

- Requires GitHub API access with appropriate permissions (repo, pull request, actions)
- Benefits from having repository cloned locally for testing fixes
- May coordinate with other agents for complex refactoring
- Respects repository contribution guidelines and code style
- At logical completion points, ASKS THE USER if they would like to create git commits. DO NOT commit changes without User confirmation
- Can handle both GitHub and GitHub Enterprise instances
