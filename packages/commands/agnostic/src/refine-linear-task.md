---
description: Refine and enhance Linear task descriptions for improved clarity, completeness, and actionability
argument-hint: <issue-identifier> [--focus <area>] [--update]
allowed-tools: Read(*), Glob(*), Grep(*), Task(*), WebSearch(*), WebFetch(*), mcp__linear__linear_search_issues(*), mcp__linear__linear_update_issue(*), mcp__linear__linear_add_comment(*)
---

# Refine Linear Task

Analyze and refine Linear task descriptions to improve clarity, completeness, and actionability through AI-assisted enhancement.

## Overview

This command takes a Linear issue identifier and refines its description by:

1. **Analyzing** the current task description for gaps and ambiguities
2. **Researching** relevant codebase context to inform the refinement
3. **Generating** an improved description with clear structure
4. **Presenting** the changes for user approval
5. **Updating** the Linear issue (with user consent)

## Use Cases

- **Vague tasks**: Transform "Fix the bug" into actionable specifications
- **Missing context**: Add relevant codebase references and technical details
- **Incomplete acceptance criteria**: Generate clear, testable success conditions
- **New team members**: Help understand what a task requires
- **Sprint planning**: Prepare tasks for development with complete information

## Inputs

Accept a Linear issue identifier with optional flags:

```bash
/refine-linear-task DEV-123                    # Refine issue DEV-123
/refine-linear-task DEV-123 --focus security   # Focus refinement on security aspects
/refine-linear-task DEV-123 --update           # Auto-update after approval
```

### Parameters

Extract from user input:

- `issue_identifier`: The Linear issue ID (e.g., "DEV-123", "dai-456")
- `focus_area`: Optional focus for refinement (e.g., "security", "performance", "testing")
- `auto_update`: Boolean flag indicating whether to update Linear automatically after approval

### Examples

```bash
# Basic refinement
/refine-linear-task DEV-104

# Focus on specific aspects
/refine-linear-task DEV-104 --focus testing
/refine-linear-task DEV-104 --focus security
/refine-linear-task DEV-104 --focus performance

# Auto-update mode
/refine-linear-task DEV-104 --update
```

## Task

Execute a structured refinement workflow:

### Phase 1: Fetch and Analyze Current Task

1. **Fetch Issue Details**

   Use the Linear MCP tools to fetch the issue:

   ```typescript
   // Search for the specific issue by identifier
   const results = await mcp__linear__linear_search_issues({
     query: issue_identifier,
     limit: 1,
   });

   if (results.length === 0) {
     console.log(`❌ Could not find issue: ${issue_identifier}`);
     return;
   }

   const issue = results[0];
   ```

2. **Display Current State**

   Show the user what we're working with:

   ```markdown
   ## Current Task Details

   **Issue**: [identifier] - [title]
   **Status**: [status]
   **Priority**: [priority]
   **Assignee**: [assignee or "Unassigned"]

   ### Current Description

   > [existing description or "No description provided"]
   ```

3. **Analyze for Gaps**

   Evaluate the current description against these criteria:

   - **Clarity**: Is the problem/goal clearly stated?
   - **Context**: Is there sufficient background information?
   - **Scope**: Are boundaries clearly defined?
   - **Acceptance Criteria**: Are success conditions defined?
   - **Technical Details**: Are implementation hints provided?
   - **Dependencies**: Are related tasks/blockers mentioned?

   Present a gap analysis:

   ```markdown
   ## Gap Analysis

   | Aspect             | Status | Notes                           |
   | ------------------ | ------ | ------------------------------- |
   | Problem Statement  | ⚠️     | Vague - needs specific details  |
   | Context            | ❌     | Missing - no background info    |
   | Scope              | ✅     | Clear boundaries defined        |
   | Acceptance Criteria| ❌     | Missing - no success conditions |
   | Technical Details  | ⚠️     | Partial - could be expanded     |
   | Dependencies       | ✅     | None identified                 |
   ```

### Phase 2: Research Codebase Context

If the task relates to existing code:

1. **Identify Relevant Areas**

   Based on the task description, determine what parts of the codebase are relevant:

   - Search for mentioned files, functions, or components
   - Look for related patterns or implementations
   - Find tests that might inform requirements

2. **Gather Technical Context**

   Use the Task tool with Explore agent to understand:

   - Current implementation patterns
   - Related files and their purposes
   - Existing tests and their coverage
   - Architecture decisions that might impact the task

