# Enterprise Deployment Guide

This guide explains how to deploy AI Toolkit skills organization-wide using Claude Enterprise Managed Policy Settings and MDM (Mobile Device Management) tools like Kandji.

## Overview

The deployment combines two mechanisms:

1. **Plugin Marketplace** - Skills hosted in this repository as a Claude Code plugin marketplace
2. **Managed Settings** - Enterprise configuration deployed via MDM that automatically configures the marketplace and enables skills

```text
┌─────────────────────────────────────────────────────────────────┐
│                        MDM (Kandji)                             │
│  Deploys managed-settings.json to system directory              │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   managed-settings.json                         │
│  - extraKnownMarketplaces → points to ai-toolkit repo           │
│  - enabledPlugins → auto-enables specified skills               │
│  - strictKnownMarketplaces → locks to approved sources only     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ai-toolkit Repository                        │
│  .claude-plugin/marketplace.json ← Marketplace definition       │
│  packages/claude-skills/src/     ← Skill implementations        │
└─────────────────────────────────────────────────────────────────┘
```

## File Locations

| Operating System | Managed Settings Path |
|------------------|----------------------|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux/WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

> **Note**: These are system-wide paths (not user home directories) that require administrator privileges.

## Configuration Options

### managed-settings-example.json

See [managed-settings-example.json](./managed-settings-example.json) for a complete example.

### Key Settings

#### extraKnownMarketplaces

Adds the AI Toolkit marketplace so it's automatically available to all users:

```json
{
  "extraKnownMarketplaces": {
    "uniswap-ai-toolkit": {
      "source": {
        "source": "github",
        "repo": "Uniswap/ai-toolkit",
        "ref": "main",
        "path": ".claude-plugin"
      }
    }
  }
}
```

#### enabledPlugins

Auto-enables specific skills for all users:

```json
{
  "enabledPlugins": {
    "implementation-planner@uniswap-ai-toolkit": true,
    "plan-executor@uniswap-ai-toolkit": true,
    "plan-reviewer@uniswap-ai-toolkit": true,
    "pr-reviewer@uniswap-ai-toolkit": true,
    "pr-creator@uniswap-ai-toolkit": true,
    "codebase-explorer@uniswap-ai-toolkit": true
  }
}
```

#### strictKnownMarketplaces (Optional)

Restricts users to only approved marketplace sources:

```json
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "Uniswap/ai-toolkit" },
    { "source": "github", "repo": "anthropics/skills" },
    { "source": "github", "repo": "anthropics/claude-plugins-official" }
  ]
}
```

## Kandji Deployment

### Option 1: Custom Script

Create a Kandji Custom Script that deploys the managed-settings.json file:

```bash
#!/bin/bash
# Deploy Claude Code managed settings

SETTINGS_DIR="/Library/Application Support/ClaudeCode"
SETTINGS_FILE="${SETTINGS_DIR}/managed-settings.json"

# Create directory if it doesn't exist
mkdir -p "${SETTINGS_DIR}"

# Write managed settings
cat > "${SETTINGS_FILE}" << 'EOF'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "extraKnownMarketplaces": {
    "uniswap-ai-toolkit": {
      "source": {
        "source": "github",
        "repo": "Uniswap/ai-toolkit",
        "ref": "main",
        "path": ".claude-plugin"
      }
    }
  },
  "enabledPlugins": {
    "implementation-planner@uniswap-ai-toolkit": true,
    "plan-executor@uniswap-ai-toolkit": true,
    "plan-reviewer@uniswap-ai-toolkit": true,
    "pr-reviewer@uniswap-ai-toolkit": true,
    "pr-creator@uniswap-ai-toolkit": true,
    "codebase-explorer@uniswap-ai-toolkit": true
  }
}
EOF

# Set proper permissions
chown root:wheel "${SETTINGS_FILE}"
chmod 644 "${SETTINGS_FILE}"

echo "Claude Code managed settings deployed successfully"
```

### Option 2: Custom App (PKG)

Package the managed-settings.json into a PKG installer:

1. Create the package payload directory structure
2. Place managed-settings.json at the correct path
3. Build and sign the PKG
4. Upload to Kandji and assign to devices

### Verification

After deployment, users can verify the settings are active:

```bash
# Check if the file exists
ls -la "/Library/Application Support/ClaudeCode/managed-settings.json"

# View the settings
cat "/Library/Application Support/ClaudeCode/managed-settings.json"
```

In Claude Code, users should see the marketplace available:

```bash
/plugin marketplace list
```

## Available Skills

The following skills are available in the Uniswap AI Toolkit marketplace:

### Planning & Execution

| Skill | Description |
|-------|-------------|
| `implementation-planner` | Create actionable implementation plans through multi-agent collaborative refinement |
| `plan-executor` | Execute implementation plans step-by-step with progress tracking |
| `plan-reviewer` | Critically review plans for completeness and feasibility |
| `plan-swarm` | Collaborative plan refinement with expert opinions |

### Code Review & PR Management

| Skill | Description |
|-------|-------------|
| `pr-reviewer` | Comprehensive PR review using specialized agents |
| `pr-creator` | Create Graphite PRs with auto-generated messages |
| `pr-issue-resolver` | Address PR review comments and fix CI failures |
| `graphite-stack-updater` | Automate Graphite PR stack updates |

### Research & Documentation

| Skill | Description |
|-------|-------------|
| `codebase-explorer` | Deep codebase exploration and understanding |
| `topic-researcher` | Combine web search with codebase analysis |
| `claude-docs-updater` | Update CLAUDE.md files based on code changes |

### Code Quality

| Skill | Description |
|-------|-------------|
| `code-refactorer` | Comprehensive refactoring with safety checks |
| `tech-debt-analyzer` | Identify and prioritize technical debt |
| `prompt-optimizer` | Optimize AI prompts for better performance |

## User Experience

After deployment:

1. User opens Claude Code
2. Claude Code reads `managed-settings.json` from the system directory
3. The AI Toolkit marketplace is automatically available
4. Enabled skills are ready to use immediately
5. Users can invoke skills with `/skill-name` or through natural language triggers

## Updating Skills

To update skills across the organization:

1. Update the skills in `packages/claude-skills/src/`
2. Bump the version in `.claude-plugin/marketplace.json`
3. Merge to `main` branch
4. Claude Code will automatically fetch updates from the GitHub marketplace

> **Note**: If you want to pin to a specific version, update the `ref` in the managed-settings.json from `"main"` to a specific tag or commit SHA.

## Security Considerations

- The `managed-settings.json` file is deployed with root ownership and 644 permissions
- Users cannot override managed settings with local configuration
- `strictKnownMarketplaces` prevents users from adding unapproved marketplace sources
- Skills execute in the user's context with Claude Code's standard permission model

## Troubleshooting

### Skills not appearing

1. Verify the managed-settings.json file exists at the correct path
2. Check file permissions (should be readable by all users)
3. Restart Claude Code to reload settings
4. Check Claude Code logs for marketplace errors

### Marketplace not available

1. Verify network access to github.com
2. Check if `strictKnownMarketplaces` is blocking the source
3. Validate the GitHub repo path and branch name

### Permission denied

1. Ensure the managed-settings.json was deployed with proper permissions
2. Verify the deployment script ran with administrator privileges

## References

- [Claude Code Settings Documentation](https://code.claude.com/docs/en/settings)
- [Plugin Marketplaces Documentation](https://code.claude.com/docs/en/plugin-marketplaces)
- [Enterprise Configuration](https://support.claude.com/en/articles/12622667-enterprise-configuration)
