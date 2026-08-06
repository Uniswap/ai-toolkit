---
description: Backtest a data-driven change against LIVE historical data before opening the PR — replay old-vs-new and report whether it actually achieves its goal. Refuses to ship (or redirects) when the data disproves the premise. Deliberate entry point for the `backtest-change` skill.
argument-hint: [what you're about to change + the metric/signal it should move]
allowed-tools: Bash(*), Read(*), Grep(*), Glob(*), AskUserQuestion(*)
---

# Backtest a change before you PR it

Load and follow the **`backtest-change` skill**
(`packages/plugins/development-pr-workflow/skills/backtest-change/SKILL.md`),
which holds the full workflow, verdict taxonomy, and output format.

Parse `$ARGUMENTS` for the two inputs the skill requires:

1. **The change** you intend to make (and the file(s), if known).
2. **The goal** — which metric/signal should move, in which direction, by how
   much. If it isn't stated, ask. A backtest is meaningless without a target.

Then run the skill's workflow and produce its backtest report.

## Why this is a thin wrapper

The workflow lives in a skill so that it **auto-triggers**. The highest-value
case is someone proposing a threshold without thinking to invoke a backtest —
"add a monitor at 700 MB warn / 1.2 GB critical" — and a slash command can only
fire when it is explicitly typed. This command remains the deliberate entry point
for when you *do* want a backtest on demand, with arguments.
