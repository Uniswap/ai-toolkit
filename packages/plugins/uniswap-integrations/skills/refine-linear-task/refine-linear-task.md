---
description: Refine and enhance Linear task descriptions. Use when user says "refine this Linear task", "improve task description", "make this task clearer", "enhance Linear issue", or needs to improve clarity, completeness, and actionability of Linear issues.
allowed-tools: Read(*), Glob(*), Grep(*), Task(subagent_type:Explore), WebSearch(*), WebFetch(*), mcp__linear__linear_search_issues(*), mcp__linear__linear_update_issue(*), mcp__linear__linear_add_comment(*)
---

# Linear Task Refiner

Analyze and refine Linear task descriptions to improve clarity, completeness, and actionability through AI-assisted enhancement.

## When to Activate

- User wants to refine a Linear task
- User mentions improving task descriptions
- User asks to make a task clearer or more actionable
- User wants to add acceptance criteria to a task
- User mentions Linear issue refinement

## Overview

This skill takes a Linear issue identifier and refines its description by:

1. **Analyzing** the current task description for gaps and ambiguities
2. **Researching** relevant codebase context to inform the refinement
3. **Generating** an improved description with clear structure
4. **Presenting** the changes for user approval
5. **Updating** the Linear issue (with user consent)

## Inputs

Parse from request:

- **issue_identifier**: The Linear issue ID (e.g., "DEV-123", "dai-456")
- **--focus**: Optional focus for refinement (security, performance, testing, accessibility)
- **--update**: Auto-update after approval (default: false)

## Quick Process

### Phase 1: Fetch and Analyze Current Task

1. **Fetch Issue Details** via Linear MCP tools
2. **Display Current State**: Show issue details and description
3. **Analyze for Gaps**: Evaluate against criteria:
   - Clarity: Is the problem/goal clearly stated?
   - Context: Is there sufficient background information?
   - Scope: Are boundaries clearly defined?
   - Acceptance Criteria: Are success conditions defined?
   - Technical Details: Are implementation hints provided?
   - Dependencies: Are related tasks/blockers mentioned?

### Phase 2: Research Codebase Context

If the task relates to existing code:

1. **Identify Relevant Areas**: Search for mentioned files, functions, components
2. **Gather Technical Context**: Use Explore agent for patterns, tests, architecture
3. **Summarize Findings**: Document relevant files, patterns, considerations

### Phase 3: Generate Refined Description

Create comprehensive, well-structured description:

- **Problem Statement**: Clear, specific description of what and why
- **Context**: Background information, related decisions
- **Scope**: In-scope and out-of-scope items explicitly listed
- **Acceptance Criteria**: Specific, testable success conditions
- **Technical Notes**: Implementation hints, relevant patterns
- **Dependencies**: Related tasks, blockers
- **References**: Documentation, design docs, related issues

### Phase 4: Present and Confirm

1. **Show Comparison**: Clear before/after comparison
2. **Summarize Improvements**: List specific enhancements made
3. **Request Approval**: Approve, Edit, or Cancel

### Phase 5: Update Linear (with approval)

1. **Update Issue Description** via Linear MCP
2. **Add Comment** (optional): Note the refinement
3. **Confirm Success**: Provide issue URL

## Focus Areas

### `--focus security`

- Analyze for security implications
- Add security-related acceptance criteria
- Note potential vulnerabilities or risks

### `--focus performance`

- Consider performance impact
- Add performance-related acceptance criteria
- Include benchmarks or targets

### `--focus testing`

- Emphasize test requirements
- Add test-specific acceptance criteria
- Note edge cases to cover

### `--focus accessibility`

- Consider a11y implications
- Add accessibility acceptance criteria
- Reference WCAG guidelines if applicable

## Output Format

Return structured summary:

- **Issue**: Identifier and title
- **Status**: Updated / Not Updated
- **Improvements Made**: List of specific improvements
- **Gap Analysis Summary**: Before/after comparison table
- **Next Steps**: Review, assign, begin implementation

## Best Practices

1. **Start with Context**: Always fetch and display current state first
2. **Research Before Refining**: Use codebase exploration for accuracy
3. **Be Specific**: Replace vague language with concrete, actionable items
4. **Make Criteria Testable**: Each acceptance criterion should be verifiable
5. **Respect Original Intent**: Enhance and clarify, don't fundamentally change
6. **Note Assumptions**: Explicitly note any assumptions made

## Examples

```
"Refine Linear task DEV-123"
"Improve the description for DAI-456"
"Make task DEV-789 more actionable with acceptance criteria"
"Refine DEV-104 with focus on security"
```

## Error Handling

- **Issue Not Found**: Verify identifier, access, and deletion status
- **No Linear Access**: Check MCP server config and API key
- **Update Failed**: Show error, offer manual copy option

## Integration

Works well with implementation workflow:

1. **Refine**: `/linear-task-refiner DEV-123` - Clarify what needs to be done
2. **Explore**: Understand the codebase
3. **Plan**: Create implementation plan
4. **Execute**: Implement the solution
