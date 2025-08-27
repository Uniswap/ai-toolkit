# Claude Code Hooks Generator

## Overview

The `hooks` generator automatically installs notification hooks for Claude Code. These hooks provide audio notifications when Claude needs user input, improving the development workflow by alerting you when your attention is required.

## Features

- 🔔 **Sound Notifications**: Custom sound alerts when Claude needs input
- 🔄 **Auto-update**: Always installs the latest version
- 💾 **Backup & Restore**: Automatically backs up existing configurations
- 🧪 **Test Mode**: Verify hooks are working correctly
- 🌍 **Cross-platform**: Works on macOS, Windows, and Linux

## Prerequisites

The generator will check for these dependencies and warn if missing:

- **Node.js** (v16 or higher)
- **npm** (for executing TypeScript hooks)
- **Git** (for downloading hook files)

## Installation

### Run the Generator

```bash
# From any directory (installs globally to ~/.claude/hooks/)
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks

# Or with npm
npm run nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks
```

### Interactive Mode (Default)

When run without options, the generator will interactively prompt for:

1. **Backup**: Whether to backup existing configuration
2. **Dry Run**: Preview changes without installation
3. **Verbose**: Show detailed output

### Non-Interactive Examples

```bash
# Install with all defaults (using Nx's built-in flag)
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks --no-interactive

# Dry run to preview changes
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks --dry

# Also works with --dry-run alias for Nx compatibility
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks --dry-run

# Skip backup during installation
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks --backup=false --no-interactive

# Force installation (skip dependency checks)
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks --force

# Verbose output for debugging
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks --verbose
```

## Generator Options

| Option    | Type      | Default | Description                                   |
| --------- | --------- | ------- | --------------------------------------------- |
| `backup`  | `boolean` | `true`  | Backup existing hooks before installation     |
| `dry`     | `boolean` | `false` | Preview installation without making changes   |
| `dry-run` | `boolean` | `false` | Alias for `dry` (for Nx compatibility)        |
| `force`   | `boolean` | `false` | Skip dependency checks and force installation |
| `verbose` | `boolean` | `false` | Show detailed output during installation      |

**Note**: Use Nx's built-in `--no-interactive` flag to skip all prompts and use defaults.

## What Gets Installed

The generator installs the following hooks to `~/.claude/hooks/`:

### Hook Files

- **notification.ts**: Triggered when Claude needs user input
- **stop.ts**: Triggered when Claude stops execution
- **subagent_stop.ts**: Triggered when a subagent stops

### Configuration

The generator also updates `~/.claude/settings.json` to register the hooks:

```json
{
  "hooks": {
    "notification": "~/.claude/hooks/notification.ts",
    "stop": "~/.claude/hooks/stop.ts",
    "subagent_stop": "~/.claude/hooks/subagent_stop.ts"
  }
}
```

## Platform Support

The notification system automatically detects and uses the appropriate audio playback method for your platform:

- **macOS**: Uses `afplay` (built-in)
- **Windows**: Uses PowerShell audio playback
- **Linux**: Uses `aplay` or `paplay`

## Testing the Installation

After installation, you can test the hooks:

```bash
# Run with verbose flag to get testing option
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:hooks --verbose

# When prompted, choose to test the hooks
# You should hear a notification sound
```

## Backup and Recovery

### Automatic Backup

By default, the generator creates a backup before modifying existing hooks:

- Backup location: `~/.claude/hooks-backup-[timestamp]/`
- Includes all hook files and settings.json

### Manual Recovery

If you need to restore a backup:

```bash
# List backups
ls -la ~/.claude/hooks-backup-*

# Restore a specific backup
cp -r ~/.claude/hooks-backup-2024-01-01T12-00-00/* ~/.claude/hooks/
```

## Troubleshooting

### Missing Dependencies

If you see dependency warnings:

```bash
# Install Node.js
# Visit https://nodejs.org or use a version manager like nvm

# Install Git
# macOS: brew install git
# Ubuntu/Debian: sudo apt-get install git
# Windows: Download from https://git-scm.com
```

### Hooks Not Working

1. **Verify Installation**:

   ```bash
   ls -la ~/.claude/hooks/
   cat ~/.claude/settings.json | grep hooks
   ```

2. **Check TypeScript Execution**:

   ```bash
   npx tsx --version
   ```

3. **Test Manually**:

   ```bash
   echo '{"hook_event_name":"Notification"}' | npx tsx ~/.claude/hooks/notification.ts
   ```

### Sound Not Playing

- **macOS**: Check System Preferences > Sound > Sound Effects volume
- **Windows**: Check Windows Volume Mixer settings
- **Linux**: Verify audio packages are installed (`sudo apt-get install alsa-utils`)

## Customization

### Modifying Installed Hooks

After installation, you can customize the hooks by editing files in `~/.claude/hooks/`. The TypeScript files can be modified to:

- Change notification sounds
- Customize speech messages
- Add logging or debugging
- Integrate with other tools

## How It Works

1. **Dependency Check**: Verifies Node.js, npm, and Git are installed
2. **Download**: Fetches the latest hook files
3. **Backup Creation**: Saves existing configuration if present
4. **Script Execution**: Runs the installation script
5. **Verification**: Confirms hooks are properly installed
6. **Cleanup**: Removes temporary files (unless --verbose is used)

## Credits

This generator provides an automated installation process for Claude Code notification hooks, integrated with the Nx toolchain.

## Contributing

To contribute to this generator:

1. Fork the AI Toolkit repository
2. Make your changes in `packages/ai-toolkit-nx-claude/src/generators/hooks/`
3. Add tests in `packages/ai-toolkit-nx-claude/src/generators/hooks/generator.spec.ts`
4. Submit a pull request

## License

This generator is part of the AI Toolkit project.
