# CLAUDE.md - Init Generator

## Overview

The `init` generator is the primary entry point for setting up Claude Code configurations in projects. It provides a one-shot, interactive installer that deploys curated commands and agents from the AI Toolkit content packages to either a global or local installation directory.

## Core Functionality

### Two Installation Modes

The generator provides two distinct paths:

#### 1. Default Installation Mode (`installMode: 'default'`)

**Purpose**: Get started quickly with recommended components for most users.

**Characteristics**:

- Pre-selects 6 essential commands (explore, plan, review-plan, execute-plan, address-pr-issues)
- Pre-selects 6 essential agents (context-loader, planner, plan-reviewer, test-writer, doc-writer, pr-reviewer)
- Installs globally by default (~/.claude)
- Only prompts for notification hooks (recommended)
- Skips dry-run mode (always performs installation)
- Shows summary of pre-selected components before installation

**User Experience**:

```
📦 Default Installation Mode
   Installing recommended setup with pre-selected components

📍 Location: Global (~/.claude)
📝 Commands: 6 pre-selected
🤖 Agents: 6 pre-selected

🔔 Install notification hooks? (y/n)
```

#### 2. Custom Installation Mode (`installMode: 'custom'`)

**Purpose**: Full control for power users who want to choose exactly what to install.

**Characteristics**:

- Prompts for installation location (global/local)
- Prompts whether to install commands (yes/no)
- If installing commands → multi-select which ones
- Prompts whether to install agents (yes/no)
- If installing agents → multi-select which ones
- Prompts for notification hooks (yes/no)
- After hooks, prompts for addons like spec-mcp-workflow (yes/no)
- Prompts for dry-run mode (yes/no)

**User Experience**:

```
📍 Would you like to install globally or locally?
📝 Install slash commands? (y/n)
🤖 Install AI agents? (y/n)
🔔 Install notification hooks? (y/n)
🔌 Install addons? (y/n)
👁️ Run in dry-run mode? (y/n)
```

Note: The addons prompt appears after notification hooks have been installed in the custom flow.

### What It Does

1. **Mode Detection**: Determines installation mode (default vs custom) from CLI flag or interactive menu selection
2. **Claude CLI Check**: Verifies Claude CLI installation and offers to install it if missing
3. **Automatic Fallback Installation**: If curl installation fails, automatically attempts npm installation as fallback
4. **Default Mode Pre-Configuration**: For default mode, auto-populates recommended selections and skips most prompts
5. **Installation Type Selection**: For custom mode, prompts user to choose between global (~/.claude) or local (./.claude) installation
6. **Local Path Confirmation**: For local installations in custom mode, confirms the user is at project root (exits if not)
7. **Schema-Driven Interactive Setup**: Dynamically generates prompts from `schema.json` based on `prompt-when` conditions
8. **Conditional Prompting**: Only shows relevant prompts based on mode and previous answers (e.g., command selection only if installCommands=true)
9. **Cross-Location Detection**: Shows when files exist in the other location (e.g., "exists globally" when installing locally)
10. **Overwrite Detection**: Indicates which files will be overwritten in the target location
11. **Smart Multi-Select**: Provides multi-select with 'a' key for toggle all functionality
12. **Integrated Hooks Installation**: Can install notification hooks as part of the flow (no separate command needed)
13. **Integrated Addons Installation**: Can install addons like spec-mcp-workflow (custom mode only; prompted after hooks)
14. **Content Deployment**: Copies selected commands and agents from content packages to the target directory
15. **Manifest Generation**: Creates a `manifest.json` file tracking installed components, version, and installation metadata
16. **Collision Detection**: Checks for existing installations and prompts for overwrite confirmation (unless forced)
17. **Installation Verification**: Verifies successful installation using `which claude` (optional: `claude --version`)
18. **Auto-Update Checker Installation**: Installs background update checker to shell configuration (bash/zsh/fish)
19. **Installation Summary**: Shows comprehensive summary of what was installed

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

   - Primary check: Uses `which claude` to confirm availability on PATH
   - Optional: Run `claude --version` or `claude doctor` manually for deeper checks
   - PATH warnings: Alerts if CLI installed but not in PATH

4. **Manual Instructions**: Provided if both methods fail
   - Shows curl and npm commands for manual execution
   - Links to official documentation
   - Suggests troubleshooting with `claude doctor`

### Auto-Update Checker

After successful installation, the generator automatically installs an update checker to your shell configuration:

**Installation Process**:

