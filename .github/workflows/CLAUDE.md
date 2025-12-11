# GitHub Actions Workflows

## Purpose

Contains GitHub Actions workflow definitions that automate CI/CD, code quality, releases, and Claude AI integrations for the AI Toolkit monorepo. Includes both callable workflows (prefixed with `_`) and consumer workflows that use them.

## Workflow Categories

### CI & Quality Assurance (2 workflows)

- `ci-pr-checks.yml` - Validates PRs with build, lint, format, and test checks
- `claude-welcome.yml` - Posts welcome messages from Claude to new PRs

### Release & Deployment (2 workflows)

- `publish-packages.yml` - Unified package publishing workflow (automatic on push to main/next, manual via workflow_dispatch)
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

### Dependency Management (2 workflows)

- `update-action-versions.yml` - Scheduled workflow to update GitHub Actions to latest versions
- `_update-action-versions-worker.yml` - Reusable worker for analyzing and updating action versions

### Reusable Workflows (8 workflows, prefixed with `_`)

- `_claude-main.yml` - Core Claude AI interaction engine
- `_claude-welcome.yml` - Reusable welcome message poster
- `_claude-code-review.yml` - Reusable PR review automation
- `_claude-task-worker.yml` - Autonomous task execution from Linear issues
- `_generate-changelog.yml` - AI-powered changelog generation
- `_generate-pr-metadata.yml` - AI-powered PR title and description generation
- `_notify-release.yml` - Slack release notifications
- `_update-action-versions-worker.yml` - GitHub Actions version update automation

## Key Files

### Callable Workflows (Reusable - External)

These workflows are prefixed with `_` and may be called from other repositories:

- `_claude-main.yml` - Claude AI assistant for GitHub interactions
- `_claude-code-review.yml` - Formal GitHub PR reviews with inline comments
- `_claude-task-worker.yml` - Process single Linear task autonomously
- `_claude-welcome.yml` - Welcome messages for new contributors
- `_generate-changelog.yml` - AI-generated release notes
- `_generate-pr-metadata.yml` - AI-generated PR titles and descriptions
- `_notify-release.yml` - Slack notification dispatcher

### PR Code Review (`_claude-code-review.yml`)

This workflow performs automated PR code reviews using Claude AI with the following features:

**Key Features:**

- Formal GitHub reviews (APPROVE/REQUEST_CHANGES/COMMENT)
- Inline comments on specific lines of code (as `github-actions[bot]`)
- **Real-time status updates**: Shows "review in progress" immediately when workflow starts
- Patch-ID based caching to skip rebases (no actual code changes)
- **Comment trigger**: Add `@request-claude-review` to any PR comment to force a fresh review
- Manual trigger via workflow_dispatch to force a new review (bypasses cache)
- Custom prompt support
- Existing review comment context for re-reviews
- Fast review mode for trivial PRs (< 20 lines)
- **Built-in Verdict Decision Rules** - Ensures consistent, predictable review verdicts

**Verdict Decision Rules:**

The workflow includes mandatory verdict decision rules that ensure Claude returns appropriate review verdicts:

| Verdict             | When to Use                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **APPROVE**         | No bugs or security issues found. Suggestions, questions, and style feedback are NOT blocking.                                  |
| **REQUEST_CHANGES** | Bugs, security vulnerabilities, data corruption risks, or breaking changes found.                                               |
| **COMMENT**         | Used sparingly when multiple near-blocking issues exist or significant rework is needed, but no specific bug can be identified. |

**Key principle:** Questions, considerations, "nice-to-haves", and teaching moments are NOT blocking issues. If Claude's review is positive overall with suggestions, it should APPROVE, not COMMENT.

This logic is built into the workflow's system prompt, so all consumers get consistent verdict behavior regardless of their custom prompt content. Custom prompts should focus on _how to review_ (priorities, tone, patterns to look for), not _how to decide the verdict_.

**Architecture:**

This workflow uses a hybrid approach:

1. Claude analyzes the PR and outputs structured JSON
2. A TypeScript script (`post-review.ts`) parses the JSON and posts the review via `gh` CLI

This ensures all comments appear as `github-actions[bot]` using the official Anthropic action without needing a fork.

