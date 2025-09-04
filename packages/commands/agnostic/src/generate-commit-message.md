---
name: generate-commit-message
description: Generate a structured git commit message based on current changes and repository patterns
argument-hint: [scope or focus area]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

# /generate-commit-message Command

## Description

This command generates a well-structured git commit message that follows conventional format by analyzing current git state and repository patterns. It creates contextually appropriate commit messages with a concise summary line, detailed explanation of WHAT and WHY, and proper formatting.

## Usage

```
/generate-commit-message [scope or focus area]
```

## Arguments

- `scope`: Optional scope or component focus (e.g., "auth", "frontend", "api")
- Natural language descriptions like "focus on authentication changes" or "database migration"

## Instructions

This command accomplishes the following:

1. **Gather Git Information**:

   - Runs `git status` to see staged and unstaged changes
   - Runs `git diff --cached` to get detailed staged changes
   - Runs `git diff` to get unstaged changes (if any)
   - Runs `git log --oneline -10` to understand repository commit patterns

2. **Parse Input**: Extracts any scope or focus area from the user's natural language input

3. **Delegate to Agent**: Invokes the **commit-message-generator** agent with structured git data

The command generates a commit message that follows conventional format:

- Concise summary line (≤100 characters)
- Detailed explanation of WHAT and WHY (1-3 paragraphs, preferably 1 paragraph)
- Claude Code signature

**Expected Inputs**: Natural language scope or focus area (optional)
**Expected Outputs**: Formatted commit message ready for git commit
**Error Handling**: Informs user to make first make changes if there haven't been any code changes
**Special Considerations**: includes staged and unstaged changes for context, preserves repository's existing commit message conventions

## Examples

### Example 1: Basic usage without scope

```
/generate-commit-message
```

### Example 2: With specific scope

```
/generate-commit-message auth
```

### Example 3: With natural language focus

```
/generate-commit-message focusing on API changes
```

### Example 4: With descriptive focus

```
/generate-commit-message database refactoring
```

## Implementation Notes

The command delegates to the **commit-message-generator** agent with the following structured data:

```json
{
  "staged_changes": "<git diff --cached output>",
  "unstaged_changes": "<git diff output or null>",
  "commit_history": "<git log output>",
  "scope": "<extracted scope or null>"
}
```

**Dependencies**: Requires git repository with changes (staged or unstaged)
**Output Format**: Returns generated commit message in a code block for easy copying
**Safety**: Never executes `git commit` - only generates the message text
