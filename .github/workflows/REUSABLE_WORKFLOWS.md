# Reusable Changelog & Notification Workflows

This repository provides two reusable GitHub Actions workflows for generating AI-powered changelogs and sending notifications to multiple destinations (Slack, Notion).

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Workflows Reference](#workflows-reference)
  - [_generate-changelog.yml](#_generate-changelogyml)
  - [_notify-release.yml](#_notify-releaseyml)
- [Real-World Examples](#real-world-examples)
- [Custom Prompts](#custom-prompts)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

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

### _generate-changelog.yml

**Purpose**: Generate AI-powered changelogs from git commit ranges using Anthropic's Claude API.

#### Inputs

| Input                 | Required | Default      | Description                                                                     |
| --------------------- | -------- | ------------ | ------------------------------------------------------------------------------- |
| `from_ref`            | Yes      | -            | Starting git reference (SHA, tag, or branch name)                               |
| `to_ref`              | Yes      | -            | Ending git reference (SHA, tag, or branch name)                                 |
| `output_formats`      | No       | `'markdown'` | Comma-separated formats: `'slack'`, `'markdown'`, or `'slack,markdown'`         |
| `custom_prompt_file`  | No       | -            | Path to custom prompt file (relative to repo root)                              |
| `custom_prompt_text`  | No       | -            | Inline custom prompt (overrides `custom_prompt_file`)                           |
| `max_tokens`          | No       | `2048`       | Maximum tokens for AI response (1024=concise, 2048=detailed, 4096=comprehensive |

#### Outputs

| Output                | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `changelog_slack`     | Slack mrkdwn formatted changelog (only if `'slack'` in formats)   |
| `changelog_markdown`  | GitHub-flavored markdown changelog (only if `'markdown'` in formats) |
| `generation_method`   | Either `'ai'` (success) or `'fallback'` (commit list)             |

#### Secrets

| Secret              | Required | Description                       |
| ------------------- | -------- | --------------------------------- |
| `ANTHROPIC_API_KEY` | Yes      | API key from console.anthropic.com |

#### Example: Multiple Formats

```yaml
jobs:
  changelog:
    uses: uniswap/ai-toolkit/.github/workflows/_generate-changelog.yml@main
    with:
      from_ref: 'v1.0.0'
      to_ref: 'v1.1.0'
      output_formats: 'slack,markdown'  # Generate both formats in one call
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

### _notify-release.yml

**Purpose**: Send release notifications to Slack, Notion, or both with pre-generated changelogs.

#### Inputs

| Input                 | Required | Default | Description                                                |
| --------------------- | -------- | ------- | ---------------------------------------------------------- |
| `changelog_slack`     | No       | -       | Pre-generated Slack changelog (from _generate-changelog)   |
| `changelog_markdown`  | No       | -       | Pre-generated markdown changelog (from _generate-changelog) |
| `destinations`        | Yes      | -       | Comma-separated: `'slack'`, `'notion'`, or `'slack,notion'` |
| `from_ref`            | Yes      | -       | Starting git reference (for display in notifications)      |
| `to_ref`              | Yes      | -       | Ending git reference (for display in notifications)        |
| `branch`              | Yes      | -       | Branch name that was released                              |
| `release_title`       | No       | Auto-generated | Custom title for notification                   |

#### Outputs

None. This workflow sends notifications but doesn't return data.

#### Secrets

| Secret                            | Required         | Description                                           |
| --------------------------------- | ---------------- | ----------------------------------------------------- |
| `SLACK_WEBHOOK_URL`               | If using Slack   | Incoming webhook URL from slack.com/apps              |
| `NOTION_API_KEY`                  | If using Notion  | Integration API key from notion.so/my-integrations    |
| `RELEASE_NOTES_NOTION_DATABASE_ID`| If using Notion  | 32-character database ID from database URL            |

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

## Real-World Examples

See the [`examples/`](./examples/) directory for complete, working workflows:

| Example                                   | Use Case                                  | Complexity |
| ----------------------------------------- | ----------------------------------------- | ---------- |
| `01-manual-changelog-generator.yml`       | On-demand changelog between any two commits | ⭐          |
| `02-existing-release-integration.yml`     | Integrate into existing release pipeline  | ⭐⭐         |
| `03-weekly-digest.yml`                    | Scheduled weekly team updates             | ⭐⭐⭐       |
| `04-hotfix-release.yml`                   | Emergency hotfix notifications            | ⭐⭐         |

### When to Use Each Example

- **Manual Generator**: Perfect for generating changelogs for past releases, creating release notes after the fact, or testing different prompts
- **Release Integration**: The most common pattern - integrate into your existing npm publish, docker push, or deployment workflow
- **Weekly Digest**: Great for keeping stakeholders informed without notification overload
- **Hotfix Release**: Fast-track critical patches with appropriate urgency in notifications

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
- Use *asterisks* for bold (NOT double asterisks)
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
- Use *single asterisks* for italic
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

## Best Practices

### Keep Prompts Focused

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

### Token Budget Recommendations

| Use Case                  | Recommended max_tokens | Estimated Cost |
| ------------------------- | ---------------------- | -------------- |
| Hotfix (urgent, concise)  | 512-1024               | ~$0.005        |
| Standard release          | 1024-2048              | ~$0.01         |
| Detailed release notes    | 2048-4096              | ~$0.02         |
| Weekly digest             | 2048-4096              | ~$0.02         |

### Multi-Format Strategy

Generate both formats in one AI call to save costs:

```yaml
# ✅ Efficient: One AI call generates both formats
output_formats: 'slack,markdown'

# ❌ Wasteful: Would require two separate AI calls
# (Don't do this - use the comma-separated approach above)
```

### Caching Considerations

GitHub Actions caches:

- ✅ Node modules (automatic with `actions/setup-node@v6`)
- ✅ Dependencies (automatic with `npm ci`)
- ❌ AI responses (not cached - each run calls API)

### Error Handling

Always use `continue-on-error` for non-critical notifications:

```yaml
- name: Send Slack notification
  continue-on-error: true  # Don't fail entire workflow if Slack is down
  uses: uniswap/ai-toolkit/.github/workflows/_notify-release.yml@main
  # ...
```

### Security

1. **Never Log Secrets**: Secrets are automatically redacted, but avoid `echo $SECRET`
2. **Use Least Privilege**: Slack webhooks should only post to specific channels
3. **Rotate Keys**: Rotate Anthropic API keys every 90 days
4. **Limit Scope**: Don't use workspace-wide Notion integrations

### Cost Optimization

1. **Skip redundant generation**: If you already have a changelog, skip `_generate-changelog.yml`
2. **Use appropriate token limits**: Don't use 4096 tokens when 1024 will suffice
3. **Batch notifications**: Send weekly digests instead of per-commit notifications
4. **Monitor usage**: Check Anthropic dashboard monthly

---

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

## Support

For issues or questions:

- Check [Troubleshooting](#troubleshooting) section
- Review [examples/](./examples/) for working patterns
- File an issue in this repository
