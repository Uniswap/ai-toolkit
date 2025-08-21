---
description: Create a detailed implementation plan for a task without writing code
argument-hint: <task description>
allowed-tools: Read(*), Glob(*), Grep(*), LS(*), WebSearch(*), WebFetch(*), Write(*), MultiEdit(*)
---

# Plan Command

Create a comprehensive implementation plan for a task, feature, refactor, or bug fix without writing any code.

## Recommended Workflow

**BEST PRACTICE: Use this command AFTER running `/understand-area` for optimal results**

1. First: `/understand-area <relevant area>` - Builds comprehensive context
2. Then: `/plan <task>` - Creates plan using that context automatically

This two-step process ensures the planner has deep understanding before creating the implementation plan.

**Note for Claude Code**: When you have context-loader findings from a previous `/understand-area` command, automatically pass them to the planner agent. The user doesn't need to specify any flags.

## Inputs

Accept natural language description and extract:

- `task`: The full description of what needs to be implemented/fixed/refactored
- `scope`: Any specific scope or boundaries mentioned
- `constraints`: Any explicit constraints or requirements
- `context_findings`: Automatically include context-loader findings from `/understand-area` if available

Examples:

- `/plan add user authentication with JWT tokens`
- `/plan refactor the data pipeline to use async/await`
- `/plan fix the memory leak in the image processing module`
- `/plan implement real-time notifications using WebSockets`

## Task

Generate a detailed implementation plan that:

1. Leverages any context-loader findings if available
2. Analyzes the current codebase state
3. Defines the exact scope of changes
4. Creates a step-by-step implementation plan
5. Identifies potential challenges and solutions
6. Provides both overview and detailed breakdown

## Context Integration

**Claude Code**: When you have findings from a previous `/understand-area` command, automatically extract and pass:

- Key components and their responsibilities
- Existing patterns and conventions
- Dependencies and integration points
- Known gotchas and edge cases
- Testing approaches in use

## Delegation

Invoke **planner** with:

- `task`: The complete task description
- `scope`: Extracted scope/boundaries (optional)
- `constraints`: Any specific constraints (optional)
- `context_findings`: Structured findings from context-loader if available:
  - `key_components`: Core files and responsibilities
  - `patterns`: Conventions to follow
  - `dependencies`: External integrations
  - `gotchas`: Known issues/edge cases
  - `testing_approach`: Current testing patterns

## Output

Return the plan summary from planner:

- `plan_file_path`: Absolute path to the generated markdown plan file
- `summary`: Brief summary of what was planned
- `task_analyzed`: Original task that was analyzed
- `context_used`: Whether context-loader findings were leveraged

The detailed plan is written to the markdown file for use with `/review-plan` or future reference.
