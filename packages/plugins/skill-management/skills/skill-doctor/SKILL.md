---
name: skill-doctor
description: >
  Audit, map, and improve your Claude Code skills, agents, and slash commands —
  and mine the current session for new ones worth creating. Use this whenever the
  user says "review my skills", "optimize my skills", "update my skills", "update
  all my skills", "maintain my skills", "audit my agents", "map my skills", "what
  skills do I have", "suggest skill improvements", "are any of my skills
  redundant", "clean up my skills", "turn this into a skill", "should this be a
  skill or an agent", "codify this workflow", or invokes /skill-map, /skill-mine,
  or /skill-new. Also use PROACTIVELY after finishing a multi-step workflow that
  the user is likely to repeat (especially right after opening a PR) to ask
  whether it should become a skill or agent. It inventories every
  skill/agent/command across the user's own dirs AND all installed marketplaces,
  flags overlaps / gaps / weak triggering descriptions, and — when there's real
  prior work in the session — proposes new or edited skills/agents grounded in
  what actually happened.
---

# skill-doctor

The orchestrator/triage layer over the user's whole Claude Code customization
surface. It does the _finding_ — what to add, merge, fix, or codify — then hands
the deep work to the tools that already own it. **Reuse, don't reinvent:**

- **Creating or iterating a skill (drafting, evals, description optimization, packaging)** → invoke the `skill-creator` skill if it's
  installed (it ships in Anthropic's agent-skills marketplace and bundles
  `improve_description.py`, `run_loop.py`, `package_skill.py`, `quick_validate.py`).
- **Tuning an agent's prompt** → delegate to the `agent-optimizer` or `prompt-engineer` agents.
- **Scoring an agent's capabilities / team fit** → the `agent-capability-analyst` agent.
- **Cataloging agents** → the `claude-agent-discovery` agent.
- **"This is really a standing rule, not a skill"** → write it into the relevant
  `CLAUDE.md` (e.g. via an `update-claude-md` skill) or the project's memory store.
- **Auditing / cleaning up the memory store itself** (orphans vs `MEMORY.md`, stale
  memories, dedupe, "scope memories into skills") → the `memory-doctor` skill if
  installed, the sibling of this one for the memory surface. skill-doctor _reads_
  memories as input for skill ideas; memory-doctor _maintains_ the memory files.

## Editable targets — read this first

You may **edit/create** files under:

- `~/.claude/{skills,agents,commands}/` — the user's personal, non-git config.
  Edited **in place**.
- Skill/agent/command files inside a **git repo** the user owns or contributes to.
  Changes here ship as a **draft PR** (see "Delivering changes once approved"
  below) — never an in-place edit on the repo's working branch, never a direct
  commit to its default branch.

Installed marketplaces and plugin caches (`~/.claude/plugins/marketplaces/…`,
`~/.claude/plugins/cache/…`) are **read-only** install mirrors — map and analyze,
never edit. If a worthwhile fix lands on a read-only mirror, fork a copy into a
writable location instead. The inventory tags every entry with `writable`; respect
it.

**Never auto-apply.** Propose a numbered menu and let the user pick. The user
always approves _which_ change before you make it.

**Delivering changes once approved:**

- `~/.claude/…` (not a git repo): edit in place; show the before/after first.
- Any file inside a **git repo**: deliver as a **draft PR** automatically — don't
  ask a second time once the change itself is approved. Detect the repo's default
  branch (`git symbolic-ref --short refs/remotes/origin/HEAD` — it is NOT always
  `main`), branch off `origin/<default>` in a clean worktree, apply the edit,
  commit, push, and `gh pr create --draft --base <default>`. Return the PR URL and
  leave it in draft. Never push to the default branch directly. One draft PR per
  logical change; group trivially-related edits in the same repo into one PR.

## Run modes

The skill takes an optional mode argument (the slash commands pass it):

| Mode      | Steps                              | When                                                                               |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| `map`     | 1–3                                | Pure audit / fresh session. Inventory + analysis + suggestions. No session mining. |
| `session` | light 1, then 4                    | Mine THIS conversation for skills/agents to add or fix.                            |
| `create`  | jump to 4's "new skill/agent" path | "Turn this into a skill." Hand to skill-creator.                                   |
| `full`    | 1–5                                | Everything. Default when the session contains real work.                           |