3. **Summarize Findings**

   ```markdown
   ## Codebase Context

   ### Relevant Files

   - `src/services/auth.ts` - Current authentication implementation
   - `src/middleware/validate.ts` - Request validation patterns
   - `tests/auth.spec.ts` - Existing test coverage

   ### Key Patterns

   - Uses middleware pattern for request handling
   - JWT tokens stored in httpOnly cookies
   - Error handling follows Result<T, E> pattern

   ### Considerations

   - Need to maintain backward compatibility with v1 API
   - Performance budget: < 100ms response time
   ```

### Phase 3: Generate Refined Description

Create a comprehensive, well-structured task description:

```markdown
## Refined Task Description

### Problem Statement

[Clear, specific description of what needs to be done and why]

### Context

[Background information, why this matters, related decisions]

### Scope

**In Scope:**

- [Specific item 1]
- [Specific item 2]

**Out of Scope:**

- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

### Acceptance Criteria

- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]

### Technical Notes

[Implementation hints, relevant patterns, files to modify]

### Dependencies

- [Dependency 1, if any]
- [Dependency 2, if any]

### References

- [Link to related documentation]
- [Link to design document]
- [Link to related issues]
```

### Phase 4: Present and Confirm

1. **Show Comparison**

   Display a clear before/after comparison:

   ```markdown
   ## Proposed Changes

   ### Before

   > [Original description]

   ### After

   > [Refined description]

   ### Summary of Improvements

   - ✅ Added clear problem statement
   - ✅ Included acceptance criteria (3 items)
   - ✅ Added technical context from codebase
   - ✅ Defined explicit scope boundaries
   ```

2. **Request Approval**

   Ask the user to review and approve:

   - **Approve**: Update the Linear issue with refined description
   - **Edit**: Allow user to modify before updating
   - **Cancel**: Discard changes

### Phase 5: Update Linear (with approval)

If the user approves:

1. **Update Issue Description**

   ```typescript
   await mcp__linear__linear_update_issue({
     id: issue.id,
     description: refinedDescription,
   });
   ```

2. **Add Comment (optional)**

   Optionally add a comment noting the refinement:

   ```typescript
   await mcp__linear__linear_add_comment({
     issueId: issue.id,
     body: '📝 Task description refined using AI assistance.\n\nChanges include: [summary of changes]',
   });
   ```

3. **Confirm Success**

   ```markdown
   ✅ Issue [identifier] has been updated!

   **View in Linear**: [issue URL]
   ```

## Focus Areas

When `--focus` is specified, emphasize that aspect:

### `--focus security`

- Analyze for security implications
- Add security-related acceptance criteria
- Note potential vulnerabilities or risks
- Reference security patterns in codebase

### `--focus performance`

- Consider performance impact
- Add performance-related acceptance criteria
- Include benchmarks or targets
- Note performance patterns in codebase

### `--focus testing`

- Emphasize test requirements
- Add test-specific acceptance criteria
- Reference existing test patterns
- Note edge cases to cover

### `--focus accessibility`

- Consider a11y implications
- Add accessibility acceptance criteria
- Reference WCAG guidelines if applicable
- Note existing a11y patterns

## Output

Return a structured summary:

```markdown
## Task Refinement Complete

**Issue**: [DEV-123] [Title]
**Status**: [Updated / Not Updated]

### Improvements Made

- [List of specific improvements]

### Gap Analysis Summary

| Aspect             | Before | After |
| ------------------ | ------ | ----- |
| Problem Statement  | ⚠️     | ✅    |
| Context            | ❌     | ✅    |
| Acceptance Criteria| ❌     | ✅    |

### Next Steps

1. Review the refined description in Linear
2. Assign the task if not already assigned
3. Begin implementation with `/plan [issue-identifier]`
```

## Integration with Other Commands

This command works well with the implementation workflow:

1. **Refine**: `/refine-linear-task DEV-123` - Clarify what needs to be done
2. **Explore**: `/explore [relevant area]` - Understand the codebase
3. **Plan**: `/plan DEV-123` - Create implementation plan
4. **Execute**: `/execute-plan plan-file.md` - Implement the solution

## Error Handling

### Issue Not Found

```markdown
❌ Could not find issue: [identifier]

Please verify:

- The issue identifier is correct (e.g., DEV-123)
- You have access to this Linear workspace
- The issue hasn't been deleted
```

### No Linear Access

```markdown
❌ Linear MCP tools not available

Please ensure:

- Linear MCP server is configured
- LINEAR_API_KEY environment variable is set
- MCP server is enabled in Claude Code settings
```

### Update Failed

```markdown
❌ Failed to update issue [identifier]

Error: [error message]

The refined description has been generated but not saved.
You can manually copy the refined description to Linear.
```

