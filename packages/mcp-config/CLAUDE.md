# CLAUDE.md - MCP Config Package

## Overview

The `@uniswap/ai-toolkit-claude-mcp-helper` package (source directory: `packages/mcp-config`) is a standalone CLI tool for managing MCP (Model Context Protocol) servers in Claude Code workspaces. It provides an intuitive interface for enabling/disabling MCP servers across global and project-specific configurations.

## Package Purpose

This tool solves the problem of managing MCP server availability in Claude Code by:

- Reading from multiple sources: global (`~/.claude.json`), project-specific (`~/.claude.json` projects), and project-local (`./.mcp.json`)
- Managing enabled/disabled state through local settings (`./.claude/settings.local.json`)
- Presenting a unified view of all available servers with their enabled/disabled status
- Allowing easy multi-select interface to toggle server availability
- Maintaining proper configuration priority (local overrides global)

## Architecture

### Configuration System

The tool implements a **multi-source configuration system** that discovers MCP servers from three locations and manages their enabled/disabled state:

#### MCP Server Sources (Discovery)

1. **Global Config** (`~/.claude.json`):

   - Contains user-wide MCP server definitions in `mcpServers` object
   - Accessible across all projects
   - Example: `{ "mcpServers": { "github": { "command": "npx", "args": [...] } } }`

2. **Project-Specific Config** (`~/.claude.json` → `projects[cwd].mcpServers`):

   - Project-specific MCP server definitions within the global config
   - Scoped to specific working directories
   - Example: `{ "projects": { "/path/to/project": { "mcpServers": { "custom-tool": {...} } } } }`

3. **Project-Local Config** (`./.mcp.json`):
   - Project-committed MCP server definitions
   - Allows teams to share MCP server configurations via version control
   - Example: `{ "mcpServers": { "team-tool": { "command": "npx", "args": [...] } } }`

#### Enabled/Disabled State Management

**Local Settings** (`./.claude/settings.local.json`):

- Project-specific settings that control which discovered servers are enabled/disabled
- Contains `deniedMcpServers` array listing disabled servers
- Format: Array of objects with `serverName` property
- **Takes precedence** over all other configurations

```json
{
  "deniedMcpServers": [
    { "serverName": "chrome-devtools" },
    { "serverName": "claude-historian" }
  ]
}
```

**Priority Rule**: If a server appears in local `deniedMcpServers`, it's disabled regardless of where it was discovered. Otherwise, it's enabled by default.

### Key Data Structure

The `deniedMcpServers` array uses an **object format** (not string array):

```json
{
  "deniedMcpServers": [
    { "serverName": "chrome-devtools" },
    { "serverName": "claude-historian" }
  ]
}
```

This format is critical for proper integration with Claude Code's configuration system.

## Module Structure

```
packages/mcp-config/
├── src/
│   ├── index.ts              # CLI entry point and command router
│   ├── commands/
│   │   ├── list.ts           # List servers with status
│   │   ├── enable.ts         # Enable one or more servers
│   │   ├── disable.ts        # Disable one or more servers
│   │   ├── status.ts         # Detailed status view
│   │   └── interactive.ts    # Multi-select interactive mode
│   ├── config/
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── reader.ts         # Configuration reading logic
│   │   └── writer.ts         # Configuration writing logic
│   └── utils/
│       └── display.ts        # Console output formatting
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
├── README.md
└── CLAUDE.md                 # This file
```

## Core Components

### 1. Type System (types.ts)

Defines the complete type structure for configuration management:

```typescript
// Critical: Object format for denied servers
interface DeniedMcpServer {
  serverName: string;
}

// Local project configuration
interface SettingsLocal {
  permissions?: {
    allow?: string[];
    deny?: string[];
    ask?: string[];
  };
  deniedMcpServers?: DeniedMcpServer[];
}

// Global configuration structure
interface ClaudeConfig {
  mcpServers?: Record<string, McpServerConfig>;
  projects?: Record<string, ProjectConfig>;
}

// Project-local MCP configuration (.mcp.json)
interface McpConfig {
  mcpServers?: Record<string, McpServerConfig>;
}

// Server status tracking
interface ServerStatus {
  name: string;
  enabled: boolean;
  source: 'local' | 'global' | 'none';
}
```

