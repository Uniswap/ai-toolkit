---
description: Mine THIS conversation for skills/agents worth adding or fixing — codify-worthy workflows, a skill that should have triggered but didn't, repeated corrections. Runs a light inventory for context.
argument-hint: (none)
allowed-tools: Bash(python3:*), Read, Grep, Glob, Agent
---

Run the **skill-doctor** skill in **`session`** mode.

- Evaluate the current conversation for: (a) codify-worthy workflows that should
  become a new skill or agent, (b) any skill that should have triggered this
  session but didn't (propose a description fix), (c) a skill that misfired, and
  (d) corrections the user gave more than once (decide skill vs agent vs CLAUDE.md rule).
- Run only a **light inventory** (`--mine-only`) so you know what already exists.
- Ground every proposal in a specific moment from this conversation — quote the turn.
- Editable targets: personal config under `~/.claude/{skills,agents,commands}` is
  edited in place. Skill/agent/command files inside a git repo ship as a **draft
  PR** off the repo's default branch (never a direct commit/push to it). Installed
  marketplaces and plugin caches are read-only.
- **Propose a prioritized menu; do not apply any change without the user's approval.**
