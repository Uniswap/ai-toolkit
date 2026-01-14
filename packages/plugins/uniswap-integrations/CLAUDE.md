# CLAUDE.md - uniswap-integrations

## Overview

This plugin provides external service integrations for Claude Code, bundling MCP servers for Linear, Notion, Nx, and Chrome DevTools, plus deployment and CI/CD capabilities.

## Plugin Components

### Skills (./skills/)

- **daily-standup**: Generate daily standup reports from GitHub and Linear activity
- **deployment-orchestrator**: Orchestrate deployment pipelines with CI/CD configuration
- **linear-task-refiner**: Refine and enhance Linear task descriptions

### Agents (./agents/)

- **cicd-agent**: CI/CD pipeline specialist for deployments and workflows
- **infrastructure-agent**: Cloud resource provisioning and infrastructure setup
- **migration-assistant**: Guides version upgrades and migrations

### MCP Servers (./.mcp.json)

- **nx-mcp**: Nx workspace integration for monorepo management
- **notion**: Notion API integration for documentation
- **linear**: Linear issue tracking integration
- **chrome-devtools**: Chrome DevTools debugging integration

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- MCP servers provide external service connectivity

## Related Plugins

For spec-driven development workflows, see the **spec-workflow** plugin which provides the spec-workflow MCP server and related skills.

## File Structure

```text
uniswap-integrations/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── daily-standup/
│   ├── deployment-orchestrator/
│   └── linear-task-refiner/
├── agents/
│   ├── cicd-agent.md
│   ├── infrastructure-agent.md
│   ├── migration-assistant.md
├── .mcp.json
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