### 2. Configuration Reader (reader.ts)

Implements the multi-source configuration discovery and status determination:

**Key Functions**:

- `readGlobalConfig()`: Reads `~/.claude.json`
- `readLocalConfig()`: Reads `./.claude/settings.local.json`
- `readMcpJsonConfig()`: Reads `./.mcp.json` (NEW)
- `getAvailableServers()`: Returns all server names from all three sources (UPDATED)
- `getServerStatus(name)`: Determines if server is enabled and why
- `getAllServerStatuses()`: Returns status for all servers
- `hasMcpServers()`: Checks if any MCP servers are configured

**Server Discovery Logic**:

```typescript
export function getAvailableServers(): string[] {
  const servers = new Set<string>();
  const cwd = process.cwd();

  // 1. Global MCP servers from ~/.claude.json
  const globalConfig = readGlobalConfig();
  if (globalConfig.mcpServers) {
    Object.keys(globalConfig.mcpServers).forEach((name) => servers.add(name));
  }

  // 2. Project-specific from ~/.claude.json projects[cwd].mcpServers
  if (globalConfig.projects?.[cwd]?.mcpServers) {
    Object.keys(globalConfig.projects[cwd].mcpServers!).forEach((name) =>
      servers.add(name)
    );
  }

  // 3. Project-local from ./.mcp.json
  const mcpConfig = readMcpJsonConfig();
  if (mcpConfig.mcpServers) {
    Object.keys(mcpConfig.mcpServers).forEach((name) => servers.add(name));
  }

  return Array.from(servers).sort();
}
```

**Priority Logic**:

```typescript
export function getServerStatus(serverName: string): ServerStatus {
  // 1. Check local config first (highest priority)
  if (isServerDeniedLocally(serverName)) {
    return { name: serverName, enabled: false, source: 'local' };
  }

  // 2. Check global config for current project
  if (isServerDisabledGlobally(serverName)) {
    return { name: serverName, enabled: false, source: 'global' };
  }

  // 3. Default: enabled
  return { name: serverName, enabled: true, source: 'none' };
}
```

### 3. Configuration Writer (writer.ts)

Handles writing changes to local configuration:

**Key Function**:

```typescript
export function updateLocalConfig(deniedServers: string[]): void {
  const configPath = path.join(process.cwd(), '.claude', 'settings.local.json');

  // Load existing config or create new
  let config: SettingsLocal = {};
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  }

  // CRITICAL: Convert to object format
  config.deniedMcpServers = deniedServers.map(
    (serverName): DeniedMcpServer => ({ serverName })
  );

  // Write with formatting
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
```

**Important**: Always converts server names to object format when writing.

### 4. Commands

#### list.ts - List Command

Displays all servers with their status:

```
✓ Enabled Servers:
  ✓ github
  ✓ linear
  ✓ notion

✗ Disabled Servers:
  ✗ chrome-devtools (local)
  ✗ claude-historian (global)

3 enabled, 2 disabled
```

#### enable.ts - Enable Command

Removes servers from `deniedMcpServers`:

```bash
mcp-config enable chrome-devtools linear
```

#### disable.ts - Disable Command

Adds servers to `deniedMcpServers`:

```bash
mcp-config disable chrome-devtools claude-historian
```

#### status.ts - Status Command

Shows detailed configuration information including paths and server definitions.

#### interactive.ts - Interactive Mode

**Most Important Command**: Provides multi-select interface using enquirer.

**Key Implementation Detail**:

