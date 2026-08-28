# @uniswap/uniswap-integrations

External service integrations for Claude Code - Linear, Notion, Nx, Chrome DevTools, GitHub, Pulumi, Figma, Vercel, Slack, Amplitude, Datadog, and more.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install uniswap-integrations
```

## MCP Servers

This plugin bundles the following MCP (Model Context Protocol) servers:

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

## Skills

| Skill                      | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| **daily-standup**          | Generate daily standup reports from GitHub and Linear activity           |
| **datadog-cost-tracker**   | Analyze Datadog ingestion costs by service using estimated-usage metrics |
| **github-setup**           | Configure GitHub Personal Access Token for MCP server                    |
| **investigate-incident**   | Investigate production incidents using Datadog logs, metrics, and traces |
| **orchestrate-deployment** | Orchestrate deployment pipelines with CI/CD configuration                |
| **refine-linear-task**     | Refine and enhance Linear task descriptions                              |
| **use-datadog**            | Use the `pup` CLI for Datadog observability tasks                        |

## Agents

| Agent                         | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| **cicd-agent**                | CI/CD pipeline specialist for deployments and workflows |
| **infrastructure-agent**      | Cloud resource provisioning and infrastructure setup    |
| **migration-assistant-agent** | Guides version upgrades and migrations                  |

## Usage Examples

```bash
# Use skills contextually
"Generate my daily standup"                    # triggers daily-standup skill
"Help me deploy to staging"                    # triggers orchestrate-deployment skill
"Investigate the high error rate on api-gateway"  # triggers investigate-incident skill
"Refine this Linear task description"          # triggers refine-linear-task skill
"Check Datadog for error logs in prod"         # triggers use-datadog skill
"Are there any firing monitors?"               # triggers use-datadog skill
```

## MCP Authentication

Some MCP servers require authentication:

### OAuth-Based (Automatic)

- **notion**: OAuth via <https://mcp.notion.com> - Run `/mcp` and follow browser flow
- **linear**: OAuth via <https://mcp.linear.app> - Run `/mcp` and follow browser flow
- **pulumi**: OAuth via <https://mcp.ai.pulumi.com> - Run `/mcp` and follow browser flow
- **figma**: OAuth via <https://mcp.figma.com> - Run `/mcp` and follow browser flow
- **vercel**: OAuth via <https://mcp.vercel.com> - Run `/mcp` and follow browser flow
- **amplitude**: OAuth via <https://mcp.amplitude.com> - Run `/mcp` and follow browser flow (routes through Uniswap SSO)
- **datadog**: OAuth via <https://mcp.datadoghq.com> - Run `/mcp` and follow browser flow
- **slack**: OAuth via <https://mcp.slack.com> - Run `/mcp` and follow browser flow

### Token-Based (Manual Setup)

- **github**: Requires `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable

#### Slack Setup

No token setup. Run `/mcp`, pick `slack`, and complete the browser OAuth flow.

The grant carries your own Slack permissions, so it reaches every channel and DM you can
read. The hosted server has no channel or team allowlist, so treat it as your full read
surface rather than a scoped-down one.

If you have previously run `claude-plus`, it may have written a user-scope `slack` entry
with a `SLACK_BOT_TOKEN` into your Claude config, which shadows this plugin's HTTP server.
Delete that entry from whichever config holds it — `~/.claude.json`,
`~/.claude/claude.json`, or `$CLAUDE_CONFIG_DIR/claude.json` if you set that — and delete
`~/.config/claude-code/slack-env.sh` if it exists — it holds a refresh token that can still
mint new bot tokens, so removing only the config entry leaves the more durable credential
behind. Then ask a workspace admin to revoke the old app grant; deleting the local files
hides the credentials but leaves them valid at Slack. Recent `claude-plus` versions detect
both and print these steps on launch.

A workspace admin must approve the Claude app (and, when Slack adds tools, its new
scopes) for the Uniswap org. If the tool list looks short — e.g. no `slack_add_reaction`,
added by Slack in May 2026 — you are holding a pre-existing grant issued under the older
scope set: disconnect `slack` in `/mcp` and reconnect to re-run OAuth.

#### GitHub Setup

1. **Create a Personal Access Token**:

   - Go to <https://github.com/settings/tokens?type=beta>
   - Click "Generate new token" (Fine-grained recommended)
   - Set permissions: Contents (R/W), Issues (R/W), Pull requests (R/W)

2. **Add to your shell profile**:

   ```bash
   # Add to ~/.zshrc or ~/.bashrc
   export GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_your_token_here"
   ```

3. **Reload and restart Claude Code**:

   ```bash
   source ~/.zshrc  # or ~/.bashrc
   claude
   ```

4. **Verify setup**: Run `/mcp` to see the GitHub server listed

For detailed setup instructions, run `/uniswap-integrations:github-setup`.

## Spec-Driven Development

For spec-driven development workflows with the spec-workflow MCP server, install the **spec-workflow** plugin:

```bash
claude /plugin install spec-workflow
```

## License

MIT - Uniswap Labs
