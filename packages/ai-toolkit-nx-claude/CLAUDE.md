# CLAUDE.md - @uniswap/ai-toolkit-nx-claude Package

## Overview

The `@uniswap/ai-toolkit-nx-claude` package provides Nx generators for installing Claude Code addon MCP servers. The package also includes the `claude-plus` script for enhanced Claude Code startup.

> **Note**: The init, add-command, add-agent, and hooks generators have been removed. For Claude Code setup, use the marketplace-based plugin architecture instead.

### Standalone Package Usage

This package can be run directly via npx without cloning the repository:

```bash
# For Uniswap organization members only
npx @uniswap/ai-toolkit-nx-claude@latest
```

Authentication to private npmjs registry is required (see README for setup instructions).

## Package Structure

```text
packages/ai-toolkit-nx-claude/
├── src/
│   ├── generators/
│   │   └── addons/     # MCP server addon installer
│   ├── scripts/
│   │   └── claude-plus/ # Enhanced Claude launcher with MCP + Slack
│   └── index.ts        # Package exports
├── generators.json     # Generator registration
└── package.json        # Package configuration
```

## Available Generators

### addons - MCP Server Addon Installer

**Purpose**: Install and configure Claude Code addons including MCP servers

**Usage**:

```bash
npx @uniswap/ai-toolkit-nx-claude@latest addons
# or
npx nx generate @uniswap/ai-toolkit-nx-claude:addons
```

**Key Features**:

- Interactive addon selection
- MCP server configuration
- Global or local installation
- Spec-workflow, AWS log analyzer, and more

**Documentation**: [src/generators/addons/CLAUDE.md](src/generators/addons/CLAUDE.md)

## Standalone Scripts

### claude-plus - Enhanced Claude Launcher

**Purpose**: Streamlined Claude Code startup with MCP server selection and Slack token management.

**Usage**:

```bash
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus
```

**Key Features**:

- **MCP Server Selection**: Runs claude-mcp-helper to interactively select which MCP servers to enable
- **Slack Token Management**: Validates Slack OAuth tokens and refreshes them if expired
- **Claude Launch**: Starts Claude Code after setup is complete
- **Graceful Degradation**: Continues even if MCP helper or Slack config is missing

**Options**:

- `--skip-mcp`: Skip MCP server selection
- `--skip-slack`: Skip Slack token validation
- `--dry-run`: Preview actions without executing
- `--verbose`: Show detailed output

**Shell Alias Setup**:

```bash
# Add to ~/.zshrc or ~/.bashrc
alias claude-plus="npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus"
```

**Documentation**: [src/scripts/claude-plus/CLAUDE.md](src/scripts/claude-plus/CLAUDE.md)

## Generator Development Patterns

### The installMode Pattern for Sub-Generators

**Critical Pattern for Preventing Duplicate Prompts**

When generators are called programmatically from parent generators, they need a way to know whether to prompt interactively or use defaults. The **installMode pattern** solves this:

**Problem**: When a parent generator calls a child generator programmatically, the child's `getExplicitlyProvidedOptions()` reads `process.argv` which contains the ORIGINAL CLI command, not the programmatic options. This causes the child to re-prompt for options that were already decided by the parent.

**Solution**: Add a hidden `installMode` parameter that parent generators can pass to control child behavior:

**Implementation Steps**:

1. **In schema.json**: Add `installMode` property with `hidden: true`

```json
{
  "installMode": {
    "type": "string",
    "description": "Installation mode from parent generator (default or custom)",
    "enum": ["default", "custom"],
    "hidden": true
  }
}
```

2. **In schema.d.ts**: Add to TypeScript interface

```typescript
interface MyGeneratorSchema {
  installMode?: 'default' | 'custom';
  // ... other properties
}
```

3. **In generator.ts**: Check installMode before prompting

```typescript
if (options.installMode === 'default') {
  // Skip prompts, use defaults
  normalizedOptions = {
    option1: options.option1 !== false,
    option2: options.option2 || false,
    installMode: 'default',
  };
} else {
  // Normal prompting flow
  normalizedOptions = await promptForMissingOptions(...);
}
```

4. **In parent generator**: Pass installMode when calling child

```typescript
await childGenerator(tree, {
  installMode: normalizedOptions.installMode,
  // ... other options
});
```

**Benefits**:

- Eliminates duplicate prompts
- Maintains backward compatibility (works standalone)
- Hidden property doesn't clutter CLI help
- Clear control flow between parent and child generators

**Generators Using This Pattern**: addons

### Schema-Driven Prompting

All generators use a sophisticated schema-driven approach for user interaction that extends standard JSON Schema with custom prompt properties:

1. **schema.json**: Defines all configuration options with custom extensions
2. **schema.d.ts**: TypeScript interface for type safety
3. **prompt-utils.ts**: Shared utility for generating prompts from schema
4. **Custom Properties**: Multiple ways to control prompting behavior

#### Custom Schema Properties

The package implements several custom schema properties that extend JSON Schema for rich CLI interactions:

##### Standard x-prompt (Nx Compatible)

```json
{
  "installationType": {
    "type": "string",
    "enum": ["global", "local"],
    "x-prompt": "Choose installation location"
  }
}
```

##### Enhanced Prompt Properties (Our Extensions)

We've extended the schema system with additional properties for finer control:

```json
{
  "backup": {
    "type": "boolean",
    "default": true,
    "always-prompt": true, // Force prompting even when default exists
    "prompt-message": "💾 Backup existing configuration?", // Custom message with emoji
    "prompt-type": "confirm" // Specify prompt type explicitly
  },
  "commands": {
    "type": "array",
    "prompt-type": "multiselect",
    "prompt-items": [
      // Custom items for select/multiselect
      { "value": "cmd1", "label": "Command 1 - Description" },
      { "value": "cmd2", "label": "Command 2 - Description" }
    ],
    "prompt-when": "installationType === 'local'" // Conditional prompting
  }
}
```

#### Prompt Control Properties

| Property         | Type             | Purpose                                    | Example                      |
| ---------------- | ---------------- | ------------------------------------------ | ---------------------------- |
| `x-prompt`       | string \| object | Nx-compatible prompt configuration         | `"Choose an option"`         |
| `always-prompt`  | boolean          | Force prompting even with defaults         | `true`                       |
| `prompt-message` | string           | Custom prompt message (overrides x-prompt) | `"💾 Backup?"`               |
| `prompt-type`    | string           | Explicit prompt type                       | `"confirm"`, `"multiselect"` |
| `prompt-items`   | array            | Custom items for select prompts            | `[{value, label}]`           |
| `prompt-when`    | string           | Conditional expression for prompting       | `"mode === 'advanced'"`      |

#### Prompt Resolution Logic

The prompt-utils.ts utility resolves prompts with the following precedence:

1. **Skip if explicitly provided via CLI** (unless `always-prompt: true`)
2. **Check conditional prompting** (`prompt-when` expression)
3. **Message resolution order**:
   - `prompt-message` (highest priority)
   - `x-prompt.message` or `x-prompt` string
   - Auto-generated from property name
4. **Type resolution order**:
   - `prompt-type` (highest priority)
   - `x-prompt.type`
   - Inferred from schema type and constraints

#### CLI Parsing Enhancements

The package includes sophisticated CLI argument parsing to handle:

- **Nx flag variations**: `--no-interactive`, `--non-interactive`, etc.
- **Boolean negations**: `--no-backup`, `--skip-tests`
- **Camel/kebab conversion**: `--dry-run` → `dryRun`
- **Explicit tracking**: Distinguishes CLI-provided vs. default values

Example schema showcasing all features:

```json
{
  "$schema": "https://json-schema.org/schema",
  "properties": {
    "mode": {
      "type": "string",
      "enum": ["sound", "speech", "both"],
      "prompt-message": "🔊 Select notification type",
      "prompt-type": "select",
      "default": "sound"
    },
    "test": {
      "type": "boolean",
      "always-prompt": true,
      "prompt-message": "🧪 Test notifications after installation?",
      "prompt-type": "confirm",
      "default": false
    },
    "verbose": {
      "type": "boolean",
      "description": "Show detailed output",
      "x-prompt": {
        "message": "Enable verbose logging?",
        "type": "confirm"
      }
    }
  }
}
```

### Error Handling Patterns

Consistent error handling across generators:

1. Validate prerequisites (CLI tools, paths)
2. Confirm destructive operations
3. Create backups before modifications
4. Provide rollback on failure
5. Clear error messages with remediation steps

### File Operation Patterns

Standard approaches for file management:

1. Check existence before write
2. Offer overwrite confirmation
3. Use dry-run mode for preview
4. Create manifests for tracking
5. Preserve user customizations

## Shared Utilities

### prompt-utils.ts

Located at `src/utils/prompt-utils.ts`, this utility is shared by multiple generators for consistent prompting:

**Core Functions**:

- **promptForMissingOptions**: Main entry point that processes schema and handles all prompting
- **promptForProperty**: Type-specific prompt generation with custom property support
- **promptMultiSelectWithAll**: Enhanced multi-select with "All" option
- **getPromptMessage**: Resolves prompt message from multiple sources (prompt-message, x-prompt, auto-generated)
- **parseCliArgs**: Sophisticated CLI argument parser handling Nx variations

**Key Features**:

- Handles both Map and Set for tracking explicitly provided options
- Supports conditional prompting via `prompt-when` expressions
- Respects `always-prompt` to force user interaction
- Provides context-aware prompts (e.g., "exists globally" indicators)
- Full support for no-interactive mode

### Common Patterns

1. **Installation Detection**: Check both global and local locations
2. **Cross-Location Awareness**: Show "(exists globally/locally)" indicators
3. **Multi-Select with All**: Use 'a' key to toggle all items in prompts
4. **No-Interactive Mode**: Support CI/CD with --no-interactive
5. **Force Mode**: Override safety checks with --force