```typescript
import { prompt } from 'enquirer';

const response = await prompt({
  type: 'multiselect',
  name: 'servers',
  message: 'Select MCP servers to enable',
  choices: servers.map((name) => ({
    name: name + colorize(hint, 'gray'),
    value: name,
    enabled: currentlyEnabled.includes(name), // Pre-select enabled servers
  })),
  hint: 'Use <space> to select, <a> to toggle all, <return> to submit',
});

// Calculate denied servers (those NOT selected)
const deniedServers = servers.filter((s) => !response.servers.includes(s));

// Update configuration
updateLocalConfig(deniedServers);
```

**User Experience**:

- Pre-selects currently enabled servers
- Shows disabled servers with source indicator
- Supports 'a' key to toggle all
- Calculates deniedMcpServers as inverse of selection

### 5. Display Utilities (display.ts)

Provides colorized console output:

```typescript
export function colorize(
  text: string,
  style: 'green' | 'red' | 'yellow' | 'gray' | 'bold'
): string {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
  };
  return `${colors[style]}${text}${colors.reset}`;
}
```

## CLI Entry Point (index.ts)

Routes commands to appropriate handlers:

```typescript
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case undefined:
    case 'interactive':
      await interactiveCommand();
      break;

    case 'list':
      listCommand();
      break;

    case 'enable':
      enableCommand(args.slice(1));
      break;

    case 'disable':
      disableCommand(args.slice(1));
      break;

    case 'status':
      statusCommand();
      break;

    case 'help':
    case '--help':
    case '-h':
      displayHelp();
      break;

    default:
      displayError(`Unknown command: ${command}`);
      displayHelp();
      process.exit(1);
  }
}
```

**Note**: No shebang in source file - esbuild adds it via banner configuration.

## Build Configuration

### package.json

Key configuration for building executable CLI:

```json
{
  "type": "commonjs",
  "bin": {
    "mcp-config": "./dist/mcp-config.cjs"
  },
  "scripts": {
    "postbuild": "chmod +x dist/mcp-config.cjs"
  },
  "nx": {
    "targets": {
      "build": {
        "executor": "@nx/esbuild:esbuild",
        "options": {
          "format": ["cjs"],
          "outputFileName": "mcp-config.cjs",
          "bundle": true,
          "thirdParty": true,
          "platform": "node",
          "target": "node18",
          "esbuildOptions": {
            "banner": {
              "js": "#!/usr/bin/env node"
            }
          }
        }
      }
    }
  }
}
```

**Critical Points**:

- CommonJS format for Node.js compatibility
- Bundles all dependencies (including enquirer)
- Adds shebang via esbuild banner (NOT in source file)
- postbuild script makes output executable

### Building

```bash
npx nx build mcp-config
# Output: packages/mcp-config/dist/mcp-config.cjs
```

## Installation and Usage

### Shell Alias Setup

The tool is designed to be used via shell alias:

**Bash/Zsh** (`~/.bashrc` or `~/.zshrc`):

```bash
alias mcp-config="/absolute/path/to/ai-toolkit/packages/mcp-config/dist/mcp-config.cjs"
```

**Fish** (`~/.config/fish/config.fish`):

```fish
alias mcp-config="/absolute/path/to/ai-toolkit/packages/mcp-config/dist/mcp-config.cjs"
```

After adding alias, reload shell:

```bash
source ~/.zshrc  # or ~/.bashrc or ~/.config/fish/config.fish
```

### Command Usage

```bash
# Interactive mode (recommended)
mcp-config

# List all servers
mcp-config list

# Enable servers
mcp-config enable github linear

# Disable servers
mcp-config disable chrome-devtools

# Show detailed status
mcp-config status

# Show help
mcp-config help
```

## Dependencies

### Runtime

- `enquirer` (^2.4.1): Interactive prompts with multi-select support

### Development

- `@types/node` (^24.10.0): TypeScript types for Node.js APIs

### Built-in Modules

- `fs`: File system operations
- `path`: Path manipulation
- `os`: Operating system utilities (homedir)

## Error Handling

### No MCP Servers Configured

When `~/.claude.json` doesn't contain `mcpServers`:

