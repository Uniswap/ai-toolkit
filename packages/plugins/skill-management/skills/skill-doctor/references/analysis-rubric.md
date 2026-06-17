# skill-doctor analysis rubric

Heuristics for the analysis + mining passes. Keep judgments concrete and tied to
the inventory data; don't invent problems.

## What a good triggering description looks like

The `description` is the _only_ thing Claude sees when deciding whether to
consult a skill, so it must say **what it does AND when to use it** — both, in
the description, not the body.

- **Be a little pushy.** Claude tends to _under_-trigger skills. Prefer
  "Use this whenever the user mentions X, Y, or Z, even if they don't say
  'skill'…" over a bare one-liner. List concrete trigger phrases the user
  actually types.
- **Substantive tasks only.** Skills are consulted for multi-step / specialized
  work, not trivial one-shots. A description that promises to "read a file" won't
  (and shouldn't) trigger — Claude just does it. Pitch the description at the
  real, non-trivial job.
- **Disambiguate from neighbors.** When two skills are adjacent (e.g. tune vs
  tighten monitors), each description should name the boundary ("inverse of…",
  "lighter than…", "NOT for…").

A description is _weak_ when it's < ~15 words, has no "use when"/trigger phrasing
(`no_trigger_language` flag), or is so generic it overlaps a dozen others.

## Overlap / duplicate judgment

- **Ignore `mirror_only` duplicates.** `marketplace` and `plugin-cache` are two
  copies of the same upstream plugin item. Not actionable.
- **Actionable:** the same name (or near-identical description) appearing across
  `user` / `own-marketplace` / `project`, or two _different-named_ skills that do
  the same job. Recommend a single canonical version; for the rest, either delete
  (if writable and truly redundant) or note that one shadows the other and which
  one wins.
- **Shadowing:** a `user` skill and a `marketplace` skill with the same name —
  know which one Claude actually loads, and whether the user's copy is an
  intentional override or stale drift.

## skill vs agent vs command vs CLAUDE.md rule

Decide what form a proposal should take:

- **Skill** — a reusable _procedure/knowledge_ with triggering: "when X, do this
  workflow." Can bundle scripts/references. Most codify-worthy workflows.
- **Agent (subagent)** — a _role_ you dispatch a self-contained task to, that runs
  in its own context (heavy search, parallel work, independent review). Choose
  this when the work should be delegated and isolated, not run inline.
- **Command** — a thin prompt shortcut. Good as a typed entry point that
  invokes a skill in a specific mode (that's exactly how skill-map/mine/new work).
- **CLAUDE.md rule / memory** — a _standing constraint or preference_ with no
  procedure ("never log addresses", "use bun not npm"). If the user keeps
  correcting the same thing, this is usually the right home, not a new skill.

When unsure between skill and agent: if it's "knowledge + steps Claude follows
inline," skill; if it's "go do this whole thing and report back," agent.

## Body quality

- Keep SKILL.md bodies under ~500 lines (`oversized_body` flag). Past that, push
  detail into `references/` and point to it (progressive disclosure).
- Prefer explaining _why_ over heavy-handed ALL-CAPS MUSTs — the model has good
  theory of mind and follows reasoning better than rules.
- If multiple past sessions independently wrote the same helper script, that
  script should be bundled into the skill's `scripts/`.

## Grounding (mining pass)

Every mining proposal must cite a specific conversation moment — quote the turn.
"You repeated the gh-pr-create → check-CI → fix-lint loop three times" is a
proposal; "you might want a CI skill" is noise.
