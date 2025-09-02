# CLAUDE.md - Init Generator

## Overview

The `init` generator is the primary entry point for setting up Claude Code configurations in projects. It provides a one-shot, interactive installer that deploys curated commands and agents from the AI Toolkit content packages to either a global or local installation directory.

## Core Functionality

### What It Does

1. **Claude CLI Check**: Verifies Claude CLI installation and offers to install it if missing
2. **Automatic Fallback Installation**: If curl installation fails, automatically attempts npm installation as fallback
3. **Installation Type Selection**: Prompts user to choose between global (~/.claude) or local (./.claude) installation
4. **Local Path Confirmation**: For local installations only, confirms the user is at project root (exits if not)
5. **Schema-Driven Interactive Setup**: Dynamically generates prompts from `schema.json` for all configuration options
6. **Cross-Location Detection**: Shows when files exist in the other location (e.g., "exists globally" when installing locally)
7. **Overwrite Detection**: Indicates which files will be overwritten in the target location
8. **Smart Multi-Select**: Provides multi-select with 'a' key for toggle all functionality
9. **Content Deployment**: Copies selected commands and agents from content packages to the target directory
10. **Manifest Generation**: Creates a `manifest.json` file tracking installed components, version, and installation metadata
11. **Collision Detection**: Checks for existing installations and prompts for overwrite confirmation (unless forced)
12. **Installation Verification**: Verifies successful installation using `claude doctor` or `which claude`

### Claude CLI Installation

The generator automatically handles Claude CLI installation with intelligent fallback:

1. **Primary Method (curl)**: Attempts to install using the official curl script

   - Command: `curl -fsSL https://claude.ai/install.sh | bash`
   - Works best on macOS and most Linux distributions
   - 5-minute timeout protection

2. **Fallback Method (npm)**: Automatically triggered if curl fails

   - Command: `npm install -g @anthropic-ai/claude-code`
   - Better for restricted environments or Windows systems
   - Does NOT use sudo to avoid permission issues
   - Handles specific error cases:
     - npm not found: Prompts to install Node.js
     - Permission errors: Suggests manual installation with `migrate-installer`
     - Network failures: Provides manual instructions

3. **Verification**: After successful installation (either method)

   - Primary check: Runs `claude doctor` to verify setup
   - Fallback check: Uses `which claude` if doctor command unavailable
   - PATH warnings: Alerts if CLI installed but not in PATH

4. **Manual Instructions**: Provided if both methods fail
   - Shows curl and npm commands for manual execution
   - Links to official documentation
   - Suggests troubleshooting with `claude doctor`

### Installation Modes

- **Global**: Installs to `~/.claude/` for user-wide configurations
- **Local**: Installs to `./.claude/` in the current directory for project-specific configurations
  - Requires confirmation that you're at the project root
  - Exits if not at project root

### Content Sources

The generator pulls content from:

- `@ai-toolkit/commands-agnostic`: Language-agnostic command templates
- `@ai-toolkit/agents-agnostic`: Language-agnostic agent configurations

## Generator Options

### Optional Parameters

- `installationType`: Choose between 'global' or 'local' installation
- `confirmLocalPath`: For local installations, confirms you're at project root (auto-prompted if not provided)
- `commands`: Array of specific command names to install
- `agents`: Array of specific agent names to install
- `dry`: Preview installation without making changes (dry-run mode)
- `nonInteractive`: Skip all prompts and use provided options
- `force`: Overwrite existing installation without confirmation

## Usage Examples

### Interactive Mode (Default)

When run without options, the generator will interactively prompt for all configuration choices:

```bash
bunx nx generate @uniswap/ai-toolkit-nx-claude:init
```

The interactive flow will:

1. Check if Claude CLI is installed (offer to install if missing)
2. Ask for installation type (global or local)
3. For local installations only: Confirm you're at project root (exits if not)
4. Show command selection with indicators for existing files:
   - "(will overwrite)" for files in target location
   - "(exists globally/locally)" for files in other location
5. Show agent selection with same indicators
6. Ask for dry-run mode preference
7. If existing installation detected: Ask to force overwrite

### Non-Interactive Global Installation

```bash
bunx nx generate @uniswap/ai-toolkit-nx-claude:init --no-interactive --installation-type=global --commands=review-pr,gen-tests,plan-feature --agents=test-writer,doc-writer,planner
```

### Non-Interactive Local Installation

