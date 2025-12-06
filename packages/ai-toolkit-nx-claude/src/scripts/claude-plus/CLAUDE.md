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
├── slack-setup.ts    # Interactive Slack OAuth setup wizard
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

**Purpose**: Validates and refreshes Slack OAuth tokens using a backend service.

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

1. Environment variables: `SLACK_REFRESH_URL`, `SLACK_REFRESH_TOKEN`
2. File: `~/.config/claude-code/slack-env.sh` (parsed for export statements)

**Token Storage**:

- Access token: `~/.claude.json` → `mcpServers["zencoder-slack"].env.SLACK_BOT_TOKEN`
- Refresh token: `~/.config/claude-code/slack-env.sh` (updated in-place)

**API Endpoints**:

- Token validation: `GET https://slack.com/api/auth.test` (direct Slack API call)
- Token refresh: `POST {SLACK_REFRESH_URL}/slack/refresh` (backend endpoint)
  - Request: `{ refresh_token: string }`
  - Response: `{ ok: boolean, access_token: string, refresh_token?: string }`

**Architecture Change**: Previously called Slack's OAuth API directly with client credentials. Now calls a backend service that securely handles the OAuth flow, keeping client credentials on the backend.

**Important**: Slack refresh tokens are single-use. After each refresh, the new refresh token must be saved.

### slack-setup.ts - Interactive Setup Wizard

**Purpose**: Provides an interactive setup wizard for first-time users to configure Slack OAuth settings.

**OAuth Backend URL**: `https://ai-toolkit-slack-oauth-backend.vercel.app`

**Key Functions**:

```typescript
// Main setup wizard entry point
export async function runSlackSetupWizard(verbose?: boolean): Promise<boolean>;

// Offer setup when config is missing (called from slack-token.ts)
export async function offerSlackSetup(verbose?: boolean): Promise<boolean>;

// Check if config file exists
export function slackEnvExists(): boolean;
```

**Behavior**:

1. Displays step-by-step instructions with the OAuth backend URL
2. Guides user to visit the OAuth backend, authorize with Slack, and copy tokens
3. Prompts for Backend Refresh URL (with default pre-filled) and Refresh Token
4. Creates `~/.config/claude-code/` directory with 700 permissions
5. Writes `slack-env.sh` file with 600 permissions (owner read/write only)
6. Returns true if setup completed, false if skipped/cancelled

**Setup Instructions Shown to User**:

```
📋 Step-by-Step Instructions:

  Step 1: Visit the OAuth Setup Page
    • Open: https://ai-toolkit-slack-oauth-backend.vercel.app
    • Click "Add to Slack" and authorize the app

  Step 2: Copy Your Tokens
    • After authorization, you'll see your tokens displayed
    • Copy the Access Token (OAuth Token) - starts with xoxp-...
    • Copy the Refresh Token - starts with xoxe-1-...

  Step 3: Enter Your Configuration Below
    • Backend Refresh URL: https://ai-toolkit-slack-oauth-backend.vercel.app
    • Refresh Token: The xoxe-1-... token you copied
```

**Integration**:

- Called from `slack-token.ts` when `loadSlackConfig()` returns null
- Can be invoked directly via `--setup-slack` CLI flag
- Handles existing file detection with overwrite confirmation
- Backend URL defaults to `https://ai-toolkit-slack-oauth-backend.vercel.app` (user can press Enter to accept)

**File Permissions**: The setup wizard enforces secure file permissions:

- Directory: `0o700` (rwx------)
- Config file: `0o600` (rw-------)

**User Guidance**: Directs users to visit the OAuth backend URL to obtain their tokens. The backend handles the secure OAuth flow with Slack and provides both access and refresh tokens.

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
