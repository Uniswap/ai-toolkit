---
description: Review the current changes or a specified branch/commit-range. Summarize risks and suggest improvements.
argument-hint: [branch|commit-range]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git log:*), Bash(git show:*)
---

## Context (gather via Bash)

- Current branch: !`git branch --show-current`
- Status: !`git status --porcelain`
- If `$ARGUMENTS` is empty, use the working tree diff vs HEAD:
  - Diff: !`git diff --unified=0 HEAD`
- If `$ARGUMENTS` is provided:
  - Recent commits: !`git log --oneline -20`
  - Diff for range or branch tip:
    - !`git diff --unified=0 $ARGUMENTS`

## Task

Perform an AI-native code review:

1. Summarize the intent of the change and the scope of touched files.
2. Identify **risks** by category: correctness, security, performance, maintainability.
3. Propose **actionable suggestions** with file+line anchors when possible.
4. Where appropriate, propose **patch hunks** (do not apply automatically).

## Delegation

- Use **code-explainer** to explain notable files.
- If tests appear missing for changed logic, call **test-writer** to propose tests.
- When style issues dominate, call **style-enforcer** for focused patches.
- For larger cleanups, call **refactorer** to suggest minimal, safe refactors.

## Output

- `summary`
- `findings` (by category)
- `patches[]`
- `tests[]` (optional from test-writer)
