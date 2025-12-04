# CLAUDE.md - claude-plus Script

## Overview

The `claude-plus` script is an enhanced launcher for Claude Code that improves developer experience by automating pre-launch tasks:

1. MCP server selection (via claude-mcp-helper)
2. Slack OAuth token validation and refresh
3. Claude Code launch

## Architecture

```
src/scripts/claude-plus/
├── index.ts          # CLI entry point, argument parsing, orchestration
├── display.ts        # Colorized console output utilities
├── mcp-selector.ts   # MCP server selector integration
├── slack-token.ts    # Slack OAuth token management
├── claude-launcher.ts # Claude Code process spawning
├── README.md         # User documentation
└── CLAUDE.md         # This file (AI assistant documentation)
```

## Module Details

### index.ts - CLI Entry Point

**Purpose**: Main entry point that orchestrates the three-step startup flow.

**Key Features**:

- Argument parsing for CLI flags (--skip-mcp, --skip-slack, --dry-run, --verbose)
- Sequential step execution with status display
- Error handling with clean exit codes

**Flow**:

```typescript
main() -> parseArgs() -> [runMcpSelector] -> [validateAndRefreshSlackToken] -> [launchClaude]
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

1. Attempts to run `npx -y @uniswap/ai-toolkit-claude-mcp-helper@latest interactive`
2. Falls back to direct `claude-mcp-helper` command if npx fails
3. Gracefully handles missing tool (warns and continues)
4. Non-zero exit codes are treated as user cancellation (not failure)

**Key Pattern**: Uses `spawn` with `stdio: 'inherit'` to allow interactive terminal control.

### slack-token.ts - Slack Token Management

**Purpose**: Validates and refreshes Slack OAuth tokens.

**Key Functions**:

```typescript
// Main entry point
export async function validateAndRefreshSlackToken(verbose?: boolean): Promise<void>;

// Internal functions
function loadSlackConfig(): SlackConfig | null;
function getCurrentToken(): string | null;
async function testToken(token: string, verbose?: boolean): Promise<boolean>;
async function refreshOAuthToken(
  config: SlackConfig,
  verbose?: boolean
): Promise<{ accessToken; refreshToken? }>;
function updateClaudeConfig(newToken: string, verbose?: boolean): void;
function updateRefreshToken(newRefreshToken: string, verbose?: boolean): void;
```

**Configuration Sources**:

1. Environment variables: `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_REFRESH_TOKEN`
2. File: `~/.config/claude-code/slack-env.sh` (parsed for export statements)

**Token Storage**:

- Access token: `~/.claude.json` → `mcpServers["zencoder-slack"].env.SLACK_BOT_TOKEN`
- Refresh token: `~/.config/claude-code/slack-env.sh` (updated in-place)

**API Endpoints**:

- Token validation: `GET https://slack.com/api/auth.test`
- Token refresh: `POST https://slack.com/api/oauth.v2.access`

**Important**: Slack refresh tokens are single-use. After each refresh, the new refresh token must be saved.

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
npx @uniswap/ai-toolkit-nx-claude:claude-plus
```

The `:claude-plus` syntax tells npm to use the `claude-plus` binary from the package.

## Error Handling Patterns

### Graceful Degradation

The script is designed to continue even when optional components fail:

1. **MCP Helper Missing**: Warns and skips MCP selection
2. **Slack Config Missing**: Warns and skips token validation
3. **Claude Not Installed**: Fails with helpful installation instructions

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
3. **Skip Slack**: `--skip-slack` flag works
4. **Dry run**: No actual changes made
5. **Missing MCP helper**: Graceful warning and continue
6. **Missing Slack config**: Graceful warning and continue
7. **Invalid Slack token**: Refresh flow triggered
8. **Valid Slack token**: Early exit from validation

## Maintenance

### Adding New Steps

To add a new pre-launch step:

1. Create a new module in `src/scripts/claude-plus/`
2. Export an async function matching the pattern: `async function stepName(verbose?: boolean): Promise<void>`
3. Add a `--skip-<step>` flag in `parseArgs()` in index.ts
4. Add the step call in `main()` with appropriate step numbering
5. Update help text and documentation

### Updating Slack API

If Slack changes their OAuth API:

1. Update `refreshOAuthToken()` request format
2. Update `testToken()` if auth.test response changes
3. Update `TokenRefreshResponse` and `AuthTestResponse` interfaces

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
