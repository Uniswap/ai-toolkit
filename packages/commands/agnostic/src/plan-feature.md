---
description: Turn a natural-language feature idea into a concrete implementation plan with tasks and file-level changes.
argument-hint: <freeform feature description>
allowed-tools: Bash(git ls-files:*)
---

## Inputs
- `$ARGUMENTS`: freeform description of the feature or goal.

## Task
Produce a concise, actionable plan:
- Scope and assumptions.
- Architecture notes and affected modules.
- Task list (small, testable steps).
- Risks and open questions.

## Delegation
- Use **code-explainer** on relevant files to build context.
- If external APIs are implied, outline integration points (no code writes).

## Output
- `plan`: structured steps.
- `filesToTouch[]`: likely files with brief rationale.
- `followups[]`: later enhancements.
