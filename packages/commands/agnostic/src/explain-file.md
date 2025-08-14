---
description: Explain a file or module in plain English with responsibilities, invariants, and risks.
argument-hint: <path> [--depth overview|deep]
allowed-tools: Bash(git show:*), Bash(git ls-files:*)
---

## Inputs
- Path is required. Depth defaults to `overview` unless `--depth deep`.

## Task
- Use **code-explainer** to generate a structured explanation.

## Output
- `overview`
- `key-concepts[]`
- `dependencies[]`
- `risks[]`
- `improvements[]`
