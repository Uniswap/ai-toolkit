# CLAUDE.md - uniswap-integrations

## Overview

This plugin provides external service integrations for Claude Code, bundling MCP servers for Linear, Notion, Nx, Chrome DevTools, GitHub, and spec-workflow, plus deployment and CI/CD capabilities.

## Plugin Components

### Skills (./skills/)

- **daily-standup**: Generate daily standup reports from GitHub and Linear activity
- **deployment-orchestrator**: Orchestrate deployment pipelines with CI/CD configuration
- **linear-task-refiner**: Refine and enhance Linear task descriptions
- **github-setup**: Configure GitHub Personal Access Token for the GitHub MCP server

### Agents (./agents/)

- **cicd-agent**: CI/CD pipeline specialist for deployments and workflows
- **infrastructure-agent**: Cloud resource provisioning and infrastructure setup
- **migration-assistant**: Guides version upgrades and migrations

### MCP Servers (./.mcp.json)

| Server              | Description                                      | Auth  |
| ------------------- | ------------------------------------------------ | ----- |
| **spec-workflow**   | Spec workflow dashboard and task management      | None  |
| **nx-mcp**          | Nx workspace integration for monorepo management | None  |
| **notion**          | Notion API integration for documentation         | OAuth |
| **linear**          | Linear issue tracking integration                | OAuth |
| **chrome-devtools** | Chrome DevTools debugging integration            | None  |
| **github**          | GitHub repository, issue, and PR management      | PAT   |

### Hooks (./hooks/)

- **SessionStart**: Validates `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable and provides setup guidance if missing

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- MCP servers provide external service connectivity
- OAuth-based servers (Notion, Linear) authenticate via `/mcp` command
- PAT-based servers (GitHub) require environment variable configuration

## MCP Authentication

### OAuth Servers

Notion and Linear use OAuth authentication. Users authenticate via the `/mcp` command which opens a browser flow.

### PAT Servers

GitHub requires a Personal Access Token set as `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_your_token_here"
```

Run `/uniswap-integrations:github-setup` for detailed setup instructions.

## File Structure

```text
uniswap-integrations/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── daily-standup/
│   ├── deployment-orchestrator/
│   ├── linear-task-refiner/
│   └── github-setup/
├── agents/
│   ├── cicd-agent.md
│   ├── infrastructure-agent.md
│   └── migration-assistant.md
├── hooks/
│   └── hooks.json
├── scripts/
│   └── check-github-token.sh           # SessionStart hook for token validation
├── .mcp.json
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
