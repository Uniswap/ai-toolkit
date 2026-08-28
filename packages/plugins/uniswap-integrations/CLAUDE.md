# CLAUDE.md - uniswap-integrations

## Overview

This plugin provides external service integrations for Claude Code, bundling MCP servers for Linear, Notion, Nx, Chrome DevTools, GitHub, Slack, Amplitude, Datadog, and more, plus deployment and CI/CD capabilities.

## Plugin Components

### Skills (./skills/)

- **daily-standup**: Generate daily standup reports from GitHub and Linear activity
- **datadog-cost-tracker**: Analyze Datadog ingestion costs by service using estimated-usage metrics, flagging anomalous growth and reduction opportunities
- **github-setup**: Configure GitHub Personal Access Token for the GitHub MCP server
- **investigate-incident**: Investigate production incidents using Datadog logs, metrics, and traces
- **orchestrate-deployment**: Orchestrate deployment pipelines with CI/CD configuration
- **refine-linear-task**: Refine and enhance Linear task descriptions
- **use-datadog**: Directs the agent to use the `pup` CLI for all Datadog observability tasks (monitors, logs, metrics, APM, incidents, etc.)

### Agents (./agents/)

- **cicd-agent**: CI/CD pipeline specialist for deployments and workflows
- **infrastructure-agent**: Cloud resource provisioning and infrastructure setup
- **migration-assistant-agent**: Guides version upgrades and migrations

### MCP Servers (./.mcp.json)

| Server              | Description                                      | Auth  |
| ------------------- | ------------------------------------------------ | ----- |
| **nx-mcp**          | Nx workspace integration for monorepo management | None  |
| **notion**          | Notion API integration for documentation         | OAuth |
| **linear**          | Linear issue tracking integration                | OAuth |
| **chrome-devtools** | Chrome DevTools debugging integration            | None  |
| **github**          | GitHub repository, issue, and PR management      | PAT   |
| **pulumi**          | Pulumi infrastructure as code management         | OAuth |
| **figma**           | Figma design file access and collaboration       | OAuth |
| **vercel**          | Vercel deployment management and hosting         | OAuth |
| **amplitude**       | Amplitude analytics, experiments, and metrics    | OAuth |
| **datadog**         | Datadog monitoring, logs, and metrics            | OAuth |
| **slack**           | Slack workspace integration for messaging        | OAuth |

### Hooks (./hooks/)

- **SessionStart**: Validates `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable and provides setup guidance if missing

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- MCP servers provide external service connectivity
- OAuth-based servers (Notion, Linear, Pulumi, Figma, Vercel, Amplitude, Datadog, Slack) authenticate via `/mcp` command
- Token-based servers (GitHub) require environment variable configuration

## MCP Authentication

### OAuth Servers

Notion, Linear, Amplitude, Datadog, Slack, and other OAuth servers use OAuth authentication. Users authenticate via the `/mcp` command which opens a browser flow. Amplitude's OAuth flow routes through Uniswap's SSO provider (SAML 2.0), so no separate API keys are needed.

Slack is the hosted first-party server at `https://mcp.slack.com/mcp`, GA since 2026-02-17.
The grant is per-user OAuth and requires workspace-admin approval of the Claude app. It carries
the connecting user's own Slack permissions, which means every channel and DM that user can read
— the hosted server has no channel or team allowlist, unlike the `SLACK_TEAM_ID` the removed
stdio entry set. Treat it as the full read surface of the connecting account, not a narrowing.
Slack adds tools behind new scopes over time (`slack_add_reaction`
arrived 2026-05-13), and an existing grant keeps the scope set it was issued under — so a
short tool list means reconnect `slack` in `/mcp`, not a broken server.

### Token-Based Servers

#### GitHub

GitHub requires a Personal Access Token set as `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_your_token_here"
```

Run `/uniswap-integrations:github-setup` for detailed setup instructions.

## Related Plugins

For spec-driven development workflows, see the **spec-workflow** plugin which provides the spec-workflow MCP server and related skills.

## File Structure

```text
uniswap-integrations/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── daily-standup/
│   ├── datadog-cost-tracker/
│   ├── github-setup/
│   ├── investigate-incident/
│   ├── orchestrate-deployment/
│   ├── refine-linear-task/
│   └── use-datadog/
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
