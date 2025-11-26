# GitHub Actions Workflows

## Purpose

Contains GitHub Actions workflow definitions that automate CI/CD, code quality, releases, and Claude AI integrations for the AI Toolkit monorepo. Includes both callable workflows (prefixed with `_`) and consumer workflows that use them.

## Workflow Categories

### CI & Quality Assurance (2 workflows)

- `ci-pr-checks.yml` - Validates PRs with build, lint, format, and test checks
- `claude-welcome.yml` - Posts welcome messages from Claude to new PRs

### Release & Deployment (3 workflows)

- `publish-packages.yml` - Versions and publishes packages to NPM (automatic on push)
- `force-publish-packages.yml` - Manually force-publishes packages to NPM with `next` tag (for new packages or failed releases)
- `release-update-production.yml` - Creates production sync PRs with AI changelogs

### Code Review & PR Management (3 workflows)

- `claude-code.yml` - Responds to @claude mentions in issues and PRs
- `claude-code-review.yml` - Automated PR code reviews with inline comments
- `generate-pr-title-description.yml` - Auto-generates PR titles and descriptions using Claude

### PR Title Validation (1 workflow)

- `ci-check-pr-title.yml` - Validates PR titles follow conventional commit format

### Autonomous Task Processing (2 workflows)

- `claude-auto-tasks.yml` - Scheduled autonomous task processing from Linear
- `_claude-task-worker.yml` - Reusable worker for processing individual Linear tasks

### Reusable Workflows (7 workflows, prefixed with `_`)

- `_claude-main.yml` - Core Claude AI interaction engine
- `_claude-welcome.yml` - Reusable welcome message poster
- `_claude-code-review.yml` - Reusable PR review automation
- `_claude-task-worker.yml` - Autonomous task execution from Linear issues
- `_generate-changelog.yml` - AI-powered changelog generation
- `_generate-pr-metadata.yml` - AI-powered PR title and description generation
- `_notify-release.yml` - Slack release notifications

## Key Files

### Callable Workflows (Reusable)

- `_claude-main.yml` - Claude AI assistant for GitHub interactions
- `_claude-code-review.yml` - Formal GitHub PR reviews with inline comments
- `_claude-task-worker.yml` - Process single Linear task autonomously
- `_claude-welcome.yml` - Welcome messages for new contributors
- `_generate-changelog.yml` - AI-generated release notes
- `_generate-pr-metadata.yml` - AI-generated PR titles and descriptions
- `_notify-release.yml` - Slack notification dispatcher

### Consumer Workflows

- `ci-pr-checks.yml` - Main PR validation pipeline
- `ci-check-pr-title.yml` - PR title format validation
- `claude-auto-tasks.yml` - Autonomous task processing from Linear (scheduled)
- `claude-code.yml` - Enables @claude mentions
- `claude-code-review.yml` - Automated code reviews
- `claude-welcome.yml` - New PR welcomes
- `generate-pr-title-description.yml` - Auto-generated PR titles and descriptions
- `publish-packages.yml` - Package release automation
- `force-publish-packages.yml` - Manual force-publish for new/failed packages
- `release-update-production.yml` - Production sync automation

## Subdirectories

- `examples/` - Example implementations of workflows (13 numbered files)

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

### Repository Variables

Version pinning is centralized using GitHub repository variables (`vars.*`):

| Variable       | Value     | Purpose                                    |
| -------------- | --------- | ------------------------------------------ |
| `NODE_VERSION` | `22.21.1` | Node.js version for all workflows          |
| `NPM_VERSION`  | `11.6.2`  | npm version (required for OIDC publishing) |

**Usage in workflows:**

```yaml
- uses: actions/setup-node@...
  with:
    node-version: ${{ vars.NODE_VERSION }}

- run: npm install -g npm@${{ vars.NPM_VERSION }}
```

**To update versions:** Change the repository variables in GitHub Settings > Secrets and variables > Actions > Variables. All workflows will automatically use the new values.

### Secrets

Common secrets referenced:

- `ANTHROPIC_API_KEY` - Claude AI API authentication
- `NPM_TOKEN` / `NODE_AUTH_TOKEN` - NPM registry publishing
- `WORKFLOW_PAT` - Personal Access Token for pushing commits/tags (force-publish)
- `SERVICE_ACCOUNT_GPG_PRIVATE_KEY` - GPG key for signed commits/tags
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

- **On PR**: `ci-pr-checks.yml`, `claude-welcome.yml`, `ci-check-pr-title.yml`, `generate-pr-title-description.yml`
- **On Push to main/next**: `publish-packages.yml`
- **On Issue Comment**: `claude-code.yml` (when @claude mentioned)
- **Manual Dispatch**: `release-update-production.yml`, `claude-code-review.yml`, `force-publish-packages.yml`

### Force Publishing Packages

Use `force-publish-packages.yml` to manually publish packages when:

- New packages haven't had code changes detected by Nx release
- A previous release partially failed
- You need to republish a specific package

```bash
# Publish a single package
gh workflow run force-publish-packages.yml \
  -f packages="@uniswap/ai-toolkit-nx-claude"

# Publish multiple packages
gh workflow run force-publish-packages.yml \
  -f packages="@uniswap/ai-toolkit-nx-claude,@ai-toolkit/utils"

# Publish all release-configured packages
gh workflow run force-publish-packages.yml \
  -f packages="all"

# Dry run (no actual publish)
gh workflow run force-publish-packages.yml \
  -f packages="all" \
  -f dryRun="true"
```

**Note**: This workflow only runs on the `next` branch and publishes with the `next` npm tag.
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
