---
description: Explore and understand how the codebase works. Use when user asks "how does the authentication work", "where is the API endpoint defined", "show me how data flows through the system", "explain this module's architecture", "trace the request from controller to database", or "I need to understand this feature before making changes".
allowed-tools: Bash(git ls-files:*), Bash(find:*), Bash(git log:*), Bash(git show:*), Bash(npx nx graph:*), Glob, Grep, Read, WebFetch, Task(subagent_type:context-loader-agent)
model: opus
---

# Codebase Explorer

Build comprehensive understanding of codebase areas before implementation or to answer questions about how things work.

## When to Activate

- User asks "how does X work?"
- User wants to understand existing code
- User asks where something is implemented
- Before planning any feature (preparation step)
- User asks about architecture or patterns
- User wants to trace data flow or execution

## Quick Process

1. **Identify the topic** from user's natural language
2. **Map relevant files** using Glob and Grep
3. **Trace dependencies** and integration points
4. **Identify patterns** and conventions
5. **Document findings** for implementation work

## Input Parsing

Extract from user's request:

- `topic`: Main area/feature/component to explore
- `files`: Specific files mentioned (optional)
- `focus`: Particular aspects to emphasize (optional)

## Delegation

Invoke the **context-loader-agent** agent with extracted parameters for comprehensive analysis.

## Output Format

Return structured analysis:

- **Summary**: Executive overview of the area
- **Key Components**: Core files and responsibilities
- **Patterns**: Conventions to follow
- **Dependencies**: External integrations
- **Data Flow**: How data moves through the system
- **Gotchas**: Non-obvious behaviors and pitfalls
- **Implementation Notes**: Key considerations for new work

## Workflow Integration

This is **Step 1** of the implementation workflow:

1. **Explore** (this) → 2. Plan → 3. Review → 4. Execute

After exploring, context is automatically available for `/plan` or the `plan-implementation` skill.

## Detailed Reference

For exploration strategies and patterns, see [exploration-guide.md](exploration-guide.md).