```
⚠ No MCP servers configured.

To configure MCP servers, add them to ~/.claude.json:

{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package@latest"]
    }
  }
}
```

### Permission Errors

If executable permissions are missing:

```bash
chmod +x packages/mcp-config/dist/mcp-config.cjs
```

### Configuration Read Errors

- Validates JSON syntax
- Provides clear error messages
- Gracefully handles missing files (creates if needed)

## Testing Checklist

### Manual Testing

1. **List Command**: Verify server status display
2. **Enable Command**: Remove from deniedMcpServers
3. **Disable Command**: Add to deniedMcpServers (as objects)
4. **Interactive Mode**: Multi-select interface with pre-selection
5. **Status Command**: Show detailed configuration
6. **Help Command**: Display usage information
7. **Edge Cases**:
   - No MCP servers configured
   - Empty deniedMcpServers
   - Non-existent local config
   - Invalid JSON in configs

### Automated Testing (Future)

Unit tests should cover:

- Configuration reading priority logic
- Object format conversion in writer
- Server status determination
- CLI argument parsing
- Error handling scenarios

## Development Notes

### Critical Implementation Details

1. **Object Format**: `deniedMcpServers` MUST be array of objects, not strings
2. **No Shebang in Source**: esbuild adds shebang - source file should not have one
3. **enquirer Import**: Use `prompt` function, not `MultiSelect` class
4. **Configuration Priority**: Local ALWAYS overrides global
5. **Inverse Selection**: Interactive mode calculates denied as NOT selected

### Common Pitfalls

1. **Duplicate Shebang**: Don't add shebang to source file when esbuild banner adds one
2. **enquirer Import Error**: Module doesn't export `MultiSelect` class directly
3. **String vs Object Format**: deniedMcpServers must be objects, not strings
4. **Working Directory**: Commands should run from project root, not package directory

### Adding New Features

To extend the tool:

1. Add new command file in `src/commands/`
2. Update command router in `src/index.ts`
3. Add command to help text
4. Update README.md with usage examples
5. Update this CLAUDE.md with implementation details
6. Consider adding tests

## Integration with Claude Code

### How Claude Code Uses Configuration

Claude Code reads configuration in this order:

1. Local `.claude/settings.local.json` (per-project)
2. Global `~/.claude.json` (user-wide)
3. Built-in defaults

The `deniedMcpServers` array in local config is the primary mechanism for project-specific server management.

### Restarting Claude Code

After making configuration changes with mcp-config:

1. Save the configuration
2. Restart Claude Code for changes to take effect
3. Verify with Claude's MCP server list

## Future Enhancements

Potential improvements:

1. **Validation**: Verify server names exist before adding to denied list
2. **Bulk Operations**: Enable/disable by category or pattern
3. **History**: Track configuration changes
4. **Export/Import**: Share configurations across projects
5. **Server Info**: Show server details (command, args, env vars)
6. **Configuration Templates**: Pre-configured setups for common use cases
7. **Tests**: Comprehensive unit and integration tests

## Maintenance Requirements

⚠️ **IMPORTANT**: This CLAUDE.md file must be updated whenever:

- Command functionality changes
- Configuration format changes
- New commands are added
- Error handling improves
- Build configuration changes
- Dependencies are updated
- Integration patterns change

This documentation serves as the source of truth for AI assistants working with the mcp-config package.

## Related Documentation

- **README.md**: User-facing documentation with setup and usage instructions
- **packages/ai-toolkit-nx-claude/CLAUDE.md**: Context on how this fits in the broader AI Toolkit
- **Claude Code Documentation**: Official docs for MCP server configuration

## Package Status

**Current Status**: Complete and published

- All core commands implemented and tested
- Build process working correctly
- Documentation complete
- Published to npm as `@uniswap/ai-toolkit-claude-mcp-helper`
- Integrated into automated publishing workflow

**Not Implemented**:

- Automated tests
- Advanced features (validation, templates, etc.)
