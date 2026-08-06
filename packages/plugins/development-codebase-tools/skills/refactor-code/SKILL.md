---
description: Refactor code with safety checks and pattern application. Use when user says "refactor this code", "clean up this function", "simplify this logic", "extract this into a separate function", "apply the strategy pattern here", "reduce the complexity of this module", or "reorganize this file structure".
allowed-tools: Read, Edit, Write, Glob, Grep, TodoWrite, Bash(git diff:*), Bash(git show:*), Bash(git status:*), Bash(npm test:*), Bash(npm run:*), Bash(yarn:*), Bash(pnpm:*), Bash(bun run:*), Bash(bun test:*), Bash(npx nx:*), Bash(npx vitest:*), Bash(npx jest:*), Bash(npx tsc:*), Bash(npx eslint:*), Bash(npx prettier:*), Bash(python -m pytest:*), Bash(go test:*), Bash(go build:*), Bash(cargo test:*), Bash(cargo fmt:*), Bash(mvn:*), Bash(gradle:*), Bash(./gradlew:*), Task(subagent_type:refactorer-agent), Task(subagent_type:style-enforcer-agent), Task(subagent_type:code-explainer-agent), Task(subagent_type:test-writer-agent)
model: claude-opus-5
---

# Code Refactorer

Orchestrate sophisticated refactoring through multi-agent coordination with safety checks.

## Refactoring Strategies

| Strategy           | Risk   | Use When                               |
| ------------------ | ------ | -------------------------------------- |
| **Safe** (default) | Low    | Production code, critical paths        |
| **Aggressive**     | Medium | Comprehensive restructuring with tests |
| **Architectural**  | High   | System-wide pattern application        |

## Sizing the Work First

Every dispatch below is conditional. "Clean up this function" is one file and one edit — do it
directly with Read and Edit, then run the project's formatter and tests. Three agent dispatches
for a single-function tidy-up costs three context loads to produce work you could have done in
two tool calls.

Dispatch agents when the refactor spans multiple files, changes a public interface, or applies
a structural pattern across a module.

## Execution Steps

1. **Understand scope** — Read the target file(s). Run `git diff HEAD` to see any uncommitted state. Dispatch `code-explainer-agent` only if the target's behavior is unclear after reading it.
2. **Create a task plan** — Use TodoWrite when the refactor has more than about three steps; skip it for a single edit.
3. **Dispatch refactorer-agent** _(multi-file or structural refactors only)_ — Pass:
   - `paths`: file(s) or globs to refactor
   - `goals`: e.g., `["readability", "maintainability"]` (or user-specified goal from Goals table below)
   - `refactor_depth`: `"surface"` | `"moderate"` | `"deep"` based on strategy
   - `risk_tolerance`: `"low"` | `"medium"` | `"high"` matching the strategy
4. **Apply patches** — Write the refactored code to disk. Apply incrementally — one logical change at a time.
5. **Enforce style** — Run the project's own formatter and linter (the runner prefixes in `allowed-tools` cover the common ones; read `package.json` scripts or the equivalent manifest to find the right command). Dispatch `style-enforcer-agent` only when the project has no configured formatter, or the refactor touched enough files that a convention drift is plausible.
6. **Validate — mandatory, never skipped** — A refactor is not done until behavior preservation has been checked by something other than reading your own diff. Exactly one of these must run and pass:

   - **Preferred**: run the tests covering the touched code. If the suite is large, run the narrowest command that exercises the changed files.
   - **Fallback, when no test covers the touched code**: dispatch `code-explainer-agent` on the before/after pair and have it state, per changed function, whether observable behavior is identical. This is not optional — it is what replaces the test run, not an addition to it.

   Then run `git diff HEAD` and review the final changes. Report which of the two checks ran and its result. If neither could run, say so explicitly and mark the refactor unverified rather than complete.

7. **Generate tests** — Dispatch `test-writer-agent` only when the refactored code had no test coverage to begin with. Existing passing tests are the behavior-preservation check; adding more is not.

## Goals

- `readability`: Extract expressions, rename for clarity
- `performance`: Algorithm improvements, caching
- `maintainability`: SOLID principles, reduce coupling
- `testability`: Dependency injection, pure functions
- `all`: Comprehensive improvement

## Output Format

Provides:

- Summary with metrics and risk assessment
- Analysis of current issues and patterns
- Incremental patches with diffs
- Migration plan for architectural changes
- Validation results

## Safety

- Small, reviewable patches
- Dependency ordering
- Rollback procedures
- Validation checkpoints
