# CLAUDE.md - claude-plus Script

## Overview

The `claude-plus` script is an enhanced launcher for Claude Code that improves developer experience by automating pre-launch tasks:

1. MCP server selection (via claude-mcp-helper)
2. Claude Code launch

Slack OAuth is no longer handled here. Slack is a hosted OAuth MCP server
(`https://mcp.slack.com/mcp`) that users connect through `/mcp`; the token
wizard and refresh flow this script used to own were removed in favor of it.

## Architecture

```
src/scripts/claude-plus/
├── index.ts          # CLI entry point, argument parsing, orchestration
├── display.ts        # Colorized console output utilities
├── mcp-selector.ts   # MCP server selector integration
├── config-paths.ts   # Claude config path resolution
├── claude-launcher.ts # Claude Code process spawning
├── README.md         # User documentation
└── CLAUDE.md         # This file (AI assistant documentation)
```

## Module Details

### index.ts - CLI Entry Point

**Purpose**: Main entry point that orchestrates the two-step startup flow.

**Key Features**:

- Argument parsing for CLI flags (--skip-mcp, --dry-run, --verbose)
- Removed Slack flags (--skip-slack, --setup-slack) are swallowed so they never
  reach the `claude` binary, and warned about once after the header
- Sequential step execution with status display
- Error handling with clean exit codes

**Flow**:

```typescript
main() -> parseArgs() -> [runMcpSelector] -> [launchClaude]
```

### display.ts - Display Utilities

**Purpose**: Colorized console output for consistent UX.

**Exports**:

- `colorize(text, color)`: Apply ANSI color codes
- `displayHeader()`: Show the claude-plus banner
- `displaySuccess(message)`: Green checkmark prefix
- `displayError(message)`: Red X prefix
- `displayWarning(message)`: Yellow warning prefix
- `displayInfo(message)`: Blue informational text
- `displayDebug(message, verbose?)`: Gray debug output (only when verbose)

### mcp-selector.ts - MCP Server Selection

**Purpose**: Integrates with claude-mcp-helper for interactive MCP server management.

**Implementation**:

```typescript
export async function runMcpSelector(verbose?: boolean): Promise<void>;
```

**Behavior**:

1. Determines npm tag based on this package's version:
   - Prerelease versions (containing `-next`, `-alpha`, `-beta`, `-rc`) use `@next` tag
   - Stable versions use `@latest` tag
2. Attempts to run `npx -y @uniswap/ai-toolkit-claude-mcp-helper@{tag} interactive`
3. Falls back to direct `claude-mcp-helper` command if npx fails
4. Gracefully handles missing tool (warns and continues)
5. Non-zero exit codes are treated as user cancellation (not failure)

**Tag Selection Logic**:

```typescript
function getMcpHelperTag(): string {
  const isPrerelease = /-/.test(packageVersion);
  return isPrerelease ? 'next' : 'latest';
}
```

This ensures that `@next` releases of `ai-toolkit-nx-claude` use the matching `@next` release of `claude-mcp-helper`.

**Key Pattern**: Uses `spawn` with `stdio: 'inherit'` to allow interactive terminal control.

### config-paths.ts - Claude Config Path Resolution

**Purpose**: Centralizes resolution of the Claude Code configuration path so
every module agrees on which profile is in play.

The config path utilities are centralized in `config-paths.ts`:

```typescript
// config-paths.ts - shared utility module

export function getClaudeConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR || os.homedir();
}

export function getClaudeConfigPath(): string {
  if (process.env.CLAUDE_CONFIG_DIR) {
    return path.join(process.env.CLAUDE_CONFIG_DIR, 'claude.json');
  }
  // Backward compatible: use ~/.claude.json when env var is not set
  return path.join(os.homedir(), '.claude.json');
}

// When CLAUDE_CONFIG_DIR is set, only returns that path (no cross-profile fallback).
// Otherwise returns legacy paths in priority order.
export function getAllClaudeConfigPaths(): string[] {
  if (process.env.CLAUDE_CONFIG_DIR) {
    return [path.join(process.env.CLAUDE_CONFIG_DIR, 'claude.json')];
  }
  return [
    path.join(os.homedir(), '.claude.json'), // Legacy
    path.join(os.homedir(), '.claude', 'claude.json'), // New default
  ];
}

export function isUsingCustomConfigDir(): boolean {
  return !!process.env.CLAUDE_CONFIG_DIR;
}
```

