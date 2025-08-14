---
description: Generate or extend tests for one or more files using the test-writer subagent.
argument-hint: [paths...] [--framework jest|vitest|pytest] [--coverage unit|integration]
---

## Inputs
Arguments are file paths and optional flags.
Examples:
- `/gen-tests src/utils/math.ts`
- `/gen-tests src/foo.ts --framework vitest --coverage unit`

## Task
Use **test-writer** to propose tests for the provided paths.
If `--framework` is set, use it; otherwise infer from the repo.
Default coverage is `unit` unless `--coverage integration` is provided.

## Delegation
Invoke **test-writer** with:
- `paths`: parsed from `$ARGUMENTS`
- `framework`: from `--framework` or inferred
- `coverage`: from `--coverage` or `unit`

## Output
- `summary`
- `suggestedTests[] { file, contents, rationale[] }`
