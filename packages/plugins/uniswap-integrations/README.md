# @uniswap/plugin-integrations

External service integrations for Claude Code - Linear, Notion, Nx, Chrome DevTools, and more.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install plugin-integrations
```

## MCP Servers

This plugin bundles the following MCP (Model Context Protocol) servers:

| Server | Description |
| ------ | ----------- |
| **spec-workflow** | Spec workflow dashboard and task management |
| **nx-mcp** | Nx workspace integration for monorepo management |
| **notion** | Notion API integration for documentation |
| **linear** | Linear issue tracking integration |
| **chrome-devtools** | Chrome DevTools debugging integration |

## Commands

| Command | Description |
| ------- | ----------- |
| `/daily-standup` | Generate daily standup reports from Linear/GitHub |
| `/deploy` | Orchestrate deployment pipelines |

## Agents

| Agent | Description |
| ----- | ----------- |
| **commit-message-generator** | Generate structured commit messages |
| **cicd-agent** | CI/CD pipeline specialist |

## Usage Examples

```bash
# Generate a daily standup
/daily-standup

# Deploy to staging
/deploy staging
```

## MCP Authentication

Some MCP servers require authentication:

- **notion**: OAuth via <https://mcp.notion.com>
- **linear**: OAuth via <https://mcp.linear.app>

## License

MIT - Uniswap Labs