```bash
# Must be run from project root

bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:init --no-interactive --installation-type=local --confirm-local-path=true --commands=review-pr,gen-tests,plan --agents=test-writer,doc-writer,planner
=======
bunx nx generate @uniswap/ai-toolkit-nx-claude:init --no-interactive --installation-type=local --confirm-local-path=true --commands=review-pr,gen-tests,plan-feature --agents=test-writer,doc-writer,planner
### Dry Run to Preview
```bash
bunx nx generate @uniswap/ai-toolkit-nx-claude:init --dry
```

In dry-run mode, if Claude CLI is not installed, the generator will show:

- The installation methods that would be attempted (curl → npm → manual)
- The files that would be installed
- No actual changes will be made to the system

### Selective Installation

```bash
bunx nx generate @uniswap/ai-toolkit-nx-claude:init --installation-type=global --commands=review-pr,gen-tests --agents=test-writer,doc-writer
```

## File Structure Created

### Global Installation (~/.claude/)

```
~/.claude/
├── commands/
│   ├── review-pr.md
│   ├── gen-tests.md
│   ├── plan.md
│   ├── explain-file.md
│   ├── fix-bug.md
│   └── refactor.md
├── agents/
│   ├── test-writer.md
│   ├── doc-writer.md
│   ├── code-explainer.md
│   ├── debug-assistant.md
│   ├── refactorer.md
│   └── style-enforcer.md
└── manifest.json
```

### Local Installation (./.claude/)

```
./.claude/
├── commands/
│   ├── review-pr.md
│   ├── gen-tests.md
│   ├── plan.md
│   ├── explain-file.md
│   ├── fix-bug.md
│   └── refactor.md
├── agents/
│   ├── test-writer.md
│   ├── doc-writer.md
│   ├── code-explainer.md
│   ├── debug-assistant.md
│   ├── refactorer.md
│   └── style-enforcer.md
└── manifest.json
```

## Manifest File Structure

The generated `manifest.json` contains:

```json
{
  "version": "1.0.0",
  "installedAt": "2024-01-15T10:30:00.000Z",
  "commands": ["review-pr", "gen-tests", ...],
  "agents": ["test-writer", "doc-writer", ...],
  "files": ["commands/review-pr.md", "agents/test-writer.md", ...]
}
```

## Implementation Details

### Key Components

1. **initGenerator**: Main generator function that orchestrates the installation
   - Checks Claude CLI installation
   - Handles installation type selection (global/local)
   - Validates local installation path
   - Detects existing files in both locations
   - Orchestrates file copying and manifest creation
2. **Claude CLI Installation Functions**:
   - **installClaude**: Main orchestrator for installation with fallback logic
   - **installViaCurl**: Primary installation method using official curl script
   - **installViaNpm**: Fallback installation method using npm
   - **verifyInstallation**: Verifies CLI installation success
   - **provideManualInstructions**: Displays manual installation steps when auto-install fails
3. **prompt-utils.ts**: Schema-driven prompt generation module
   - **promptForMissingOptions**: Reads schema.json and generates prompts for missing options
   - **promptForProperty**: Handles different property types (boolean, string, array, enum)
   - **promptMultiSelectWithAll**: Enhanced multi-select with file existence indicators
4. **checkExistingFiles**: Detects which files already exist in target locations
5. **promptOverwrite**: Manages collision detection and user confirmation
6. **checkClaudeInstalled**: Checks if Claude CLI is already installed
7. **promptInstallClaude**: Prompts user for consent to install Claude CLI

### Schema-Driven Prompting

The generator uses `schema.json` as the single source of truth for all options:

- Automatically discovers all configurable options
- Generates appropriate prompt types based on schema property types
- Supports x-prompt hints from the schema for custom prompt messages
- Special handling for conditional prompts (e.g., confirmLocalPath only for local installations)
- Dynamic choice enhancement with file existence indicators

### Content Resolution

- Commands and agents are imported from their respective content packages
- File paths are resolved relative to the compiled output directory
- Content is read from source files and written to the target directory

### Error Handling

- Validates target directory existence
- Checks for existing installations
- Handles missing content gracefully
- Provides informative logging throughout the process
- **Installation-specific error handling**:
  - Command not found errors (curl/npm)
  - Permission denied errors
  - Network timeouts (5-minute limit)
  - PATH configuration issues
  - Platform compatibility warnings

## Development Notes

### Adding New Content

To add new commands or agents:

1. Add them to the respective content packages (`@ai-toolkit/commands-*` or `@ai-toolkit/agents-*`)
2. Export them from the package's index file
3. The init generator will automatically discover them

### Testing the Generator

```bash
# Build the plugin first
bunx nx build nx-claude

# Test global installation with dry-run
bunx nx generate @uniswap/ai-toolkit-nx-claude:init --dry --installation-type=global

# Test local installation (must be at project root)
bunx nx generate @uniswap/ai-toolkit-nx-claude:init --installation-type=local --confirm-local-path=true

# Test interactive mode
bunx nx generate @uniswap/ai-toolkit-nx-claude:init

# Verify global installation
ls -la ~/.claude/
cat ~/.claude/manifest.json

# Verify local installation
ls -la ./.claude/
cat ./.claude/manifest.json
```

## Maintenance Requirements

⚠️ **IMPORTANT**: Whenever the init generator is updated, this CLAUDE.md file MUST also be updated to reflect any changes in:

- Functionality
- Options/parameters
- File structure
- Content sources
- Usage patterns
- Implementation details

It should, at any given point in time, be a snapshot of the functionality of this generator. This ensures that Claude Code and other AI assistants have accurate, up-to-date information about the generator's capabilities and usage.