1. **Shell Detection**: Detects your shell type (bash, zsh, or fish)
2. **Version Extraction**: Reads current package version from package.json
3. **Config Backup**: Creates timestamped backup of shell config (e.g., `~/.zshrc.backup-1234567890`)
4. **Script Injection**: Adds update check script between `AI_TOOLKIT_UPDATE_CHECK` markers
5. **Self-Updating**: Re-running init updates the script version in your shell config

**Update Check Script Features**:

- **Weekly Frequency**: Checks once per week using cache file `~/.uniswap-ai-toolkit/.last-update-check`
- **Background Execution**: Runs in background to avoid blocking shell startup (<5ms overhead)
- **Version Tracking**: Stores current version in script comment for self-maintenance
- **npm Registry Query**: Queries npm for `@uniswap/ai-toolkit-nx-claude` latest version
- **User Notification**: Displays message when update available with upgrade instructions
- **Disable Option**: Respects `AI_TOOLKIT_SKIP_UPDATE_CHECK=1` environment variable

**User Experience**:

When an update is available, users see this on shell startup (once per week):

```
📦 AI Toolkit update available: 0.5.7 → 0.6.0
   Run: npx @uniswap/ai-toolkit-nx-claude@latest init
   Disable these checks: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1
```

**Disabling Updates**:

```bash
# Temporary (one session)
export AI_TOOLKIT_SKIP_UPDATE_CHECK=1

# Permanent (add to shell config)
echo "export AI_TOOLKIT_SKIP_UPDATE_CHECK=1" >> ~/.zshrc
```

**Error Handling**:

- If update checker installation fails, a warning is shown but installation continues
- Failure is treated as non-critical (user can still use installed commands/agents)
- Users are advised to report issues at <https://github.com/Uniswap/ai-toolkit/issues>

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

- `installMode`: Choose between 'default' (recommended setup) or 'custom' (full control) - typically set by CLI menu selection
- `installationType`: Choose between 'global' or 'local' installation (custom mode only)
- `confirmLocalPath`: For local installations, confirms you're at project root (custom mode only, auto-prompted if not provided)
- `installCommands`: Boolean flag to install commands (custom mode only)
- `installAgents`: Boolean flag to install agents (custom mode only)
- `installHooks`: Boolean flag to install notification hooks (always prompted)
- `hooksMode`: Notification mode - 'sound', 'speech', or 'both' (default: 'sound')
- `installAddons`: Boolean flag to install addons like spec-mcp-workflow (custom mode only; interactive prompt occurs after hooks)
- `commands`: Array of specific command names to install (only used if installCommands=true)
- `agents`: Array of specific agent names to install (only used if installAgents=true)
- `dry`: Preview installation without making changes (custom mode only)
- `nonInteractive`: Skip all prompts and use provided options
- `force`: Overwrite existing installation without confirmation

## Usage Examples

### Recommended: Via CLI Menu

The best way to run the init generator is through the CLI, which presents a clear menu:

```bash
npx @uniswap/ai-toolkit-nx-claude@latest

# Presents menu:
# 1. default-install - Recommended setup with pre-selected components
# 2. custom-install - Choose exactly what to install
```

### Default Installation Mode

Automatically invoked when selecting "default-install" from CLI menu, or explicitly:

```bash
npx nx generate @uniswap/ai-toolkit-nx-claude:init --install-mode=default
```

**Flow**:

1. Check if Claude CLI is installed (offer to install if missing)
2. Show pre-selected components (6 commands, 6 agents, global installation)
3. Prompt for notification hooks installation
4. Install everything and show summary

**Output**:

```
📦 Default Installation Mode
   Installing recommended setup with pre-selected components

📍 Location: Global (~/.claude)
📝 Commands: 6 pre-selected
🤖 Agents: 6 pre-selected

🔔 Install notification hooks? (y/n) > y

[Installation progress...]

✨ Installation complete!
   Commands: explore, plan, review-plan, execute-plan, address-pr-issues
   Agents: context-loader, planner, plan-reviewer, test-writer, doc-writer, pr-reviewer
   Hooks: ✅ Installed
```

### Custom Installation Mode

Automatically invoked when selecting "custom-install" from CLI menu, or explicitly:

```bash
npx nx generate @uniswap/ai-toolkit-nx-claude:init --install-mode=custom
```

**Flow**:

1. Check if Claude CLI is installed (offer to install if missing)
2. Ask for installation type (global or local)
3. For local installations: Confirm you're at project root (exits if not)
4. Ask if you want to install commands (yes/no)
5. If yes → show command multi-select with indicators for existing files:
   - "(will overwrite)" for files in target location
   - "(exists globally/locally)" for files in other location
