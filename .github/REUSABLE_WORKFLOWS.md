# Reusable GitHub Actions Workflows

This repository provides reusable GitHub Actions workflows for AI-powered development workflows, including:

- Claude Code integration for interactive AI assistance (@claude mentions)
- Claude PR welcome messages
- AI-powered changelog generation
- Release notifications to multiple destinations (Slack, Notion)

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Workflows Reference](#workflows-reference)
  - [\_claude-main.yml](#_claude-mainyml)
  - [\_claude-welcome.yml](#_claude-welcomeyml)
  - [\_generate-changelog.yml](#_generate-changelogyml)
  - [\_notify-release.yml](#_notify-releaseyml)
- [Implementation Details](#implementation-details)
- [Real-World Examples](#real-world-examples)
- [Usage Examples](#usage-examples)
- [Custom Prompts](#custom-prompts)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Migration Guides](#migration-guides)
- [Support and Contributing](#support-and-contributing)

## Quick Start

### 30-Second Integration into Existing Release Pipeline

Add these jobs to your existing release workflow:

```yaml
jobs:
  # Your existing release job
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Version and publish
        run: npm publish
      # ... other steps

  # Add changelog generation
  generate-changelog:
    needs: publish
    uses: uniswap/ai-toolkit/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: ${{ github.event.before }}
      to_ref: ${{ github.sha }}
      output_formats: 'slack,markdown'
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  # Add notifications
  notify-release:
    needs: [publish, generate-changelog]
    uses: uniswap/ai-toolkit/.github/workflows/_notify-release.yml@main
    with:
      changelog_slack: ${{ needs.generate-changelog.outputs.changelog_slack }}
      changelog_markdown: ${{ needs.generate-changelog.outputs.changelog_markdown }}
      destinations: 'slack'
      from_ref: ${{ github.event.before }}
      to_ref: ${{ github.sha }}
      branch: ${{ github.ref_name }}
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 60-Second Manual Changelog Generation

Create `.github/workflows/manual-changelog.yml`:

```yaml
name: Manual Changelog Generator

on:
  workflow_dispatch:
    inputs:
      from_ref:
        description: 'Starting git reference (tag, SHA, or branch)'
        required: true
        type: string
      to_ref:
        description: 'Ending git reference (tag, SHA, or branch)'
        required: true
        type: string

jobs:
  generate:
    uses: uniswap/ai-toolkit/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: ${{ inputs.from_ref }}
      to_ref: ${{ inputs.to_ref }}
      output_formats: 'markdown'
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Then run from GitHub Actions UI: Actions → Manual Changelog Generator → Run workflow

## Prerequisites

### Required Secrets

To use these workflows, you'll need to configure the following secrets in your repository:

#### For Changelog Generation

- **ANTHROPIC_API_KEY**: API key for Claude AI
  - Required for: `_generate-changelog.yml`
  - Get from: <https://console.anthropic.com/settings/keys>
  - Permissions: API access with sufficient credits

#### For Slack Notifications

- **SLACK_WEBHOOK_URL**: Incoming webhook URL for your Slack channel
  - Required for: `_notify-release.yml` (when `destinations` includes "slack")
  - Get from: <https://api.slack.com/apps> → Your App → Incoming Webhooks
  - Format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`

#### For Notion Integration

- **NOTION_API_KEY**: Notion integration API key

  - Required for: `_notify-release.yml` (when `destinations` includes "notion")
  - Get from: <https://www.notion.so/my-integrations>
  - Format: `secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
  - Permissions: Write access to target database

- **RELEASE_NOTES_NOTION_DATABASE_ID**: Target Notion database ID
  - Required for: `_notify-release.yml` (when `destinations` includes "notion")
  - Extract from database URL: `notion.so/{workspace}/{database_id}?v=...`
  - Format: 32-character hex string (xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
  - Database Requirements:
    - Must have a "Name" property (title)
    - Should have "Commit Range", "Branch", "NPM Tag", and "Date" properties (rich text or date)

### Repository Setup

Add these secrets to your repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each required secret with its value

## Architecture

### Workflow Separation

These workflows follow a modular design pattern:

```
┌─────────────────────────┐
│  Your Release Workflow  │
│  (publish, version,     │
│   build, etc.)          │
└───────────┬─────────────┘
            │
            ├─────────────────────────────┐
            │                             │
            ▼                             ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│ _generate-changelog.yml │   │   _notify-release.yml    │
│                         │   │                          │
│  • Calls Anthropic API  │──▶│  • Formats for Slack     │
│  • Parses git diff      │   │  • Sends to Slack        │
│  • Returns changelog    │   │  • Creates Notion page   │
└─────────────────────────┘   └──────────────────────────┘
```

### Why Two Separate Workflows?

1. **Modularity**: Use changelog generation without notifications, or vice versa
2. **Reusability**: Call from multiple workflows (release, hotfix, digest, etc.)
3. **Testability**: Test changelog generation independently from notifications
4. **Cost Optimization**: Skip AI generation when you already have a changelog
5. **Flexibility**: Mix and match output formats and notification destinations

### Data Flow

```
Input: Git References (from_ref, to_ref)
  ↓
Generate Changelog (_generate-changelog.yml)
  ├─ Fetch commit history
  ├─ Call Claude API with custom prompt
  ├─ Parse response into multiple formats
  └─ Output: changelog_slack, changelog_markdown
      ↓
Notify Release (_notify-release.yml)
  ├─ Prepare changelogs for each destination
  ├─ Format for Slack (escape, convert newlines)
  ├─ Send to Slack via webhook
  └─ Create Notion page with TypeScript script
```

## Workflows Reference

### \_claude-main.yml

**Purpose**: Enable Claude Code to respond interactively to `@claude` mentions in issues, pull requests, comments, and reviews. This workflow provides AI-assisted code review, debugging help, and codebase questions directly within GitHub's collaboration interface.

#### Inputs

| Input                           | Required | Default                          | Description                                                                        |
| ------------------------------- | -------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| `model`                         | No       | `'claude-sonnet-4-5-20250929'`   | Claude model to use (Sonnet 4.5, Opus 4, or Haiku 4.5)                             |
| `allowed_tools`                 | No       | (permissive defaults, see below) | YAML string specifying which tools Claude can use (file operations, bash commands) |
| `custom_instructions`           | No       | `'Be sure to follow rules...'`   | Additional instructions for Claude beyond CLAUDE.md files                          |
| `timeout_minutes`               | No       | `'10'`                           | Maximum execution time in minutes (prevents runaway costs)                         |
| `anthropic_api_key_secret_name` | No       | `'ANTHROPIC_API_KEY'`            | Name of the repository secret containing the Anthropic API key                     |

**Default Allowed Tools (Permissive):**

```yaml
# File operations (read & write)
- read_file
- write_file
- edit_file
- list_files
- search_files
- search_code
- grep
- glob

# All bash commands
- Bash(*)
```

#### Outputs

This workflow does not have outputs (Claude responds directly in PR/issue comments).

#### Secrets

| Secret              | Required | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `ANTHROPIC_API_KEY` | Yes      | API key from console.anthropic.com |

**Note**: The secret must be passed explicitly from the calling workflow.

#### Permissions Required (Fixed)

These permissions are **fixed** in the reusable workflow and cannot be overridden:

```yaml
permissions:
  id-token: write # Required for OIDC authentication
  contents: read # Required to read repository code
  pull-requests: write # Required to comment on PRs
  issues: write # Required to comment on issues
  actions: read # Required to read CI results on PRs
```

**Note**: You do NOT need to specify these permissions in your calling workflow - they are automatically set by the reusable workflow.

#### Fixed Settings (Cannot be Overridden)

The following settings are intentionally fixed to ensure consistent security and behavior across all repositories:

1. **Security Scanning**: Bullfrog security scanning with `egress-policy: audit`
2. **Trigger Conditions**: `@claude` mentions with bot filtering
3. **Checkout Settings**: `fetch-depth: 50` for adequate git history
4. **Concurrency Control**: Prevents duplicate executions for the same issue/PR

#### Features

- **Interactive AI Assistance**: Respond to `@claude` mentions anywhere in GitHub
- **Multiple Trigger Points**: Works in issue comments, PR comments, review comments, and reviews
- **Configurable Model**: Choose between Sonnet 4.5 (balanced), Opus 4 (thorough), or Haiku 4.5 (fast)
- **Flexible Tool Permissions**: Control what Claude can do (read-only, read-write, or custom)
- **Custom Instructions**: Add repository-specific guidelines and standards
- **Bot Filtering**: Automatically excludes bot comments to prevent loops
- **Concurrency Control**: Prevents multiple simultaneous executions per issue/PR
- **Security Built-in**: Bullfrog security scanning integrated and cannot be disabled
- **Cost Controls**: Configurable timeout to manage API costs
- **CI Integration**: Claude can read and help debug CI failures

#### Quick Start Example

```yaml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude') && github.event.review.user.type != 'Bot') ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')) && github.event.issue.user.type != 'Bot')

    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

#### Example: Custom Model (Claude Opus for Thorough Analysis)

```yaml
jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude') && github.event.review.user.type != 'Bot') ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')) && github.event.issue.user.type != 'Bot')

    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    with:
      model: 'claude-opus-4-20250514'
      timeout_minutes: '15' # Opus may need more time
```

#### Example: Restricted Read-Only Mode

```yaml
jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude') && github.event.review.user.type != 'Bot') ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')) && github.event.issue.user.type != 'Bot')

    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    with:
      allowed_tools: |
        # File operations (READ-ONLY)
        - read_file
        - list_files
        - search_files
        - search_code
        - grep
        - glob

        # Limited bash commands (read-only)
        - Bash(git status)
        - Bash(git log*)
        - Bash(git diff*)
        - Bash(npm list)
```

#### Example: Custom Instructions for Your Codebase

```yaml
jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude') && github.event.review.user.type != 'Bot') ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')) && github.event.issue.user.type != 'Bot')

    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    with:
      custom_instructions: |
        Be sure to follow rules in all CLAUDE.md files.

        When reviewing code in this repository:
        - Focus on security vulnerabilities (XSS, SQL injection)
        - Check for proper error handling
        - Ensure all public APIs have TypeScript types
        - Verify test coverage for new features
        - Follow our style guide in docs/STYLE_GUIDE.md
```

#### Example: Label-Based Model Selection

```yaml
jobs:
  claude-standard:
    if: |
      !contains(github.event.pull_request.labels.*.name, 'claude-opus') &&
      ((github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude') && github.event.review.user.type != 'Bot'))

    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    with:
      model: 'claude-sonnet-4-5-20250929'

  claude-opus:
    if: |
      contains(github.event.pull_request.labels.*.name, 'claude-opus') &&
      ((github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.user.type != 'Bot') ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude') && github.event.review.user.type != 'Bot'))

    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    with:
      model: 'claude-opus-4-20250514'
      timeout_minutes: '15'
```

#### Troubleshooting

**Issue: Claude doesn't respond when mentioned**

```
Tagged @claude in comment but no response appears
```

**Possible causes & solutions**:

1. **ANTHROPIC_API_KEY not configured**: Go to Settings → Secrets → Actions and add the secret
2. **Comment from bot**: Bot comments are intentionally filtered out to prevent loops
3. **@claude not in comment body**: Ensure @claude is in the actual comment text (not just code blocks)
4. **Workflow not triggered**: Check Actions tab for execution logs and errors
5. **If condition missing**: The calling workflow must include the if condition shown in examples

**Issue: Resource not accessible by integration**

```
Error: Resource not accessible by integration
```

**Solution**: This means you're trying to set permissions in the calling workflow. Don't! The reusable workflow automatically sets all required permissions. Remove any `permissions:` block from your job definition.

❌ **Incorrect**:

```yaml
jobs:
  claude:
    permissions: # DON'T DO THIS
      contents: read
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
```

✅ **Correct**:

```yaml
jobs:
  claude:
    # No permissions block needed
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
```

**Issue: Claude runs too long and times out**

```
Workflow execution exceeded timeout limit
```

**Solution**: Increase `timeout_minutes`:

```yaml
with:
  timeout_minutes: '15' # or higher
```

**Issue: Claude makes unwanted file changes**

```
Claude modified files when I only wanted analysis
```

**Solution**: Restrict to read-only tools:

```yaml
with:
  allowed_tools: |
    # Read-only file operations
    - read_file
    - list_files
    - search_files
    - grep

    # No write_file or edit_file
```

**Issue: API rate limit or cost concerns**

```
Worried about Anthropic API costs
```

**Solutions**:

- Use `claude-sonnet-4-5-20250929` (default) instead of Opus for most tasks (~80% cheaper)
- Reduce `timeout_minutes` to limit execution time (default: 10)
- The workflow includes concurrency control to prevent duplicate runs
- Monitor usage at console.anthropic.com

**Issue: Multiple Claude executions for same comment**

```
Claude responded multiple times to the same @mention
```

**Possible causes**:

1. **Multiple workflow files**: Ensure only one workflow calls `_claude-main.yml`
2. **Concurrency group conflict**: Check for custom concurrency settings in calling workflow

**Issue: Claude can't access certain files or run commands**

```
Claude says it doesn't have permission to perform action
```

**Solution**: Check `allowed_tools` configuration. Default is permissive (includes write access). If you've customized it, ensure required tools are included.

#### Best Practices

1. **Start with Defaults**:

   - Use the Quick Start Example initially
   - The default configuration works well for most repositories
   - Add customizations incrementally as needed

2. **Choose the Right Model**:

   - **Sonnet 4.5** (default): Best balance of speed, capability, and cost for 90% of use cases
   - **Opus 4**: Reserve for complex architectural reviews or critical security analysis
   - **Haiku 4.5**: Fast and cost-effective for simple questions, quick lookups, or high-volume usage

3. **Set Appropriate Timeouts**:

   - **5 minutes**: Simple questions, quick lookups
   - **10 minutes** (default): Code reviews, moderate debugging
   - **15+ minutes**: Large codebase analysis, complex CI debugging

4. **Tool Permissions Strategy**:

   - **Start permissive** (defaults): Let Claude edit files, run commands
   - **Restrict gradually**: If concerns arise, move to read-only
   - **Use read-only for**: Public repositories, sensitive codebases, or pilot programs

5. **Craft Effective Custom Instructions**:

   - Be specific about your coding standards and patterns
   - Include links to style guides or architecture docs
   - Mention critical areas (security, performance, testing requirements)
   - Keep instructions focused (< 20 lines for best results)

6. **Integrate with CLAUDE.md Files**:

   - Use custom_instructions for organization-wide standards
   - Use CLAUDE.md files for repository-specific patterns
   - CLAUDE.md files can provide more detailed context (they're part of the codebase)

7. **Monitor and Optimize**:

   - Track execution times in Actions tab
   - Monitor API costs in Anthropic console
   - Gather team feedback on helpfulness
   - Iterate on custom_instructions based on common requests

8. **Security Considerations**:
   - The workflow runs in a sandboxed GitHub Actions environment
   - Bullfrog security scanning is always active (cannot be disabled)
   - Permissions are fixed and cannot be escalated
   - API keys should be stored as GitHub Secrets
   - Consider read-only mode for untrusted contributions

#### Advanced Patterns

**Pattern 1: Different Configs for Issues vs PRs**

Use a faster model for quick issue questions, more capable model for thorough PR reviews:

```yaml
jobs:
  claude-issues:
    if: |
      github.event_name == 'issues' &&
      (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')) &&
      github.event.issue.user.type != 'Bot'

    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    with:
      model: 'claude-sonnet-4-5-20250929'
      timeout_minutes: '5'

  claude-pr-reviews:
    if: |
      (github.event_name == 'pull_request_review_comment' || github.event_name == 'pull_request_review' || github.event_name == 'issue_comment') &&
      contains(coalesce(github.event.comment.body, github.event.review.body), '@claude') &&
      coalesce(github.event.comment.user.type, github.event.review.user.type) != 'Bot'

    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    with:
      model: 'claude-opus-4-20250514'
      timeout_minutes: '15'
```

**Pattern 2: Repository-Specific Model via Label**

Allow teams to request deeper analysis by adding a label:

```yaml
# Standard model by default
claude-standard:
  if: |
    !contains(github.event.pull_request.labels.*.name, 'deep-analysis') &&
    # ... (rest of if condition)

# Opus model when 'deep-analysis' label present
claude-deep:
  if: |
    contains(github.event.pull_request.labels.*.name, 'deep-analysis') &&
    # ... (rest of if condition)
  with:
    model: 'claude-opus-4-20250514'
```

#### Integration with Other Workflows

This workflow is designed to work alongside other GitHub automation:

```yaml
name: PR Automation

on:
  issue_comment:
    types: [created]
  pull_request:
    types: [opened, synchronize]
  pull_request_review_comment:
    types: [created]

jobs:
  # Claude Code (responds to @mentions)
  claude:
    if: contains(github.event.comment.body, '@claude') || contains(github.event.review.body, '@claude')
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-main.yml@main
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  # Your existing CI checks
  tests:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  # Your existing code quality checks
  lint:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint
```

#### Cost Optimization

Tips for managing Claude API costs effectively:

1. **Model Selection Impact**:

   - Haiku 4.5: Most cost-effective for simple tasks
   - Sonnet 4.5: ~$3 per 1M input tokens, ~$15 per 1M output tokens (default, recommended)
   - Opus 4: ~$15 per 1M input tokens, ~$75 per 1M output tokens (reserve for complex tasks)
   - Typical interaction: 5K-50K tokens (mostly input)

2. **Timeout Strategy**:

   - Shorter timeouts prevent runaway costs from stuck executions
   - Most interactions complete in under 5 minutes
   - Rarely need more than 15 minutes even for complex analysis

3. **Tool Restrictions Reduce Costs**:

   - Fewer tools = less exploration time = lower token usage
   - Read-only mode typically uses 20-30% fewer tokens
   - Restricting bash commands can significantly reduce cost

4. **Concurrency Control** (Built-in):

   - Automatically cancels in-progress runs when new comments arrive
   - Prevents duplicate executions for same issue/PR
   - No additional configuration needed

5. **Usage Monitoring**:
   - Set up budget alerts in Anthropic console
   - Review monthly costs and adjust strategy
   - Consider using Sonnet exclusively if costs are a concern

**Example cost calculation**:

- 50 @claude mentions per week
- Average 20K tokens per interaction
- Using Sonnet 4.5

```
50 mentions × 20K tokens = 1M tokens/week
Input: 1M × $3 = $3/week
Output: 0.2M × $15 = $3/week
Total: ~$6/week = ~$24/month
```

---

### \_claude-welcome.yml

**Purpose**: Automatically post a welcome message from Claude to newly opened pull requests, introducing Claude's capabilities and helping teams adopt AI-assisted code review.

#### Inputs

| Input                      | Required | Default     | Description                                                                       |
| -------------------------- | -------- | ----------- | --------------------------------------------------------------------------------- |
| `welcome_message`          | No       | (See below) | Custom welcome message body (supports markdown)                                   |
| `workflow_deployment_date` | Yes      | -           | Date workflow was deployed (YYYY-MM-DD format, used for expiration calculation)   |
| `expiration_months`        | No       | `3`         | Number of months the welcome should remain active (0 disables expiration)         |
| `documentation_url`        | No       | -           | Optional URL to repository-specific Claude PR guide (appended to welcome message) |

**Default Welcome Message:**

```markdown
👋 Hi!

I'm Claude, an AI assistant here to help with code reviews and answer questions about your PR. You can tag me anytime with `@claude` followed by your request.

💡 **Tip:** Ask me to explain code, suggest improvements, or review specific changes.
```

#### Outputs

This workflow does not have outputs (welcome messages are posted directly to PRs).

#### Secrets

| Secret         | Required                     | Description                    |
| -------------- | ---------------------------- | ------------------------------ |
| `GITHUB_TOKEN` | Yes (automatically provided) | Built-in token for PR comments |

**Note**: This workflow uses the built-in `GITHUB_TOKEN` which is automatically available. No additional secrets are required.

#### Permissions Required

The calling workflow must grant these permissions:

```yaml
permissions:
  pull-requests: write
  issues: write
```

#### Features

- **Configurable Expiration**: Set time-limited welcome periods for pilot programs or trials
- **Date Validation**: Strict YYYY-MM-DD format validation with helpful error messages
- **Duplicate Detection**: Prevents multiple welcome messages on the same PR
- **Optional Documentation Link**: Seamlessly append repo-specific Claude guides
- **Security Built-in**: Bullfrog security scanning integrated into workflow
- **Zero Maintenance**: Automatically disables after expiration period

#### Quick Start Example

```yaml
name: Welcome Claude

on:
  pull_request:
    types: [opened]

jobs:
  welcome:
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-welcome.yml@main
    with:
      workflow_deployment_date: '2025-01-15'
    permissions:
      pull-requests: write
      issues: write
```

#### Example: Custom Message

```yaml
jobs:
  welcome:
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-welcome.yml@main
    with:
      welcome_message: |
        👋 Hello from the Engineering Team!

        Claude is available to help with:
        - Code review and suggestions
        - Answering questions about this PR
        - Explaining complex code changes

        Tag `@claude` in comments to get started!
      workflow_deployment_date: '2025-01-15'
      expiration_months: 6
    permissions:
      pull-requests: write
      issues: write
```

#### Example: With Documentation Link

```yaml
jobs:
  welcome:
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-welcome.yml@main
    with:
      workflow_deployment_date: '2025-01-15'
      expiration_months: 3
      documentation_url: 'https://github.com/your-org/your-repo/blob/main/docs/claude-guide.md'
    permissions:
      pull-requests: write
      issues: write
```

#### Example: Permanent Welcome (No Expiration)

```yaml
jobs:
  welcome:
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-welcome.yml@main
    with:
      workflow_deployment_date: '2025-01-15'
      expiration_months: 0 # 0 = no expiration
    permissions:
      pull-requests: write
      issues: write
```

#### Troubleshooting

**Issue: Date format error**

```
Error: Invalid workflow_deployment_date format: '2025-1-15'. Must be YYYY-MM-DD (e.g., '2025-01-15')
```

**Solution**: Use zero-padded dates (YYYY-MM-DD format)

- ❌ `'2025-1-15'`
- ✅ `'2025-01-15'`

**Issue: Multiple welcome messages appear**

```
Multiple welcome comments from Claude on the same PR
```

**Solution**: This shouldn't happen due to duplicate detection. Check if:

- Multiple workflows are calling this reusable workflow
- The welcome message text was changed (detection looks for specific text)

**Issue: Welcome message not appearing**

```
Workflow runs successfully but no comment is posted
```

**Possible causes**:

1. **Expiration period passed**: Check if current date is beyond `workflow_deployment_date + expiration_months`
2. **Permissions missing**: Ensure calling workflow has `pull-requests: write` permission
3. **Already posted**: Duplicate detection may have found an existing message

**Issue: Workflow fails with permission error**

```
Error: Resource not accessible by integration
```

**Solution**: Add required permissions to the calling workflow:

```yaml
jobs:
  welcome:
    permissions:
      pull-requests: write
      issues: write
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-welcome.yml@main
    # ...
```

#### Best Practices

1. **Set Realistic Expiration Dates**:

   - Use 3-6 months for pilot programs
   - Use 0 (no expiration) for permanent adoption
   - Update `workflow_deployment_date` when extending trials

2. **Customize the Message**:

   - Keep it concise (3-5 lines)
   - Link to your repository's Claude documentation
   - Include specific examples relevant to your codebase

3. **Test Before Rolling Out**:

   - Create a test PR in a feature branch
   - Verify message appearance and formatting
   - Confirm links work correctly

4. **Monitor Adoption**:
   - Track how many PRs receive the welcome
   - Gather team feedback on message clarity
   - Update documentation_url as needed

#### Integration with Existing Workflows

This workflow is designed to work alongside other PR automation:

```yaml
name: PR Automation

on:
  pull_request:
    types: [opened]

jobs:
  # Welcome Claude (only on first open)
  claude-welcome:
    uses: Uniswap/ai-toolkit/.github/workflows/_claude-welcome.yml@main
    with:
      workflow_deployment_date: '2025-01-15'
    permissions:
      pull-requests: write
      issues: write

  # Your existing PR checks
  assign-reviewer:
    runs-on: ubuntu-latest
    steps:
      - name: Assign reviewer
        run: gh pr edit ${{ github.event.pull_request.number }} --add-assignee @team-lead

  # Your existing labeling
  auto-label:
    runs-on: ubuntu-latest
    steps:
      - name: Add labels
        run: gh pr edit ${{ github.event.pull_request.number }} --add-label "needs-review"
```

---

### \_generate-changelog.yml

**Purpose**: Generate AI-powered changelogs from git commit ranges using Anthropic's Claude API.

#### Inputs

| Input                | Required | Default      | Description                                                                     |
| -------------------- | -------- | ------------ | ------------------------------------------------------------------------------- |
| `from_ref`           | Yes      | -            | Starting git reference (SHA, tag, or branch name)                               |
| `to_ref`             | Yes      | -            | Ending git reference (SHA, tag, or branch name)                                 |
| `output_formats`     | No       | `'markdown'` | Comma-separated formats: `'slack'`, `'markdown'`, or `'slack,markdown'`         |
| `custom_prompt_file` | No       | -            | Path to custom prompt file (relative to repo root)                              |
| `custom_prompt_text` | No       | -            | Inline custom prompt (overrides `custom_prompt_file`)                           |
| `max_tokens`         | No       | `2048`       | Maximum tokens for AI response (1024=concise, 2048=detailed, 4096=comprehensive |

#### Outputs

| Output               | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| `changelog_slack`    | Slack mrkdwn formatted changelog (only if `'slack'` in formats)      |
| `changelog_markdown` | GitHub-flavored markdown changelog (only if `'markdown'` in formats) |
| `generation_method`  | Either `'ai'` (success) or `'fallback'` (commit list)                |

#### Secrets

| Secret              | Required | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `ANTHROPIC_API_KEY` | Yes      | API key from console.anthropic.com |

#### Features

- **Flexible Git References**: Accepts any combination of SHA, tag, or branch references
- **Multi-Format Generation**: Generate Slack and/or markdown formats in a single AI call
- **Custom Prompts**: Provide your own prompts via file or inline text
- **Automatic Fallback**: Falls back to commit list if AI generation fails
- **Format-Specific Instructions**: Automatically appends format requirements to your custom prompt

#### Example: Multiple Formats

```yaml
jobs:
  changelog:
    uses: uniswap/ai-toolkit/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: 'v1.0.0'
      to_ref: 'v1.1.0'
      output_formats: 'slack,markdown' # Generate both formats in one call
      max_tokens: 1024
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

#### Example: Custom Prompt File

```yaml
jobs:
  changelog:
    uses: uniswap/ai-toolkit/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: ${{ github.event.before }}
      to_ref: ${{ github.sha }}
      custom_prompt_file: '.github/prompts/release-changelog.md'
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

#### Example: Inline Custom Prompt

```yaml
jobs:
  changelog:
    uses: uniswap/ai-toolkit/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: ${{ github.event.before }}
      to_ref: ${{ github.sha }}
      custom_prompt_text: |
        Generate a changelog focusing ONLY on breaking changes.
        Format as a numbered list with upgrade instructions for each breaking change.
        Ignore all other changes.
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### \_notify-release.yml

**Purpose**: Send release notifications to Slack, Notion, or both with pre-generated changelogs.

#### Inputs

| Input                | Required | Default | Description                                                  |
| -------------------- | -------- | ------- | ------------------------------------------------------------ |
| `changelog_slack`    | No       | -       | Pre-generated Slack changelog (from \_generate-changelog)    |
| `changelog_markdown` | No       | -       | Pre-generated markdown changelog (from \_generate-changelog) |
| `destinations`       | Yes      | -       | Comma-separated: `'slack'`, `'notion'`, or `'slack,notion'`  |
| `from_ref`           | Yes      | -       | Starting git reference (for display in notifications)        |
| `to_ref`             | Yes      | -       | Ending git reference (for display in notifications)          |
| `branch`             | Yes      | -       | Branch name that was released                                |
| `npm_tag`            | No       | -       | NPM tag used for publishing                                  |
| `release_title`      | No       | -       | Custom title (default: generated from branch/refs)           |

#### Outputs

This workflow does not have outputs (notifications are fire-and-forget).

#### Secrets

| Secret | Required | Description |\n| ---------------------------------- | ---------------------------------- | -------------------------- |\n| `SLACK_WEBHOOK_URL` | ✅ If `\"slack\"` in `destinations` | Slack incoming webhook URL |\n| `NOTION_API_KEY` | ✅ If `\"notion\"` in `destinations` | Notion integration API key |\n| `RELEASE_NOTES_NOTION_DATABASE_ID` | ✅ If `\"notion\"` in `destinations` | Target Notion database ID |

#### Features

- **Destination Routing**: Send to Slack, Notion, or both based on configuration
- **Automatic Format Handling**: Converts markdown to Slack format if needed
- **Notion Database Integration**: Creates rich pages with metadata in Notion
- **Graceful Failures**: Notifications continue even if one destination fails
- **GitHub Actions Summary**: Provides detailed summary with links in workflow UI

#### Example: Slack Only

```yaml
jobs:
  notify:
    uses: uniswap/ai-toolkit/.github/workflows/_notify-release.yml@main
    with:
      changelog_slack: ${{ needs.generate-changelog.outputs.changelog_slack }}
      destinations: 'slack'
      from_ref: 'v1.0.0'
      to_ref: 'v1.1.0'
      branch: 'main'
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### Example: Notion Only

```yaml
jobs:
  notify:
    uses: uniswap/ai-toolkit/.github/workflows/_notify-release.yml@main
    with:
      changelog_markdown: ${{ needs.generate-changelog.outputs.changelog_markdown }}
      destinations: 'notion'
      from_ref: 'v1.0.0'
      to_ref: 'v1.1.0'
      branch: 'main'
      release_title: 'Production Release v1.1.0'
    secrets:
      NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
      RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.RELEASE_NOTES_NOTION_DATABASE_ID }}
```

#### Example: Both Destinations

```yaml
jobs:
  notify:
    uses: uniswap/ai-toolkit/.github/workflows/_notify-release.yml@main
    with:
      changelog_slack: ${{ needs.generate-changelog.outputs.changelog_slack }}
      changelog_markdown: ${{ needs.generate-changelog.outputs.changelog_markdown }}
      destinations: 'slack,notion'
      from_ref: ${{ github.event.before }}
      to_ref: ${{ github.sha }}
      branch: ${{ github.ref_name }}
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
      RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.RELEASE_NOTES_NOTION_DATABASE_ID }}
```

## Implementation Details

### Published npm Package Architecture

The notification workflows leverage the **@uniswap/notion-publisher** npm package for Notion integration. This CLI tool provides:

- **CI/CD Agnostic**: Works in GitHub Actions, GitLab CI, CircleCI, Jenkins, and locally
- **Type Safety**: Full TypeScript type checking for API interactions
- **Better Error Handling**: Structured error handling with detailed error messages
- **External Reusability**: Other teams and projects can use the same tool
- **Maintainability**: Tested and versioned independently from workflows
- **No Build Steps**: Direct execution via `npx` without local builds

### Package Structure

The Notion publisher is organized as an Nx library:

```
packages/notion-publisher/
├── package.json       # Package configuration with CLI bin field
├── README.md          # User-facing documentation
├── CLAUDE.md          # Developer documentation
└── src/
    └── cli.ts         # Main CLI implementation
```

**Key Characteristics**:

- **Published to npm**: Available as `@uniswap/notion-publisher` with restricted access
- **CLI Tool**: Executable via `npx @uniswap/notion-publisher`
- **Environment Variables**: Secrets passed via env vars (secure, no process listing exposure)
- **Node.js 22**: Requires Node.js 22+ for execution

For complete usage documentation, see `packages/notion-publisher/README.md`.

### Community-First Development Principle

**CRITICAL PRINCIPLE**: All scripts and tooling prioritize community-maintained libraries over custom implementations.

**Why This Matters**:

- Battle-tested reliability (millions of weekly downloads)
- Active maintenance and security patches
- Comprehensive documentation and community support
- Reduced technical debt and maintenance burden

**Example - Argument Parsing**:
Instead of custom argument parsing logic, the action uses **minimist** (~62.5M weekly downloads):

```typescript
import minimist from 'minimist';

const args = minimist(process.argv.slice(2), {
  string: ['api-key', 'database-id', 'title', 'content', 'from-ref', 'to-ref', 'branch'],
  alias: {
    'api-key': 'apiKey',
    'database-id': 'databaseId',
    'from-ref': 'fromRef',
    'to-ref': 'toRef',
  },
});
```

**Benefits**:

- Handles edge cases (quoted arguments, spaces, special characters)
- Supports aliases for kebab-case → camelCase conversion
- Well-documented and widely used across the ecosystem
- ~50 lines of custom code eliminated

### Dependencies

The `@uniswap/notion-publisher` package relies on these community-maintained libraries:

#### Core Dependencies

1. **@notionhq/client** (v2.2.15)

   - Official Notion JavaScript SDK
   - Provides type-safe API access
   - Handles authentication and rate limiting
   - [npm](https://www.npmjs.com/package/@notionhq/client)

2. **@tryfabric/martian** (v1.2.4)

   - Markdown to Notion blocks converter
   - Supports rich formatting (headings, lists, code blocks)
   - Handles complex markdown structures
   - [npm](https://www.npmjs.com/package/@tryfabric/martian)

3. **minimist** (v1.2.8)
   - Lightweight CLI argument parser
   - Supports flags, aliases, and type coercion
   - Zero dependencies
   - [npm](https://www.npmjs.com/package/minimist)

These dependencies are managed in the package's `package.json` and installed automatically when using `npx`.

#### CLI Features

The `@uniswap/notion-publisher` CLI provides:

- **Simple Interface**: Clean flag-based inputs with environment variable support
- **Structured Logging**: Color-coded output for info/error messages (to stderr)
- **Error Context**: Detailed error messages with API response bodies
- **Metadata Support**: Automatically adds commit range, branch, and date properties
- **Output Capture**: Returns Notion page URL to stdout for easy capture
- **Exit Codes**: Proper exit codes for CI/CD integration (0 = success, 1 = failure)

#### Type Handling for Third-Party Libraries

The CLI's TypeScript implementation handles a known type incompatibility between `@tryfabric/martian` and `@notionhq/client` using a **JSON serialization approach**:

```typescript
// Convert markdown to Notion blocks
const blocks = markdownToBlocks(content);

// Serialize and deserialize to strip TypeScript type metadata
// This is necessary because @tryfabric/martian and @notionhq/client have
// incompatible type definitions despite being structurally compatible at runtime
const notionBlocks = JSON.parse(JSON.stringify(blocks));
```

**Why This Works**:

- The libraries produce/consume structurally compatible data at runtime
- TypeScript type definitions differ in newer properties (`is_toggleable`, `custom_emoji`)
- JSON serialization preserves data structure while stripping type metadata
- Avoids unsafe type assertions (`as any`) which bypass type safety
- The data remains fully functional despite nominal type incompatibility

**Type Safety Principle**: Always prefer solutions that maintain type safety (like JSON serialization) over type assertions or suppressing errors.

#### Development Guidelines

When modifying or extending these workflows:

1. **Search First**: Always search for existing community libraries before writing custom code
2. **Evaluate Adoption**: Prefer libraries with:
   - High weekly downloads (> 1M)
   - Active maintenance (recent updates)
   - Good documentation
   - Stable version history
3. **Type Safety**: Use TypeScript for all new scripts and actions
   - Avoid `as any` type assertions
   - Prefer structural solutions for type incompatibilities
   - Document why type handling is necessary
4. **Dependencies**: Keep dependencies minimal but don't reinvent the wheel
5. **Composite Actions**: For complex logic or reusable operations:
   - Create composite actions in `.github/actions/`
   - Include comprehensive README.md documentation
   - Manage dependencies separately from root
   - Use npm caching for performance

## Real-World Examples

See the [`examples/`](./examples/) directory for complete, working workflows:

| Example                               | Use Case                                    | Complexity |
| ------------------------------------- | ------------------------------------------- | ---------- |
| `01-manual-changelog-generator.yml`   | On-demand changelog between any two commits | ⭐         |
| `02-existing-release-integration.yml` | Integrate into existing release pipeline    | ⭐⭐       |
| `03-weekly-digest.yml`                | Scheduled weekly team updates               | ⭐⭐⭐     |
| `04-hotfix-release.yml`               | Emergency hotfix notifications              | ⭐⭐       |

### When to Use Each Example

- **Manual Generator**: Perfect for generating changelogs for past releases, creating release notes after the fact, or testing different prompts
- **Release Integration**: The most common pattern - integrate into your existing npm publish, docker push, or deployment workflow
- **Weekly Digest**: Great for keeping stakeholders informed without notification overload
- **Hotfix Release**: Fast-track critical patches with appropriate urgency in notifications

## Usage Examples

### Complete Release Workflow

This example demonstrates a complete release workflow using both reusable workflows:

```yaml
name: Release Workflow

on:
  push:
    branches: [main, next]

jobs:
  # Step 1: Generate changelogs in both formats
  generate-changelog:
    uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: ${{ github.event.before }}
      to_ref: ${{ github.sha }}
      output_formats: 'slack,markdown'
      custom_prompt_file: '.github/prompts/release-changelog.md'
      max_tokens: 2048
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  # Step 2: Send notifications to both destinations
  notify-release:
    needs: generate-changelog
    uses: your-org/your-repo/.github/workflows/_notify-release.yml@main
    with:
      changelog_slack: ${{ needs.generate-changelog.outputs.changelog_slack }}
      changelog_markdown: ${{ needs.generate-changelog.outputs.changelog_markdown }}
      destinations: 'slack,notion'
      from_ref: ${{ github.event.before }}
      to_ref: ${{ github.sha }}
      branch: ${{ github.ref_name }}
      npm_tag: ${{ github.ref_name == 'main' && 'latest' || 'next' }}
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
      RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.RELEASE_NOTES_NOTION_DATABASE_ID }}