### claude-launcher.ts - Claude Launch

**Purpose**: Spawns Claude Code and transfers terminal control.

**Implementation**:

```typescript
export async function launchClaude(): Promise<void>;
```

**Behavior**:

- Spawns `claude` command with `stdio: 'inherit'`
- Returns promise that resolves when Claude exits
- Handles errors gracefully with installation suggestions

## Build Integration

### Package.json Configuration

```json
{
  "bin": {
    "claude-plus": "dist/scripts/claude-plus/index.cjs"
  }
}
```

**Additional Entry Point**:

```json
"additionalEntryPoints": [
  "packages/ai-toolkit-nx-claude/src/scripts/claude-plus/index.ts"
]
```

**Post-build**: `chmod +x dist/scripts/claude-plus/index.cjs`

### Usage via npx

```bash
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus
```

The `-p` flag tells npx to install the package, and then run the `claude-plus` binary from it.

## Error Handling Patterns

### Graceful Degradation

The script is designed to continue even when optional components fail:

1. **MCP Helper Missing**: Warns and skips MCP selection
2. **Claude Not Installed**: Fails with helpful installation instructions

### User Cancellation

Non-zero exit codes from interactive tools (like claude-mcp-helper) are treated as user cancellation, not errors. The script continues with the next step.

## Testing

### Manual Testing

```bash
# Build the package
npx nx build ai-toolkit-nx-claude

# Run via Nx target
npx nx run @uniswap/ai-toolkit-nx-claude:claude-plus:exec

# Test dry-run
node packages/ai-toolkit-nx-claude/dist/scripts/claude-plus/index.cjs --dry-run

# Test with verbose output
node packages/ai-toolkit-nx-claude/dist/scripts/claude-plus/index.cjs --verbose --dry-run
```

### Test Scenarios

1. **Full flow**: All steps execute successfully
2. **Skip MCP**: `--skip-mcp` flag works
3. **Dry run**: No actual changes made
4. **Missing MCP helper**: Graceful warning and continue
5. **Removed Slack flags**: `--skip-slack` / `--setup-slack` print one notice,
   do not reach the `claude` binary, and do not abort the launch

## Maintenance

### Adding New Steps

To add a new pre-launch step:

1. Create a new module in `src/scripts/claude-plus/`
2. Export an async function matching the pattern: `async function stepName(verbose?: boolean): Promise<void>`
3. Add a `--skip-<step>` flag in `parseArgs()` in index.ts
4. Add the step call in `main()` with appropriate step numbering
5. Update help text and documentation

### Updating Backend Integration

If the backend API changes:

1. Update `refreshOAuthToken()` request format and endpoint path
2. Update `testToken()` if auth.test response changes
3. Update `TokenRefreshResponse` and `AuthTestResponse` interfaces
4. Coordinate with backend team on API contract changes

## Dependencies

### Runtime

- Node.js built-ins: `fs`, `path`, `https`, `child_process`

### External Tools (optional)

- `@uniswap/ai-toolkit-claude-mcp-helper`: For MCP selection
- `claude` CLI: For launching Claude Code

## Related Documentation

- [README.md](./README.md): User-facing documentation
- [claude-mcp-helper CLAUDE.md](../../../claude-mcp-helper/CLAUDE.md): MCP helper implementation details
- [Package CLAUDE.md](../../CLAUDE.md): Overall package documentation
