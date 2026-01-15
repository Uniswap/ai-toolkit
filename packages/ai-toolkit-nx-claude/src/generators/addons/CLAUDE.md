# Addons Generator

## Purpose

Nx generator for installing optional MCP server add-ons to the AI Toolkit. These are MCP servers that are NOT bundled via plugins and require manual installation.

## Usage

```bash
# Interactive mode (recommended)
npx nx generate @uniswap/ai-toolkit-nx-claude:addons

# Install all addons
npx nx generate @uniswap/ai-toolkit-nx-claude:addons --selection-mode=all

# Install specific addon
npx nx generate @uniswap/ai-toolkit-nx-claude:addons \
  --selection-mode=specific \
  --addons=slack-mcp
```

## Options

### Installation Control

- `selectionMode` - Selection mode for which addons to install:
  - `all` - Install all available addons (2 MCP servers)
  - `specific` - Choose specific addons to install
- `addons` - Specific addons to install (when `selectionMode=specific`)
- `installationType` - Installation location for MCP servers:
  - `global` - Install to `~/.claude` (available in all projects)
  - `local` - Install to `./.claude` (project-specific configuration)

### Integration Options

- `installMode` (hidden) - Set to "default" or "custom" when called from init generator to control prompting behavior:
  - When `installMode === 'default'`: Skips all prompts, uses `installationType` from parent or defaults to 'global'
  - When undefined (standalone execution): Shows full interactive prompts including `installationType` selection

## Available Addons

Registered in `addon-registry.ts`. These 2 MCP servers are available for manual installation:

### 1. slack-mcp

**Purpose**: Slack workspace integration for Claude Code

**Features**:

- Send and receive Slack messages
- Search channels and conversations
- Manage workspace interactions

**Requires**: Slack Bot Token authentication

### 2. aws-log-analyzer-mcp

**Purpose**: MCP server for AWS CloudWatch log analysis

**Features**:

- CloudWatch log querying
- Log pattern detection
- Error analysis
- Performance metrics

**Setup File**: `aws-log-analyzer-setup.ts`

**Installation**:

- Clones the AWS Log Analyzer repository
- Installs Python dependencies with uv
- Adds MCP server configuration

**Requires**: AWS credentials with CloudWatchLogsReadOnlyAccess

## Note on Plugin-Bundled MCP Servers

The following MCP servers are **NOT** available via this addons generator because they are bundled via plugins:

- **spec-workflow-mcp** - Available via spec-workflow plugin
- **graphite-mcp** - Available via development-pr-workflow plugin
- **nx-mcp** - Available via uniswap-integrations plugin
- **notion-mcp** - Available via uniswap-integrations plugin
- **linear-mcp** - Available via uniswap-integrations plugin
- **chrome-devtools-mcp** - Available via uniswap-integrations plugin
- **github-mcp** - Available via uniswap-integrations plugin
- **pulumi-mcp** - Available via uniswap-integrations plugin
- **figma-mcp** - Available via uniswap-integrations plugin
- **vercel-mcp** - Available via uniswap-integrations plugin

To access these, install the corresponding plugin from the Claude Code Plugin Marketplace.

## Generator Flow

1. **Mode Selection** (if running standalone):

   - Selection mode: All addons vs Specific addons
   - Installation location: Global (`~/.claude`) vs Local (`./.claude`)

2. **Addon Selection** (if specific mode):

   - Display available addons with descriptions
   - Multi-select interface
   - Show installation status

3. **Installation**:

   - For each selected addon:
     - Run addon's setup function (if any)
     - Install MCP server using `claude mcp add` with appropriate scope:
       - `--scope user` for global installation
       - `--scope project` for local installation
     - Create necessary files/directories
     - Install dependencies if needed

4. **Verification**:
   - Validate MCP server configurations
   - Check file permissions
   - Test basic functionality

## File Structure

- `generator.ts` - Main generator orchestration
- `schema.json` - Configuration schema with conditional prompting
- `schema.d.ts` - TypeScript interface
- `addon-registry.ts` - Registry of available addons
- `aws-log-analyzer-setup.ts` - AWS Log Analyzer setup implementation
- `claude-mcp-installer.ts` - MCP server installation utilities

## Addon Registry

The registry (`addon-registry.ts`) defines available addons:

```typescript
export interface McpServerAddon {
  id: string;
  name: string;
  description: string;
  mcp: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
  requirements?: string[];
}

export function getAvailableAddons(): McpServerAddon[] {
  return [
    {
      id: 'slack-mcp',
      name: 'Slack MCP',
      description: 'Slack workspace integration',
      mcp: { command: 'npx', args: ['-y', '@anthropic/slack-mcp'] },
    },
    // ... more addons
  ];
}
```

## Integration with Init Generator

The addons generator supports the `installMode` pattern for programmatic invocation:

```typescript
// From init generator
await addonsGenerator(tree, {
  installMode: 'default', // or 'custom'
  selectionMode: 'all', // or 'specific'
  installationType: normalizedOptions.installationType, // 'global' or 'local'
  force: false,
  skipVerification: false,
});
```

**Behavior by installMode**:

- `installMode === 'default'`:

  - Skips all interactive prompts
  - Uses `installationType` from init generator (or defaults to 'global')
  - Uses provided `selectionMode` and other options
  - No user interaction required

- `installMode` undefined (standalone execution):
  - Shows `selectionMode` prompt (all vs specific)
  - Shows `installationType` prompt (global vs local)
  - Shows addon selection for 'specific' mode
  - Full interactive experience

## Configuration Updates

Addons update `~/.claude/claude.json` (global) or `./.claude/claude.json` (local):

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/slack-mcp"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-..."
      }
    }
  }
}
```

## Development Patterns

### Addon Setup Functions

For addons that require special setup (like aws-log-analyzer-mcp), create a setup file:

1. **Validate Prerequisites**:

   - Check for required tools
   - Verify configuration
   - Prompt for missing information

2. **File Operations**:

   - Create directories
   - Clone repositories
   - Install dependencies

3. **Configuration Updates**:

   - Update Claude config JSON
   - Preserve existing configuration
   - Merge MCP server definitions

4. **Post-Installation**:
   - Display success message
   - Show usage instructions
   - List next steps

### Error Handling

```typescript
try {
  await setupAddon(tree, options);
  logger.success(`✅ ${addonName} installed successfully`);
} catch (error) {
  logger.error(`❌ Failed to install ${addonName}`);
  logger.error(`Error: ${error.message}`);
  // Rollback changes if possible
}
```

## Related Documentation

- Parent package: `../../CLAUDE.md`
- MCP server documentation: External links per addon

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
