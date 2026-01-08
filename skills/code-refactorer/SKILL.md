---
name: code-refactorer
description: Refactor code with safety checks and pattern application. Use when user says "refactor this code", "clean up this function", "simplify this logic", "extract this into a separate function", "apply the strategy pattern here", "reduce the complexity of this module", or "reorganize this file structure".
allowed-tools: Read, Grep, Bash(git diff:*), Bash(git show:*), Task(subagent_type:refactorer), Task(subagent_type:style-enforcer), Task(subagent_type:code-explainer), Task(subagent_type:test-writer), Task(subagent_type:agent-orchestrator)
---

# Code Refactorer

Orchestrate sophisticated refactoring through multi-agent coordination with safety checks.

## When to Activate

- User wants to refactor code
- Code complexity needs reduction
- Design patterns should be applied
- Technical debt cleanup needed
- Code structure improvements requested
- User mentions "clean up", "simplify", or "improve"

## Refactoring Strategies

| Strategy           | Risk   | Use When                               |
| ------------------ | ------ | -------------------------------------- |
| **Safe** (default) | Low    | Production code, critical paths        |
| **Aggressive**     | Medium | Comprehensive restructuring with tests |
| **Architectural**  | High   | System-wide pattern application        |

## Quick Process

1. **Analyze**: Understand current structure and issues
2. **Identify**: Detect applicable design patterns
3. **Plan**: Create incremental, safe transformations
4. **Validate**: Ensure behavior preservation
5. **Test**: Generate tests for refactored code

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
