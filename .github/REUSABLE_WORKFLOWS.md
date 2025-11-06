# Reusable Changelog & Notification Workflows

This repository provides two reusable GitHub Actions workflows for generating AI-powered changelogs and sending notifications to multiple destinations (Slack, Notion).

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Workflows Reference](#workflows-reference)
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

### TypeScript Script Architecture

The notification workflows leverage a TypeScript script (`.github/scripts/notion-publish.ts`) for Notion integration instead of bash scripts. This approach provides:

- **Type Safety**: Full TypeScript type checking for API interactions
- **Better Error Handling**: Structured error handling with detailed error messages
- **Direct Execution**: Uses `tsx` for direct TypeScript execution without build steps
- **Maintainability**: Easier to test, debug, and maintain than shell scripts

### Community-First Development Principle

**CRITICAL PRINCIPLE**: All scripts and tooling prioritize community-maintained libraries over custom implementations.

**Why This Matters**:

- Battle-tested reliability (millions of weekly downloads)
- Active maintenance and security patches
- Comprehensive documentation and community support
- Reduced technical debt and maintenance burden

**Example - Argument Parsing**:
Instead of custom argument parsing logic, the script uses **minimist** (~62.5M weekly downloads):

```typescript
import minimist from 'minimist';

const args = minimist(process.argv.slice(2), {
  string: [
    'api-key',
    'database-id',
    'title',
    'content',
    'from-ref',
    'to-ref',
    'branch',
    'npm-tag',
  ],
  alias: {
    'api-key': 'apiKey',
    'database-id': 'databaseId',
    'from-ref': 'fromRef',
    'to-ref': 'toRef',
    'npm-tag': 'npmTag',
  },
});
```

**Benefits**:

- Handles edge cases (quoted arguments, spaces, special characters)
- Supports aliases for kebab-case → camelCase conversion
- Well-documented and widely used across the ecosystem
- ~50 lines of custom code eliminated

### Dependencies

The Notion publishing script relies on these community-maintained libraries:

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

#### Script Features

The `notion-publish.ts` script provides:

- **Flag-Based Arguments**: Clean CLI interface with kebab-case flags
- **Structured Logging**: Color-coded output for info/error messages
- **Error Context**: Detailed error messages with API response bodies
- **Metadata Support**: Automatically adds commit range, branch, and npm tag properties
- **Exit Codes**: Proper exit codes for CI/CD integration (0 = success, 1 = failure)

#### TypeScript Configuration

The scripts directory has its own TypeScript configuration (`.github/scripts/tsconfig.json`) with settings optimized for Node.js execution:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "strict": true,
    "resolveJsonModule": true,
    "declaration": false,
    "outDir": "../../dist/.github/scripts"
  }
}
```

**Key Settings**:

- **skipLibCheck**: Required for handling type incompatibilities between third-party libraries
- **Node16 module system**: Ensures proper ESM/CommonJS interop
- **Strict mode**: Enforces type safety throughout the script

#### Type Handling for Third-Party Libraries

The script handles a known type incompatibility between `@tryfabric/martian` and `@notionhq/client` using a **JSON serialization approach**:

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
3. **Type Safety**: Use TypeScript for all new scripts
   - Avoid `as any` type assertions
   - Prefer structural solutions for type incompatibilities
   - Document why type handling is necessary
4. **Dependencies**: Keep dependencies minimal but don't reinvent the wheel

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
- **NPM Tag** (Rich Text) - Package tag
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
