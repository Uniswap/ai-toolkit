---
description: Diagnose an error message or failing test and propose a smallest-possible fix with an optional regression test.
argument-hint: <error text or pointer> [--run-tests]
allowed-tools: Bash(npm test:*), Bash(pnpm test:*), Bash(bun test:*), Bash(yarn test:*)
---

## Inputs
- `$ARGUMENTS`: paste an error/stack trace or provide a short description.
- If `--run-tests` is provided, run the project's test command to capture failure output.

## Task
- Use **debug-assistant** to identify likely root cause and propose a fix plan.
- When the fix is code-level, ask **refactorer** for a minimal patch.
- Request **test-writer** to propose a regression test if applicable.

## Output
- `rootCause`
- `fixPlan`
- `patches[]` (optional)
- `tests[]` (optional regression tests)
