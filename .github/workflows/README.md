# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the AI Toolkit monorepo. Workflows are categorized by their purpose and usage pattern.

## Workflow Categories

### 1. CI & Quality Assurance

Workflows that run automated checks on pull requests and commits.

| Workflow                                     | Trigger      | Purpose                                                                                      | Status                                                                                          |
| -------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`ci-pr-checks.yml`](./ci-pr-checks.yml)     | Pull Request | Validates installation, builds affected packages, runs linting, formatting checks, and tests | ![PR Checks](https://github.com/owner/repo/actions/workflows/ci-pr-checks.yml/badge.svg)        |
| [`claude-welcome.yml`](./claude-welcome.yml) | PR Opened    | Posts welcome message from Claude to newly opened PRs                                        | ![Claude Welcome](https://github.com/owner/repo/actions/workflows/claude-welcome.yml/badge.svg) |

**Key Features:**

- **ci-pr-checks.yml**:

  - Verifies `package-lock.json` is up to date
  - Runs affected Nx targets only (build, lint, format, test)
  - Runs tests with coverage in parallel
  - Uses Nx's affected commands for efficiency

- **claude-welcome.yml**:
  - Uses the reusable `_claude-welcome.yml` workflow
  - Customized welcome message for AI Toolkit development
  - Links to Claude package documentation
  - 3-month expiration period

---

### 2. Release & Deployment

Workflows that handle versioning, publishing, and production deployments.

| Workflow                                                           | Trigger                  | Purpose                                                                        | Status                                                                                                        |
| ------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| [`release-publish-packages.yml`](./release-publish-packages.yml)   | Push to `main` or `next` | Versions, builds, and publishes packages to NPM registry                       | ![Publish](https://github.com/owner/repo/actions/workflows/release-publish-packages.yml/badge.svg)            |
| [`release-update-production.yml`](./release-update-production.yml) | Manual dispatch          | Creates PR to sync `next` branch changes to `main` with AI-generated changelog | ![Update Production](https://github.com/owner/repo/actions/workflows/release-update-production.yml/badge.svg) |

**Key Features:**

- **publish-packages.yml**:

  - Automatic versioning based on conventional commits
  - Publishes to NPM with `latest` (main) or `next` (next branch) tags
  - Generates AI-powered changelogs
  - Sends Slack notifications
  - Syncs `next` branch with `main` after production releases

- **update-production.yml**:
  - Creates production PRs from `next` branch
  - Generates categorized changelogs using AI
  - Uses custom prompt for professional release notes
  - Adds reviewers and sends notifications

---

### 3. Reusable Workflows

Workflows designed to be called by other workflows using `workflow_call`. These provide modular, reusable functionality.

| Workflow                                               | Inputs                                                                                                                                   | Outputs                          | Purpose                                                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`_claude-main.yml`](./_claude-main.yml)               | `model`, `allowed_tools`, `custom_instructions`, `timeout_minutes`, `anthropic_api_key_secret_name`                                      | None                             | Enables Claude Code to respond to @claude mentions in issues, PRs, comments, and reviews             |
| [`_claude-welcome.yml`](./_claude-welcome.yml)         | `welcome_message`, `workflow_deployment_date`, `expiration_months`, `documentation_url`                                                  | None                             | Posts welcome message from Claude to newly opened pull requests                                      |
| [`_claude-code-review.yml`](./_claude-code-review.yml) | `pr_number`, `base_ref`, `model`, `max_turns`, `custom_prompt`, `custom_prompt_path`, `timeout_minutes`, `anthropic_api_key_secret_name` | None                             | Automated PR code reviews with formal GitHub review submission, inline comments, and auto-resolution |
| [`_generate-changelog.yml`](./_generate-changelog.yml) | `before_sha`, `after_sha`, `custom_prompt_file`, `custom_prompt_text`, `max_tokens`                                                      | `changelog`, `generation_method` | Generates AI-powered changelogs from git commit ranges using Anthropic's Claude API                  |
| [`_notify-release.yml`](./_notify-release.yml)         | `branch`, `npm_tag`, `before_sha`, `after_sha`, `changelog`                                                                              | None                             | Sends formatted Slack notifications about package releases                                           |

**Key Features:**

- **claude-main.yml**:

  - Interactive AI assistance via @claude mentions
  - Works in issue comments, PR comments, review comments, and reviews
  - Configurable models (Sonnet 4.6, Opus 4, Haiku 4.5)
  - Flexible tool permissions (read-only, read-write, or custom)
  - Custom instructions for repository-specific standards
  - Fixed security settings (Bullfrog scanning, immutable permissions)
  - Bot filtering to prevent loops
  - Concurrency control to prevent duplicate executions
  - Configurable timeout for cost management
  - CI integration (can read and help debug CI failures)

- **claude-welcome.yml**:

  - Posts welcome message to new PRs from Claude
  - Configurable expiration period (default 3 months)
  - Date format validation with helpful error messages
  - Duplicate message detection to prevent multiple welcomes
  - Optional repository-specific documentation link
  - Bullfrog security scanning integrated

- **claude-code-review.yml**:

  - Formal GitHub reviews (APPROVE/REQUEST_CHANGES/COMMENT) for merge protection
  - Inline comments on specific lines of code
  - Auto-resolution of comments when issues are fixed
  - Patch-ID based caching to skip rebases (no duplicate reviews)
  - Iterative reviews track previous comments
  - Custom prompts with automatic verdict injection
  - Merge queue filtering (skips gh-readonly-queue branches)
  - Supports model selection (Sonnet/Opus via labels)
  - Fixed security settings (Bullfrog scanning, immutable permissions)

- **generate-changelog.yml**:

  - Uses Claude Haiku 4.5 for intelligent changelog generation
  - Supports custom prompts via file or inline text
  - Automatic fallback to commit list if AI generation fails
  - Configurable token limits

- **notify-release.yml**:
  - Sends rich Slack notifications with formatted changelog
  - Supports Notion database integration via `@uniswap/ai-toolkit-notion-publisher` npm package
  - Different emoji and styling for production vs. next branch
  - Includes commit range, package list, and workflow run links
  - Uses community-maintained libraries (minimist, @notionhq/client, @tryfabric/martian)

**📚 For comprehensive documentation including implementation details, dependencies, and usage examples, see [REUSABLE_WORKFLOWS.md](../REUSABLE_WORKFLOWS.md)**

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CI/Quality Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ci-pr-checks.yml: Validates PRs (build, lint, test)       │
│  claude-welcome.yml: Welcome message for new PRs            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Release/Deploy Layer                      │
├─────────────────────────────────────────────────────────────┤
│  release-publish-packages.yml: NPM publishing (main/next)   │
│  release-update-production.yml: Sync next → main via PR     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Reusable Utilities                       │
├─────────────────────────────────────────────────────────────┤
│  _claude-main.yml: Interactive @claude mentions             │
│  _claude-welcome.yml: PR welcome messages                   │
│  _claude-code-review.yml: Automated PR code reviews         │
│  _generate-changelog.yml: AI changelog generation           │
│  _notify-release.yml: Slack notifications                   │
└─────────────────────────────────────────────────────────────┘
```

## Workflow Orchestration

### Publishing Flow (publish-packages.yml)

```
1. publish job
   └─> Versions and publishes packages to NPM
        ↓
2. generate-changelog job (calls reusable workflow)
   └─> Generates AI-powered changelog
        ↓
3. notify-release job (calls reusable workflow)
   └─> Sends Slack notification with changelog
        ↓
4. sync-next job (main branch only)
   └─> Rebases next branch onto main
```

### Production Update Flow (update-production.yml)

```
1. create-pr job
   └─> Creates PR from next to main
        ↓
2. generate-changelog job (calls reusable workflow)
   └─> Generates categorized changelog using custom prompt
        ↓
3. finalize-pr job
   └─> Updates PR body with changelog and adds reviewers
```

## Required Setup

### Claude GitHub App (Required for Claude-powered workflows)

The [Claude GitHub App](https://github.com/apps/claude) must be installed on your repository to use any Claude-powered workflows (`_claude-main.yml`, `_claude-welcome.yml`, `_claude-code-review.yml`, `_generate-changelog.yml`, `_generate-pr-metadata.yml`, `_claude-task-worker.yml`).

1. Go to: <https://github.com/apps/claude>
2. Click **Install**
3. Select your repository

> **Need help?** Open an issue at [GitHub Issues](https://github.com/Uniswap/ai-toolkit/issues)

### Required Secrets

| Secret                             | Used By                                     | Purpose                                             |
| ---------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `WORKFLOW_PAT`                     | publish-packages.yml, update-production.yml | Push commits/tags, create PRs (internal CI/CD only) |
| `ANTHROPIC_API_KEY`                | generate-changelog.yml                      | AI-powered changelog generation                     |
| `SLACK_WEBHOOK_URL`                | notify-release.yml                          | Send Slack release notifications                    |
| `NOTION_API_KEY`                   | notify-release.yml                          | Publish release notes to Notion (optional)          |
| `RELEASE_NOTES_NOTION_DATABASE_ID` | notify-release.yml                          | Notion database ID for release notes (optional)     |
| `NODE_AUTH_TOKEN`                  | publish-packages.yml                        | Publish to NPM registry                             |

> **Note:** External consumers of the reusable workflows (e.g., `_claude-code-review.yml`, `_generate-pr-metadata.yml`) do **not** need `WORKFLOW_PAT`. The ai-toolkit repository is public, so fetching default prompts requires no authentication.

## Usage Examples

### Calling a Reusable Workflow

```yaml
jobs:
  generate-changelog:
    uses: ./.github/workflows/_generate-changelog.yml
    with:
      before_sha: ${{ github.event.before }}
      after_sha: ${{ github.sha }}
      custom_prompt_file: '.github/prompts/my-prompt.md'
      max_tokens: 2048
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Triggering Manual Workflows

```bash
# Trigger update-production workflow
gh workflow run release-update-production.yml

# Trigger publish-packages in dry-run mode
gh workflow run release-publish-packages.yml -f dryRun=true
```

## Directory Structure

```
.github/
├── workflows/
│   ├── README.md (this file)
│   ├── ci-pr-checks.yml
│   ├── claude-welcome.yml
│   ├── release-publish-packages.yml
│   ├── release-update-production.yml
│   ├── _claude-main.yml
│   ├── _claude-welcome.yml
│   ├── _claude-code-review.yml
│   ├── _generate-changelog.yml
│   ├── _notify-release.yml
│   └── examples/
│       ├── 08-claude-code-review-basic.yml
│       ├── 09-claude-code-review-with-custom-prompt.yml
│       └── 10-claude-code-review-advanced.yml
└── prompts/
    ├── default-pr-review.md
    └── production-release-changelog.md
```

**Note on Flat Structure**: GitHub Actions [does not support subdirectories](https://github.com/orgs/community/discussions/15935) within `.github/workflows/`. All workflow files must be in the root of the workflows directory. We use naming convention prefixes (`ci-`, `release-`, `_`) to categorize workflows instead of subdirectories.

## Naming Conventions

Due to GitHub Actions' flat directory requirement, we use naming prefixes to categorize workflows:

- **CI workflows**: Prefixed with `ci-` (e.g., `ci-pr-checks.yml`)

  - For workflows that validate code quality, run tests, and perform checks on pull requests

- **Release workflows**: Prefixed with `release-` (e.g., `release-publish-packages.yml`, `release-update-production.yml`)

  - For workflows that handle versioning, publishing, and deployment operations

- **Reusable workflows**: Prefixed with `_` (underscore) (e.g., `_generate-changelog.yml`, `_notify-release.yml`)
  - For workflows designed to be called by other workflows using `workflow_call`

### Benefits of Prefix Convention

- **Alphabetical Grouping**: Workflows with the same prefix appear together in file listings
- **Visual Categorization**: Prefix immediately indicates the workflow's purpose
- **Reusable Identification**: The `_` prefix makes reusable workflows sort to the top and clearly distinguishes them from triggered workflows
- **GitHub Actions Compatible**: Works within GitHub's flat directory structure requirement

## Best Practices

1. **Reusable Workflows**:

   - Use `workflow_call` trigger
   - Document all inputs/outputs clearly
   - Provide sensible defaults
   - Include fallback mechanisms

2. **Main Workflows**:

   - Use clear, descriptive job names
   - Add comprehensive documentation in headers
   - Use job outputs for data passing
   - Implement proper error handling

3. **Secrets Management**:

   - Never log secret values
   - Use secrets only where needed
   - Document required scopes/permissions
   - Use environment protection when appropriate

4. **Performance**:
   - Use Nx's affected commands
   - Cache dependencies when possible
   - Run jobs in parallel when independent
   - Use appropriate runner sizes

## Maintenance

When adding new workflows:

1. Add entry to appropriate category in this README
2. Update architecture diagram if needed
3. Document all required secrets
4. Add usage examples
5. Consider if it should be reusable

When modifying workflows:

1. Update this README to reflect changes
2. Update workflow documentation headers
3. Test thoroughly in a feature branch
4. Update dependent workflows if needed
