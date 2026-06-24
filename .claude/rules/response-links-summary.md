# Response Links Summary

## Instructions for Claude Code

When you finish a turn — that is, you are stopping, **not** asking the user a question and **not** mid-task — end the response with a short `## Links` block: a one-glance, copy-pasteable index of everything actionable from the turn, so the reader doesn't have to scroll back through the work to find it.

## Critical Rules - ALWAYS FOLLOW

### 1. End a stopping turn with a `## Links` block

Include every link that is actionable or referenceable from the turn:

- **PRs / branches** — any PR opened this session AND any PR referenced in-context.
- **Issues / tickets / incidents** — anything touched or referenced (Jira, Linear, incident.io, GitHub issues, etc.).
- **Observability** — dashboards, monitors, notebooks, SLOs, CI/build runs, or traces you cited.
- **Docs / pages** — Notion, Confluence, design docs, runbooks you surfaced.

Group by type when there are several; omit a group that's empty. If there are genuinely no links, **skip the section entirely** — never emit an empty heading.

### 2. Always use full, clickable URLs — never bare IDs

- Render `https://github.com/<org>/<repo>/pull/1234`, not `#1234`.
- Whenever you reference an external component by ID or name in a summary (a monitor, dashboard, ticket, build job, etc.), link it directly — a bare ID forces the reader to go search for it. This applies to **every** summary that names such a component, not only the on-stop block.

### 3. Keep it a trailing index, not the answer

The `## Links` block sits **below** the substantive response and is just URLs plus a few words of label. Don't let it crowd out or replace the actual answer.

## Why

Readers act on these links immediately — open the PR, check the live dashboard, read the ticket. A trailing, grouped, fully-linked index turns "scroll back and reconstruct what was touched" into one glance, and avoids the common failure of citing a bare ID that the reader then has to hunt down.