6. Ask if you want to install agents (yes/no)
7. If yes → show agent multi-select with same indicators
8. Ask if you want to install notification hooks (yes/no)
9. After installing hooks, ask if you want to install addons (yes/no)
10. Ask for dry-run mode preference
11. If existing installation detected: Ask to force overwrite
12. Install selections, install hooks, optionally install addons, and show summary

### Non-Interactive Default Installation

```bash
npx nx generate @uniswap/ai-toolkit-nx-claude:init --no-interactive --install-mode=default --install-hooks=true
```

### Non-Interactive Custom Installation

```bash
npx nx generate @uniswap/ai-toolkit-nx-claude:init \
  --no-interactive \
  --install-mode=custom \
  --installation-type=global \
  --install-commands=true \
  --commands=review-pr,gen-tests,plan,execute-plan \
  --install-agents=true \
  --agents=test-writer,doc-writer,planner \
  --install-hooks=true \
  --install-addons=false
```

### Dry Run to Preview (Custom Mode Only)

```bash
npx nx generate @uniswap/ai-toolkit-nx-claude:init --install-mode=custom --dry
```

In dry-run mode, the generator will show:

- The installation methods that would be attempted (curl → npm → manual) if Claude CLI not installed
- The files that would be installed
- Hooks that would be installed
- Whether you would be prompted for addons after hooks, and the addon that would be installed if accepted
- The auto-update checker setup plan (shell detection, config update, frequency)
- No actual changes will be made to the system

**Note**: Default mode does not support dry-run (it always installs).

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
├── manifest.json
└── .last-update-check  # Cache file for auto-update checker (timestamp)
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

Note: The .last-update-check cache file is stored in ~/.uniswap-ai-toolkit/ (global location) regardless of installation type, since auto-update checker is installed globally to shell config.
```

## Shell Configuration Modifications

The init generator modifies your shell configuration file to add the auto-update checker:

### Bash (~/.bashrc)

```bash
# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v0.5.7
_ai_toolkit_check_updates() {
  [ -n "$AI_TOOLKIT_SKIP_UPDATE_CHECK" ] && return
  # ... update check logic ...
}
_ai_toolkit_check_updates
# END AI_TOOLKIT_UPDATE_CHECK
```

### Zsh (~/.zshrc)

Same format as bash (uses POSIX-compatible syntax).

### Fish (~/.config/fish/config.fish)

```fish
# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v0.5.7
function _ai_toolkit_check_updates
  if set -q AI_TOOLKIT_SKIP_UPDATE_CHECK
    return
  end
  # ... update check logic ...
end
_ai_toolkit_check_updates
# END AI_TOOLKIT_UPDATE_CHECK
```

**Important Notes**:

- The script is self-contained between marker comments for easy removal
- Running init again will update the version in the script
- Backup files are created before any modifications (e.g., `~/.zshrc.backup-1234567890`)
- The script only runs if the markers aren't already present (idempotent)

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
   - Installs auto-update checker after successful setup
2. **Claude CLI Installation Functions**:
   - **installClaude**: Main orchestrator for installation with fallback logic
   - **installViaCurl**: Primary installation method using official curl script
   - **installViaNpm**: Fallback installation method using npm
   - **verifyInstallation**: Verifies CLI installation success
   - **provideManualInstructions**: Displays manual installation steps when auto-install fails
3. **Auto-Update Functions** (from `auto-update-utils.ts`):
   - **detectShell**: Detects shell type from environment (bash/zsh/fish)
   - **getCurrentToolkitVersion**: Reads version from package.json
   - **installUpdateChecker**: Main function that installs update checker to shell config
   - **generateAutoUpdateSnippet**: Generates bash/zsh update check script
   - **generateFishAutoUpdateSnippet**: Generates fish-specific update check script
   - **getShellConfigPath**: Returns shell config file path for detected shell
4. **prompt-utils.ts**: Schema-driven prompt generation module
   - **promptForMissingOptions**: Reads schema.json and generates prompts for missing options
   - **promptForProperty**: Handles different property types (boolean, string, array, enum)
   - **promptMultiSelectWithAll**: Enhanced multi-select with file existence indicators
5. **checkExistingFiles**: Detects which files already exist in target locations
6. **promptOverwrite**: Manages collision detection and user confirmation
7. **checkClaudeInstalled**: Checks if Claude CLI is already installed
8. **promptInstallClaude**: Prompts user for consent to install Claude CLI

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
npx nx build nx-claude

# Test global installation with dry-run
npx nx generate @uniswap/ai-toolkit-nx-claude:init --dry --installation-type=global

# Test local installation (must be at project root)
npx nx generate @uniswap/ai-toolkit-nx-claude:init --installation-type=local --confirm-local-path=true

# Test interactive mode
npx nx generate @uniswap/ai-toolkit-nx-claude:init

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
