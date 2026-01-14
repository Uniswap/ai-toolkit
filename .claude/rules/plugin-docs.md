# Plugin Documentation Rules

## Instructions for Claude Code

When making changes to files in `packages/plugins/`, follow these mandatory documentation update rules.

## Critical Rules - ALWAYS FOLLOW

### 1. Update Notion Plugin Marketplace Documentation

After ANY changes to `packages/plugins/`, you MUST update the Notion Plugin Marketplace documentation:

**URL**: <https://www.notion.so/uniswaplabs/Uniswap-Claude-Code-Plugin-Marketplace-2e4c52b2548b815795a5f88c58894eac>

**What to update:**

1. **Plugin inventory changes**: When skills, agents, commands, or MCP servers are added, removed, or renamed
2. **Component counts**: The overview section shows totals for Skills, Agents, and Commands - keep these accurate
3. **Per-plugin sections**: Each of the 5 plugins has its own section listing components - update the relevant section(s)
4. **Descriptions**: Update component descriptions when functionality changes significantly

### 2. Update Plugin CLAUDE.md Files

After changes to a plugin's structure or functionality:

1. Update the plugin's `CLAUDE.md` file (e.g., `packages/plugins/development-pr-workflow/CLAUDE.md`)
2. Update the file structure section if directories/files were added or removed
3. Update component lists (skills, commands, agents) to match `plugin.json`

### 3. Verification Checklist

Before completing plugin-related work, verify:

- [ ] `plugin.json` skills array matches actual skill directories
- [ ] `plugin.json` commands array matches actual command files
- [ ] Plugin `CLAUDE.md` reflects current structure
- [ ] Notion marketplace doc is updated (if inventory changed)

## The 5 Plugins

For reference, these are the plugin directories:

1. `packages/plugins/development-planning/`
2. `packages/plugins/development-pr-workflow/`
3. `packages/plugins/development-codebase-tools/`
4. `packages/plugins/development-productivity/`
5. `packages/plugins/uniswap-integrations/`

## When to Skip Notion Updates

Only skip Notion updates if:

- Changes are purely internal (no user-facing component changes)
- Documentation/comment-only changes
- Bug fixes that don't change functionality

When in doubt, update the Notion doc.
