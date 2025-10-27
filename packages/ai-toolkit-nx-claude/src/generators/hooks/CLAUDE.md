# CLAUDE.md - Hooks Generator

## Overview

The `hooks` generator is a specialized Nx generator that automates the installation of notification hooks for Claude Code, providing audio and speech alerts when Claude needs user input during development sessions.

## Core Functionality

### What It Does

1. **Dependency Validation**: Checks for Node.js, npm, and Git installations
2. **Repository Management**: Clones or updates the awesome-claude-code repository
3. **Interactive Configuration**: Prompts for notification preferences (sound vs speech)
4. **Backup Management**: Creates timestamped backups of existing hook configurations
5. **Script Orchestration**: Executes awesome-claude-code's install-global.sh with user selections
6. **Installation Verification**: Validates that hooks were properly installed
7. **Rollback Support**: Restores from backup if installation fails
8. **Test Capability**: Optionally tests the installed hooks to verify functionality

### Key Design Decision

This generator provides a streamlined installation process that:

- Automatically downloads the latest hook implementations
- Handles all configuration and setup
- Manages backups and rollback
- Provides a consistent installation experience

## Architecture

### Module Structure

```
packages/ai-toolkit-nx-claude/src/generators/hooks/
├── generator.ts           # Main generator orchestrator
├── generator.spec.ts      # Test suite
├── schema.json           # Configuration schema for Nx
├── schema.d.ts           # TypeScript interface for options
├── dependency-checker.ts  # System dependency validation
├── repo-manager.ts       # Git repository operations
├── install-orchestrator.ts # Installation script execution
└── CLAUDE.md            # This documentation file
```

### Key Components

#### 1. Generator (generator.ts)

The main orchestrator that:

- Coordinates the entire installation flow
- Manages user prompts via schema-driven prompting
- Handles dry-run mode
- Provides verbose/quiet output modes
- Manages cleanup on success/failure

#### 2. Dependency Checker (dependency-checker.ts)

Validates system requirements:

- **checkDependencies()**: Returns status for Node, npm, and Git
- **validateDependencies()**: Logs detailed version information
- **checkAndValidateDependencies()**: Combined check with user-friendly output
- Cross-platform command detection (handles Windows/Unix differences)

#### 3. Repository Manager (repo-manager.ts)

Manages the hook file downloads:

- **ensureRepository()**: Main entry point that clones or updates
- **cloneRepository()**: Handles HTTPS/SSH fallback for cloning
- **updateRepository()**: Git pull with stash handling for uncommitted changes
- **getRepoStatus()**: Detailed repository state information
- **cleanupRepository()**: Removes temporary repository after installation

#### 4. Installation Orchestrator (install-orchestrator.ts)

Executes the actual installation:

- **runInstallation()**: Main installation coordinator
- **executeInstallScript()**: Spawns bash process with input piping
- **backupExistingHooks()**: Creates timestamped backups
- **verifyInstallation()**: Checks for expected files and settings
- **restoreBackup()**: Rollback capability on failure
- **testHooks()**: Triggers test notifications

## Installation Flow

### Step-by-Step Process

1. **Dependency Check**

   - Validates Node.js, npm, and Git are available
   - Can be skipped with `--force` flag (not recommended)

2. **User Prompting**

   - Uses schema.json to generate prompts
   - Reuses prompt-utils from init generator
   - Options: notification type, voice selection, update, backup

3. **Hook Download**

   - Downloads latest hook files to temp directory
   - Always fetches latest version
   - Handles download with automatic fallback

4. **Backup Creation**

   - Backs up ~/.claude/hooks/\* if exists
   - Saves settings.json state
   - Creates timestamped backup directory

5. **Script Execution**

   - Runs installation script
   - Pipes user selections to script stdin
   - Handles interactive script input programmatically

6. **Verification**

   - Checks for notification.ts, stop.ts, subagent_stop.ts
   - Validates settings.json has hooks configuration
   - Returns list of installed files

7. **Optional Testing**

   - In verbose mode, offers to test hooks
   - Executes notification hook with test payload
   - User should hear/see the notification

8. **Cleanup**
   - Removes temporary repository (unless --verbose)
   - Preserves backup for user reference

## Generator Options

### Schema Properties

```typescript
interface HooksGeneratorSchema {
  notificationType?: 'sound' | 'speech'; // Default: 'sound'
  voiceSelection?: string; // For speech mode
  backup?: boolean; // Create backup (default: true)
  'dry-run'?: boolean; // Preview without changes
  force?: boolean; // Skip dependency checks
  verbose?: boolean; // Detailed output
}
```

