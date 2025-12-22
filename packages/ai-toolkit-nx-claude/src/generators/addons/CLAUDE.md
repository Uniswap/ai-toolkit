# Addons Generator

## Purpose

Nx generator for installing optional add-on components to the AI Toolkit. Add-ons provide extended functionality like MCP servers, workflows, and integrations.

## Usage

```bash
# Interactive mode (recommended)
npx nx generate @uniswap/ai-toolkit-nx-claude:addons

# Install all addons
npx nx generate @uniswap/ai-toolkit-nx-claude:addons --install-mode=all

# Install specific addon
npx nx generate @uniswap/ai-toolkit-nx-claude:addons \
  --install-mode=specific \
  --addon=spec-mcp-workflow
```

## Options

### Installation Control

- `selectionMode` - Selection mode for which addons to install:
  - `all` - Install all available addons
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

Registered in `addon-registry.ts`:

### 1. spec-mcp-workflow

**Purpose**: MCP server for spec-driven development workflows

**Features**:

- Spec document management
- Task orchestration
- Approval workflows
- Steering document integration

**Setup File**: `spec-workflow-setup.ts`

**Installation**:

- Adds MCP server configuration to Claude config
- Creates `.spec-workflow/` directory structure
- Installs necessary dependencies

### 2. aws-log-analyzer

**Purpose**: MCP server for AWS CloudWatch log analysis

**Features**:

- CloudWatch log querying
- Log pattern detection
- Error analysis
- Performance metrics

**Setup File**: `aws-log-analyzer-setup.ts`

**Installation**:

- Adds MCP server configuration
- Prompts for AWS credentials
- Creates necessary configuration files

### 3. claude-mcp-installer

**Purpose**: Universal MCP server installer

**Features**:

- Discover available MCP servers
- Install from Claude MCP registry
- Manage MCP server configurations
- Auto-detect and configure servers

**Setup File**: `claude-mcp-installer.ts`

**Installation**:

- Interactive server selection
- Auto-configuration with sensible defaults
- Integration with existing Claude config

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
     - Run addon's setup function
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
- `*-setup.ts` - Individual addon setup implementations

## Addon Registry

The registry (`addon-registry.ts`) defines available addons:

```typescript
export interface AddonDefinition {
  id: string;
  name: string;
  description: string;
  setupFunction: (tree: Tree, options: any) => Promise<void>;
  dependencies?: string[];
}

export const addons: AddonDefinition[] = [
  {
    id: 'spec-mcp-workflow',
    name: 'Spec MCP Workflow',
    description: 'Spec-driven development with MCP server',
    setupFunction: setupSpecWorkflow,
  },
  // ... more addons
];
```

## Creating New Addons

### Step 1: Create Setup File

Create `{addon-name}-setup.ts`:

```typescript
export async function setupMyAddon(tree: Tree, options: AddonsGeneratorSchema): Promise<void> {
  // 1. Validate prerequisites
  // 2. Create configuration files
  // 3. Update Claude config
  // 4. Install dependencies
  // 5. Provide usage instructions
}
```

### Step 2: Register in addon-registry.ts

```typescript
{
  id: 'my-addon',
  name: 'My Addon',
  description: 'Description of what it does',
  setupFunction: setupMyAddon,
  dependencies: ['optional-deps']
}
```

### Step 3: Test

```bash
npx nx generate @uniswap/ai-toolkit-nx-claude:addons \
  --install-mode=specific \
  --addon=my-addon \
  --dry-run
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
  dashboardMode: 'always',
  port: 0,
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
    "spec-workflow": {
      "command": "node",
      "args": ["/path/to/spec-workflow-server.js"],
      "env": {
        "WORKSPACE_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

## Development Patterns

### Addon Setup Functions

All setup functions follow this pattern:

1. **Validate Prerequisites**:

   - Check for required tools
   - Verify configuration
   - Prompt for missing information

2. **File Operations**:

   - Create directories
   - Generate configuration files
   - Copy templates

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
- Init generator (caller): `../init/CLAUDE.md`
- MCP server documentation: External links per addon

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