### Step 1 — Resolve mode

If a mode was passed, use it. Otherwise auto-detect: if the session already
contains substantive prior work (a real task was carried out, not just this
invocation), use `full`; if it's a fresh/empty session, use `map`. State the
mode you picked in one line, then run only the steps its row enables.

### Step 2 — Inventory (modes: map, full; light version for session/create)

Run the bundled script — it extracts the signal without you reading hundreds of
files:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/skill-doctor/scripts/inventory.py" --cwd "$PWD"
# session/create modes: add --mine-only to limit to writable (own) sources
```

It writes `inventory.json` + `inventory.md` to a temp workspace and prints the
path. **Read `inventory.md`** (compact tables grouped by source + a Flagged
section). Do NOT read every underlying file — that's the whole point of the
script.

Present a short summary: counts per source, and the headline flagged issues.

### Step 3 — Analysis pass (modes: map, full)

Reason over the map (not the raw files). Produce a **prioritized, numbered list**
of suggested improvements. For each: target file, problem, proposed change, and
whether it's `writable`. Cover:

- **Overlaps / duplicates.** Use the `duplicate_names` and
  `near_duplicate_descriptions` flags. Ignore `mirror-only` duplicates
  (marketplace↔plugin-cache are just install mirrors of the same upstream item).
  Focus on `[editable]` collisions and genuinely distinct skills doing the same
  job. Recommend a canonical one + merge/deprecate the rest.
- **Gaps.** Recurring needs with no skill. Cross-reference the project's memory
  store if one exists — many feedback memories encode repeated corrections that
  may deserve a skill.
- **Trigger-quality.** Use `weak_or_missing_description` and
  `no_trigger_language`. For the handful of **writable** items you'll actually
  propose changing, deep-read them **via a subagent** (Explore or general-purpose)
  so main context stays bounded — ask the subagent to return the current
  description + body summary + a tightened description proposal. For rigorous
  triggering work, hand the item to skill-creator's `improve_description.py` /
  `run_loop.py` loop.
- **Oversized bodies.** `oversized_body` items (>500 lines) are candidates for
  progressive disclosure (move detail into `references/`).

See `references/analysis-rubric.md` for the heuristics (good-description shape,
overlap judgment, skill-vs-agent-vs-CLAUDE.md decision).

### Step 4 — Session mining (modes: session, create, full)

Only meaningful if the session contains real prior work. Read the conversation
and look for:

- **Codify-worthy workflows** — a repeated multi-step sequence, or "do X like
  last time." Propose a NEW skill or agent: draft `name`, a pushy `description`
  (per the rubric), and a body outline. Decide skill vs agent vs command using
  the rubric. In `create` mode, go straight here and hand the draft to the
  `skill-creator` skill to flesh out + eval.
- **Undertriggering** — a skill that should have fired this session but didn't.
  Identify which one and propose a description fix (the description is the
  trigger mechanism).
- **Misfire / overtrigger** — a skill that fired wrongly. Tighten its description.
- **Repeated corrections** — guidance the user gave more than once. Decide
  whether it belongs in a skill, an agent, or as a standing rule (a `CLAUDE.md`
  entry / a memory file).

Ground every proposal in a specific moment from the conversation — quote the
turn that motivates it. Vague "you could add a skill for X" proposals aren't useful.

### Step 5 — Present & apply (all modes)

Show the consolidated, prioritized menu. Mark each item `[editable]` or
`[read-only]`. Let the user choose. Then, for accepted items only:

- New/iterated skill → `skill-creator` skill.
- Agent prompt tuning → `agent-optimizer` / `prompt-engineer` agents.
- Standing rule → an `update-claude-md` skill or a memory file.
- Direct small edits (e.g. a tightened description):
  - under `~/.claude/…` (non-git) → edit in place; show the before/after first.
  - inside a git repo → open a **draft PR** per "Delivering changes once
    approved" (branch off the repo's default branch in a clean worktree, commit,
    push, `gh pr create --draft`).

After any change, suggest re-running `inventory.py` to confirm the flag cleared.
For draft PRs, surface the PR URL and note it's left in draft for review.
