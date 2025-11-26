# @uniswap/ai-toolkit-linear-task-utils

CLI tool to query Linear issues for autonomous Claude Code task processing in GitHub Actions workflows.

## Installation

```bash
# Use directly via npx (recommended for CI)
npx @uniswap/ai-toolkit-linear-task-utils query --team "Developer AI" --label "claude"

# Or install globally
npm install -g @uniswap/ai-toolkit-linear-task-utils
```

## Commands

### query

Query Linear issues matching criteria and output a JSON matrix for GitHub Actions.

```bash
npx @uniswap/ai-toolkit-linear-task-utils query \
  --team "Developer AI" \
  --label "claude" \
  --statuses "Backlog,Todo" \
  --max 3
```

**Options:**

| Option       | Default        | Description                  |
| ------------ | -------------- | ---------------------------- |
| `--team`     | "Developer AI" | Linear team name             |
| `--label`    | "claude"       | Label to filter by           |
| `--statuses` | "Backlog,Todo" | Comma-separated status names |
| `--max`      | 3              | Maximum issues to return     |

**Output (JSON to stdout):**

```json
{
  "include": [
    {
      "issue_id": "abc123",
      "issue_identifier": "DAI-123",
      "issue_title": "Fix authentication bug",
      "issue_description": "Full description...",
      "issue_url": "https://linear.app/...",
      "branch_name": "claude/dai-123-fix-auth-bug",
      "priority": 1,
      "priority_label": "Urgent"
    }
  ],
  "count": 1
}
```

### ensure-label

Ensure a label exists in the specified team. Creates it if missing.

```bash
npx @uniswap/ai-toolkit-linear-task-utils ensure-label \
  --team "Developer AI" \
  --label "claude" \
  --color "#6366f1"
```

**Options:**

| Option    | Default        | Description                 |
| --------- | -------------- | --------------------------- |
| `--team`  | "Developer AI" | Linear team name            |
| `--label` | "claude"       | Label name to ensure exists |
| `--color` | "#6366f1"      | Label color (hex)           |

### update-issue

Update an issue status and optionally attach a PR link.

```bash
npx @uniswap/ai-toolkit-linear-task-utils update-issue \
  --issue-id "abc123" \
  --status "In Review" \
  --pr-url "https://github.com/org/repo/pull/123"
```

**Options:**

| Option       | Required | Description                         |
| ------------ | -------- | ----------------------------------- |
| `--issue-id` | Yes      | Linear issue ID                     |
| `--status`   | Yes      | New status name (e.g., "In Review") |
| `--pr-url`   | No       | PR URL to attach                    |
| `--comment`  | No       | Comment to add to the issue         |

## Authentication

Set the `LINEAR_API_KEY` environment variable:

```bash
export LINEAR_API_KEY="lin_api_xxxxx"
```

Or pass via CLI flag (not recommended for CI - shows in process list):

```bash
npx @uniswap/ai-toolkit-linear-task-utils query --api-key "lin_api_xxxxx"
```

## GitHub Actions Usage

### Querying Issues for Matrix Strategy

```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.query.outputs.result }}
      has_tasks: ${{ steps.query.outputs.has_tasks }}
    steps:
      - name: Query Linear issues
        id: query
        run: |
          RESULT=$(npx @uniswap/ai-toolkit-linear-task-utils query \
            --team "${{ inputs.linear_team }}" \
            --label "${{ inputs.linear_label }}" \
            --max "${{ inputs.max_issues }}")

          echo "result=$RESULT" >> $GITHUB_OUTPUT

          COUNT=$(echo "$RESULT" | jq -r '.count')
          if [ "$COUNT" -gt 0 ]; then
            echo "has_tasks=true" >> $GITHUB_OUTPUT
          else
            echo "has_tasks=false" >> $GITHUB_OUTPUT
          fi
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}

  process-task:
    needs: prepare
    if: needs.prepare.outputs.has_tasks == 'true'
    strategy:
      fail-fast: false
      matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}
    runs-on: ubuntu-latest
    steps:
      - name: Process task ${{ matrix.issue_identifier }}
        run: echo "Working on ${{ matrix.issue_title }}"
```

### Updating Issue After PR Creation

```yaml
- name: Update Linear issue
  if: steps.create-pr.outputs.pr_url != ''
  run: |
    npx @uniswap/ai-toolkit-linear-task-utils update-issue \
      --issue-id "${{ matrix.issue_id }}" \
      --status "In Review" \
      --pr-url "${{ steps.create-pr.outputs.pr_url }}"
  env:
    LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
```

## Priority Sorting

Issues are sorted by priority in this order:

1. **Urgent** (priority = 1)
2. **High** (priority = 2)
3. **Normal** (priority = 3)
4. **Low** (priority = 4)
5. **No Priority** (priority = 0)

## Related

- [AI Toolkit](https://github.com/Uniswap/ai-toolkit) - Standardized Claude Code setup
- [Claude Code Action](https://github.com/anthropics/claude-code-action) - GitHub Action for Claude Code
- [Linear API](https://developers.linear.app/) - Linear API documentation

## License

MIT
