# @uniswap/plugin-pr-workflow

Pull request management workflows for Claude Code with Graphite integration.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install plugin-pr-workflow
```

## Skills

| Skill | Description |
| ----- | ----------- |
| **pr-reviewer** | Comprehensive PR review using specialized agents |
| **pr-creator** | Create Graphite PRs with auto-generated commit messages |
| **pr-issue-resolver** | Address PR review comments and fix CI failures |
| **graphite-stack-updater** | Update Graphite PR stacks by resolving comments and syncing |

## Commands

| Command | Description |
| ------- | ----------- |
| `/create-pr` | Create or update a Graphite PR |
| `/review-pr` | Review a pull request comprehensively |
| `/work-through-pr-comments` | Methodically address PR comments |

## Agents

| Agent | Description |
| ----- | ----------- |
| **pr-reviewer** | Reviews PRs for quality, security, and performance |
| **pr-creator** | Creates PRs with proper formatting and descriptions |

## MCP Integration

This plugin includes the Graphite MCP server for seamless PR stack management:

- Create stacked PRs with `gt create`
- Submit stacks with `gt submit`
- Sync and rebase with `gt sync`

## Usage Examples

```bash
# Create a PR from current changes
/create-pr

# Review an open PR
/review-pr 123

# Work through review comments
/work-through-pr-comments
```

## License

MIT - Uniswap Labs
