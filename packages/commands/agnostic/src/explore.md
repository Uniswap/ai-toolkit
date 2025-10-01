---
description: Deep dive into a codebase area to build comprehensive understanding before creating and implementing a plan.
argument-hint: <natural language description of what you want to understand>
allowed-tools: Bash(git ls-files:*), Bash(find:*), Fetch(*), Bash(git log:*), Bash(git show:*), Bash(bunx nx graph:*)
---

## Inputs

Accept natural language description and intelligently extract:

- `topic`: The main area/feature/component (inferred from the description)
- `files`: Specific files mentioned (look for file paths with extensions)
- `focus`: Specific aspects emphasized (e.g., "focusing on X", "especially Y", "particularly Z")

Examples:

- `/explore authentication system`
- `/explore I want to understand the scrapers, especially error handling`
- `/explore show me how the data pipeline works in src/pipeline.ts and src/transform.ts`
- `/explore explain the Nx configuration focusing on package dependencies`

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

## Workflow Integration (Optional)

This command is **Step 1** of the implementation workflow:

1. **Explore** → 2. Plan → 3. Review → 4. Execute

### Next Steps

After exploring an area, the context findings are automatically available for:

- `/plan <task>` - Creates implementation plan using the explored context
- The plan command will automatically leverage your exploration findings

### Example Workflow

```bash
# Step 1: Explore and understand the area
/explore authentication system

# Step 2: Plan implementation with automatic context
/plan add two-factor authentication

# Step 3: Review the generated plan
/review-plan auth-2fa-plan.md

# Step 4: Execute the approved plan
/execute-plan auth-2fa-plan.md
```

**Note for Claude Code**: Store the context-loader findings in memory for automatic use by the `/plan` command in the same session.
