# CLAUDE.md - uniswap-integrations

## Overview

This plugin provides external service integrations for Claude Code, bundling MCP servers for Linear, Notion, Nx, Chrome DevTools, GitHub, Slack, Amplitude, Datadog, and more, plus deployment and CI/CD capabilities.

## Plugin Components

### Skills (./skills/)

- **daily-standup**: Generate daily standup reports from GitHub and Linear activity
- **github-setup**: Configure GitHub Personal Access Token for the GitHub MCP server
- **investigate-incident**: Investigate production incidents using Datadog logs, metrics, and traces
- **orchestrate-deployment**: Orchestrate deployment pipelines with CI/CD configuration
- **refine-linear-task**: Refine and enhance Linear task descriptions

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
| **slack**           | Slack workspace integration for messaging        | Token |

### Hooks (./hooks/)

- **SessionStart**: Validates `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable and provides setup guidance if missing

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- MCP servers provide external service connectivity
- OAuth-based servers (Notion, Linear, Pulumi, Figma, Vercel, Amplitude, Datadog) authenticate via `/mcp` command
- Token-based servers (GitHub, Slack) require environment variable configuration

## MCP Authentication

### OAuth Servers

Notion, Linear, Amplitude, Datadog, and other OAuth servers use OAuth authentication. Users authenticate via the `/mcp` command which opens a browser flow. Amplitude's OAuth flow routes through Uniswap's SSO provider (SAML 2.0), so no separate API keys are needed.

### Token-Based Servers

#### GitHub

GitHub requires a Personal Access Token set as `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_your_token_here"
```

Run `/uniswap-integrations:github-setup` for detailed setup instructions.

#### Slack

Slack requires a bot token set as `SLACK_BOT_TOKEN` environment variable:

```bash
export SLACK_BOT_TOKEN="xoxp-your-token-here"
export SLACK_TEAM_ID="your-team-id"  # Optional
```

To obtain a Slack token:

1. Visit <https://ai-toolkit-slack-oauth-backend.vercel.app/>
2. Click "Add to Slack" and authorize the app
3. Copy the Access Token

**Recommended**: Use the `claude-plus` launcher which automatically handles Slack token validation and refresh:

```bash
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus
```

For detailed documentation, see: <https://www.notion.so/uniswaplabs/Using-a-Slack-MCP-with-Claude-Claude-Code-249c52b2548b8052b901dc05d90e57fc>

## Related Plugins

For spec-driven development workflows, see the **spec-workflow** plugin which provides the spec-workflow MCP server and related skills.

## File Structure

```text
uniswap-integrations/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── daily-standup/
│   ├── github-setup/
│   ├── investigate-incident/
│   ├── orchestrate-deployment/
│   └── refine-linear-task/
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
