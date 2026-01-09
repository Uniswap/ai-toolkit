# CLAUDE.md - uniswap-integrations

## Overview

This plugin provides external service integrations for Claude Code, bundling MCP servers for Linear, Notion, Nx, Chrome DevTools, and spec-workflow, plus deployment and CI/CD capabilities.

## Plugin Components

### Skills (./skills/)

- **daily-standup**: Generate daily standup reports from GitHub and Linear activity
- **deployment-orchestrator**: Orchestrate deployment pipelines with CI/CD configuration
- **linear-task-refiner**: Refine and enhance Linear task descriptions

### Agents (./agents/)

- **cicd-agent**: CI/CD pipeline specialist for deployments and workflows
- **infrastructure-agent**: Cloud resource provisioning and infrastructure setup
- **migration-assistant**: Guides version upgrades and migrations
- **slack-analyzer**: Analyzes Slack conversations and activity
- **slack-fetcher**: Fetches Slack data for analysis
- **dev-ai-pod-weekly-newsletter**: Generates weekly newsletters from activity

### MCP Servers (./.mcp.json)

- **spec-workflow**: Spec workflow dashboard and task management
- **nx-mcp**: Nx workspace integration for monorepo management
- **notion**: Notion API integration for documentation
- **linear**: Linear issue tracking integration
- **chrome-devtools**: Chrome DevTools debugging integration

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- MCP servers provide external service connectivity

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
│   ├── slack-analyzer.md
│   ├── slack-fetcher.md
│   └── dev-ai-pod-weekly-newsletter.md
├── .mcp.json
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
