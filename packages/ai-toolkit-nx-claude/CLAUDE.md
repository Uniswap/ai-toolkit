# CLAUDE.md - @ai-toolkit/ai-toolkit-nx-claude Package

## Overview

The `@ai-toolkit/ai-toolkit-nx-claude` package (published as `@uniswap/ai-toolkit-nx-claude` to GitHub Packages) provides Nx generators for setting up and managing Claude Code configurations, commands, agents, and notification hooks. This package is the primary tooling interface for the AI Toolkit, offering both one-shot installers and incremental configuration management.

### Standalone Package Usage

This package can be run directly via npx/bunx without cloning the repository:

```bash
# For Uniswap organization members only
npx --registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude

# Or install globally first
npm install -g @uniswap/ai-toolkit-nx-claude --registry=https://npm.pkg.github.com
ai-toolkit-nx-claude
```

Authentication to GitHub Packages is required (see README for setup instructions).

## Package Structure

```
packages/ai-toolkit-nx-claude/
├── src/
│   ├── generators/
│   │   ├── init/               # One-shot installer for commands/agents
│   │   ├── hooks/              # Notification hooks installer
│   │   ├── setup-registry-proxy/ # Shell proxy for GitHub registry routing
│   │   ├── add-command/        # Add individual commands
│   │   ├── add-agent/          # Add individual agents
│   │   └── content-package/    # Create new content packages
│   └── index.ts            # Package exports
├── generators.json         # Generator registration
└── package.json           # Package configuration
```

## Available Generators

### 1. init - One-Shot Configuration Installer

**Purpose**: Primary entry point for setting up Claude Code configurations

**Usage**:

```bash
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:init
```

**Key Features**:

- Interactive installation wizard
- **Automatic Claude CLI installation with fallback mechanism**:
  - Primary: curl installation method
  - Fallback: npm installation if curl fails
  - Manual: Instructions provided if both fail
- Global (~/.claude) or local (./.claude) installation
- Detects existing files and offers overwrite options
- Creates manifest.json for tracking installations
- Sources content from @ai-toolkit content packages
- Cross-platform support (macOS, Linux, Windows)

**Documentation**: [src/generators/init/CLAUDE.md](src/generators/init/CLAUDE.md)

### 2. hooks - Notification Hooks Installer

**Purpose**: Installs audio/speech notifications for Claude Code

**Usage**:

```bash
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks
```

**Key Features**:

- Automated hook installation process
- Sound or speech notifications
- Automatic backup and rollback
- Cross-platform support
- Test mode for verification

**Documentation**: [src/generators/hooks/CLAUDE.md](src/generators/hooks/CLAUDE.md)

### 3. setup-registry-proxy - GitHub Registry Router

**Purpose**: Configures shell proxy to automatically route @uniswap/ai-toolkit\* packages to GitHub registry

**Usage**:

```bash
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:setup-registry-proxy
```

**Key Features**:

- Automatic shell detection (bash, zsh, fish)
- Creates proxy functions for npm/npx/yarn/bun/pnpm commands
- Selectively adds `--registry` flag only for matching packages
- Preserves normal registry for all other packages
- Automatic shell configuration updates
- Backup and restore capabilities

**Documentation**: [src/generators/setup-registry-proxy/README.md](src/generators/setup-registry-proxy/README.md)

### 4. add-command - Add Individual Commands

**Purpose**: Add a single command to an existing Claude configuration

**Usage**:

```bash
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:add-command
```

**Status**: Placeholder implementation - needs completion

### 5. add-agent - Add Individual Agents

**Purpose**: Add a single agent to an existing Claude configuration

**Usage**:

```bash
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:add-agent
```

**Status**: Placeholder implementation - needs completion

### 6. content-package - Create Content Packages

**Purpose**: Scaffold new content packages for commands or agents

**Usage**:

```bash
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:content-package
```

**Status**: Placeholder implementation - needs completion

## Generator Development Patterns

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

### Content Resolution

