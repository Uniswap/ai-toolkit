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

1. **Parse the request** — extract `topic`, `files` (optional), and `focus` (optional) from the user's message
2. **Delegate** — invoke context-loader-agent with the extracted parameters
3. **Present findings** — format the agent output using the Output Format section below

## Input Parsing

Extract from user's request:

- `topic`: Main area/feature/component to explore
- `files`: Specific files mentioned (optional)
- `focus`: Particular aspects to emphasize (optional)

## Delegation

Invoke **context-loader-agent** and pass the extracted parameters:

- `topic`: the main area to explore
- `files`: specific files mentioned (omit if none)
- `focus`: the aspect to emphasize (omit if not specified)

The agent handles file discovery, dependency tracing, pattern identification, and analysis.

## Output Format

Return structured analysis:

- **Summary**: Executive overview of the area
- **Key Components**: Core files and responsibilities
- **Patterns**: Conventions to follow
- **Dependencies**: External integrations
- **Data Flow**: How data moves through the system
- **Gotchas**: Non-obvious behaviors and pitfalls
- **Implementation Notes**: Key considerations for new work

## Examples

```
"How does the authentication flow work?"
"Where is the API rate limiting implemented?"
"Show me how data flows from the UI to the database"
"Explain the plugin architecture before I add a new one"
"Trace a request from the controller to the database"
```

## Workflow Integration

This is **Step 1** of the implementation workflow:

1. **Explore** (this) → 2. Plan → 3. Review → 4. Execute

After exploring, context is automatically available for `/plan` or the `plan-implementation` skill.

## Detailed Reference

For exploration strategies and patterns, see [exploration-guide.md](exploration-guide.md).
