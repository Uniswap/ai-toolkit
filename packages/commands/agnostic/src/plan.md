---
description: Create clear, actionable implementation plans for any task, feature, refactor, or architectural change
argument-hint: <task/feature description>
allowed-tools: Read(*), Glob(*), Grep(*), LS(*), WebSearch(*), WebFetch(*), Write(*.md), MultiEdit(*.md), Bash(git ls-files:*)
---

# Plan Command

Create clear, actionable implementation plans for any development task - from simple bug fixes to complex architectural changes. Plans focus on strategic direction: what needs to be done, in what order, and what challenges to expect.

## Workflow Integration

This command is **Step 2** of the implementation workflow:

1. Explore → 2. **Plan** → 3. Review → 4. Execute

### Recommended Workflow

**BEST PRACTICE: Use this command AFTER running `/explore` for optimal results**

1. First: `/explore <relevant area>` - Builds comprehensive context
2. Then: `/plan <task>` - Creates plan using that context automatically
3. Next: `/review-plan <plan-file>` - Review and validate the plan
4. Finally: `/execute-plan <plan-file>` - Executes the approved implementation

This four-step process ensures optimal understanding, planning, validation, and execution.

**Note for Claude Code**: When you have context-loader findings from a previous `/explore` command, automatically pass them to the planner agent. The user doesn't need to specify any flags.

## Inputs

Accept natural language description and extract:

- `task`: The full description of what needs to be implemented/fixed/refactored
- `scope`: Any specific scope or boundaries mentioned
- `constraints`: Any explicit constraints or requirements
- `context_findings`: Automatically include context-loader findings from `/explore` if available

Examples:

**Simple Bug Fixes:**

- `/plan fix the memory leak in the image processing module`
- `/plan resolve race condition in checkout process`
- `/plan fix broken unit tests in auth module`

**Feature Implementation:**

- `/plan add user authentication with JWT tokens`
- `/plan implement real-time notifications using WebSockets`
- `/plan add dark mode toggle to settings`
- `/plan implement search functionality with elasticsearch`

**Refactoring & Optimization:**

- `/plan refactor the data pipeline to use async/await`
- `/plan optimize database queries for user dashboard`
- `/plan migrate from callbacks to promises in legacy code`

**Complex Architectural Planning:**

- `/plan migrate monolith to microservices architecture for the e-commerce platform`
- `/plan implement event-driven order processing system with Kafka`
- `/plan design domain-driven architecture for healthcare management system`
- `/plan implement real-time collaborative editing with conflict resolution`

## Task

Generate a clear, actionable implementation plan:

### Core Planning Capabilities

1. **Context Integration**

   - Leverage any context-loader findings if available
   - Analyze the current codebase state and architecture
   - Map existing patterns, conventions, and constraints

2. **Implementation Breakdown**

   - Break down the task into clear, sequential steps (typically 5-7 steps for medium complexity)
   - Identify which files need to be modified or created
   - Define API interfaces and data structures when needed
   - Focus on WHAT needs to happen, not HOW to code it

3. **Challenge Identification**
   - Identify critical, blocking, or high-risk challenges
   - Provide mitigation strategies for significant issues
   - Skip minor edge cases (trust the implementer)

## Context Integration

**Claude Code**: When you have findings from a previous `/explore` command, automatically extract and pass:

- Key components and their responsibilities
- Existing patterns and conventions
- Dependencies and integration points
- Known gotchas and edge cases

## Delegation

Invoke the **planner agent** with:

### Required Parameters

- `task`: The complete task description

### Optional Parameters

- `scope`: Extracted scope/boundaries
- `constraints`: Any specific constraints or requirements
- `context_findings`: Structured findings from context-loader if available:
  - `key_components`: Core files and responsibilities
  - `patterns`: Conventions to follow
  - `dependencies`: External integrations
  - `gotchas`: Known issues/edge cases

## Output

Return the plan summary from the planner agent:

- `plan_file_path`: Absolute path to the generated markdown plan file
- `summary`: Brief summary of the implementation plan (2-3 sentences)
- `task_analyzed`: Original task that was analyzed
- `context_used`: Whether context-loader findings were leveraged

### Plan File Contents

The generated markdown file includes:

1. **Overview** - High-level summary of the proposed changes and approach
2. **Scope** - What will and won't be implemented
3. **Current State** - Relevant architecture, files, and patterns
4. **API Design** (optional) - Function signatures, data structures, and algorithms when creating/modifying interfaces
5. **Implementation Steps** - Clear, sequential steps (typically 5-7 for medium tasks)
6. **Files Summary** - Files to be created or modified
7. **Critical Challenges** (optional) - Blocking or high-risk issues with mitigation strategies

The plan is written to a markdown file for use with `/review-plan` and `/execute-plan`.

**What Plans Omit:**

- Testing strategies (handled during execution)
- Detailed dependency graphs (execution handles orchestration)
- Agent assignments (orchestrator assigns automatically)
- Success criteria checklists (implementer validates)
- Risk matrices (only critical risks documented)

## Complexity-Based Planning

The planner automatically adapts its output based on task complexity:

### Simple Tasks (Bug fixes, minor features)

- **Length**: ~100-200 lines
- Focused scope and 3-5 implementation steps
- Minimal challenges section
- Optional API design section (often skipped)

### Medium Tasks (Features, refactors)

- **Length**: ~200-400 lines
- Clear scope with included/excluded items
- 5-7 implementation steps
- API design when creating new interfaces
- Critical challenges documented

### Complex Tasks (Major features, architectural changes)

- **Length**: ~400-600 lines
- Detailed scope and architectural context
- 7-10 implementation steps
- Comprehensive API design section
- Multiple critical challenges with mitigations

## Integration with Other Commands

### Recommended Workflow

1. **Complete Flow**: `/explore` → `/plan` → `/review-plan` → `/execute-plan`

   - Best for medium to complex tasks
   - Exploration context automatically flows to planner

2. **Quick Planning**: `/plan` → `/execute-plan`

   - Suitable for simple, well-understood tasks
   - Skip review step when plan is straightforward

3. **With Review**: `/plan` → `/review-plan` → `/execute-plan`
   - Skip exploration for simple tasks in familiar code
   - Add review for validation and improvement suggestions

### How Execution Works

- **`/execute-plan`** reads the plan file and orchestrates implementation
- Agent orchestrator automatically assigns specialized agents to tasks
- Testing is handled during execution (not part of planning)
- Dependencies and parallel execution are managed by the orchestrator
