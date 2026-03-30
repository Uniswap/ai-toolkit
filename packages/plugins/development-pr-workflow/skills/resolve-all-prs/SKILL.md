---
description: Resolve issues on all your open PRs in parallel. Use when user says "fix all my open PRs", "resolve issues on all my PRs", "address comments on all my pull requests", "batch fix my PRs", or "make all my PRs merge-ready".
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch, WebSearch, Task, mcp__plugin_uniswap-integrations_github__get_me, mcp__plugin_uniswap-integrations_github__list_pull_requests, mcp__plugin_uniswap-integrations_github__search_pull_requests
model: opus
---

# Resolve All My PRs

Batch resolve issues across all your open pull requests in the current repository. Spawns parallel agents to address review comments and CI failures on each PR, automatically committing and pushing fixes.

## When to Activate

- User wants to fix all their open PRs at once
- User says "fix all my PRs" or "resolve all my open pull requests"
- User wants to batch process PR review feedback
- User needs to make multiple PRs merge-ready

## Arguments

| Argument | Type   | Default | Description                      |
| -------- | ------ | ------- | -------------------------------- |
| `max`    | number | 5       | Maximum number of PRs to process |

## Process Overview

1. **Identify User**: Get current GitHub user via `gh api user`
2. **List PRs**: Fetch open PRs authored by user, sorted by newest
3. **Cap Results**: Limit to `max` PRs (default: 5)
4. **Parallel Execution**: Spawn one agent per PR to resolve issues
5. **Aggregate Results**: Collect success/failure status from all agents
6. **Report Summary**: Output final summary with all results

## Execution Flow

```
1. Get GitHub username
        ↓
2. List open PRs (author:me, newest first)
        ↓
3. Cap at max PRs
        ↓
4. For each PR (in parallel):
   └─→ Spawn Task agent with review-executor-agent
       └─→ Fix CI issues
       └─→ Address review comments
       └─→ Auto-commit and push each fix
        ↓
5. Collect results from all agents
        ↓
6. Output summary report
```

## Implementation

### Step 1: Get Current User and Repository Info

```bash
# Get current GitHub user
gh api user --jq '.login'

# Get current repo info
gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"'
```

### Step 2: List Open PRs

Use the GitHub MCP or gh CLI to list PRs:

```bash
# List open PRs authored by current user, newest first
gh pr list --author @me --state open --json number,title,url,createdAt --limit {max}
```

### Step 3: Spawn Parallel Agents

For each PR, spawn a Task agent with the `review-executor-agent` subagent type:

```
Task(
  subagent_type: "development-pr-workflow:review-executor-agent",
  prompt: "Resolve all issues on PR #{pr_number} in {owner}/{repo}.

IMPORTANT: This is an AUTOMATED batch run. You MUST:
1. Fix all CI failures first
2. Address all review comments
3. AUTO-COMMIT each fix with a descriptive message
4. AUTO-PUSH after each commit
5. Do NOT ask for confirmation - commit and push immediately

PR URL: {pr_url}
PR Title: {pr_title}

After completing all fixes, report:
- Number of commits made
- Summary of changes
- Any issues that could not be resolved",
  run_in_background: true
)
```

### Step 4: Collect Results

After spawning all agents, wait for them to complete by reading their output files. Track:

- PRs successfully processed
- PRs that failed (with error messages)
- Total commits made across all PRs

### Step 5: Output Summary

Provide a structured summary:

```markdown
## Batch PR Resolution Summary

### Processed PRs: {count}/{total}

| PR   | Status     | Commits | Notes               |
| ---- | ---------- | ------- | ------------------- |
| #123 | ✅ Success | 3       | All issues resolved |
| #456 | ✅ Success | 1       | CI fixed            |
| #789 | ❌ Failed  | 0       | Error: {reason}     |

### Failed PRs (require manual attention)

- **PR #789**: {error_details}

### Total Changes

- **Commits made**: {total_commits}
- **PRs resolved**: {success_count}
- **PRs failed**: {fail_count}
```

## Commit Policy

**This skill AUTO-COMMITS and AUTO-PUSHES changes.** Unlike the single-PR resolver, this batch mode operates autonomously to maximize throughput. Each fix is committed granularly with a descriptive message.

## Error Handling

- If a PR cannot be resolved, log the error and continue with remaining PRs
- Collect all failures and report them in the final summary
- Never stop the entire batch due to a single PR failure

## Usage Examples

```
# Resolve issues on up to 5 PRs (default)
/resolve-all-prs

# Resolve issues on up to 10 PRs
/resolve-all-prs max=10

# Resolve issues on up to 3 PRs
/resolve-all-prs max=3
```