## Best Practices

### 1. Start with Context

Always fetch and display the current state before making suggestions.

### 2. Research Before Refining

Use codebase exploration to inform technical details and ensure accuracy.

### 3. Be Specific

Replace vague language with concrete, actionable items:

- ❌ "Improve performance"
- ✅ "Reduce API response time to < 100ms for /users endpoint"

### 4. Make Criteria Testable

Each acceptance criterion should be verifiable:

- ❌ "Works correctly"
- ✅ "Returns 401 status code when authentication token is missing"

### 5. Respect Original Intent

Enhance and clarify, don't fundamentally change what the task is about.

### 6. Note Assumptions

If making assumptions during refinement, explicitly note them.

## Example Session

```bash
/refine-linear-task DEV-104
```

**Output:**

```markdown
## Current Task Details

**Issue**: DEV-104 - Develop Claude code agent and/or slash command for refining a Linear task
**Status**: In Progress
**Priority**: Normal
**Assignee**: Unassigned

### Current Description

> Create a Claude Code agent and/or slash command that can refine and enhance
> Linear task descriptions and details.
>
> **Context:**
> Automate task refinement to improve clarity, completeness, and actionability
> of Linear issues through AI assistance.

## Gap Analysis

| Aspect              | Status | Notes                              |
| ------------------- | ------ | ---------------------------------- |
| Problem Statement   | ✅     | Clear goal stated                  |
| Context             | ⚠️     | Partial - could explain more "why" |
| Scope               | ❌     | No boundaries defined              |
| Acceptance Criteria | ❌     | No success conditions              |
| Technical Details   | ❌     | No implementation hints            |
| Dependencies        | ⚠️     | Linear MCP implied but not stated  |

## Codebase Context

### Relevant Files

- `packages/commands/agnostic/src/` - Existing slash commands
- `.claude/commands/` - Project-specific commands
- `packages/linear-task-utils/` - Linear integration utilities

### Key Patterns

- Commands use markdown with YAML frontmatter
- Multi-phase workflows with user interaction
- MCP tools for Linear API access

## Refined Task Description

### Problem Statement

Create a slash command `/refine-linear-task` that analyzes Linear issues and
enhances their descriptions with improved clarity, completeness, and
actionability through AI-assisted refinement.

### Context

Linear tasks often lack sufficient detail for effective implementation.
This leads to:

- Unclear requirements causing rework
- Missing acceptance criteria making verification difficult
- Lack of technical context slowing down developers

This command automates the refinement process, ensuring tasks are
implementation-ready.

### Scope

**In Scope:**

- Fetching and analyzing Linear issues via MCP
- Generating improved descriptions with structured format
- Codebase context research for technical details
- User approval workflow before updates
- Updating Linear issues with refined content

**Out of Scope:**

- Creating new Linear issues
- Modifying issue status, priority, or assignment
- Batch processing multiple issues
- Integration with other project management tools

### Acceptance Criteria

- [ ] Command accepts Linear issue identifier (e.g., DEV-123)
- [ ] Fetches issue details using Linear MCP tools
- [ ] Analyzes current description for gaps
- [ ] Researches relevant codebase context
- [ ] Generates structured, improved description
- [ ] Presents comparison for user review
- [ ] Updates Linear only with user approval
- [ ] Handles errors gracefully with helpful messages

### Technical Notes

- Use `mcp__linear__linear_search_issues` to fetch issue
- Use `mcp__linear__linear_update_issue` to save changes
- Follow existing slash command patterns in `packages/commands/agnostic/src/`
- Include `allowed-tools` for Linear MCP access

### Dependencies

- Linear MCP server must be configured and enabled
- LINEAR_API_KEY environment variable required

---

## Proposed Changes Summary

### Before

> Create a Claude Code agent and/or slash command that can refine...
> (49 words, no structure)

### After

> Comprehensive description with problem statement, context, scope,
> acceptance criteria, technical notes, and dependencies
> (180+ words, fully structured)

### Improvements

- ✅ Added detailed problem statement with rationale
- ✅ Defined explicit scope (in/out)
- ✅ Created 8 testable acceptance criteria
- ✅ Added technical implementation notes
- ✅ Documented dependencies

---

How would you like to proceed?

- **Approve**: Update DEV-104 with refined description
- **Edit**: Modify the refined description first
- **Cancel**: Discard changes
```

## Notes

- This command requires Linear MCP tools to be available
- Always show the user what will change before updating
- Preserve the original intent while improving structure
- Use codebase context to make technical details accurate
- Follow the principle of least surprise - enhance, don't transform
