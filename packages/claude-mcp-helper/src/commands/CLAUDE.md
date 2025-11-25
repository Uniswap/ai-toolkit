# Claude MCP Helper Commands

## Purpose

Command implementations for the Claude MCP Helper CLI tool. Provides commands for managing MCP (Model Context Protocol) servers in Claude Code configurations.

## Command Files

### Core Commands

- `enable.ts` - Enable MCP servers in Claude config
- `disable.ts` - Disable MCP servers in Claude config
- `list.ts` - List available and configured MCP servers
- `status.ts` - Show status of MCP servers
- `interactive.ts` - Interactive mode for managing MCP servers

### Test Files

- `enable.spec.ts` - Tests for enable command
- `disable.spec.ts` - Tests for disable command
- `list.spec.ts` - Tests for list command
- `status.spec.ts` - Tests for status command

## Command Implementations

### enable

**Purpose**: Enable one or more MCP servers in Claude configuration

**Usage**:

```bash
claude-mcp enable [server-names...]
claude-mcp enable spec-workflow github
claude-mcp enable --all
```

**Features**:

- Enable specific servers by name
- Enable all available servers with `--all` flag
- Validates server existence before enabling
- Updates Claude config JSON
- Preserves existing configuration

### disable

**Purpose**: Disable one or more MCP servers in Claude configuration

**Usage**:

```bash
claude-mcp disable [server-names...]
claude-mcp disable spec-workflow
claude-mcp disable --all
```

**Features**:

- Disable specific servers by name
- Disable all servers with `--all` flag
- Removes server from active configuration
- Maintains server definitions for re-enabling

### list

**Purpose**: List all available MCP servers

**Usage**:

```bash
claude-mcp list
claude-mcp list --enabled
claude-mcp list --disabled
```

**Features**:

- Show all available MCP servers
- Filter by enabled/disabled status
- Display server descriptions and commands
- Indicate current status (✓ enabled, ○ disabled)

### status

**Purpose**: Show status of MCP server configuration

**Usage**:

```bash
claude-mcp status
claude-mcp status [server-name]
```

**Features**:

- Display overall MCP configuration status
- Show specific server details
- Validate server configurations
- Check for configuration errors

### interactive

**Purpose**: Interactive mode for managing MCP servers

**Usage**:

```bash
claude-mcp interactive
claude-mcp -i
```

**Features**:

- Menu-driven interface
- Visual server selection
- Real-time configuration updates
- Confirmation prompts for changes

## Common Patterns

### Configuration Access

All commands access Claude config:

```typescript
const configPath = path.join(os.homedir(), '.claude', 'claude.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
```

### MCP Server Structure

MCP servers in config follow this format:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "KEY": "value"
      },
      "disabled": false
    }
  }
}
```

### Error Handling

Commands implement consistent error handling:

1. Validate configuration exists
2. Check for malformed JSON
3. Verify server definitions
4. Provide clear error messages
5. Offer remediation steps

## Testing

### Test Structure

Each command has corresponding test file:

```typescript
describe('enable command', () => {
  it('should enable specified server', () => {});
  it('should enable all servers with --all', () => {});
  it('should handle missing server gracefully', () => {});
  it('should preserve existing config', () => {});
});
```

### Test Utilities

Tests use common utilities:

- Mock file system operations
- Fixture configurations
- Assertion helpers
- Cleanup functions

## Development

### Adding New Commands

1. Create `{command}.ts` in this directory
2. Create `{command}.spec.ts` for tests
3. Implement command function:

   ```typescript
   export async function myCommand(args: string[]): Promise<void> {
     // Implementation
   }
   ```

4. Register in CLI entry point
5. Update this CLAUDE.md documentation

### Command Structure

Standard command implementation:

```typescript
export async function myCommand(args: string[], options: CommandOptions = {}): Promise<void> {
  // 1. Parse arguments
  // 2. Validate prerequisites
  // 3. Load configuration
  // 4. Execute command logic
  // 5. Update configuration
  // 6. Display results
}
```

## Related Documentation

- Parent package: `../../CLAUDE.md`
- CLI entry point: `../index.ts`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