```

### Tag-Based Release Workflow

Generate changelog between two release tags:

```yaml
name: Tag Release

on:
  push:
    tags:
      - 'v*'

jobs:
  generate-changelog:
    runs-on: ubuntu-latest
    outputs:
      previous_tag: ${{ steps.get-tags.outputs.previous_tag }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get previous tag
        id: get-tags
        run: |
          CURRENT_TAG=${{ github.ref_name }}
          PREVIOUS_TAG=$(git tag --sort=-version:refname | grep -A1 "^${CURRENT_TAG}$" | tail -n1)
          echo "previous_tag=$PREVIOUS_TAG" >> $GITHUB_OUTPUT

  changelog:
    needs: generate-changelog
    uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: ${{ needs.generate-changelog.outputs.previous_tag }}
      to_ref: ${{ github.ref_name }}
      output_formats: 'markdown'
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  notify:
    needs: [generate-changelog, changelog]
    uses: your-org/your-repo/.github/workflows/_notify-release.yml@main
    with:
      changelog_markdown: ${{ needs.changelog.outputs.changelog_markdown }}
      destinations: 'slack'
      from_ref: ${{ needs.generate-changelog.outputs.previous_tag }}
      to_ref: ${{ github.ref_name }}
      branch: main
      release_title: 'Release ${{ github.ref_name }}'
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Weekly Digest Workflow

Generate a weekly digest of all changes:

```yaml
name: Weekly Digest

on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday at 9am UTC
  workflow_dispatch:

jobs:
  generate-digest:
    runs-on: ubuntu-latest
    outputs:
      week_ago_sha: ${{ steps.get-sha.outputs.sha }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get SHA from one week ago
        id: get-sha
        run: |
          WEEK_AGO_SHA=$(git rev-list -n 1 --before="1 week ago" HEAD)
          echo "sha=$WEEK_AGO_SHA" >> $GITHUB_OUTPUT

  changelog:
    needs: generate-digest
    uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: ${{ needs.generate-digest.outputs.week_ago_sha }}
      to_ref: HEAD
      output_formats: 'slack'
      custom_prompt_text: |
        Create a weekly digest changelog:
        - Highlight major features and improvements
        - Summarize bug fixes
        - Note any breaking changes
        Keep it concise (max 10 items).
      max_tokens: 1024
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  notify:
    needs: changelog
    uses: your-org/your-repo/.github/workflows/_notify-release.yml@main
    with:
      changelog_slack: ${{ needs.changelog.outputs.changelog_slack }}
      destinations: 'slack'
      from_ref: '1 week ago'
      to_ref: 'HEAD'
      branch: main
      release_title: 'Weekly Development Digest'
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Custom Prompts

### Anatomy of an Effective Prompt

```markdown
# Your Prompt Title

You are a changelog generator. [Set the role/context]

Focus on: [Define what to include]

- Feature additions
- Bug fixes
- Breaking changes

Format requirements: [Specify output format]

- Use bullet points
- Keep it concise (3-10 items)
- Group related changes

[Format-specific instructions follow - see below]
```

### Format-Specific Tips

#### Slack Format (mrkdwn)

```markdown
Slack formatting requirements:

- Use _asterisks_ for bold (NOT double asterisks)
- Use _underscores_ for italic
- Use • or - for bullets
- NO markdown headers (##, ###)
- Plain URLs only (no [text](url) format)
- Keep very concise
```

#### Markdown Format

```markdown
Markdown formatting requirements:

- Use **double asterisks** for bold
- Use _single asterisks_ for italic
- Use ### headers for sections
- Can include [links](url)
- Can be more detailed than Slack
```

### Example Custom Prompts

See `.github/prompts/` for production examples:

- `release-changelog.md` - Standard release notes
- `production-release-changelog.md` - Detailed production deployment notes
- `weekly-digest.md` - Weekly summary format
- `hotfix-changelog.md` - Urgent hotfix format

**Example Prompt File** (`.github/prompts/release-changelog.md`):

```markdown
You are a changelog generator for a JavaScript/TypeScript monorepo.

Based on the git changes, create a categorized changelog:

## 🎉 Features

- List new features

## 🐛 Bug Fixes

- List bug fixes

## ⚡ Performance

- List performance improvements

## 🔨 Refactoring

- List code refactoring

## 📚 Documentation

- List documentation updates

Rules:

- Keep items concise (one line each)
- Focus on user-facing changes
- Skip internal refactoring unless significant
- Include package names for monorepo changes
- Max 15 items total
```

### Testing Custom Prompts

Before committing a custom prompt, test it locally:

```bash
# 1. Create your prompt file
echo "Your custom prompt..." > .github/prompts/test-prompt.md

# 2. Trigger workflow with your prompt
# (Use manual-changelog-generator example)

# 3. Review output in workflow summary
# 4. Iterate until satisfied
```

## Best Practices

### 1. Keep Prompts Focused

❌ **Bad**: Vague, multi-purpose prompt

```markdown
Generate a changelog. Include everything that changed.
Make it look nice. Format appropriately for the destination.
```

✅ **Good**: Specific, single-purpose prompt

```markdown
Generate a concise changelog (3-7 items) focusing on user-facing changes only.
Ignore internal refactoring, dependency updates, and test changes.
Group by: Features, Fixes, Breaking Changes.
```

### 2. Token Budget Recommendations

| Use Case                 | Recommended max_tokens | Estimated Cost |
| ------------------------ | ---------------------- | -------------- |
| Hotfix (urgent, concise) | 512-1024               | ~$0.005        |
| Standard release         | 1024-2048              | ~$0.01         |
| Detailed release notes   | 2048-4096              | ~$0.02         |
| Weekly digest            | 2048-4096              | ~$0.02         |

### 3. Output Format Selection

Choose the right format(s) for your needs:

- **Slack only** (`"slack"`): Real-time notifications, team updates
- **Markdown only** (`"markdown"`): Release notes, GitHub releases, Notion pages
- **Both** (`"slack,markdown"`): When you need notifications AND documentation

**Pro Tip**: Generate both formats in a single call for efficiency, even if you only need one immediately. The other can be saved for future use.

### 4. Multi-Format Strategy

Generate both formats in one AI call to save costs:

```yaml
# ✅ Efficient: One AI call generates both formats
output_formats: 'slack,markdown'
# ❌ Wasteful: Would require two separate AI calls
# (Don't do this - use the comma-separated approach above)
```

### 5. Notion Database Schema

Set up your Notion database with these properties for best compatibility:

**Required:**

- **Name** (Title) - Page title

**Recommended:**

- **Commit Range** (Rich Text) - Git reference range
- **Branch** (Rich Text) - Branch name
- **Date** (Date) - Release timestamp
- **Status** (Select) - Release status (Optional: "Draft", "Published", "Archived")

**Optional:**

- **Version** (Rich Text) - Version number
- **Author** (Person) - Release author

### 6. Git Reference Patterns

**Recommended patterns:**

| Pattern        | Example                                            | Use Case                 |
| -------------- | -------------------------------------------------- | ------------------------ |
| Commit SHAs    | `abc123def` → `def456abc`                          | Specific commit ranges   |
| Tags           | `v1.0.0` → `v1.1.0`                                | Release changelogs       |
| Branch to HEAD | `main` → `HEAD`                                    | Current branch state     |
| Event refs     | `${{ github.event.before }}` → `${{ github.sha }}` | Push-triggered workflows |

**Avoid:**

- Branch-to-branch comparisons (ambiguous)
- Mixing local and remote references without clear intent

### 7. Error Handling

Always use `continue-on-error` for non-critical notifications:

```yaml
- name: Send Slack notification
  continue-on-error: true # Don't fail entire workflow if Slack is down
  uses: uniswap/ai-toolkit/.github/workflows/_notify-release.yml@main
  # ...
```

Both workflows use `continue-on-error: true` for non-critical steps:

- **Changelog Generation**: Falls back to commit list if AI fails
- **Slack Notifications**: Continues if webhook fails
- **Notion Publishing**: Continues if API call fails

Check workflow logs and GitHub Actions summary for detailed error information.

### 8. Caching Considerations

GitHub Actions caches:

- ✅ Node modules (automatic with `actions/setup-node@v6`)
- ✅ Dependencies (automatic with `npm ci`)
- ❌ AI responses (not cached - each run calls API)

### 9. Security

1. **Never Log Secrets**: Secrets are automatically redacted, but avoid `echo $SECRET`
2. **Use Least Privilege**: Slack webhooks should only post to specific channels
3. **Rotate Keys**: Rotate Anthropic API keys every 90 days
4. **Limit Scope**: Don't use workspace-wide Notion integrations

### 10. Cost Optimization

1. **Skip redundant generation**: If you already have a changelog, skip `_generate-changelog.yml`
2. **Use appropriate token limits**: Don't use 4096 tokens when 1024 will suffice
3. **Batch notifications**: Send weekly digests instead of per-commit notifications
4. **Monitor usage**: Check Anthropic dashboard monthly

## Troubleshooting

### AI Generation Failures

**Symptom**: `generation_method` output is `'fallback'` instead of `'ai'`

**Causes & Solutions**:

1. **Invalid API Key**

   ```
   Error: 401 Unauthorized
   Solution: Verify ANTHROPIC_API_KEY secret is correct
   ```

2. **Rate Limiting**

   ```
   Error: 429 Too Many Requests
   Solution: Wait and retry, or implement exponential backoff
   ```

3. **Timeout**

   ```
   Error: Request timeout
   Solution: Reduce max_tokens or simplify custom prompt
   ```

4. **Invalid Response**

   ```
   Error: Failed to parse API response
   Solution: Check Anthropic status page for API issues
   ```

**Fallback Behavior**: When AI generation fails, the workflow automatically falls back to a simple commit list (markdown format only). Check the `generation_method` output to detect this.

### Slack Notification Errors

**Symptom**: Slack notification step fails

**Common Issues**:

1. **Invalid Webhook URL**

   ```yaml
   # ❌ Wrong - missing https://
   webhook: hooks.slack.com/services/...

   # ✅ Correct
   webhook: https://hooks.slack.com/services/...
   ```

2. **Webhook Revoked**

   - Check Slack app settings
   - Regenerate webhook if needed

3. **Payload Too Large**

   - Reduce `max_tokens` in changelog generation
   - Use more concise custom prompt
   - Slack has 3000 character limit per message

4. **Special Characters**
   - Workflow handles escaping automatically
   - If issues persist, check for unmatched quotes in custom prompt

### Notion Integration Issues

**Symptom**: Notion page creation fails

**Common Issues**:

1. **Missing Database Properties**

   ```
   Error: Property "Name" not found
   Solution: Notion database must have these properties:
   - Name (title)
   - Date (date)
   - Commit Range (rich_text)
   - Branch (rich_text)
   ```

2. **Permission Denied**

   ```
   Error: 403 Forbidden
   Solution: Ensure Notion integration has access to the database
   - Go to database in Notion
   - Click "..." → Connections → Add your integration
   ```

3. **Invalid Database ID**

   ```
   Error: 404 Not Found
   Solution: Extract correct ID from database URL:
   https://notion.so/workspace/DATABASE_ID?v=...
   ```

### Invalid Git Reference

**Symptom**: `fatal: bad revision` error

**Possible Causes**:

- Reference doesn't exist
- Shallow clone (insufficient history)
- Reference not fetched

**Solutions:**

- Use `fetch-depth: 0` in checkout action
- Verify reference exists: `git rev-parse <ref>`
- For tags, ensure they're fetched: `git fetch --tags`

### Format Mismatch

**Symptom**: Wrong format received or parsed incorrectly

**Possible Causes:**

- Output format requested doesn't match consumption
- Both formats requested but only one needed

**Solutions:**

- Request only needed formats for efficiency
- Check output variable names match format requested:
  - `changelog_slack` for Slack format
  - `changelog_markdown` for markdown format
- Verify destination expects correct format

### Rate Limits and Quotas

**Anthropic API**:

- Free tier: 50 requests/day
- Paid tier: Much higher (check current limits)
- Cost: ~$0.01-0.03 per changelog (with Claude Haiku)

**GitHub Actions**:

- 2000 minutes/month (free tier)
- These workflows use ~2-5 minutes per run

**Slack**:

- 1 request/second per webhook
- No daily limit

### Debug Mode

Enable verbose logging:

```yaml
- name: Enable debug logging
  run: echo "ACTIONS_STEP_DEBUG=true" >> $GITHUB_ENV

- uses: uniswap/ai-toolkit/.github/workflows/_generate-changelog.yml@main
  # ... workflow continues with debug output
```

## Migration Guides

### From Manual Changelogs

1. Start with manual generator to test AI output quality
2. Once satisfied, integrate into release pipeline
3. Keep manual generator for backfilling historical releases

### From conventional-changelog

These workflows can coexist! Use AI for human-readable summaries, keep conventional-changelog for detailed CHANGELOG.md files:

```yaml
jobs:
  conventional:
    runs-on: ubuntu-latest
    steps:
      - run: npx conventional-changelog-cli -p angular -i CHANGELOG.md -s

  ai-changelog:
    uses: uniswap/ai-toolkit/.github/workflows/_generate-changelog.yml@main
    # ... generate human-readable summary for Slack
```

## Support and Contributing

For issues, questions, or contributions related to these workflows:

1. **Issues**: Open an issue in this repository
2. **Documentation**: This file is the source of truth
3. **Updates**: Watch this repository for workflow updates
4. **Breaking Changes**: Major version tags will be used for breaking changes

### Versioning

Reference workflows using tags for stability:

```yaml
# Recommended: Use specific version tag
uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@v1.0.0

# Alternative: Use branch (gets latest changes, may break)
uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@main
```

### Changelog for This Documentation

- **2025-01-XX**: Initial release with both reusable workflows
- Changelog generation with multi-format support
- Notification routing with Notion integration
- Comprehensive documentation and examples

---

## License

These workflows are part of the internal tooling and follow the same license as the parent repository.
