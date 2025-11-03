# Reusable Workflows Documentation

This document provides comprehensive documentation for the reusable GitHub Actions workflows available in this repository. These workflows can be used by any repository in the organization to generate AI-powered changelogs and send notifications to multiple destinations.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Workflows](#workflows)
  - [Generate Changelog (`_generate-changelog.yml`)](#generate-changelog-_generate-changelogyml)
  - [Notify Release (`_notify-release.yml`)](#notify-release-_notify-releaseyml)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

These reusable workflows provide:

1. **AI-Powered Changelog Generation**: Generate human-readable changelogs from git commit ranges using Anthropic's Claude API
2. **Multi-Format Output**: Support for Slack mrkdwn and standard markdown formats
3. **Flexible Git References**: Support for any git reference type (SHA, tag, branch)
4. **Multiple Notification Destinations**: Route notifications to Slack, Notion, or both
5. **Customizable Prompts**: Bring your own prompts for domain-specific changelog formatting

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

---

## Workflows

### Generate Changelog (`_generate-changelog.yml`)

Generates AI-powered changelogs from git commit ranges with support for multiple output formats.

#### Reference

```yaml
uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@main
```

#### Inputs

| Input                | Type   | Required | Default      | Description                                                          |
| -------------------- | ------ | -------- | ------------ | -------------------------------------------------------------------- |
| `from_ref`           | string | ✅ Yes   | -            | Starting git reference (SHA, tag, or branch)                         |
| `to_ref`             | string | ✅ Yes   | -            | Ending git reference (SHA, tag, or branch)                           |
| `output_formats`     | string | ❌ No    | `"markdown"` | Comma-separated list: `"slack"`, `"markdown"`, or `"slack,markdown"` |
| `custom_prompt_file` | string | ❌ No    | -            | Path to custom prompt file (relative to repo root)                   |
| `custom_prompt_text` | string | ❌ No    | -            | Inline custom prompt text (overrides `custom_prompt_file`)           |
| `max_tokens`         | number | ❌ No    | `2048`       | Maximum tokens for AI response (1024-4096)                           |

#### Outputs

| Output               | Type   | Description                                                                      |
| -------------------- | ------ | -------------------------------------------------------------------------------- |
| `changelog_slack`    | string | Slack mrkdwn formatted changelog (only if `"slack"` in `output_formats`)         |
| `changelog_markdown` | string | Standard markdown formatted changelog (only if `"markdown"` in `output_formats`) |
| `generation_method`  | string | Method used: `"ai"` (success) or `"fallback"` (commit list)                      |

#### Secrets

| Secret              | Required | Description                     |
| ------------------- | -------- | ------------------------------- |
| `ANTHROPIC_API_KEY` | ✅ Yes   | Anthropic API key for Claude AI |

#### Features

- **Flexible Git References**: Accepts any combination of SHA, tag, or branch references
- **Multi-Format Generation**: Generate Slack and/or markdown formats in a single AI call
- **Custom Prompts**: Provide your own prompts via file or inline text
- **Automatic Fallback**: Falls back to commit list if AI generation fails
- **Format-Specific Instructions**: Automatically appends format requirements to your custom prompt

#### Example Usage

<details>
<summary>Basic Usage - Markdown Only</summary>

```yaml
jobs:
  generate-changelog:
    uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: v1.0.0
      to_ref: v1.1.0
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

</details>

<details>
<summary>Multi-Format with Custom Prompt</summary>

```yaml
jobs:
  generate-changelog:
    uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: ${{ github.event.before }}
      to_ref: ${{ github.sha }}
      output_formats: 'slack,markdown'
      custom_prompt_file: '.github/prompts/release-changelog.md'
      max_tokens: 1024
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

</details>

<details>
<summary>SHA to SHA with Inline Prompt</summary>

```yaml
jobs:
  generate-changelog:
    uses: your-org/your-repo/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: abc123def
      to_ref: def456abc
      output_formats: 'markdown'
      custom_prompt_text: |
        Create a changelog focusing on:
        - Breaking changes (highlight prominently)
        - New features
        - Bug fixes
        Group by impact level.
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

</details>

---

### Notify Release (`_notify-release.yml`)

Routes release notifications to multiple destinations (Slack, Notion, or both) with pre-generated changelogs.

#### Reference

```yaml
uses: your-org/your-repo/.github/workflows/_notify-release.yml@main
```

#### Inputs

| Input                | Type   | Required | Default | Description                                                              |
| -------------------- | ------ | -------- | ------- | ------------------------------------------------------------------------ |
| `changelog_slack`    | string | ❌ No    | -       | Pre-generated Slack-formatted changelog                                  |
| `changelog_markdown` | string | ❌ No    | -       | Pre-generated markdown changelog                                         |
| `destinations`       | string | ✅ Yes   | -       | Comma-separated destinations: `"slack"`, `"notion"`, or `"slack,notion"` |
| `from_ref`           | string | ✅ Yes   | -       | Starting git reference (for display)                                     |
| `to_ref`             | string | ✅ Yes   | -       | Ending git reference (for display)                                       |
| `branch`             | string | ✅ Yes   | -       | Branch name that was released                                            |
| `npm_tag`            | string | ❌ No    | -       | NPM tag used for publishing                                              |
| `release_title`      | string | ❌ No    | -       | Custom title (default: generated from branch/refs)                       |

#### Outputs

This workflow does not have outputs (notifications are fire-and-forget).

#### Secrets

| Secret                             | Required                           | Description                |
| ---------------------------------- | ---------------------------------- | -------------------------- |
| `SLACK_WEBHOOK_URL`                | ✅ If `"slack"` in `destinations`  | Slack incoming webhook URL |
| `NOTION_API_KEY`     | ✅ If `"notion"` in `destinations` | Notion integration API key |
| `RELEASE_NOTES_NOTION_DATABASE_ID` | ✅ If `"notion"` in `destinations` | Target Notion database ID  |

#### Features

- **Destination Routing**: Send to Slack, Notion, or both based on configuration
- **Automatic Format Handling**: Converts markdown to Slack format if needed
- **Notion Database Integration**: Creates rich pages with metadata in Notion
- **Graceful Failures**: Notifications continue even if one destination fails
- **GitHub Actions Summary**: Provides detailed summary with links in workflow UI

#### Example Usage

<details>
<summary>Slack Only Notification</summary>

```yaml
jobs:
  notify:
    uses: your-org/your-repo/.github/workflows/_notify-release.yml@main
    with:
      changelog_slack: ${{ needs.generate-changelog.outputs.changelog_slack }}
      destinations: 'slack'
      from_ref: v1.0.0
      to_ref: v1.1.0
      branch: main
      npm_tag: latest
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

</details>

<details>
<summary>Both Slack and Notion</summary>

```yaml
jobs:
  notify:
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

</details>

<details>
<summary>Notion Only with Custom Title</summary>

```yaml
jobs:
  notify:
    uses: your-org/your-repo/.github/workflows/_notify-release.yml@main
    with:
      changelog_markdown: ${{ needs.generate-changelog.outputs.changelog_markdown }}
      destinations: 'notion'
      from_ref: v2.0.0
      to_ref: v2.1.0
      branch: main
      npm_tag: latest
      release_title: 'Production Release v2.1.0 - Major Update'
    secrets:
      NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
      RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.RELEASE_NOTES_NOTION_DATABASE_ID }}
```

</details>

---

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

---

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

---

## Best Practices

### 1. Custom Prompts

Create repository-specific prompt files for consistent changelog formatting:

```bash
.github/
  prompts/
    release-changelog.md      # Production releases
    weekly-digest.md          # Weekly summaries
    hotfix-changelog.md       # Emergency fixes
```

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

### 2. Output Format Selection

Choose the right format(s) for your needs:

- **Slack only** (`"slack"`): Real-time notifications, team updates
- **Markdown only** (`"markdown"`): Release notes, GitHub releases, Notion pages
- **Both** (`"slack,markdown"`): When you need notifications AND documentation

**Pro Tip**: Generate both formats in a single call for efficiency, even if you only need one immediately. The other can be saved for future use.

### 3. Token Limits

Adjust `max_tokens` based on changelog complexity:

- **1024**: Short, concise changelogs (< 10 commits)
- **2048**: Standard releases (10-50 commits) ← **Recommended default**
- **4096**: Large releases or detailed changelogs (50+ commits)

Higher token limits cost more and may take longer to generate.

### 4. Notion Database Schema

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

### 5. Error Handling

Both workflows use `continue-on-error: true` for non-critical steps:

- **Changelog Generation**: Falls back to commit list if AI fails
- **Slack Notifications**: Continues if webhook fails
- **Notion Publishing**: Continues if API call fails

Check workflow logs and GitHub Actions summary for detailed error information.

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

---

## Troubleshooting

### Common Issues

#### 1. "No changelog generated"

**Symptom**: Empty or missing changelog output

**Possible Causes:**

- Insufficient ANTHROPIC_API_KEY credits
- Invalid API key
- Network timeout
- Git reference doesn't exist

**Solutions:**

- Check API key validity at <https://console.anthropic.com>
- Verify git references exist: `git rev-parse <ref>`
- Check workflow logs for API errors
- Verify `from_ref` and `to_ref` are correct

#### 2. "Notion publishing failed"

**Symptom**: Notion page not created, error in logs

**Possible Causes:**

- Invalid NOTION_API_KEY
- Invalid RELEASE_NOTES_NOTION_DATABASE_ID
- Integration doesn't have database access
- Database schema mismatch

**Solutions:**

- Verify API key at <https://www.notion.so/my-integrations>
- Confirm database ID from URL
- Grant integration access to database (Share → Add Integration)
- Ensure database has "Name" property (title type)

#### 3. "Slack notification failed"

**Symptom**: No Slack message, error in logs

**Possible Causes:**

- Invalid SLACK_WEBHOOK_URL
- Webhook URL expired/revoked
- Channel deleted or archived

**Solutions:**

- Regenerate webhook URL at <https://api.slack.com/apps>
- Verify webhook URL format (should start with `https://hooks.slack.com`)
- Check Slack app configuration
- Test webhook with curl:

  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test"}' \
    YOUR_WEBHOOK_URL
  ```

#### 4. "Invalid git reference"

**Symptom**: `fatal: bad revision` error

**Possible Causes:**

- Reference doesn't exist
- Shallow clone (insufficient history)
- Reference not fetched

**Solutions:**

- Use `fetch-depth: 0` in checkout action
- Verify reference exists: `git rev-parse <ref>`
- For tags, ensure they're fetched: `git fetch --tags`

#### 5. "Format mismatch"

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

---

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
