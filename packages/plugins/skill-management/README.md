# @uniswap/skill-management

Audit, map, mine, and improve your Claude Code skills, agents, and slash commands.

This plugin is the curation layer over your whole Claude Code customization surface. It inventories
every skill / agent / command you have (your own dirs plus installed marketplaces), flags overlaps,
gaps, and weak triggering descriptions, and mines the current session for workflows worth codifying
into a new or edited skill or agent.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install skill-management
```

## Skills

| Skill            | Description                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **skill-doctor** | Orchestrator/triage over your skills, agents, and commands: inventory, analyze, mine, and improve. The commands below are thin entry points into its run modes. |

## Commands

| Command       | Mode      | Description                                                                                                    |
| ------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `/skill-map`  | `map`     | Pure audit. Inventory everything and flag overlaps, gaps, and weak triggering descriptions. No session mining. |
| `/skill-mine` | `session` | Mine THIS conversation for codify-worthy workflows, missed triggers, and repeated corrections.                 |
| `/skill-new`  | `create`  | Codify the current work into a NEW skill or agent and hand the draft to `skill-creator`.                       |

## Hooks

| Hook                           | Event       | Description                                                                                                                                                                                                                                        |
| ------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pr-skill-doctor-prompt.cjs** | PostToolUse | When a PR is opened (`gh pr create`, `gt submit`/`gt ss`, or the GitHub MCP `create_pull_request` tool), injects a one-time, per-session nudge asking whether you'd like to run `/skill-mine`. Never blocks the PR; asks at most once per session. |

The hook is a dependency-free Node script invoked via `node ${CLAUDE_PLUGIN_ROOT}/hooks/pr-skill-doctor-prompt.cjs` — no `tsx`, `bun`, or `jq` required.

## How it fits together

`/skill-map`, `/skill-mine`, and `/skill-new` are thin prompts that invoke the **skill-doctor** skill
in a specific run mode. The skill does the _finding_ — what to add, merge, fix, or codify — then hands
the deep work to the tools that own it (`skill-creator` for drafting/evals, `agent-optimizer` /
`prompt-engineer` for agent tuning). It never auto-applies a change: it proposes a prioritized menu and
lets you pick. Personal config under `~/.claude/{skills,agents,commands}` is edited in place; skill /
agent / command files that live inside a git repo are delivered as a **draft PR** off the repo's
default branch.
