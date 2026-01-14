# @uniswap/uniswap-integrations

External service integrations for Claude Code - Linear, Notion, Nx, Chrome DevTools, and more.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install uniswap-integrations
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

## Skills

| Skill | Description |
| ----- | ----------- |
| **daily-standup** | Generate daily standup reports from GitHub and Linear activity |
| **deployment-orchestrator** | Orchestrate deployment pipelines with CI/CD configuration |
| **linear-task-refiner** | Refine and enhance Linear task descriptions |

## Agents

| Agent | Description |
| ----- | ----------- |
| **cicd-agent** | CI/CD pipeline specialist for deployments and workflows |
| **infrastructure-agent** | Cloud resource provisioning and infrastructure setup |
| **migration-assistant** | Guides version upgrades and migrations |

## Usage Examples

```bash
# Use skills contextually
"Generate my daily standup"                    # triggers daily-standup skill
"Help me deploy to staging"                    # triggers deployment-orchestrator skill
"Refine this Linear task description"          # triggers linear-task-refiner skill
```

## MCP Authentication

Some MCP servers require authentication:

- **notion**: OAuth via <https://mcp.notion.com>
- **linear**: OAuth via <https://mcp.linear.app>

## License

MIT - Uniswap Labs
