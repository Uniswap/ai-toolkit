# claude-plus

Enhanced Claude Code launcher that streamlines your startup experience with MCP server selection and Slack token management.

## Features

- **MCP Server Selection**: Interactive selection of which MCP servers to enable before starting Claude
- **Slack Token Management**: Automatic validation and refresh of Slack OAuth tokens
- **Seamless Launch**: Starts Claude Code after setup is complete

## Installation

The `claude-plus` command is included in the `@uniswap/ai-toolkit-nx-claude` package:

```bash
# Run directly via npx
npx @uniswap/ai-toolkit-nx-claude:claude-plus

# Or install globally and run
npm install -g @uniswap/ai-toolkit-nx-claude
claude-plus
```

## Usage

```bash
# Full startup flow (MCP selection + Slack token check + launch Claude)
npx @uniswap/ai-toolkit-nx-claude:claude-plus

# Skip MCP selection (use existing configuration)
npx @uniswap/ai-toolkit-nx-claude:claude-plus --skip-mcp

# Skip Slack token validation
npx @uniswap/ai-toolkit-nx-claude:claude-plus --skip-slack

# Preview what would happen (dry run)
npx @uniswap/ai-toolkit-nx-claude:claude-plus --dry-run

# Show verbose output
npx @uniswap/ai-toolkit-nx-claude:claude-plus --verbose
```

## Shell Alias Setup

For convenience, add an alias to your shell configuration:

### Bash/Zsh (~/.bashrc or ~/.zshrc)

```bash
alias claude-plus="npx -y @uniswap/ai-toolkit-nx-claude:claude-plus"
```

### Fish (~/.config/fish/config.fish)

```fish
abbr claude-plus 'npx -y @uniswap/ai-toolkit-nx-claude:claude-plus'
```

After adding the alias, reload your shell configuration:

```bash
source ~/.zshrc  # or ~/.bashrc
```

## Configuration

### Slack OAuth Setup

To enable automatic Slack token refresh, you need to configure OAuth credentials. There are two ways:

#### Option 1: Environment Variables

Set these environment variables:

```bash
export SLACK_CLIENT_ID="your_client_id"
export SLACK_CLIENT_SECRET="your_client_secret"
export SLACK_REFRESH_TOKEN="your_refresh_token"
```

#### Option 2: Configuration File

Create `~/.config/claude-code/slack-env.sh`:

```bash
# Slack OAuth Configuration
export SLACK_CLIENT_ID="your_client_id"
export SLACK_CLIENT_SECRET="your_client_secret"
export SLACK_REFRESH_TOKEN="your_refresh_token"
```

Then source it before running claude-plus:

```bash
source ~/.config/claude-code/slack-env.sh && claude-plus
```

### Claude Configuration

The tool reads and updates `~/.claude.json` to manage the Slack bot token for the `zencoder-slack` MCP server.

## How It Works

1. **MCP Server Selection** (Step 1/3)

   - Runs `claude-mcp-helper interactive` to present a multi-select interface
   - Allows you to enable/disable MCP servers to manage context window usage
   - Saves selection to `.claude/settings.local.json`

2. **Slack Token Validation** (Step 2/3)

   - Checks if the current Slack token in `~/.claude.json` is valid
   - If expired, uses the refresh token to obtain a new access token
   - Updates `~/.claude.json` with the new token
   - Also updates the refresh token (Slack refresh tokens are single-use)

3. **Claude Launch** (Step 3/3)
   - Spawns Claude Code and hands over terminal control
   - Claude runs with your configured MCP servers and fresh Slack token

## Requirements

- **Node.js**: 18.x or higher
- **Claude Code**: Must be installed (`curl -fsSL https://claude.ai/install.sh | sh`)
- **claude-mcp-helper**: Installed automatically via npx if not present
- **Slack OAuth credentials**: Required only for Slack token refresh feature

## Troubleshooting

### MCP Helper Not Found

If you see "claude-mcp-helper not found", the tool will skip MCP selection and continue. To install it:

```bash
npm install -g @uniswap/ai-toolkit-claude-mcp-helper
```

### Slack Token Refresh Fails

1. Verify your OAuth credentials are correct
2. Check that your refresh token hasn't been revoked
3. Ensure you have network connectivity to Slack's API

### Claude Won't Launch

Make sure Claude Code is installed:

```bash
# Install via curl
curl -fsSL https://claude.ai/install.sh | sh

# Or via npm
npm install -g @anthropic-ai/claude-code
```

## Related Tools

- [`@uniswap/ai-toolkit-claude-mcp-helper`](../../claude-mcp-helper/README.md): MCP server management CLI
- [`@uniswap/ai-toolkit-nx-claude`](../README.md): Nx generators for Claude Code setup