Generators source content from dedicated packages:

- `@ai-toolkit/commands-agnostic`: Language-agnostic commands
- `@ai-toolkit/agents-agnostic`: Language-agnostic agents
- Future: Language-specific content packages

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
3. **Batch Operations**: Support --all-commands, --all-agents flags
4. **No-Interactive Mode**: Support CI/CD with --no-interactive
5. **Force Mode**: Override safety checks with --force

## Integration with Nx

### Generator Registration

All generators are registered in `generators.json`:

```json
{
  "generators": {
    "init": {
      "factory": "./dist/generators/init/generator",
      "schema": "./dist/generators/init/schema.json",
      "description": "One-shot installer for Claude Code configs"
    },
    "hooks": {
      "factory": "./dist/generators/hooks/generator",
      "schema": "./dist/generators/hooks/schema.json",
      "description": "Install Claude Code notification hooks"
    }
    // ... other generators
  }
}
```

### Building and Testing

```bash
# Build the package
bunx nx build ai-toolkit-nx-claude

# Run tests
bunx nx test ai-toolkit-nx-claude

# Test generators locally
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:init --dry-run
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks --dry-run
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

### Content Dependencies

- `@ai-toolkit/commands-agnostic`: Command templates
- `@ai-toolkit/agents-agnostic`: Agent configurations

### External Tools (via generators)

- **init**: Requires Claude CLI (checks and offers installation)
- **hooks**: Requires Node.js, npm, Git

## Maintenance Requirements

⚠️ **CRITICAL**: This CLAUDE.md file must be updated whenever:

- New generators are added
- Generator functionality changes
- Schema properties are modified
- New patterns are established
- Dependencies change
- File structures change

This documentation serves as the source of truth for AI assistants working with the ai-toolkit-nx-claude package.

## Troubleshooting

### Claude CLI Installation Issues

If the `init` generator fails to install Claude CLI:

1. **curl fails on Linux/WSL**: The generator will automatically attempt npm installation
2. **npm permission errors**: Run `npm install -g @anthropic-ai/claude-code` manually, then `claude migrate-installer`
3. **npm not found**: Install Node.js from <https://nodejs.org/>
4. **PATH issues**: After installation, restart your terminal or manually add Claude to PATH
5. **Platform-specific issues**: Visit <https://claude.ai/download> for platform-specific instructions

The generator provides automatic fallback from curl to npm installation, ensuring Claude CLI can be installed on most systems.

## Publishing and Distribution

### Package Publishing Configuration

The package is configured for standalone publishing to GitHub Packages:

- **Package Scope**: `@uniswap/ai-toolkit-nx-claude`
- **Registry**: GitHub Packages (`https://npm.pkg.github.com`)
- **Access**: Restricted to Uniswap organization members
- **CLI Entry**: `dist/cli.js` for direct execution via npx/bunx
- **Assets Bundling**: Content from agent/command packages bundled at build time

### Automated Publishing

Publishing is handled through GitHub Actions (`.github/workflows/publish-packages.yml`):

1. **Trigger**: On push to main branch
2. **Detection**: Uses Nx affected to detect changed packages
3. **Versioning**: Conventional commits determine version bumps
4. **Publishing**: Automatic publish to GitHub Packages
5. **GitHub Releases**: Created automatically with changelog

### Manual Publishing

For manual publishing (maintainers only):

```bash
# Build the package
bunx nx build ai-toolkit-nx-claude

# Version the package (first release)
bunx nx release version --projects=@uniswap/ai-toolkit-nx-claude --first-release

# Publish to GitHub Packages
bunx nx release publish --projects=@uniswap/ai-toolkit-nx-claude
```

## Version History

- **1.0.0**: Initial release with init generator
- **1.1.0**: Added hooks generator for notifications
- **1.2.0**: Added automatic fallback mechanism for Claude CLI installation (curl → npm)
- **1.3.0**: Added standalone package publishing and direct npx/bunx execution
- Future versions will be documented here
