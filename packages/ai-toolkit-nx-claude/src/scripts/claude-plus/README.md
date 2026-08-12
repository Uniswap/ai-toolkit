# claude-plus

Enhanced Claude Code launcher that streamlines your startup experience with MCP server selection.

## Features

- **MCP Server Selection**: Interactive selection of which MCP servers to enable before starting Claude
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
# Full startup flow (MCP selection + launch Claude)
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus

# Skip MCP selection (use existing configuration)
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus --skip-mcp

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

### Slack

`claude-plus` no longer manages Slack tokens. Slack is an OAuth MCP server: run
`/mcp` inside Claude Code, pick `slack`, and complete the browser flow. The grant
carries your own Slack permissions and requires workspace-admin approval of the
Claude app.

The `--skip-slack` and `--setup-slack` flags are still accepted so existing shell
aliases keep working, but they do nothing except print a notice.

If an earlier `claude-plus` run left a `slack` entry with a bot token in your
Claude config, `claude-plus` now detects it and prints cleanup steps on launch.
A user-scope entry shadows the OAuth server the `uniswap-integrations` plugin
provides, so Slack tools stay broken until it is gone:

1. Delete the `slack` entry under `mcpServers` in whichever config holds it —
   `~/.claude.json`, `~/.claude/claude.json`, or `$CLAUDE_CONFIG_DIR/claude.json`
   if you set that. The launch warning names the exact file.
2. **Revoke the old credentials.** Deleting config files hides the tokens but
   leaves them valid at Slack, and the OAuth backend can still mint new access
   tokens from a live refresh token. Have a workspace admin remove the app's
   grants. Nothing rotates these any more, so an unrevoked token is a
   long-lived credential nobody is watching.
3. Delete `~/.config/claude-code/slack-env.sh`, which is no longer read
4. Run `/mcp` and connect `slack` over OAuth

### Claude Configuration

The tool reads the Claude configuration file to resolve which MCP servers are enabled.

#### Custom Configuration Directory

By default, claude-plus uses `~/.claude.json` for Claude configuration (backward compatible). You can customize this location using the `CLAUDE_CONFIG_DIR` environment variable:

```bash
# Use a custom configuration directory
export CLAUDE_CONFIG_DIR="$HOME/.claude-personal"
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus
```

This is useful when:

- Using personal Claude Code authentication on a work computer
- Maintaining separate configurations for different projects
- Testing with isolated configuration directories

When `CLAUDE_CONFIG_DIR` is set, the tool will read/write to `$CLAUDE_CONFIG_DIR/claude.json` instead of the default `~/.claude.json`.

## How It Works

1. **MCP Server Selection** (Step 1/2)

   - Runs `claude-mcp-helper interactive` to present a multi-select interface
   - Allows you to enable/disable MCP servers to manage context window usage
   - Saves selection to `.claude/settings.local.json`

2. **Claude Launch** (Step 2/2)
   - Spawns Claude Code and hands over terminal control
   - Claude runs with your configured MCP servers

## Requirements

- **Node.js**: 18.x or higher
- **Claude Code**: Must be installed (`curl -fsSL https://claude.ai/install.sh | sh`)
- **claude-mcp-helper**: Installed automatically via npx if not present

## Troubleshooting

### MCP Helper Not Found

If you see "claude-mcp-helper not found", the tool will skip MCP selection and continue. To install it:

```bash
npm install -g @uniswap/ai-toolkit-claude-mcp-helper
```

### Slack Tools Missing or Stale

Slack is no longer handled here. Run `/mcp` inside Claude Code and reconnect
`slack`. A short tool list means your OAuth grant predates a scope Slack added,
not a broken server.

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
