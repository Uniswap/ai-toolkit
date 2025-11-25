# GitHub Actions Workflows

## Purpose

Contains GitHub Actions workflow definitions that automate CI/CD, code quality, releases, and Claude AI integrations for the AI Toolkit monorepo. Includes both callable workflows (prefixed with `_`) and consumer workflows that use them.

## Workflow Categories

### CI & Quality Assurance (2 workflows)

- `ci-pr-checks.yml` - Validates PRs with build, lint, format, and test checks
- `claude-welcome.yml` - Posts welcome messages from Claude to new PRs

### Release & Deployment (2 workflows)

- `publish-packages.yml` - Versions and publishes packages to NPM
- `release-update-production.yml` - Creates production sync PRs with AI changelogs

### Code Review & PR Management (2 workflows)

- `claude-code.yml` - Responds to @claude mentions in issues and PRs
- `claude-code-review.yml` - Automated PR code reviews with inline comments

### PR Title Validation (1 workflow)

- `ci-check-pr-title.yml` - Validates PR titles follow conventional commit format

### Autonomous Task Processing (2 workflows)

- `claude-auto-tasks.yml` - Scheduled autonomous task processing from Linear
- `_claude-task-worker.yml` - Reusable worker for processing individual Linear tasks

### Reusable Workflows (6 workflows, prefixed with `_`)

- `_claude-main.yml` - Core Claude AI interaction engine
- `_claude-welcome.yml` - Reusable welcome message poster
- `_claude-code-review.yml` - Reusable PR review automation
- `_claude-task-worker.yml` - Autonomous task execution from Linear issues
- `_generate-changelog.yml` - AI-powered changelog generation
- `_notify-release.yml` - Slack release notifications

## Key Files

### Callable Workflows (Reusable)

- `_claude-main.yml` - Claude AI assistant for GitHub interactions
- `_claude-code-review.yml` - Formal GitHub PR reviews with inline comments
- `_claude-task-worker.yml` - Process single Linear task autonomously
- `_claude-welcome.yml` - Welcome messages for new contributors
- `_generate-changelog.yml` - AI-generated release notes
- `_notify-release.yml` - Slack notification dispatcher

### Consumer Workflows

- `ci-pr-checks.yml` - Main PR validation pipeline
- `ci-check-pr-title.yml` - PR title format validation
- `claude-auto-tasks.yml` - Autonomous task processing from Linear (scheduled)
- `claude-code.yml` - Enables @claude mentions
- `claude-code-review.yml` - Automated code reviews
- `claude-welcome.yml` - New PR welcomes
- `publish-packages.yml` - Package release automation
- `release-update-production.yml` - Production sync automation

## Subdirectories

- `examples/` - Example implementations of workflows (11 numbered files)

## Conventions

### Naming

- **Reusable workflows**: Prefix with `_` (underscore)
- **Consumer workflows**: No prefix, descriptive kebab-case names
- **Example workflows**: Numbered prefix (e.g., `01-`, `02-`)

### Structure

All workflows follow consistent patterns:

1. **Concurrency control**: Prevent duplicate runs
2. **Security**: Explicit permissions, Bullfrog scanning
3. **Error handling**: Fail fast with clear messages
4. **Caching**: NPM dependencies, Nx computation cache
5. **Artifacts**: Store important outputs

### Secrets

Common secrets referenced:

- `ANTHROPIC_API_KEY` - Claude AI API authentication
- `LINEAR_API_KEY` - Linear API authentication (for autonomous tasks)
- `NPM_TOKEN` - NPM registry publishing
- `SLACK_WEBHOOK_URL` - Slack notifications
- `GITHUB_TOKEN` - Built-in token (automatic)

## Usage Patterns

### Calling Reusable Workflows

```yaml
jobs:
  call-claude:
    uses: ./.github/workflows/_claude-main.yml
    with:
      model: 'claude-sonnet-4-5-20250929'
      allowed_tools: 'read-write'
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Triggering Workflows

- **On PR**: `ci-pr-checks.yml`, `claude-welcome.yml`, `ci-check-pr-title.yml`
- **On Push to main/next**: `publish-packages.yml`
- **On Issue Comment**: `claude-code.yml` (when @claude mentioned)
- **On Schedule**: `claude-auto-tasks.yml` (daily at 5am EST)
- **Manual Dispatch**: `release-update-production.yml`, `claude-code-review.yml`, `claude-auto-tasks.yml`

## Development Guidelines

### Script Separation Policy (CRITICAL)

Complex bash scripting (50+ lines, API calls, etc.) MUST be extracted to `.github/scripts/`:

❌ **BAD**: 200 lines of inline bash in YAML
✅ **GOOD**: Call standalone script: `./.github/scripts/my-script.sh`

For reusable tools, publish as npm packages (e.g., `@uniswap/notion-publisher`).

### Action Pinning (CRITICAL)

Always pin external actions to **specific commit hashes** with version comments:

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4
```

Never use tags or branch names directly.

## Testing Workflows

### Local Testing

Use [act](https://github.com/nektos/act) to test workflows locally:

```bash
act pull_request -j ci-pr-checks
```

### Workflow Dispatch

Many workflows support manual triggering via GitHub UI or CLI:

```bash
gh workflow run claude-code-review.yml \
  -f pr_number=123 \
  -f model="claude-sonnet-4-5-20250929"
```

## Troubleshooting

### Common Issues

1. **Workflow not triggering**: Check concurrency groups and trigger conditions
2. **Permission denied**: Verify `permissions:` block in workflow
3. **Secret not found**: Ensure secret is defined in repository settings
4. **Action version mismatch**: Check commit hash is correct

### Debugging

Enable debug logging:

```bash
# Set repository secret
ACTIONS_STEP_DEBUG=true
ACTIONS_RUNNER_DEBUG=true
```

## Related Documentation

- See `examples/` subdirectory for working implementations
- See `.github/prompts/` for Claude AI prompt templates
- See root `CLAUDE.md` for project-level documentation

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory or subdirectories, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
