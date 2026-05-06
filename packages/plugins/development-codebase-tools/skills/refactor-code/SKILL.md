---
description: Refactor code with safety checks and pattern application. Use when user says "refactor this code", "clean up this function", "simplify this logic", "extract this into a separate function", "apply the strategy pattern here", "reduce the complexity of this module", or "reorganize this file structure".
allowed-tools: Read, Edit, Write, Grep, TodoWrite, Bash(git diff:*), Bash(git show:*), Task(subagent_type:refactorer-agent), Task(subagent_type:style-enforcer-agent), Task(subagent_type:code-explainer-agent), Task(subagent_type:test-writer-agent), Task(subagent_type:agent-orchestrator-agent)
model: claude-opus-4-7
---

# Code Refactorer

Orchestrate sophisticated refactoring through multi-agent coordination with safety checks.

## Refactoring Strategies

| Strategy           | Risk   | Use When                               |
| ------------------ | ------ | -------------------------------------- |
| **Safe** (default) | Low    | Production code, critical paths        |
| **Aggressive**     | Medium | Comprehensive restructuring with tests |
| **Architectural**  | High   | System-wide pattern application        |

## Execution Steps

1. **Understand scope** — Read the target file(s). Run `git diff HEAD` to see any uncommitted state. Use `code-explainer-agent` if the codebase context is complex.
2. **Create a task plan** — Use TodoWrite to list the refactoring tasks before starting.
3. **Dispatch refactorer-agent** — Pass:
   - `paths`: file(s) or globs to refactor
   - `goals`: e.g., `["readability", "maintainability"]` (or user-specified goal from Goals table below)
   - `refactor_depth`: `"surface"` | `"moderate"` | `"deep"` based on strategy
   - `risk_tolerance`: `"low"` | `"medium"` | `"high"` matching the strategy
4. **Apply patches** — Write the refactored code to disk using the patches returned by refactorer-agent. Apply incrementally — one logical change at a time.
5. **Enforce style** — Dispatch `style-enforcer-agent` on the modified files.
6. **Validate** — Run `git diff HEAD` to review the final changes. Confirm behavior is preserved.
7. **Generate tests** (if not already covered) — Dispatch `test-writer-agent` to add regression tests for refactored code.

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
