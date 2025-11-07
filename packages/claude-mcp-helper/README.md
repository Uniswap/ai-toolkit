# Claude MCP Helper

**Package**: `@uniswap/ai-toolkit-claude-mcp-helper`

A standalone CLI tool to manage MCP (Model Context Protocol) servers for Claude Code workspaces.

## Features

- 📋 **List** all MCP servers with their enabled/disabled status
- ✅ **Enable/Disable** servers individually or in bulk
- 📊 **Status** view with detailed information
- 🎯 **Interactive mode** with multi-select interface
- 🔄 **Smart configuration** - local `.claude/settings.local.json` overrides global `~/.claude.json`
- 🎨 **Colorized output** for better readability

## Installation

### Via npm (Recommended)

Use via npx without installation:

```bash
npx @uniswap/ai-toolkit-claude-mcp-helper list
```

Alias in your shell for easy access. For example, run this to automatically add it as an alias, `claude-mcp-helper`, to your `~/.zshrc` file:

```bash
echo '\n# ai-toolkit claude-mcp helper\nalias claude-mcp-helper="npx -y @uniswap/ai-toolkit-claude-mcp-helper@latest"' >> ~/.zshrc
```

### Build from Source

If you're developing or contributing to this package:

```bash
# From the ai-toolkit monorepo root
npx nx build @uniswap/ai-toolkit-claude-mcp-helper

# The executable will be at: packages/claude-mcp-helper/dist/claude-mcp-helper.cjs
```

## Usage

This assumes you've aliased it properly.

### Interactive Mode (Recommended)

Simply run `claude-mcp-helper` without arguments to enter interactive mode:

```bash
claude-mcp-helper
```

This will show a multi-select interface where you can:

- Use ↑/↓ arrows to navigate
- Press Space to toggle selection
- Press 'a' to toggle all
- Press Enter to save

### List Servers

View all MCP servers and their status:

```bash
claude-mcp-helper list
```

Output example:

```text
✓ Enabled Servers:
  ✓ github
  ✓ linear
  ✓ notion

✗ Disabled Servers:
  ✗ chrome-devtools (local)
  ✗ claude-historian (global)

3 enabled, 2 disabled
```

### Enable Servers

Enable one or more servers:

```bash
# Enable single server
claude-mcp-helper enable github

# Enable multiple servers
claude-mcp-helper enable github linear notion
```

### Disable Servers

Disable one or more servers:

```bash
# Disable single server
claude-mcp-helper disable chrome-devtools

# Disable multiple servers
claude-mcp-helper disable chrome-devtools claude-historian
```

### Detailed Status

Show comprehensive status information:

```bash
claude-mcp-helper status
```

## Configuration

### How It Works

Claude MCP Helper discovers MCP servers from multiple sources and manages their enabled/disabled state:

#### MCP Server Sources

1. **Global Config** (`~/.claude.json`)

   - User-wide MCP server definitions in `mcpServers` object
   - Accessible across all projects

2. **Project-Specific Config** (`~/.claude.json` → `projects[cwd].mcpServers`)

   - Project-specific MCP server definitions within global config
   - Scoped to specific working directories

3. **Project-Local Config** (`./.mcp.json`)
   - Project-committed MCP server definitions
   - Allows teams to share configurations via version control

#### Enabled/Disabled State

**Local Settings** (`./.claude/settings.local.json`)

- Project-specific settings that control which discovered servers are enabled/disabled
- `deniedMcpServers` array lists disabled servers
- **Takes precedence over all server sources**

### Configuration Priority

- Servers are discovered from all three sources (global, project-specific, and .mcp.json)
- Local settings in `.claude/settings.local.json` control enabled/disabled state
- If a server is in `deniedMcpServers`, it's disabled regardless of where it was discovered
- If a server is not in `deniedMcpServers`, it's enabled by default

### DeniedMcpServers Format

The `deniedMcpServers` array uses an **object format**:

```json
{
  "deniedMcpServers": [
    { "serverName": "chrome-devtools" },
    { "serverName": "claude-historian" }
  ]
}
```

## Examples

### Scenario: Disable a Server Locally

You want to disable `chrome-devtools` only in the current project:

```bash
cd /path/to/your/project
claude-mcp-helper disable chrome-devtools
```

This adds the server to `./.claude/settings.local.json`:

```json
{
  "deniedMcpServers": [{ "serverName": "chrome-devtools" }]
}
```

### Scenario: Enable All Servers in Project

```bash
claude-mcp-helper interactive
# Select all servers (press 'a')
# Press Enter to save
```

This removes all entries from the `deniedMcpServers` array in `./.claude/settings.local.json`.

### Scenario: Share Team MCP Servers via .mcp.json

Create a `.mcp.json` file in your project root to share MCP server configurations with your team:

```json
{
  "mcpServers": {
    "team-tool": {
      "command": "npx",
      "args": ["-y", "@your-org/team-mcp-server@latest"]
    },
    "project-specific": {
      "command": "node",
      "args": ["./scripts/mcp-server.js"]
    }
  }
}
```

Commit this file to version control. Team members running `claude-mcp-helper` will see these servers alongside their personal global servers.

### Scenario: Check What's Enabled

```bash
claude-mcp-helper list
```

Shows:

- ✓ for enabled servers
- ✗ for disabled servers
- (local) or (global) indicator for disabled servers

## Development

### Project Structure

```text
packages/claude-mcp-helper/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── list.ts           # List command
│   │   ├── enable.ts         # Enable command
│   │   ├── disable.ts        # Disable command
│   │   ├── status.ts         # Status command
│   │   └── interactive.ts    # Interactive mode
│   ├── config/
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── reader.ts         # Config reading logic
│   │   └── writer.ts         # Config writing logic
│   └── utils/
│       └── display.ts        # Console output formatting
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npx nx build @uniswap/ai-toolkit-claude-mcp-helper
```

The build process:

1. Compiles TypeScript to CommonJS
2. Bundles all dependencies with esbuild
3. Adds shebang (`#!/usr/bin/env node`)
4. Makes output executable via postbuild script

### Testing Locally

```bash
# Build
npx nx build @uniswap/ai-toolkit-claude-mcp-helper

# Run directly
packages/claude-mcp-helper/dist/claude-mcp-helper.cjs list

# Or use alias after setting it up
claude-mcp-helper list
```

## Troubleshooting

### "No MCP servers configured"

This means your `~/.claude.json` doesn't have any `mcpServers` defined.

**Solution**: Add MCP servers to your global config:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "linear": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-linear"]
    }
  }
}
```

### Changes Not Taking Effect

Make sure you:

1. Saved the configuration
2. Restarted Claude Code
3. Are in the correct directory (for local configs)

### Permission Denied

If you get permission errors when running the tool:

```bash
chmod +x packages/claude-mcp-helper/dist/claude-mcp-helper.cjs
```