**Real-Time Status Updates:**

The workflow provides immediate feedback to PR authors:

| Status                  | When Shown                                            | Message                                              |
| ----------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| 🔄 **In Progress**      | Immediately when workflow starts                      | "Claude is currently analyzing this pull request..." |
| ✅ **No Review Needed** | When cache hit detected (rebase with no code changes) | "No new code changes since the last review"          |
| 📋 **Review Complete**  | After Claude finishes analysis                        | Full review with verdict and inline comments         |

This eliminates the "is it running?" uncertainty by posting a status comment as the very first action in the workflow, before any analysis begins. The same comment is then updated with the final review or skipped status.

**Required Secrets:**

| Secret              | Required    | Description                                                                                                                                                                                                                            |
| ------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Yes         | Anthropic API key for Claude access                                                                                                                                                                                                    |
| `WORKFLOW_PAT`      | Conditional | Personal Access Token with `repo` scope for cross-repo access to fetch default prompts from ai-toolkit. **Required if not providing `custom_prompt` or `custom_prompt_path`.** Also used for resolving review threads via GraphQL API. |

> **Important:** The [Claude GitHub App](https://github.com/apps/claude) must be installed on your repository for these workflows to function. This is required by Anthropic's official Claude Code GitHub Action.
>
> **Note:** If you need assistance adding the `WORKFLOW_PAT` secret to your repository or installing the Claude GitHub App, please reach out to the **#pod-dev-ai** Slack channel.

**Configuration Inputs:**

| Input                | Required | Default                            | Description                                                                                                                    |
| -------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `pr_number`          | Yes      | -                                  | Pull request number to review                                                                                                  |
| `base_ref`           | Yes      | -                                  | Base branch name (e.g., main, master)                                                                                          |
| `force_review`       | No       | `false`                            | Force a full review even if the code hasn't changed (bypasses patch-ID cache)                                                  |
| `model`              | No       | `claude-sonnet-4-5-20250929`       | Claude model to use for review                                                                                                 |
| `max_turns`          | No       | unlimited                          | Maximum conversation turns for Claude                                                                                          |
| `custom_prompt`      | No       | `""`                               | Custom prompt text (overrides prompt file and default)                                                                         |
| `custom_prompt_path` | No       | `.claude/prompts/claude-pr-bot.md` | Path to custom prompt file in repository                                                                                       |
| `timeout_minutes`    | No       | `30`                               | Job timeout in minutes                                                                                                         |
| `allowed_tools`      | No       | `""`                               | Comma-separated list of allowed tools for Claude                                                                               |
| `toolkit_ref`        | No       | `main`                             | Git ref (branch, tag, or SHA) of ai-toolkit to use for the post-review script. Use `next` or a SHA to test unreleased changes. |

**Usage example:**

```yaml
uses: Uniswap/ai-toolkit/.github/workflows/_claude-code-review.yml@main
with:
  pr_number: ${{ github.event.pull_request.number }}
  base_ref: ${{ github.base_ref }}
  model: 'claude-sonnet-4-5-20250929'
  toolkit_ref: 'main' # or 'next' to test unreleased changes
secrets:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  WORKFLOW_PAT: ${{ secrets.WORKFLOW_PAT }} # Required for default prompt
```

**Prompt Configuration Options:**

The workflow determines which prompt to use in this priority order:

1. **`custom_prompt` input**: Explicit prompt text passed directly to the workflow
2. **`custom_prompt_path` input**: Path to a prompt file in the calling repository (default: `.claude/prompts/claude-pr-bot.md`)
3. **Default prompt from ai-toolkit**: Fetched from `Uniswap/ai-toolkit` repository (requires `WORKFLOW_PAT`)

If using option 1 or 2, the `WORKFLOW_PAT` secret is not required for prompt fetching (but may still be needed for thread resolution).

**Testing Unreleased Changes:**

Use the `toolkit_ref` input to test changes to the post-review script before merging:

```yaml
uses: Uniswap/ai-toolkit/.github/workflows/_claude-code-review.yml@main
with:
  pr_number: ${{ github.event.pull_request.number }}
  base_ref: ${{ github.base_ref }}
  toolkit_ref: 'next' # Use the 'next' branch version of post-review.ts
secrets:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  WORKFLOW_PAT: ${{ secrets.WORKFLOW_PAT }}
```

**Triggering a New Review Without Code Changes:**

The easiest way to trigger a fresh Claude review is to add a comment containing `@request-claude-review` to the PR. This works with both regular PR comments and inline review comments.

> **Note:** Re-requesting a review from `github-actions[bot]` via the GitHub UI does **NOT** work. GitHub does not fire the `review_requested` event when re-requesting reviews from bot accounts. Use the comment trigger or manual workflow_dispatch instead.

**When to trigger a new review:**

- After addressing review comments without pushing new code
- After infrastructure changes (e.g., updated prompts, new model)
- When a previous review timed out or encountered errors
- When you want a fresh perspective on unchanged code

**Option 1: Comment Trigger (Easiest)**

Simply add a comment to the PR containing `@request-claude-review`:

```text
@request-claude-review
```

This triggers a fresh review, bypassing the cache. Works in:

- Regular PR comments
- Inline review comments (comments on specific lines of code)

**Option 2: Manual Trigger via workflow_dispatch**

**Via GitHub CLI:**

```bash
# Trigger a forced review for PR #123
gh workflow run "Claude Code Review" -f pr_number=123

# Trigger without forcing (will respect cache)
gh workflow run "Claude Code Review" -f pr_number=123 -f force_review=false
```

**Via GitHub UI:**

1. Navigate to Actions → Claude Code Review
2. Click "Run workflow"
3. Enter the PR number
4. Optionally toggle `force_review` (defaults to `true`)
5. Click "Run workflow"

When `force_review` is `true`, the workflow bypasses the patch-ID cache and runs a complete review even if the same code was previously reviewed.

### PR Metadata Generation (`_generate-pr-metadata.yml`)

This workflow generates PR titles and descriptions using Claude AI with the following features:

**Content Preservation with Markers:**

The workflow wraps generated descriptions in HTML comment markers to enable selective updates:

```html
<!-- claude-pr-description-start -->
... AI-generated content ...
<!-- claude-pr-description-end -->
```

**First run behavior:**

- If the PR already has a description (no markers yet), the existing content is preserved above the markers
- The AI-generated content is **appended** below the existing description, wrapped in markers
- This ensures existing PR descriptions are never lost

**Subsequent runs:**

- Content **before** `<!-- claude-pr-description-start -->` is preserved (user's prefix)
- Content **after** `<!-- claude-pr-description-end -->` is preserved (user's suffix)
- Only the content between markers is replaced with new AI-generated content

This allows users to add custom notes, disclaimers, or additional context that survives regeneration.

**Example PR body with user additions:**

```markdown
> **Note:** This PR requires manual QA testing before merge.

<!-- claude-pr-description-start -->
---
## :sparkles: Claude-Generated Content

## Summary

- Added new authentication flow
- Updated user session handling
<!-- claude-pr-description-end -->

**Related Issues:** #123, #456
```

**Generation Mode:**

The `generation_mode` input is a comma-separated list that controls what the workflow generates. Combine values as needed.

| Value              | Description                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| `title`            | Generate and set the PR title (overwrites existing)                                |
| `description`      | Generate the PR description                                                        |
| `title-suggestion` | Include a suggested title in the description (non-intrusive, doesn't modify title) |
| `deferred-title`   | Only generate title if existing is inadequate (doesn't follow conventions)         |

**Common Combinations:**

| Combination                    | Description                                               | Default |
| ------------------------------ | --------------------------------------------------------- | ------- |
| `description`                  | Only generate description, leave title alone              | Yes     |
| `title,description`            | Generate both title and description                       | No      |
| `description,title-suggestion` | Generate description with suggested title for manual copy | No      |
| `deferred-title,description`   | Generate description; only update title if inadequate     | No      |

**Notes:**

- `title` and `deferred-title` are mutually exclusive
- `title` and `title-suggestion` are mutually exclusive
- `title-suggestion` requires `description` to be included (the suggestion is embedded in the description)

**Note on `deferred-title`:** In this mode, Claude evaluates the existing PR title against conventional commit patterns and repository history. If the existing title is acceptable (follows conventions, has appropriate type/scope, accurately describes the changes), Claude will preserve it and only generate the description. This is useful when users have already entered a meaningful title that shouldn't be overwritten.

**Required Secrets:**

| Secret              | Required    | Description                                                                                                                                                                    |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ANTHROPIC_API_KEY` | Yes         | Anthropic API key for Claude access                                                                                                                                            |
| `WORKFLOW_PAT`      | Conditional | Personal Access Token with `repo` scope for cross-repo access to fetch default prompts from ai-toolkit. **Required if not providing `custom_prompt` or `custom_prompt_path`.** |

> **Important:** The [Claude GitHub App](https://github.com/apps/claude) must be installed on your repository for these workflows to function. This is required by Anthropic's official Claude Code GitHub Action.
>
> **Note:** If you need assistance adding the `WORKFLOW_PAT` secret to your repository or installing the Claude GitHub App, please reach out to the **#pod-dev-ai** Slack channel.

**Usage examples:**

```yaml
# Generate description with suggested title (non-intrusive)
uses: Uniswap/ai-toolkit/.github/workflows/_generate-pr-metadata.yml@main
with:
  pr_number: ${{ github.event.pull_request.number }}
  base_ref: ${{ github.base_ref }}
  generation_mode: 'description,title-suggestion'
secrets:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  WORKFLOW_PAT: ${{ secrets.WORKFLOW_PAT }} # Required for default prompt
```

```yaml
# Generate both title and description
uses: Uniswap/ai-toolkit/.github/workflows/_generate-pr-metadata.yml@main
with:
  pr_number: ${{ github.event.pull_request.number }}
  base_ref: ${{ github.base_ref }}
  generation_mode: 'title,description'
secrets:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  WORKFLOW_PAT: ${{ secrets.WORKFLOW_PAT }}
```

**Prompt Configuration Options:**

The workflow determines which prompt to use in this priority order:

1. **`custom_prompt` input**: Explicit prompt text passed directly to the workflow
2. **`custom_prompt_path` input**: Path to a prompt file in the calling repository (default: `.github/prompts/generate-pr-title-description.md`)
3. **Default prompt from ai-toolkit**: Fetched from `Uniswap/ai-toolkit` repository (requires `WORKFLOW_PAT`)

If using option 1 or 2, the `WORKFLOW_PAT` secret is not required.

### Autonomous Task Processing (`_claude-task-worker.yml`)

This workflow processes Linear issues autonomously using Claude Code. It's called by `claude-auto-tasks.yml` for each task in the matrix.

**Key Features:**

| Feature                      | Description                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| **7-Phase Workflow**         | Claude follows a structured approach: Understand → Explore → Plan → Implement → QA → Commit → Create PR  |
| **Autonomous Execution**     | Uses `--dangerously-skip-permissions` to run without permission prompts (safe in GitHub Actions sandbox) |
| **Turn Budget Management**   | Prompt includes explicit turn budgets per phase to prevent over-exploration and ensure PR creation       |
| **Fallback PR Creation**     | If Claude makes commits but fails to create a PR, workflow automatically creates a fallback PR           |
| **Debug Mode**               | Full Claude output shown by default (`debug_mode: true`) to understand reasoning                         |
| **Configurable PR Type**     | Choose between draft or published PRs via `pr_type` input (default: "draft")                             |
| **Task Complexity Warnings** | Warns about tasks containing keywords like "audit", "review", "investigate"                              |
| **Incremental Commits**      | Prompt instructs Claude to commit and push after each major piece of work to preserve progress           |
| **Linear Integration**       | Updates Linear issue status to "In Progress" when PR is created                                          |

**Turn Budget (built into prompt):**

| Phase              | Turns   | Purpose                                          |
| ------------------ | ------- | ------------------------------------------------ |
| Understand/Explore | 1-30    | Read CLAUDE.md, explore codebase, identify files |
| Plan/Implement     | 31-100  | Design approach and implement the solution       |
| QA/Fix             | 101-130 | Run checks, fix critical issues                  |
| **Commit/PR**      | 131-150 | **RESERVED** - Must commit and create PR         |

**Configuration:**

| Input             | Default                    | Description                                  |
| ----------------- | -------------------------- | -------------------------------------------- |
| `model`           | `claude-opus-4-5-20251101` | Claude model to use                          |
| `max_turns`       | `150`                      | Maximum conversation turns                   |
| `debug_mode`      | `true`                     | Show full Claude output                      |
| `timeout_minutes` | `60`                       | Job timeout                                  |
| `pr_type`         | `draft`                    | Type of PR to create: "draft" or "published" |

**Validation Behavior:**

The workflow validates that Claude completed the task:

1. **No commits + No PR**: Job fails with "Task may be too complex, unclear, or require human judgment"
2. **Commits + No PR**: Fallback PR is automatically created to preserve work, job succeeds with warning
3. **Commits + PR**: Job succeeds, Linear updated to "In Progress"

**Job Summary Output:**

The job summary includes:

- Task title and Linear issue link
- Branch name and model used
- PR type (draft or published)
- Commit count
- PR creation status (✅ Claude PR / ⚠️ Fallback PR / ❌ No PR)
- Failure reason (if applicable)
- Linear status update

**Usage example:**

```yaml
uses: ./.github/workflows/_claude-task-worker.yml
with:
  issue_id: ${{ matrix.issue_id }}
  issue_identifier: ${{ matrix.issue_identifier }}
  issue_title: ${{ matrix.issue_title }}
  issue_description: ${{ matrix.issue_description }}
  issue_url: ${{ matrix.issue_url }}
  branch_name: ${{ matrix.branch_name }}
  target_branch: 'next'
  model: 'claude-opus-4-5-20251101'
  debug_mode: true
  pr_type: 'draft' # or 'published' for non-draft PRs
secrets:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
  NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
```

### GitHub Actions Version Updater (`_update-action-versions-worker.yml`)

This workflow uses Claude Code to automatically update GitHub Actions to their latest versions. It runs weekly and creates PRs with version updates.

**Schedule:**

- **Frequency**: Every Monday at 5:00 AM Eastern Time (10:00 AM UTC)
- **Cron**: `0 10 * * 1`

**How It Works:**

1. Consumer workflow (`update-action-versions.yml`) creates an update branch
2. Calls the reusable worker (`_update-action-versions-worker.yml`)
3. Claude Code scans all workflow files for external actions pinned to SHAs
4. Queries GitHub API for latest releases and their commit SHAs
5. Updates outdated actions and creates a PR with a summary table

**Key Features:**

| Feature                      | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| **SHA Pinning Maintained**   | Updates SHA references while preserving security best practices |
| **Version Comments Updated** | Updates both the SHA and the version comment (e.g., `# v4.2.0`) |
| **All Versions Updated**     | Updates to latest regardless of major/minor/patch               |
| **Comprehensive PR**         | Creates PR with table showing all updates and changelog links   |
| **Dry Run Mode**             | Can analyze without making changes                              |
| **Fallback PR**              | Creates fallback PR if Claude commits but doesn't create PR     |

**Configuration:**

| Input             | Default                      | Description                    |
| ----------------- | ---------------------------- | ------------------------------ |
| `branch_name`     | required                     | Branch to work on              |
| `target_branch`   | `main`                       | Base branch for PR             |
| `dry_run`         | `false`                      | Analyze only, skip PR creation |
| `model`           | `claude-sonnet-4-5-20250929` | Claude model to use            |
| `timeout_minutes` | `30`                         | Maximum execution time         |
| `debug_mode`      | `true`                       | Show full Claude output        |

**Example Transformation:**

Before:

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

After (if v4.2.3 is latest):

```yaml
- uses: actions/checkout@eef61447b9ff4aafe5dcd4e0bbf5d482be7e7871 # v4.2.3
```

**Manual Trigger:**

```bash
# Run with defaults
gh workflow run update-action-versions.yml

# Dry run (analysis only)
gh workflow run update-action-versions.yml -f dry_run=true

# Use Opus model
gh workflow run update-action-versions.yml -f model=claude-opus-4-5-20251101
```

**Usage example (calling from another repo):**

```yaml
uses: Uniswap/ai-toolkit/.github/workflows/_update-action-versions-worker.yml@main
with:
  branch_name: 'chore/update-action-versions-2024-01-15'
  target_branch: 'main'
secrets:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Shared Internal Workflows

These workflows are prefixed with two `__` and are only used within this repository:

- `publish-packages.yml` - **Unified package publishing workflow** (not a reusable workflow)
  - **Why unified?** npm OIDC trusted publishing validates the `workflow_ref` claim in the OIDC token, which contains the original trigger workflow (not the reusable workflow). This constraint requires all publishing to happen in a single workflow file that npm trusts.
  - **Two modes of operation:**
    - **Auto mode** (push to main/next): Detects affected packages via Nx, publishes with conventional/prerelease versioning, generates changelogs, sends Slack notifications
    - **Force mode** (manual workflow_dispatch): Publishes user-specified packages with prerelease versioning, useful for new packages or failed releases
  - Handles atomic versioning, npm publish with OIDC, git commit/tag push, and GitHub release creation
  - **Lockfile sync**: Automatically updates `package-lock.json` when package versions are bumped to keep workspace dependencies in sync

### Consumer Workflows

- `ci-pr-checks.yml` - Main PR validation pipeline
- `ci-check-pr-title.yml` - PR title format validation
- `claude-auto-tasks.yml` - Autonomous task processing from Linear (scheduled)
- `claude-code.yml` - Enables @claude mentions
- `claude-code-review.yml` - Automated code reviews
- `claude-welcome.yml` - New PR welcomes
- `generate-pr-title-description.yml` - Auto-generated PR titles and descriptions
- `release-update-production.yml` - Production sync automation
- `update-action-versions.yml` - Automated GitHub Actions version updates (scheduled)

## Subdirectories

- `examples/` - Example implementations of workflows (13 numbered files)

## Conventions

### Naming

- **External reusable workflows**: Prefix with `_` (underscore) - may be called from other repos
- **Internal shared workflows**: Prefix with `__` (double underscore prefix)
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

- `ANTHROPIC_API_KEY` - Claude AI API authentication (also requires the [Claude GitHub App](https://github.com/apps/claude) to be installed on the repository)
- `NODE_AUTH_TOKEN` - NPM registry authentication (for publishing and installing `@uniswap` scoped packages)
- `WORKFLOW_PAT` - Personal Access Token with `repo` scope for: (1) pushing commits/tags in force-publish, (2) cross-repo access to fetch default prompts from ai-toolkit in `_claude-code-review.yml` and `_generate-pr-metadata.yml`, (3) resolving review threads via GraphQL API in `_claude-code-review.yml` (the default `GITHUB_TOKEN` lacks permissions for the `resolveReviewThread` mutation). **Important:** The account that owns the PAT must have write, maintain, or admin access to the repository for thread resolution to work.
- `SERVICE_ACCOUNT_GPG_PRIVATE_KEY` - GPG key for signed commits/tags
- `LINEAR_API_KEY` - Linear API authentication (for autonomous tasks)
- `SLACK_WEBHOOK_URL` - Slack notifications
- `GITHUB_TOKEN` - Built-in token (automatic)

## Usage Patterns

### Calling Reusable Workflows

External reusable workflows (prefixed with `_`):

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

**Note**: `publish-packages.yml` is NOT a reusable workflow. It's a unified workflow triggered directly by push events and workflow_dispatch. See [Architecture: Publish Workflow](#architecture-publish-workflow) for details.

### Triggering Workflows

- **On PR**: `ci-pr-checks.yml`, `claude-welcome.yml`, `ci-check-pr-title.yml`, `generate-pr-title-description.yml`
- **On Push to main/next**: `publish-packages.yml` (auto mode)
- **On Issue Comment**: `claude-code.yml` (when @claude mentioned)
- **Manual Dispatch**: `release-update-production.yml`, `claude-code-review.yml`, `publish-packages.yml` (force mode)

### Force Publishing Packages

Use `publish-packages.yml` with `workflow_dispatch` to manually publish packages when:

- New packages haven't had code changes detected by Nx release
- A previous release partially failed
- You need to republish a specific package

```bash
# Publish a single package
gh workflow run publish-packages.yml \
  -f packages="@uniswap/ai-toolkit-nx-claude"

# Publish multiple packages
gh workflow run publish-packages.yml \
  -f packages="@uniswap/ai-toolkit-nx-claude,@ai-toolkit/utils"

# Publish all release-configured packages
gh workflow run publish-packages.yml \
  -f packages="all"

# Dry run (no actual publish)
gh workflow run publish-packages.yml \
  -f packages="all" \
  -f dryRun="true"
```

**Note**: Force publishing only runs on the `next` branch and publishes with the `next` npm tag using prerelease versioning.

- **On Schedule**: `claude-auto-tasks.yml` (daily at 5am EST), `update-action-versions.yml` (weekly on Mondays at 5am ET)
- **Manual Dispatch**: `release-update-production.yml`, `claude-code-review.yml`, `claude-auto-tasks.yml`, `update-action-versions.yml`

## Architecture: Publish Workflow

The publishing functionality is consolidated into a single unified workflow due to npm OIDC trusted publishing constraints:

```text
┌───────────────────────────────────────────────────────────────────┐
│                    publish-packages.yml                         │
│                                                                   │
│  Triggers:                                                        │
│  ├── push (main/next) ──► Auto Mode                              │
│  └── workflow_dispatch ──► Force Mode                            │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Jobs:                                                            │
│                                                                   │
│  1. detect                                                        │
│     ├── Auto: Detect affected packages via Nx                    │
│     └── Force: Resolve user-specified packages                   │
│                                                                   │
│  2. publish                                                       │
│     ├── Build packages                                           │
│     ├── Version (smart stable or smart prerelease)               │
│     ├── Publish to npm (OIDC authentication)                     │
│     ├── Push commits + tags                                      │
│     └── Create GitHub releases                                   │
│                                                                   │
│  3. generate-changelog (Auto mode only)                          │
│     └── AI-generated release notes                               │
│                                                                   │
│  4. notify-release (Auto mode only)                              │
│     └── Slack notifications                                      │
│                                                                   │
│  5. sync-next (Auto mode, main branch only)                      │
│     └── Sync main → next branch                                  │
│                                                                   │
│  6. summary (Force mode only)                                    │
│     └── Publish summary                                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Why a Unified Workflow?

npm OIDC trusted publishing validates the `workflow_ref` claim in the OIDC token. When a reusable workflow is called:

- `workflow_ref` = the **caller** workflow (e.g., `ci-publish-packages.yml`)
- `job_workflow_ref` = the **reusable** workflow (e.g., `publish-packages.yml`)

npm validates against `workflow_ref`, not `job_workflow_ref`. This means the caller workflow must be configured as a trusted workflow in npm, not the reusable workflow. To avoid configuring multiple workflows in npm, all publishing logic is consolidated into a single workflow file.

### workflow_dispatch Inputs (Force Mode)

| Input      | Type    | Description                                                  |
| ---------- | ------- | ------------------------------------------------------------ |
| `packages` | string  | Comma-separated npm package names, or "all" for all packages |
| `dryRun`   | boolean | Simulate without publishing (default: false)                 |

**Note**: Force mode only works on the `next` branch and always uses prerelease versioning with the `next` npm tag.

### Smart Prerelease Versioning Algorithm

When `version_strategy` is set to `prerelease`, the workflow uses a **smart versioning algorithm** that ensures `next` versions are always properly aligned with `latest` versions. This prevents version misalignment issues (e.g., `latest=0.5.0` but `next=0.3.0-next.5`).

**Algorithm (Option A: base = latest + patch bump):**

1. **Get `latest` from npm**: Query npm for the package's `latest` dist-tag version. Default to `0.0.0` if the package hasn't been published yet.

2. **Calculate base version**: Bump the patch version by 1. For example:

   - `latest = 0.5.0` → `base = 0.5.1`
   - `latest = 1.2.3` → `base = 1.2.4`
   - Not published → `base = 0.0.1`

3. **Find highest existing prerelease on npm**: Query npm for all versions matching `{base}-{preid}.*` pattern and find the highest prerelease number.

4. **Find highest existing prerelease in git tags**: Search git tags for `{package}@{base}-{preid}.*` and find the highest prerelease number.

5. **Calculate new version**: `MAX(npm_prerelease, git_prerelease) + 1`

**Example:**

```text
Package: @uniswap/my-package
Latest on npm: 0.5.0
Existing next versions: 0.5.1-next.0, 0.5.1-next.1, 0.5.1-next.2
Git tags: @uniswap/my-package@0.5.1-next.0, @uniswap/my-package@0.5.1-next.1

Result: 0.5.1-next.3
```

**Why this approach?**

- **Prevents misalignment**: `next` versions always build on top of `latest`, never behind it
- **Handles orphaned versions**: Considers both npm and git tags to avoid version conflicts
- **Resilient to failures**: Even if a publish fails partway, the next attempt will calculate the correct version
- **Semver compliant**: Follows semantic versioning rules for prereleases

### Smart Stable Versioning Algorithm

When `version_strategy` is set to `conventional` (main branch), the workflow uses a **smart stable versioning algorithm** that handles edge cases like prerelease versions being incorrectly published to the `latest` tag.

**Algorithm:**

1. **Get `latest` from npm**: Query npm for the package's `latest` dist-tag version. If not published, start at `0.0.1`.

2. **Strip prerelease suffix**: If the latest version has a prerelease suffix (e.g., `0.0.2-next.5`), strip it to get the base version (`0.0.2`).

3. **Check if base version exists**: If the latest was a prerelease, check if the base version already exists on npm or as a git tag.

4. **Graduate or bump**:
   - If base version doesn't exist → use it (the prerelease "graduates" to stable)
   - If base version exists → find highest stable patch on npm/git and bump by 1

**Example 1 - Graduating from prerelease:**

```text
Package: @uniswap/my-package
Latest on npm: 0.0.2-next.5 (incorrectly published)
Base version 0.0.2 exists on npm: NO

Result: 0.0.2 (graduates from prerelease)
```

**Example 2 - Normal patch bump:**

```text
Package: @uniswap/my-package
Latest on npm: 0.5.18
Highest stable patch: 0.5.18

Result: 0.5.19
```

**Why this approach?**

- **Handles recovery**: If prerelease versions were incorrectly published to `latest`, the algorithm recovers by graduating to the correct stable version
- **Consistent with prerelease algorithm**: Uses the same npm/git checking strategy
- **No Nx release dependency**: Doesn't rely on `nx release version` which can misinterpret prerelease versions

## Development Guidelines

### Script Separation Policy (CRITICAL)

Complex bash scripting (50+ lines, API calls, etc.) MUST be extracted to `.github/scripts/`:

❌ **BAD**: 200 lines of inline bash in YAML
✅ **GOOD**: Call standalone script: `./.github/scripts/my-script.sh`

For reusable tools, publish as npm packages (e.g., `@uniswap/ai-toolkit-notion-publisher`).

### Action Pinning (CRITICAL)

Always pin external actions to **specific commit hashes** with version comments:

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4
```

Never use tags or branch names directly.

### Reusable Workflow Permissions (CRITICAL)

When calling reusable workflows via `uses:`, permissions defined in the reusable workflow's job are **NOT automatically inherited**. The **caller workflow** must explicitly define all required permissions.

**This is especially critical for npm OIDC trusted publishing**, which requires `id-token: write`:

```yaml
jobs:
  publish:
    name: Publish packages
    permissions:
      id-token: write # Required for npm OIDC trusted publishing
      contents: write
      packages: write
      pull-requests: write
      issues: write
    uses: ./.github/workflows/_some-reusable-workflow.yml
    with:
      # ... inputs
```

Without `id-token: write` in the caller, npm publish will fail with:

```text
403 Forbidden - You may not perform that action with these credentials.
```

**Note**: `publish-packages.yml` is NOT a reusable workflow—it defines its own permissions directly. This is intentional due to npm OIDC constraints (see [Architecture: Publish Workflow](#architecture-publish-workflow)).

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
- See workflows prefixed with `__` for internal reusable workflows
- See `.github/prompts/` for Claude AI prompt templates
- See root `CLAUDE.md` for project-level documentation

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory or subdirectories, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
