---
name: implementation-planner
description: Create actionable implementation plans through multi-agent collaborative refinement. Use PROACTIVELY and AUTOMATICALLY when user wants to implement a feature, add functionality, refactor code, fix complex bugs, or make architectural changes. Triggers: "implement", "add", "build", "create", "develop", "refactor", "migrate", "design", "architect", "plan", "feature", "how should I", "what's the best way to".
allowed-tools: Read, Glob, Grep, LS, Task, WebSearch, WebFetch, Write(*.md), Bash(git ls-files:*), Bash(mkdir:*)
model: claude-sonnet-4-5-20250929
---

# Implementation Planner

Create clear, actionable implementation plans through collaborative multi-agent discussion and refinement.

## When to Activate

- User wants to implement a new feature
- User asks "how should I implement X?"
- User wants to add functionality
- User needs to refactor or migrate code
- Complex bug fixes requiring planning
- Architectural changes or design decisions
- Any task that benefits from structured planning

## Quick Process

1. **Analyze Context**: Understand the task, leverage any prior exploration
2. **Select Agents**: Choose 3-10 specialists based on task complexity
3. **Collaborative Discussion**: 2-3 rounds of multi-agent refinement
4. **Synthesize Plan**: Generate comprehensive implementation plan
5. **Output File**: Write plan to `.claude-output/plan-[timestamp].md`

## Complexity-Based Planning

| Task Type                              | Agents | Rounds | Plan Length    |
| -------------------------------------- | ------ | ------ | -------------- |
| Simple (bug fix, minor feature)        | 3-4    | 1-2    | ~100-200 lines |
| Medium (features, refactors)           | 5-7    | 2-3    | ~200-400 lines |
| Complex (architecture, major features) | 8-10   | 2-3    | ~400-600 lines |

## Plan Structure

Generated plans include:

1. **Overview** - High-level summary
2. **Scope** - What will/won't be implemented
3. **Current State** - Relevant architecture and files
4. **API Design** (optional) - Interfaces and data structures
5. **Implementation Steps** - Clear sequential steps (5-7 typical)
6. **Files Summary** - Files to create/modify
7. **Critical Challenges** (optional) - Risks and mitigations
8. **Agent Collaboration Summary** - Consensus and trade-offs

## Workflow Integration

This is **Step 2** of the implementation workflow:

1. Explore → 2. **Plan** (this) → 3. Review → 4. Execute

- Automatically uses context from prior exploration
- Output plan can be reviewed with `/review-plan`
- Approved plans execute with `plan-executor` skill

## Detailed Reference

For agent selection, discussion protocols, and output formats, see [planning-guide.md](planning-guide.md).