## Integration with Nx

### Generator Registration

All generators are registered in `generators.json`:

```json
{
  "generators": {
    "addons": {
      "factory": "./dist/generators/addons/generator",
      "schema": "./dist/generators/addons/schema.json",
      "description": "Install and configure Claude Code addons including MCP servers"
    }
  }
}
```

### Building and Testing

```bash
# Build the package
npx nx build ai-toolkit-nx-claude

# Run tests
npx nx test ai-toolkit-nx-claude

# Test generators locally
npx nx generate @uniswap/ai-toolkit-nx-claude:addons --dry-run
```

### Nx Workspace Integration

The package leverages Nx features:

- **Project Configuration**: Defined in project.json
- **Build System**: Uses @nx/js:tsc executor
- **Testing**: Uses @nx/jest:jest executor
- **Linting**: Integrated with workspace ESLint config
- **Formatting**: Uses workspace Prettier config

## Development Guidelines

### Adding New Generators

1. Create generator directory: `src/generators/[name]/`
2. Add required files:
   - `generator.ts` - Main logic
   - `schema.json` - Configuration schema
   - `schema.d.ts` - TypeScript types
   - `generator.spec.ts` - Tests
   - `README.md` - User documentation
   - `CLAUDE.md` - AI assistant documentation
3. Register in `generators.json`
4. Export from `src/index.ts` if needed
5. Update this CLAUDE.md file

### Testing Strategy

Each generator should have:

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test full generator flow
3. **Schema Tests**: Validate schema structure
4. **Prompt Tests**: Test interactive flows
5. **File Operation Tests**: Test read/write operations

### Documentation Requirements

Every generator MUST maintain:

1. **README.md**: User-facing documentation
2. **CLAUDE.md**: AI assistant documentation
3. **Schema comments**: Describe each option
4. **Code comments**: Explain complex logic
5. **Update package CLAUDE.md**: Keep this file current

## Future Enhancements

### Planned Generators

1. **update-command**: Update existing commands
2. **remove-command**: Remove installed commands
3. **update-agent**: Update existing agents
4. **remove-agent**: Remove installed agents
5. **migrate**: Migrate configurations between versions

### Planned Features

1. **Version Management**: Track and update content versions
2. **Dependency Resolution**: Handle command/agent dependencies
3. **Conflict Detection**: Detect incompatible configurations
4. **Rollback System**: Comprehensive undo capabilities
5. **Configuration Profiles**: Multiple configuration sets

## Package Dependencies

### Runtime Dependencies

- `@nx/devkit`: Nx generator utilities
- `enquirer`: Interactive prompts
- Built-in Node.js modules (fs, path, child_process)

### External Tools (via generators)

- **addons**: Requires Claude CLI for MCP server configuration

## Maintenance Requirements

⚠️ **CRITICAL**: This CLAUDE.md file must be updated whenever:

- New generators are added
- Generator functionality changes
- Schema properties are modified
- New patterns are established
- Dependencies change
- File structures change

This documentation serves as the source of truth for AI assistants working with the ai-toolkit-nx-claude package.

## Publishing and Distribution

### Automated Publishing

Publishing is handled through GitHub Actions (`.github/workflows/ci-publish-packages.yml`):

1. **Trigger**: On push to main or next branch
2. **Detection**: Uses Nx affected to detect changed packages
3. **Versioning**:
   - **main branch**: Standard versioning with conventional commits (e.g., `0.4.0`)
   - **next branch**: Prerelease versioning with `-next.X` suffix (e.g., `0.4.0-next.0`)
4. **Publishing**:
   - **main branch**: Published with `latest` npm tag
   - **next branch**: Published with `next` npm tag
5. **GitHub Releases**: Created automatically with changelog

### Manual Publishing

For manual publishing (maintainers only):

```bash
# Build the package
npx nx build ai-toolkit-nx-claude

# For main branch (latest):
npx nx release version --projects=@uniswap/ai-toolkit-nx-claude
npx nx release publish --projects=@uniswap/ai-toolkit-nx-claude --tag=latest

# For next branch (prerelease):
npx nx release version --projects=@uniswap/ai-toolkit-nx-claude --preid=next --prerelease
npx nx release publish --projects=@uniswap/ai-toolkit-nx-claude --tag=next
```

### Fixing Version Misalignment

If the `next` branch version gets out of sync with `latest`:

```bash
# Run the reset script to fix prerelease versioning
./packages/ai-toolkit-nx-claude/scripts/reset-prerelease-version.sh
```

## Version History

- **1.0.0**: Initial release with init generator
- **1.1.0**: Added hooks generator for notifications
- **1.2.0**: Added automatic fallback mechanism for Claude CLI installation (curl → npm)
- **1.3.0**: Added standalone package publishing and direct npx/npx execution
- **0.6.0**: Removed init, add-command, and add-agent generators (replaced by marketplace plugins)
- **0.6.x**: Removed hooks generator (use Claude Code hooks directly via settings)
- Future versions will be documented here
