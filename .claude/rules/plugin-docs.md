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
3. **Per-plugin sections**: Each plugin has its own section listing components - update the relevant section(s)
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

## The Plugins

**Source of truth**: the directories under `packages/plugins/` and the `plugins` array in
`.claude-plugin/marketplace.json`. Never rely on a count written in prose - including the
snapshot below. Enumerate before acting:

```bash
find packages/plugins -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort
```

The two must always agree: every plugin directory needs a matching `marketplace.json` entry, and
vice versa. Check `source`, not just `name` - `.github/actions/validate-plugins/action.yml`
resolves `.plugins[].source` to decide which directory to load and validate, so a copied or stale
`source` points the marketplace at the wrong directory even when `name` looks right. Two checks:

```bash
# 1. Every source resolves to a real plugin directory, and every directory is referenced once.
diff <(find packages/plugins -mindepth 1 -maxdepth 1 -type d | sort) \
     <(jq -r '.plugins[].source | sub("^\\./"; "")' .claude-plugin/marketplace.json | sort)

# 2. Every entry's name agrees with its own source directory.
jq -r '.plugins[] | select((.source | sub("^\\./packages/plugins/"; "")) != .name)
       | "MISMATCH: name=\(.name) source=\(.source)"' .claude-plugin/marketplace.json
```

Both silent means the inventory is consistent. Any output means it is not - fix that before
continuing.

**Snapshot** (accurate as of 2026-07-30, verify with the commands above):

1. `packages/plugins/claude-setup/`
2. `packages/plugins/development-codebase-tools/`
3. `packages/plugins/development-planning/`
4. `packages/plugins/development-pr-workflow/`
5. `packages/plugins/development-productivity/`
6. `packages/plugins/skill-management/`
7. `packages/plugins/spec-workflow/`
8. `packages/plugins/uniswap-integrations/`

If the enumerated output above differs from this snapshot, the enumerated output wins - update
this snapshot (and the plugin table in the root `CLAUDE.md`) as part of your change.

## When to Skip Notion Updates

Only skip Notion updates if:

- Changes are purely internal (no user-facing component changes)
- Documentation/comment-only changes
- Bug fixes that don't change functionality

When in doubt, update the Notion doc.
