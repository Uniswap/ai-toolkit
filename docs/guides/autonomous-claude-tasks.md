# Autonomous Claude Code Task Processing

This guide explains how to set up autonomous Claude Code task processing from Linear issues in your repository.

## Overview

The autonomous task workflow enables Claude Code to:

1. **Query Linear** for issues with a specific label (default: "claude")
2. **Filter by status** (Backlog and Todo)
3. **Sort by priority** (Urgent > High > Normal > Low > No Priority)
4. **Process tasks in parallel** (configurable, default: 3 at a time)
5. **Create PRs** with implemented changes
6. **Update Linear** with PR links and status changes

## Prerequisites

### 1. Secrets

Add these secrets to your repository:

| Secret              | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Claude API key from [Anthropic Console](https://console.anthropic.com/) |
| `LINEAR_API_KEY`    | Linear API key from [Linear Settings](https://linear.app/settings/api)  |

### 2. Linear Setup

1. Create a label for Claude tasks (default: "claude")
2. Ensure your team has workflow states including "Backlog", "Todo", and "In Review"
3. Create issues with clear descriptions including purpose, scope, and desired outcome

## Installation

### Quick Start

Create a single workflow file in your repository that references the shared reusable
workflow from AI Toolkit. Create `.github/workflows/claude-auto-tasks.yml`:

```yaml
name: Claude Auto Tasks

on:
  schedule:
    - cron: '0 10 * * *' # 5am EST daily

  workflow_dispatch:
    inputs:
      linear_team:
        description: 'Linear team name'
        default: 'Your Team Name'
      linear_label:
        description: 'Label to filter issues by'
        default: 'claude'
      max_issues:
        description: 'Max issues to process'
        default: '3'
      model:
        description: 'Claude model'
        type: choice
        options:
          - 'claude-sonnet-4-5-20250929'
          - 'claude-opus-4-20250514'
        default: 'claude-sonnet-4-5-20250929'
      target_branch:
        description: 'Branch to create PRs against'
        default: 'main'

jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.query.outputs.result }}
      has_tasks: ${{ steps.query.outputs.has_tasks }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Query Linear issues
        id: query
        run: |
          RESULT=$(npx @uniswap/ai-toolkit-linear-task-utils@latest query \
            --team "${{ inputs.linear_team }}" \
            --label "${{ inputs.linear_label }}" \
            --max "${{ inputs.max_issues }}")

          echo "result=$RESULT" >> $GITHUB_OUTPUT
          COUNT=$(echo "$RESULT" | jq -r '.count')
          echo "has_tasks=$([ $COUNT -gt 0 ] && echo true || echo false)" >> $GITHUB_OUTPUT
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}

  process-task:
    needs: prepare
    if: needs.prepare.outputs.has_tasks == 'true'
    strategy:
      fail-fast: false
      matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}

    # Reference the shared reusable workflow from AI Toolkit
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-task-worker.yml@main
    with:
      issue_id: ${{ matrix.issue_id }}
      issue_identifier: ${{ matrix.issue_identifier }}
      issue_title: ${{ matrix.issue_title }}
      issue_description: ${{ matrix.issue_description }}
      issue_url: ${{ matrix.issue_url }}
      branch_name: ${{ matrix.branch_name }}
      target_branch: ${{ inputs.target_branch }}
      model: ${{ inputs.model }}
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
```

**Key points:**

- The `_claude-task-worker.yml` is hosted in the AI Toolkit repository
- Reference it using `uses: Uniswap/ai-toolkit/.github/workflows/_claude-task-worker.yml@main`
- Pin to a specific tag/commit for stability (e.g., `@v1.0.0` or `@abc123`)
- All secrets must be explicitly passed via the `secrets:` block

See the full example at `.github/workflows/examples/11-autonomous-linear-tasks.yml`.

## Configuration

### Workflow Inputs

| Input           | Default                      | Description            |
| --------------- | ---------------------------- | ---------------------- |
| `linear_team`   | "Developer AI"               | Linear team to query   |
| `linear_label`  | "claude"                     | Label to filter issues |
| `max_issues`    | 3                            | Maximum issues per run |
| `model`         | "claude-sonnet-4-5-20250929" | Claude model to use    |
| `target_branch` | "next"                       | Branch for PRs         |

### Model Selection

| Model                        | Best For                                  |
| ---------------------------- | ----------------------------------------- |
| `claude-sonnet-4-5-20250929` | Balance of speed and capability (default) |
| `claude-opus-4-20250514`     | Complex tasks requiring deep reasoning    |
| `claude-haiku-4-5@20251001`  | Simple tasks, cost optimization           |

## Creating Good Task Descriptions

For Claude to work autonomously, issues should include:

### Required Elements

1. **Purpose** - What problem does this solve?
2. **Scope** - What specific changes are needed?
3. **Outcome** - How will success be measured?

### Example Issue

```markdown
# Add dark mode toggle to settings page

## Purpose

Users have requested a dark mode option to reduce eye strain during
night-time usage.

## Scope

- Add a toggle switch in the Settings component
- Implement theme context with light/dark values
- Update CSS variables for dark theme colors
- Persist preference to localStorage

## Acceptance Criteria

- [ ] Toggle visible on settings page
- [ ] Theme persists across page refreshes
- [ ] All existing components respect theme
- [ ] No accessibility regressions
```

### What Happens with Unclear Tasks

If Claude cannot determine the purpose, scope, or outcome, it will:

1. Post a comment on the Linear issue asking for clarification
2. Skip the task (won't create a PR)
3. The issue remains in its current status

## Workflow Execution

### Scheduled Run

The workflow runs daily at 5am EST by default. Adjust the cron schedule:

```yaml
on:
  schedule:
    # 5am EST = 10:00 UTC
    - cron: '0 10 * * *'

    # Alternative: 9am PST = 17:00 UTC
    # - cron: '0 17 * * *'
```

### Manual Run

Trigger manually from the GitHub Actions UI or CLI:

```bash
gh workflow run claude-auto-tasks.yml \
  -f linear_team="Your Team" \
  -f max_issues="5" \
  -f model="claude-opus-4-20250514"
```

## Monitoring

### GitHub Actions Summary

Each run generates a summary showing:

- Issues found and their priorities
- Tasks processed with results
- Links to created PRs
- Any failures or skipped tasks

### Linear Integration

After successful PR creation:

- Issue status changes to "In Review"
- PR link attached as an issue attachment
- Comment added with PR details

## Troubleshooting

### No Issues Found

Check:

1. Label exists in the team (auto-created if missing)
2. Issues have the correct label applied
3. Issues are in "Backlog" or "Todo" status
4. Team name matches exactly

### Claude Asks for Clarification

The task description was unclear. Update the issue with:

- Clear purpose statement
- Specific scope of changes
- Measurable acceptance criteria

### PR Not Created

Check the job logs for:

- Build/lint/test failures
- Claude deciding the task was out of scope
- Permission issues pushing branches

### Quality Check Failures

Claude will attempt to fix failures. If unfixable:

- PR is still created (if possible)
- Failures documented in PR description
- Human review required

## Security Considerations

### Secrets

- Use repository secrets, not hardcoded values
- Rotate API keys periodically
- Linear API key needs issue read/write permissions

### Permissions

The workflow uses minimal permissions:

```yaml
permissions:
  contents: write # Push branches
  pull-requests: write # Create PRs
  issues: write # Comment on issues (if needed)
  actions: read # Read CI status
```

### Branch Protection

Recommended settings for target branch:

- Require PR reviews before merge
- Require status checks to pass
- Do not allow force pushes

## Best Practices

### Task Management

1. **Prioritize issues** - Urgent and High priority run first
2. **Keep scope small** - Smaller tasks have higher success rates
3. **Include context** - Link related issues or documentation
4. **Set clear criteria** - Define what "done" looks like

### Workflow Tuning

1. **Start small** - Set `max_issues: 1` initially
2. **Monitor costs** - Opus model costs more than Sonnet
3. **Review PRs** - Human review before merging
4. **Iterate on prompts** - Customize the prompt template if needed

### Integration Tips

1. **Use with code review** - Enable Claude Code Review for PR feedback
2. **Link to documentation** - Reference CLAUDE.md files in issues
3. **Track metrics** - Monitor success rate and iteration time

## Related Resources

- [@uniswap/ai-toolkit-linear-task-utils](../../packages/linear-task-utils/README.md) - CLI package
- [Claude Code Action](https://github.com/anthropics/claude-code-action) - GitHub Action
- [Linear API Documentation](https://developers.linear.app/)
