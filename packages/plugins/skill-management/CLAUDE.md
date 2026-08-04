# CLAUDE.md - skill-management

## Overview

This plugin is the curation/triage layer over a user's whole Claude Code customization surface —
their skills, agents, and slash commands. It inventories everything (the user's own dirs plus
installed marketplaces), flags overlaps, gaps, and weak triggering descriptions, and mines the current
session for workflows worth codifying into a new or edited skill or agent. It also owns
model-generation migrations of a full Claude Code config (CLAUDE.md, rules, settings, hooks,
statusline, CI scripts) via the migrate-config-to-opus-5 skill.

## Plugin Components

### Skills (./skills/)

- **skill-doctor**: Orchestrator over the customization surface. Runs in four modes (`map`, `session`,
  `create`, `full`) selected by the commands below. Inventories via a bundled stdlib-only Python
  script, reasons over the compact map (not the raw files), and proposes a prioritized menu —
  never auto-applies. Bundles `references/analysis-rubric.md` (good-description shape, overlap
  judgment, skill-vs-agent-vs-rule decision) and `scripts/inventory.py` (cheap inventory + quality
  flags, no pip installs).
- **migrate-config-to-opus-5**: Audits and migrates a Claude Code configuration (CLAUDE.md, rules,
  skills, commands, agents, settings.json, hooks, statusline, CI scripts) for Claude Opus 5's
  behavioral changes. Interviews for scope first (global `~/.claude` vs the current project),
  inventories the surface, classifies findings (fix mechanically / rewrite / user decision / leave
  alone), and executes with granular commits plus a verification probe. Bundles
  `references/audit-patterns.md` — the four behavioral deltas (verification, delegation, literal
  instruction-following, output length) with search patterns and fix shapes, plus mechanical checks
  (stale model IDs, pricing ratios, API params).

### Commands (./commands/)

- **skill-map**: Invokes skill-doctor in `map` mode — pure audit, no session mining.
- **skill-mine**: Invokes skill-doctor in `session` mode — mine THIS conversation for codify-worthy
  workflows, missed triggers, and repeated corrections.
- **skill-new**: Invokes skill-doctor in `create` mode — codify the current work into a NEW skill or
  agent and hand the draft to `skill-creator`.

### Hooks (./hooks/)

- **pr-skill-doctor-prompt.cjs**: PostToolUse hook (matcher `Bash|mcp__.+__create_pull_request`).
  When a PR is opened, injects a one-time, per-session `additionalContext` nudge asking whether the
  user wants to run `/skill-mine`. Never blocks the PR; guarded by a session-keyed sentinel under the
  OS temp dir so it fires at most once per session. Pure Node (`.cjs`) so it needs no `tsx`/`bun`/`jq`.
  The `.+` in the matcher is load-bearing: a matcher made only of letters, digits, `_`, `-`, spaces,
  `,`, and `|` is evaluated as a list of exact tool names, so a plain `create_pull_request` entry
  would never match namespaced MCP tools like `mcp__github__create_pull_request`. The regex
  metacharacters flip the whole matcher into (unanchored) regex mode.

## Design notes

- **Names are intentionally meta.** `skill-doctor` / `skill-mine` / `skill-map` / `skill-new` don't
  follow the repo's usual verb-noun skill convention because they're an established, recognizable
  family whose value depends on the names staying stable. They're entry points into one skill, not
  independent actions.
- **Portability.** The skill references its bundled files via `${CLAUDE_PLUGIN_ROOT}` and writes
  inventory output to a temp workspace, so it works wherever the plugin is installed (not just a
  personal `~/.claude` checkout). The hook is dependency-free Node for the same reason.
- **Prepare, don't execute.** skill-doctor proposes a numbered menu and applies nothing without
  approval. Personal config under `~/.claude/{skills,agents,commands}` is edited in place; skill /
  agent / command files inside a git repo ship as a draft PR off the repo's default branch.

## Development guidelines

- This is an Nx plugin library. Validate structure with
  `node scripts/validate-plugin.cjs packages/plugins/skill-management`.
- Bump the version in `.claude-plugin/plugin.json` per semver on any change (patch for fixes/docs,
  minor for new skills/commands/hooks, major for breaking changes), in the same commit as the change.
- After editing `inventory.py`, keep its `WRITABLE_ROOTS` in sync with the "editable targets" section
  of `skills/skill-doctor/SKILL.md`.
