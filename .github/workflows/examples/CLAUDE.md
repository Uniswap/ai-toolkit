# GitHub Actions Workflow Examples

## Purpose

Example workflow implementations demonstrating AI Toolkit patterns and best practices. Each example is numbered and builds on concepts from previous examples.

## Example Files

### Changelog Generation (Examples 01-04)

1. **01-manual-changelog-generator.yml** - Basic manual changelog generation workflow
2. **02-existing-release-integration.yml** - Integrate with existing release process
3. **03-weekly-digest.yml** - Generate weekly activity digests
4. **04-hotfix-release.yml** - Hotfix release workflow with changelogs

### Claude AI Integration (Examples 05-10)

5. **05-claude-pr-welcome.yml** - Welcome new contributors with Claude
6. **06-claude-main-basic.yml** - Basic Claude mentions setup
7. **07-claude-main-custom.yml** - Advanced Claude with custom instructions
8. **08-claude-code-review-basic.yml** - Basic automated code reviews
9. **09-claude-code-review-with-custom-prompt.yml** - Code reviews with custom prompts
10. **10-claude-code-review-advanced.yml** - Advanced review configuration

### Autonomous Task Processing (Example 11)

11. **11-autonomous-linear-tasks.yml** - Autonomous Claude Code task processing from Linear issues

### PR Metadata Generation (Examples 12-13)

12. **12-generate-pr-metadata-basic.yml** - Basic auto-generated PR titles and descriptions
13. **13-generate-pr-metadata-custom.yml** - Advanced PR metadata with custom prompts

## Usage

These examples serve as:

- **Templates**: Copy and adapt for your repository
- **Reference**: Learn workflow patterns and features
- **Documentation**: Understand configuration options

### Adapting Examples

1. Copy the example file to `.github/workflows/`
2. Rename without the number prefix
3. Update repository-specific values:
   - Repository owner/name
   - Branch names
   - Secret names
   - Notification endpoints
4. Customize behavior as needed

## Key Patterns Demonstrated

### Progressive Complexity

Examples increase in sophistication:

- **Basic** (01-05): Core functionality with minimal configuration
- **Intermediate** (06-08): Additional features and customization
- **Advanced** (09-10): Full feature set with complex logic

### Common Features

All examples demonstrate:

- Proper concurrency control
- Security best practices (pinned actions, explicit permissions)
- Error handling and validation
- Clear documentation and comments
- Integration with AI Toolkit tools

### Changelog Examples (01-04)

**Patterns:**

- Manual vs. automatic triggering
- Custom prompt integration
- Integration with existing processes
- Different changelog formats (release notes, digests, hotfixes)

**Key Features:**

- Use of `_generate-changelog.yml` reusable workflow
- Custom prompts from `.github/prompts/`
- Output handling (PR creation, Notion publishing, etc.)

### Claude AI Examples (05-10)

**Patterns:**

- Progressive enhancement (basic → custom → advanced)
- Different trigger types (PR opened, comment, manual)
- Model selection and configuration
- Tool permission levels
- Custom instructions and prompts

**Key Features:**

- **05**: Welcome workflow for onboarding
- **06**: Basic @claude mention handling
- **07**: Custom instructions for repo standards
- **08**: Simple automated PR reviews
- **09**: Reviews with custom prompts from files
- **10**: Advanced reviews with inline comments and auto-resolution

### Autonomous Task Processing (Example 11)

**Patterns:**

- Scheduled execution (daily at 5am EST)
- Linear issue integration
- Matrix-based parallel processing
- Automatic PR creation and Linear status updates

**Key Features:**

- **11**: Full autonomous task processing from Linear with `@uniswap/ai-toolkit-linear-task-utils`

### PR Metadata Generation Examples (12-13)

**Patterns:**

- Automatic PR title and description generation
- Conventional commit format enforcement
- Pattern learning from repository history
- Template adaptation from recent merged PRs

**Key Features:**

- **12**: Basic auto-generated PR titles and descriptions with defaults
- **13**: Advanced configuration with custom prompts and history counts

## Configuration Reference

### Common Inputs

Most examples accept these inputs:

```yaml
inputs:
  model:
    description: 'Claude model to use'
    default: 'claude-sonnet-4-5-20250929'

  custom_prompt_path:
    description: 'Path to custom prompt file'
    default: '.github/prompts/default-pr-review.md'

  timeout_minutes:
    description: 'Maximum execution time'
    default: 15
```

### Claude GitHub App (Required)

The [Claude GitHub App](https://github.com/apps/claude) must be installed on your repository before using any Claude-powered example workflows (Examples 05-13).

1. Go to: <https://github.com/apps/claude>
2. Click **Install**
3. Select your repository

> **Need help?** Ask in **#pod-dev-ai** Slack channel

### Common Secrets

Examples reference these secrets:

- `ANTHROPIC_API_KEY` - Claude AI authentication (requires Claude GitHub App)
- `LINEAR_API_KEY` - Linear API authentication (Example 11)
- `GITHUB_TOKEN` - Built-in token (automatic)
- `SLACK_WEBHOOK_URL` - Notifications (optional)

## Testing Examples

### Before Deploying

1. Review the example code and comments
2. Update all placeholder values
3. Test with workflow dispatch (if available)
4. Monitor first real trigger closely

### Dry Run

Some examples support dry-run mode:

```yaml
inputs:
  dry_run:
    description: 'Preview without making changes'
    type: boolean
    default: false
```

## Best Practices from Examples

### Security

- Always pin actions to commit hashes (see Example 10)
- Use minimal permissions (`permissions:` blocks)
- Never log secrets or sensitive data
- Validate all inputs before use

### Performance

- Use concurrency groups to prevent duplicates
- Cache dependencies (npm, Nx)
- Run jobs in parallel where possible
- Set appropriate timeouts

### Maintainability

- Document complex logic with comments
- Use consistent naming conventions
- Extract complex scripts to `.github/scripts/`
- Keep workflows DRY (use reusable workflows)

## Related Documentation

- Parent directory: `../.github/workflows/CLAUDE.md`
- Prompt templates: `../.github/prompts/CLAUDE.md`
- Main workflows README: `../.github/workflows/README.md`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
