---
description: Deep dive into a codebase area to build comprehensive understanding before implementation.
argument-hint: <natural language description of what you want to understand>
allowed-tools: Bash(git ls-files:*), Bash(find:*), Fetch(*), Bash(git log:*), Bash(git show:*), Bash(bunx nx graph:*)
---

## Inputs

Accept natural language description and intelligently extract:
- `topic`: The main area/feature/component (inferred from the description)
- `files`: Specific files mentioned (look for file paths with extensions)
- `focus`: Specific aspects emphasized (e.g., "focusing on X", "especially Y", "particularly Z")

Examples:
- `/understand-area authentication system`
- `/understand-area I want to understand the scrapers, especially error handling`
- `/understand-area show me how the data pipeline works in src/pipeline.ts and src/transform.ts`
- `/understand-area explain the Nx configuration focusing on package dependencies`

## Task

Build a comprehensive mental model of the specified codebase area:

1. Map out the relevant files and directory structure
2. Understand the architecture and design patterns
3. Identify dependencies and integration points
4. Note conventions, gotchas, and edge cases
5. Prepare actionable context for implementation work

## Delegation

Invoke **context-loader** with:
- `topic`: Inferred from the natural language description
- `files`: Extracted file paths from the description (optional)
- `focus`: Specific aspects mentioned in the description (optional)

## Output

Return the structured analysis from context-loader:
- `summary`: Executive summary of the area
- `key-components`: Core files and their responsibilities
- `patterns`: Conventions and patterns to follow
- `dependencies`: External dependencies and integrations
- `data-flow`: How data moves through the system
- `gotchas`: Non-obvious behaviors and pitfalls
- `implementation-notes`: Key considerations for new work
- `testing-approach`: How this area is tested