---
description: Autonomously create and implement a complete spec workflow with multi-agent collaboration, replacing manual review steps with agent review
argument-hint: <feature/task description> [--skip-final-review]
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), LS(*), Bash(*), WebSearch(*), WebFetch(*), TodoWrite(*), mcp__spec-workflow__*, Task(*)
---

# Auto-Spec Command

Spec-driven development that creates requirements, design, and tasks documents through review by specialized agents, then implements each task. Runs end to end without stopping for user approval (see the autonomous execution contract below).

## Workflow Overview

1. **Requirements Generation** - reviewed by agents
2. **Design Creation** - reviewed by agents
3. **Task Planning** - reviewed by agents
4. **Task Implementation** - with quality checks between tasks
5. **Final Deliverable** - summary and test documentation

## Inputs

Accept natural language description and extract:

- `feature`: The feature or task description to implement
- `skip_final_review`: Optional flag to skip final user review (default: false)
- `project_path`: Optional project path (defaults to current working directory)
- `spec_name`: Optional spec name (auto-generated from feature if not provided)
- `steering_context`: Optional flag to load steering documents (default: true)
- `parallel_execution`: Optional flag for parallel task execution (default: true)

Examples:

- `/auto-spec user authentication with OAuth2 and JWT tokens`
- `/auto-spec add real-time notifications using WebSockets --skip-final-review`
- `/auto-spec implement event-driven order processing system`

## Task

Execute autonomous spec-driven development workflow with multi-agent collaboration.

### Autonomous execution contract

1. Never prompt the user for review or approval at any point in the workflow.
2. Never call `mcp__spec-workflow__request-approval`.
3. Use agent review in place of user review, and continue through all phases to the final deliverable.

### Agent staffing

The agent rosters named in each phase below are a menu, not a checklist. Staff only the dimensions the work actually raises: a task with no security surface does not need a security reviewer, and a documentation-only task does not need a performance reviewer.

- **Ceiling: at most 4 concurrent agents across the whole workflow at any moment.** This is a ceiling, not a quota - one agent, or none, is the right answer for most tasks.
- Do not spawn an agent for work that would finish in a handful of direct tool calls. Do it directly instead.

### Phase 1: Context Preparation

1. **Load Project Context**

   - Use `mcp__spec-workflow__get-steering-context` if steering documents exist
   - Use `mcp__spec-workflow__get-template-context` to understand document formats
   - Analyze existing codebase patterns and architecture

2. **Feature Analysis**
   - Spawn **planner-agent** agent to analyze feature requirements
   - Identify complexity level and required capabilities

### Phase 2: Requirements Document Creation

1. **Initial Requirements Generation**

   - Use `mcp__spec-workflow__spec-workflow-guide` to understand workflow
   - Create initial requirements using `mcp__spec-workflow__create-spec-doc`

2. **Agent Requirements Review**
   - Spawn **plan-reviewer-agent** to validate architectural alignment
   - Spawn **security-analyzer-agent** to identify security requirements
   - Spawn **performance-analyzer-agent** to define performance criteria
   - Revise the document until every reviewer finding is either applied or recorded in the document as an explicit, reasoned rejection. Stop at that point.

### Phase 3: Design Document Creation

1. **Initial Design Generation**

   - Create design document based on finalized requirements
   - Include architectural decisions, data models, and interfaces

2. **Agent Design Review**
   - Spawn **plan-reviewer-agent** for architectural patterns validation
   - Spawn **refactorer-agent** for implementation feasibility
   - Spawn **test-writer-agent** for testability assessment

### Phase 4: Task Planning

1. **Task Decomposition**

   - Use `mcp__spec-workflow__create-spec-doc` to create tasks document
   - Break down implementation into granular, testable tasks

2. **Task Validation**
   - Spawn **planner-agent** to validate task completeness
   - Spawn **code-explainer-agent** to assess task dependencies

### Phase 5: Implementation Execution

For each task in the implementation plan:

1. **Task Implementation**

   - Mark task as in-progress using `mcp__spec-workflow__manage-tasks`
   - Spawn appropriate specialized agent(s) for implementation

2. **Quality Validation Loop**

   - Spawn **refactorer-agent** to review implementation
   - Spawn **test-writer-agent** to verify test coverage
   - Exit the loop when all of these are observed to be true, not estimated:
     - The project's test command has been run and passes.
     - The project's lint and typecheck commands have been run and pass.
     - Every reviewer finding has been applied, or recorded in the task notes as an explicit, reasoned rejection.
   - If a criterion still fails after 3 passes, stop the loop, mark the task blocked, and record what failed. Do not keep iterating.

3. **Task Completion**
   - Mark task as completed
   - Move to next task. When `parallel_execution` is enabled, run independent tasks concurrently within the 4-agent ceiling above - the ceiling covers implementation and review agents together.

### Phase 6: Final Quality Assurance

1. **Integration Testing** - Spawn **test-writer-agent** to create integration tests
2. **Performance Validation** - Spawn **performance-analyzer-agent** to assess performance
3. **Security Audit** - Spawn **security-analyzer-agent** for final security review

### Phase 7: Deliverable Generation

Create a summary including:

- Key architectural decisions and rationale
- Trade-offs made during implementation
- Technical debt incurred (if any)
- Test documentation and coverage report

## Document Length

The requirements, design, and tasks documents are written to be read by a later agent and by a human reviewer, so length is a real cost. Keep each under roughly 600 words unless the feature genuinely needs more; cover the substance and skip restatement, filler sections, and summaries that repeat the section above.

## Output

### Structured Response Format

Keep the final summary under roughly 400 words.

```markdown
# Autonomous Spec Implementation: [Feature Name]

## Implementation Summary

- Spec Name: [spec-name]
- Total Tasks: [X completed / Y total]
- Blocked Tasks: [list, with what failed - omit if none]

## Key Decisions and Rationale

[List major architectural choices with reasoning]

## Testing Guide

- Test suite result: [pass/fail, quoted from the actual test run]
- Coverage: [only if a coverage tool was run; quote its output. Omit this line otherwise - do not estimate a percentage.]
- Integration Tests: [scenarios added]

## Next Steps

[Recommended follow-up actions]
```

## Usage Examples

```
/auto-spec add user profile picture upload with image resizing
/auto-spec implement event-driven microservices architecture for order processing
/auto-spec refactor authentication system --skip-final-review
```
