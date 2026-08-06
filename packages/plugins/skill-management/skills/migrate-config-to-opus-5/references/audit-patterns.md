# Opus 5 Audit Patterns

What to search for, why it's now wrong, and the fix shape. Patterns come from Anthropic's Opus 5 prompting guide, the 4.8→5 migration guide, and a full migration of a large real-world config (2026-08-04).

The **Search for** terms below are cues for the Step 2 subagents reading each file, plus a main-thread completeness cross-check — not a substitute for reading. Prose that compensates for a 4.x failure mode rarely contains a greppable keyword.

## Delta 1 — Verification: the model self-verifies unprompted

Opus 4.x under-verified, so configs accumulated verification pressure. Opus 5 verifies on its own; standing re-verify instructions now cause over-verification — wasted tokens, no quality gain. Anthropic's guidance is to delete them.

**Search for:** `triple-check`, `double-check`, `re-verify`, `verify before`, `verify after every`, `check your work`, per-action expect/result ceremony (structured "state expectation → act → compare" protocols).

**Fix shape:** delete the re-verification loop; keep the _grounding_ half if the user values it. Worked rewrite:

- Before: `**Triple-check by default** - Verify before reporting success.`
- After: `**Report only observed outcomes** - Never claim success you haven't seen happen; if a step wasn't verified, say so plainly. (Do not add extra re-verification passes beyond this — current models self-verify.)`

**Keep (policy, not compensation):** independent review gates (a fresh-context reviewer before merge), "reproduce the bug before fixing it" workflows. Those are process decisions with history behind them, not model babysitting. Confirm with the user rather than deleting.

## Delta 2 — Delegation: the model over-delegates where 4.8 under-delegated

Config written to push delegation harder ("use subagents proactively", "delegate aggressively") now over-triggers: agents spawned for work that fits in a handful of tool calls.

**Search for:** `use subagents` / `delegate` phrased as encouragement without limits; "PROACTIVELY" in agent descriptions; anything nudging fan-outs.

**Fix shape:** convert nudges to caps and "when not to delegate" rules:

> Cap delegation: don't spawn an agent for work that finishes in a handful of tool calls, prefer one agent over several when one suffices, and keep fleet counts low by default.

**Keep (policy):** cost-routing tables (cheap models for mechanical steps — that's economics), and adversarial-review/verification dispatches the user explicitly wants in fresh contexts. If the user has such a policy, write the cap language _with an explicit carve-out_ naming it, or the cap will silently eat the gate.

**Related stale fact:** pre-2026 configs often justify model routing with "Opus costs ~5x Sonnet". Claude 5 pricing (as of 2026-08): Opus 5 $5/$25 per MTok vs Sonnet 5 $3/$15 → ~1.7x — but Sonnet 5 has introductory pricing of $2/$10 through 2026-08-31, so the ratio is ~2.5x until then. Haiku ($1/$5) is still ~5x under Opus. Don't rewrite a cost-ratio claim to a number that goes stale in weeks: verify current pricing at docs.claude.com before writing the replacement.

## Delta 3 — Literal instruction-following: emphasis and filters over-apply

CRITICAL/MUST written to overcome 4.x under-triggering now over-applies. The highest-impact instance: **review-prompt recall filters**. "Only report findings with confidence ≥ 75" or a severity floor makes Opus 5 silently drop real findings.

**Search for:** `confidence >=` / `confidence ≥` / `only report` / `high-severity only` / `be conservative` / `skip things that look correct` in reviewer prompts; count `CRITICAL|MUST|NEVER|ALWAYS` per file and investigate the outliers.

**Fix shape for review prompts** — coverage-first, filter downstream:

> Report every genuine issue you find, including ones you are uncertain about or consider low-severity. Do not filter for confidence at this stage — set the confidence field honestly and let the downstream verification pass rank and filter. It is better to surface a finding that later gets filtered out than to silently drop a real bug.

If a severity floor must stay (a pipeline contract), soften its edge: "when uncertain whether an issue clears the floor, err on the side of reporting it — never silently drop a borderline finding you actually investigated."

**Fix shape for pressure language:** rewrite emphasis into a one-line _why_ ("X breaks when Y, so do Z") — explained constraints steer better than shouted ones.

**Leave alone:** full-volume emphasis guarding genuinely fragile operations (exact scripts for brittle tooling) and hard policy lines (secrets handling, destructive git). Note each one you kept and why.

## Delta 4 — Output length: longer responses and file deliverables

Effort settings do not shorten visible text; only explicit length instructions do. Most configs already constrain chat replies but say nothing about files the model authors.

**Check:** does the config have a deliverable-length rule? If not, add one line where writing style lives:

> Match the length of written deliverables (reports, docs, Markdown files Claude authors) to what the task needs: cover the substance, skip filler sections, redundant summaries, and boilerplate padding.

## Mechanical checks (no judgment, just fix)

- **Model IDs:** `/usr/bin/grep -rE 'claude-(opus|sonnet|haiku|fable|mythos)-[0-9]|claude-[0-9]' <scope>` across scripts, CI, statuslines, agent frontmatter, scheduled-task registrations. The second alternative catches Claude 3.x-era IDs (`claude-3-opus-20240229`, `claude-3-5-sonnet-20241022`), where the version precedes the tier — those retired, now-404 pins are exactly what a pre-Opus-5 config is most likely to carry. Current IDs (as of 2026-08): `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5` (plus `claude-fable-5` where the top tier is wanted). Aliases (`opus`, `sonnet`, `haiku`) are self-updating — prefer them where a pin isn't required.
- **Context-window logic:** scripts branching on model ID for window size. All current non-Haiku models are 1M; Haiku 4.5 is 200K. Keying "haiku → 200K, else 1M" beats enumerating model names. Test with synthetic payloads for both branches.
- **API params:** `budget_tokens` is rejected with a 400 on the Claude 5 family — replace `thinking: {type: "enabled", budget_tokens: N}` with `thinking: {type: "adaptive"}`. Also flag hardcoded `temperature` alongside thinking, and Priority Tier assumptions (not supported on Opus 5).
- **Dead weight:** vendored commands referencing nonexistent agents, archive directories, `.backup`/`.bak` settings snapshots (these often pin old models), marketplace entries pointing at dead repos. Delete outright only when the surface is a git repo with a clean tree — git holds history there. On a non-git surface (a plain `~/.claude` is the common case) deletion is unrecoverable, so list the candidates for the Step 3 interview instead of deleting, or confirm an external backup (Time Machine, sync) first.
- **Third-party plugins:** their prompts carry the same 4.x-era patterns but are not yours to edit. Check each plugin's upstream for explicit Opus 5 retuning evidence; disable or flag the ones without it, and flag (don't disable) the ones the user authors — those are theirs to retune.

## Settings that need a user decision

- **effortLevel** (Claude Code setting): Claude Code defaults Opus 5 to xhigh (the raw API default is high — don't conflate the two); low/medium are unusually strong on this model, so a pinned `high` from the 4.x era is worth revisiting. Never change this one mechanically — present the trade (cost/latency vs depth) in the Step 3 interview and let the user pick; log a checkpoint to revisit after a week of use.
