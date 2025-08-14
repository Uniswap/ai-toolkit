---
description: Suggest and return minimal, safe refactors for a file or path.
argument-hint: <path|glob> [--goal readability|performance|safety]
allowed-tools: Bash(git diff:*), Bash(git show:*)
---

## Inputs
- Target path or glob.
- Optional `--goal` (default: readability).

## Task
- Use **refactorer** to propose small, reviewable patches aligned with the goal.
- If style changes dominate, use **style-enforcer** to generate small fixes.
- Return patches only; do not apply automatically.

## Output
- `summary`
- `patches[]`
- `followups[]`
