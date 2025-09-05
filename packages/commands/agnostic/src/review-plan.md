---
description: Critically review an implementation plan for completeness, feasibility, and alignment with codebase patterns
argument-hint: <plan-file-path> [--focus security|performance|testing]
allowed-tools: Read(*), Glob(*), Grep(*), LS(*), WebSearch(*), WebFetch(*)
---

# Review Plan Command

Critically analyze an implementation plan to assess its quality, completeness, and feasibility without writing any code.

## Workflow Integration

This command is **Step 3** of the implementation workflow:

1. Explore → 2. Plan → 3. **Review** → 4. Execute

### Recommended Workflow

**BEST PRACTICE: Use this command AFTER creating a plan with `/plan`**

1. Context gathering: `/explore <relevant area>` - Builds comprehensive context
2. Plan creation: `/plan <task>` - Creates plan file using that context
3. Plan review: `/review-plan <plan-file-path>` - Reviews the plan critically
4. Execution: `/execute-plan <plan-file-path>` - Executes the approved plan

This workflow ensures the reviewer has the same context as the planner for accurate assessment, and only validated plans move to execution.

**Note for Claude Code**: When you have context-loader findings from a previous `/explore` command, automatically pass them to the plan-reviewer agent. The user doesn't need to specify any flags.

## Inputs

Accept plan file path and optional focus area, then extract:

- `plan_file_path`: The absolute path to the markdown plan file to review (required)
- `review_focus`: Any specific focus area mentioned (optional, e.g., "security", "performance", "testing")
- `context_findings`: Automatically include context-loader findings from `/explore` if available

Examples:

- `/review-plan /tmp/plans/plan-20250821-a4b3c2.md`
- `/review-plan /tmp/plans/plan-20250821-a4b3c2.md --focus security`
- `/review-plan /tmp/plans/plan-20250821-a4b3c2.md --focus performance`
- `/review-plan /tmp/plans/plan-20250821-a4b3c2.md --focus testing`

## Task

Generate a comprehensive plan review that:

1. Leverages any context-loader findings if available
2. Analyzes the plan for completeness and feasibility
3. Validates scope adherence (no extras beyond requirements)
4. Identifies potential implementation risks
5. Assesses alignment with existing codebase patterns
6. Provides actionable feedback for plan improvement

## Context Integration

**Claude Code**: When you have findings from a previous `/explore` command, automatically extract and pass:

- Key components and their responsibilities
- Existing patterns and conventions
- Dependencies and integration points
- Known gotchas and edge cases
- Testing approaches in use

## Delegation

Invoke **plan-reviewer** with:

- `plan_file_path`: The absolute path to the plan file
- `review_focus`: Extracted focus area (optional)
- `context_findings`: Structured findings from context-loader if available:
  - `key_components`: Core files and responsibilities
  - `patterns`: Conventions to follow
  - `dependencies`: External integrations
  - `gotchas`: Known issues/edge cases
  - `testing_approach`: Current testing patterns

## Output

Return the structured review from plan-reviewer:

- `summary`: Executive summary of plan quality and main assessment
- `strengths`: What the plan does well
- `concerns`: Specific issues with severity levels and suggestions
- `gaps`: Missing elements with rationale and suggestions
- `improvements`: Areas for enhancement with specific recommendations
- `feasibility-assessment`: Complexity, risks, and timeline estimate
- `alignment-check`: How well plan follows existing patterns
- `scope-validation`: Whether plan adheres to exact requirements

## Integration Notes

**File Path Handling**:

- Validate that the plan file exists and is readable
- Provide clear error messages for invalid paths
- Support both absolute and relative paths

**Context Reuse**:

- Automatically use context-loader findings when available
- Fall back gracefully when no context is available
- Include context metadata in the review assessment

**Focus Areas**:

- `security`: Emphasize security considerations and potential vulnerabilities
- `performance`: Focus on performance implications and optimizations
- `testing`: Concentrate on test coverage and testing strategy completeness