### Input Handling

The generator pipes input to the install-global.sh script based on options:

- Sound mode: Sends "1\n"
- Speech mode: Sends "2\n" followed by voice selection if provided

## File Operations

### Created Files

```
~/.claude/
├── hooks/
│   ├── notification.ts    # User input needed hook
│   ├── stop.ts           # Execution stopped hook
│   └── subagent_stop.ts  # Subagent stopped hook
└── settings.json         # Updated with hook paths
```

### Backup Structure

```
~/.claude/
└── hooks-backup-2024-01-01T12-00-00-000Z/
    ├── notification.ts
    ├── stop.ts
    ├── subagent_stop.ts
    └── settings.json.backup
```

## Error Handling

### Failure Scenarios

1. **Missing Dependencies**: Clear error messages with installation instructions
2. **Git Clone Failure**: Falls back from HTTPS to SSH for default repo
3. **Script Execution Failure**: Captures exit codes and stderr
4. **Verification Failure**: Lists missing files, attempts rollback
5. **Backup Restoration**: Automatic rollback on installation failure

### Recovery Mechanisms

- Backup restoration on failure
- Force flag to bypass checks
- Verbose mode for debugging
- Dry-run for preview

## Cross-Platform Considerations

### Dependency Detection

- **Node/npm**: Uses `which` on Unix, `where` on Windows
- **Git**: Standard git commands work cross-platform
- **Paths**: Uses Node.js path module for OS-appropriate separators

### Notification Support

The hooks handle platform differences automatically:

- **macOS**: afplay for sound, say for speech
- **Windows**: PowerShell for sound, SAPI for speech
- **Linux**: aplay/paplay for sound, espeak/festival for speech

## Testing Strategy

### Unit Tests (generator.spec.ts)

Should test:

- Schema validation
- Dependency checking logic
- Repository management operations
- Backup/restore functionality
- Script execution with mocked child_process

### Integration Testing

Manual testing checklist:

1. Fresh installation with sound
2. Fresh installation with speech
3. Update existing installation
4. Dry-run mode verification
5. Force mode with missing dependencies
6. Backup and restore flow
7. Custom repository usage

## Development Notes

### Adding New Features

To extend the generator:

1. Update schema.json with new options
2. Update schema.d.ts TypeScript interface
3. Modify generator.ts to handle new options
4. Update prompt flow if interactive
5. Add tests for new functionality
6. Update README.md and CLAUDE.md

### Debugging

Use verbose mode to debug issues:

```bash
npx nx generate @uniswap/ai-toolkit-nx-claude:hooks --verbose
```

This preserves the cloned repository and shows detailed output.

### Common Issues

1. **Script Permission Denied**: The generator runs `chmod +x` on install-global.sh
2. **Input Not Received**: Script stdin is properly ended after writing
3. **Repository Already Exists**: Handles existing repos, can force update
4. **Hooks Not Triggering**: Verification step ensures proper installation

## Integration with Nx

### Generator Registration

Registered in `packages/ai-toolkit-nx-claude/generators.json`:

```json
{
  "generators": {
    "hooks": {
      "factory": "./dist/generators/hooks/generator",
      "schema": "./dist/generators/hooks/schema.json",
      "description": "Install Claude Code notification hooks using awesome-claude-code"
    }
  }
}
```

### Building and Testing

```bash
# Build the generator
npx nx build nx-claude

# Run tests
npx nx test nx-claude

# Test locally
npx nx generate @uniswap/ai-toolkit-nx-claude:hooks --dry-run
```

## Future Enhancements

Potential improvements (not yet implemented):

1. **Custom Sound Files**: Allow users to provide their own notification sounds
2. **Hook Templates**: Provide customizable hook templates
3. **Multiple Notification Channels**: Support multiple simultaneous notifications
4. **Notification Rules**: Configure when notifications should fire
5. **Integration with IDEs**: VS Code extension integration
6. **Metrics/Analytics**: Track notification patterns

## Maintenance Requirements

⚠️ **IMPORTANT**: This CLAUDE.md file must be updated whenever the hooks generator changes:

- New options or parameters
- Changes to installation flow
- Updates to file structure
- New dependencies or requirements
- Bug fixes that change behavior
- Integration with new hook versions

The documentation should always reflect the current state of the generator implementation to ensure AI assistants have accurate information.

## Credits

This generator provides an Nx-integrated installation experience for Claude Code notification hooks.
