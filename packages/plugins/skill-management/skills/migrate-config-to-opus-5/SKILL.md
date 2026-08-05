---
name: migrate-config-to-opus-5
description: Audit and migrate a Claude Code configuration (CLAUDE.md, rules, skills, commands, agents, settings.json, hooks, statusline, CI scripts) for Claude Opus 5's behavioral changes. Use when the user asks to migrate or audit their config for Opus 5 / the Claude 5 family, says their setup was written for Opus 4.x or an older Claude model, or reports post-upgrade symptoms like over-verification, over-delegation to subagents, code reviewers missing real findings, or noticeably longer output. Always interview for scope first — the global setup (~/.claude) or an individual project (the cwd).
---

# Migrate a Claude Code Config to Opus 5

Opus 5 changed what good config looks like. Config written for Opus 4.x often _compensated_ for that era's failure modes (under-verification, under-delegation, under-triggering on instructions). Opus 5 inverts those defaults, so the old compensations now actively fight the model.

Ground rule: the harness (Claude Code's own system prompt) is re-tuned by Anthropic per model. Config should carry only what the harness can't know — the user's policies, environment facts, and preferences. Anything duplicating harness behavior is dead weight; anything compensating for a pre-Opus-5 failure mode is now harmful.

## Step 0 — Scope interview (required, before touching anything)

Ask the user which surface to migrate, via AskUserQuestion:

- **Global setup** — `~/.claude`: CLAUDE.md, `rules/**`, `skills/**`, `commands/`, `agents/`, `settings.json` (+ hooks), statusline script, plugin registrations. Affects every session on the machine (and, if the directory syncs via git, every machine).
- **This project** — the cwd: `./CLAUDE.md`, `.claude/` (settings, skills, agents, commands, rules), plus project scripts/CI workflows that embed Claude model IDs or API params.

If the user picked global and `~/.claude` is a git repo shared across machines, every path fix must be machine-agnostic (`$HOME`, `~/`, resolver scripts) — a literal home-dir path that is correct on this machine is silently wrong on the others.

In the same interview, ask one execution question: apply edits directly with granular commits (the default), or propose the full diff for review first. For project scope on a shared repo, apply the edits on a new branch off the repo's default branch (`origin/main` or equivalent, not the current checkout) and deliver them as a PR — matching this plugin's skill-doctor delivery rule.

## Step 1 — Inventory

Enumerate the chosen surface before judging any of it. For a large surface, dispatch a read-only Explore agent; for a small project config, do it inline. Collect:

- Every file that loads into context (always-on rules vs path-scoped vs on-demand).
- Prompt text embedded in skills/commands/agents — reviewer prompts especially.
- Scripts and CI that mention `claude-*` model IDs, pricing, context-window sizes, or API params.
- Hooks and their target paths.

Environment note: in Claude Code's Bash, bare `grep` is an embedded ugrep that silently skips gitignored files and any file with invalid UTF-8. Use `/usr/bin/grep` for every search whose result drives a decision.

## Step 2 — Audit against the Opus 5 deltas

Read `references/audit-patterns.md` and scan the inventory against it. It covers the four behavioral deltas (verification, delegation, literal instruction-following, output length), the mechanical checks (stale model IDs and pricing, API params, dead weight), and the settings that need a user decision (effortLevel), with search patterns and fix shapes.

Classify every finding as one of:

- **Fix mechanically** — stale facts with one correct answer (model IDs, pricing, dead entries). No interview needed.
- **Rewrite** — model-compensation text with a clear Opus 5 replacement (verification ceremony → grounding language; delegation nudges → caps; confidence filters → coverage-first).
- **User decision** — anything that might be _policy_ rather than compensation. The test: would the user still want this behavior from a perfectly-calibrated model? A review-before-merge gate, a cost-routing table, a secrets rule — those are policy; keep them and say so. When unsure, ask rather than assume.
- **Leave alone, note why** — pressure language (CRITICAL/MUST) that guards a genuinely fragile workflow or a hard policy line (secrets, destructive git). Deleting emphasis there trades a model-fit win for a real safety loss.

## Step 3 — Decision interview

Present the "user decision" findings via AskUserQuestion (batch related ones; recommendation first). Do not fold policy questions into the mechanical edits — a silently removed gate is the worst outcome of this migration.

## Step 4 — Execute

- One granular commit per logical change (if the surface is a git repo). Never one big migration commit — the user needs to be able to revert a single decision.
- For shared/synced files, apply the machine-agnostic path rule from Step 0.
- When editing `settings.json`, validate with `python3 -c "import json; json.load(open('...'))"` after every edit, and check `git diff` first so pre-existing drift from other sessions is named in the commit message rather than silently swept in.
- Delete dead things outright (superseded commands, archives, backup files) when the surface is a git repo with a clean tree — git history is the recovery path, and "kept for recovery" copies keep loading into context. Uncommitted or untracked dead weight has no history to fall back on: commit it first or route it to the Step 3 interview. On a non-git surface, deletion is unrecoverable: list the candidates for the Step 3 interview instead, or confirm the user has a backup (Time Machine, sync) before deleting.

## Step 5 — Verify and set a checkpoint

- Run a fresh probe: `claude -p --model haiku '<ask it to quote a changed line and confirm a removed one is gone>'` from the relevant directory. This proves the edited config actually loads, hooks don't error, and removals took.
- If a statusline or script was changed, test it directly with synthetic payloads.
- Log a one-week checkpoint list of what to watch (response depth at the new effort level, delegation volume, reviewer recall, deliverable length) wherever the user keeps such notes, and say where you put it.

## Output

End with: scope migrated, a per-commit list of what changed and why, findings deliberately left alone (with the policy reason), anything out of reach (other machines, external repos), and the checkpoint date.
