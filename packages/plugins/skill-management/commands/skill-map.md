---
description: Inventory and map every skill/agent/command you have (yours + all marketplaces), then suggest improvements — overlaps, gaps, weak triggering descriptions. Pure audit; no session mining.
argument-hint: (none)
allowed-tools: Bash(python3:*), Read, Grep, Glob, Agent
---

Run the **skill-doctor** skill in **`map`** mode.

- Inventory every skill, agent, and command across all sources (the user's own
  dirs AND all installed marketplaces) using the skill's bundled
  `scripts/inventory.py`, then analyze the map for overlaps/duplicates, gaps, and
  weak triggering descriptions.
- Do **not** mine the current conversation — this is a pure audit.
- Editable targets: personal config under `~/.claude/{skills,agents,commands}` is
  edited in place. Skill/agent/command files inside a git repo ship as a **draft
  PR** off the repo's default branch (never a direct commit/push to it). Installed
  marketplaces and plugin caches are read-only.
- **Propose a prioritized menu; do not apply any change without the user's approval.**
