# claude-plus

Enhanced Claude Code launcher that streamlines your startup experience with MCP server selection and Slack token management.

## Features

- **MCP Server Selection**: Interactive selection of which MCP servers to enable before starting Claude
- **Slack Token Management**: Automatic validation and refresh of Slack OAuth tokens
- **Interactive Setup Wizard**: First-run setup prompts for Slack credentials if not configured
- **Seamless Launch**: Starts Claude Code after setup is complete

## Installation

The `claude-plus` command is included in the `@uniswap/ai-toolkit-nx-claude` package:

```bash
# Run directly via npx (-p installs the package, then runs the claude-plus binary)
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus

# Or install globally and run
npm install -g @uniswap/ai-toolkit-nx-claude
claude-plus
```

## Usage

```bash
# Full startup flow (MCP selection + Slack token check + launch Claude)
# On first run, prompts to set up Slack credentials if not configured
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus

# Run the Slack OAuth setup wizard (create or update credentials)
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --setup-slack

# Skip MCP selection (use existing configuration)
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --skip-mcp

# Skip Slack token validation
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --skip-slack

# Preview what would happen (dry run)
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --dry-run

# Show verbose output
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --verbose
```

## Shell Alias Setup

For convenience, add an alias to your shell configuration:

### Bash/Zsh (~/.bashrc or ~/.zshrc)

```bash
alias claude-plus="npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus"
```

### Fish (~/.config/fish/config.fish)

```fish
abbr claude-plus 'npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus'
```

After adding the alias, reload your shell configuration:

```bash
source ~/.zshrc  # or ~/.bashrc
```

## Configuration

### Slack OAuth Setup

To enable automatic Slack token refresh, you need to configure a backend refresh URL and refresh token. There are three ways:

#### Option 1: Interactive Setup Wizard (Recommended)

Run the setup wizard which will guide you through the process and create the config file automatically:

```bash
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --setup-slack
```

This will:

- Prompt you for your backend refresh URL and refresh token
- Create `~/.config/claude-code/slack-env.sh` with proper permissions (600)
- Store credentials securely for future runs

The wizard also runs automatically on first use if no credentials are found.

#### Option 2: Environment Variables

Set these environment variables in your shell profile:

```bash
export SLACK_REFRESH_URL="https://slack-oauth-backend.vercel.app"
export SLACK_REFRESH_TOKEN="xoxe-1-your_refresh_token"
```

#### Option 3: Manual Configuration File

Create `~/.config/claude-code/slack-env.sh` manually:

```bash
mkdir -p ~/.config/claude-code
chmod 700 ~/.config/claude-code

cat > ~/.config/claude-code/slack-env.sh << 'EOF'
# Slack OAuth Configuration
export SLACK_REFRESH_URL="https://slack-oauth-backend.vercel.app"
export SLACK_REFRESH_TOKEN="xoxe-1-your_refresh_token"
EOF

chmod 600 ~/.config/claude-code/slack-env.sh
```

Then source it before running claude-plus:

```bash
source ~/.config/claude-code/slack-env.sh && claude-plus
```

**Note**: The refresh token is obtained from your OAuth backend after completing the initial OAuth flow. Contact your backend administrator if you need help obtaining these credentials.

### Claude Configuration

The tool reads and updates `~/.claude.json` to manage the Slack bot token for the `zencoder-slack` MCP server.

## How It Works

1. **MCP Server Selection** (Step 1/3)

   - Runs `claude-mcp-helper interactive` to present a multi-select interface
   - Allows you to enable/disable MCP servers to manage context window usage
   - Saves selection to `.claude/settings.local.json`

2. **Slack Token Validation** (Step 2/3)

   - Checks if the current Slack token in `~/.claude.json` is valid
   - If expired, calls the backend refresh endpoint with the refresh token
   - Backend securely handles the OAuth refresh flow with Slack
   - Updates `~/.claude.json` with the new access token
   - Also updates the refresh token (Slack refresh tokens are single-use)

3. **Claude Launch** (Step 3/3)
   - Spawns Claude Code and hands over terminal control
   - Claude runs with your configured MCP servers and fresh Slack token

## Requirements

- **Node.js**: 18.x or higher
- **Claude Code**: Must be installed (`curl -fsSL https://claude.ai/install.sh | sh`)
- **claude-mcp-helper**: Installed automatically via npx if not present
- **Backend refresh URL and token**: Required only for Slack token refresh feature

## Troubleshooting

### MCP Helper Not Found

If you see "claude-mcp-helper not found", the tool will skip MCP selection and continue. To install it:

```bash
npm install -g @uniswap/ai-toolkit-claude-mcp-helper
```

### Slack Token Refresh Fails

1. Verify your backend refresh URL is correct and accessible
2. Check that your refresh token hasn't been revoked
3. Ensure you have network connectivity to your backend service
4. Contact your backend administrator if the backend is unavailable

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
