# @uniswap/development-pr-workflow

Pull request management workflows for Claude Code with Graphite integration.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install development-pr-workflow
```

## Skills

| Skill | Description |
| ----- | ----------- |
| **pr-reviewer** | Comprehensive PR review using specialized agents |
| **pr-creator** | Create Graphite PRs with auto-generated commit messages |
| **pr-issue-resolver** | Address PR review comments and fix CI failures |
| **graphite-stack-updater** | Update Graphite PR stacks by resolving comments and syncing |
| **commit-message-generator** | Generate well-structured git commit messages |
| **git-worktree-orchestrator** | Create and manage git worktrees for parallel development |
| **stack-splitter** | Split monolithic branches into logical PR stacks |

## Commands

| Command | Description |
| ------- | ----------- |
| `/review-pr` | Review a pull request comprehensively |
| `/work-through-pr-comments` | Methodically address PR comments |
| `/address-pr-issues` | Review and fix PR comments and CI failures |

## Agents

| Agent | Description |
| ----- | ----------- |
| **pr-reviewer** | Reviews PRs for quality, security, and performance |
| **pr-creator** | Creates PRs with proper formatting and descriptions |
| **commit-message-generator** | Generates structured git commit messages |
| **stack-splitter** | Splits monolithic branches into logical PR stacks |

## MCP Integration

This plugin includes the Graphite MCP server for seamless PR stack management:

- Create stacked PRs with `gt create`
- Submit stacks with `gt submit`
- Sync and rebase with `gt sync`

## Usage Examples

```bash
# Review an open PR
/review-pr 123

# Work through review comments
/work-through-pr-comments

# Address PR issues and CI failures
/address-pr-issues

# Use skills contextually
"Help me create a PR for my changes"          # triggers pr-creator skill
"Generate a commit message for these changes" # triggers commit-message-generator skill
```

## License

MIT - Uniswap Labs
