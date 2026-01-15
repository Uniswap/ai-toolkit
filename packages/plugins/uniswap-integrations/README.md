# @uniswap/uniswap-integrations

External service integrations for Claude Code - Linear, Notion, Nx, Chrome DevTools, GitHub, Pulumi, Figma, Vercel, and more.

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

## Skills

| Skill                      | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| **daily-standup**          | Generate daily standup reports from GitHub and Linear activity |
| **github-setup**           | Configure GitHub Personal Access Token for MCP server          |
| **orchestrate-deployment** | Orchestrate deployment pipelines with CI/CD configuration      |
| **refine-linear-task**     | Refine and enhance Linear task descriptions                    |

## Agents

| Agent                    | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| **cicd-agent**           | CI/CD pipeline specialist for deployments and workflows |
| **infrastructure-agent** | Cloud resource provisioning and infrastructure setup    |
| **migration-assistant**  | Guides version upgrades and migrations                  |

## Usage Examples

```bash
# Use skills contextually
"Generate my daily standup"                    # triggers daily-standup skill
"Help me deploy to staging"                    # triggers orchestrate-deployment skill
"Refine this Linear task description"          # triggers refine-linear-task skill
```

## MCP Authentication

Some MCP servers require authentication:

### OAuth-Based (Automatic)

- **notion**: OAuth via <https://mcp.notion.com> - Run `/mcp` and follow browser flow
- **linear**: OAuth via <https://mcp.linear.app> - Run `/mcp` and follow browser flow
- **pulumi**: OAuth via <https://mcp.ai.pulumi.com> - Run `/mcp` and follow browser flow
- **figma**: OAuth via <https://mcp.figma.com> - Run `/mcp` and follow browser flow
- **vercel**: OAuth via <https://mcp.vercel.com> - Run `/mcp` and follow browser flow

### Token-Based (Manual Setup)

- **github**: Requires `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable

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
