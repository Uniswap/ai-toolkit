---
description: Review implementation plans for completeness and feasibility. Use when user says "review this plan before I start", "is this implementation plan complete", "check if this plan aligns with our patterns", "give me feedback on my implementation strategy", or "validate this plan before we execute it".
allowed-tools: Read, Glob, Grep, LS, WebSearch, WebFetch, Task(subagent_type:plan-reviewer)
model: opus
---

# Plan Reviewer

Critically analyze implementation plans for quality, completeness, and feasibility.

## When to Activate

- User has a plan file to review
- Validation needed before execution
- Feedback requested on implementation strategy
- User asks "does this plan look good?"
- Before executing a planned implementation

## Workflow Integration

This is **Step 3** of the implementation workflow:

1. Explore → 2. Plan → 3. **Review** (this) → 4. Execute

## Quick Process

1. **Load Plan**: Read the plan file
2. **Analyze**: Check completeness and conciseness
3. **Validate Scope**: Ensure no extras beyond requirements
4. **Identify Risks**: Find critical implementation risks
5. **Check Alignment**: Verify against codebase patterns
6. **Provide Feedback**: Actionable improvement suggestions

## Output Format

Returns structured review:

- **Summary**: Plan quality and main assessment
- **Strengths**: What the plan does well
- **Concerns**: Issues with severity and suggestions
- **Gaps**: Missing critical elements
- **Improvements**: Enhancement recommendations
- **Feasibility**: Complexity, risks, timeline estimate
- **Alignment**: Pattern compliance check
- **Scope Validation**: Requirements adherence

## Review Focus Areas

- `security`: Security considerations and vulnerabilities
- `performance`: Performance implications and optimizations
- `default`: All aspects

## Context Integration

Automatically uses context from prior `/explore` when available:

- Key components and responsibilities
- Existing patterns and conventions
- Dependencies and integration points
- Known gotchas and edge cases

## Delegation

Invokes **plan-reviewer** agent with plan file and context.
