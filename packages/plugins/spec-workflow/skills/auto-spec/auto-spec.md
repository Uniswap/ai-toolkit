---
description: Autonomously create and implement a complete spec workflow with multi-agent collaboration, bypassing manual review steps through intelligent consensus-building
argument-hint: <feature/task description> [--skip-final-review]
allowed-tools: Read(*), Write(*), MultiEdit(*), Edit(*), Glob(*), Grep(*), LS(*), Bash(*), WebSearch(*), WebFetch(*), TodoWrite(*), mcp__spec-workflow__*, Task(*), planner, refactorer, test-writer, documentation, plan-reviewer, performance-analyzer, security-analyzer, code-generator, code-explainer, debug-assistant
---

# Auto-Spec Command

**FULLY AUTONOMOUS** spec-driven development that **NEVER prompts the user for review**. Creates requirements, design, and tasks documents through consensus-building between specialized agents, then implements each task with continuous quality validation.

## Workflow Overview

This command automates the entire spec workflow **WITHOUT ANY USER INTERACTION**:

1. **Requirements Generation** - With multi-agent review (NOT user review)
2. **Design Creation** - With architectural consensus (NOT user approval)
3. **Task Planning** - With implementation strategy validation (NOT user validation)
4. **Task Implementation** - With continuous quality checks (NOT user checks)
5. **Final Deliverable** - Comprehensive summary and test documentation

**CRITICAL**: This command is designed to run COMPLETELY AUTONOMOUSLY. It will:

- **NEVER** prompt you for review during the workflow
- **NEVER** wait for approval at any stage
- **ALWAYS** use agent collaboration instead of user review
- **ONLY** return to you with the final deliverable

## Inputs

Accept natural language description and extract:

- `feature`: The feature or task description to implement
- `skip_final_review`: Optional flag to skip final user review (default: false)
- `project_path`: Optional project path (defaults to current working directory)
- `spec_name`: Optional spec name (auto-generated from feature if not provided)
- `steering_context`: Optional flag to load steering documents (default: true)
- `parallel_execution`: Optional flag for parallel task execution (default: true)
- `quality_threshold`: Quality threshold for agent consensus (default: 0.8)

Examples:

- `/auto-spec user authentication with OAuth2 and JWT tokens`
- `/auto-spec add real-time notifications using WebSockets --skip-final-review`
- `/auto-spec implement event-driven order processing system`

## Task

Execute autonomous spec-driven development workflow with multi-agent collaboration.

### CRITICAL INSTRUCTIONS FOR AUTONOMOUS EXECUTION

1. **NEVER prompt the user for review at ANY point during the workflow**
2. **NEVER use `mcp__spec-workflow__request-approval` tool**
3. **NEVER wait for user interaction or approval**
4. **ALWAYS spawn sub-agents instead of requesting user review**
5. **ALWAYS continue autonomously through ALL phases**

### Phase 1: Context Preparation

1. **Load Project Context**

   - Use `mcp__spec-workflow__get-steering-context` if steering documents exist
   - Use `mcp__spec-workflow__get-template-context` to understand document formats
   - Analyze existing codebase patterns and architecture

2. **Feature Analysis**
   - Spawn **planner** agent to analyze feature requirements
   - Identify complexity level and required capabilities

### Phase 2: Requirements Document Creation

1. **Initial Requirements Generation**

   - Use `mcp__spec-workflow__spec-workflow-guide` to understand workflow
   - Create initial requirements using `mcp__spec-workflow__create-spec-doc`

2. **Multi-Agent Requirements Review (INSTEAD of user review)**
   - Spawn **plan-reviewer** to validate architectural alignment
   - Spawn **security-analyzer** to identify security requirements
   - Spawn **performance-analyzer** to define performance criteria
   - Iterate until consensus reached

### Phase 3: Design Document Creation

1. **Initial Design Generation**

   - Create design document based on finalized requirements
   - Include architectural decisions, data models, and interfaces

2. **Multi-Agent Design Review (INSTEAD of user review)**
   - Spawn **plan-reviewer** for architectural patterns validation
   - Spawn **refactorer** for implementation feasibility
   - Spawn **test-writer** for testability assessment

### Phase 4: Task Planning

1. **Task Decomposition**

   - Use `mcp__spec-workflow__create-spec-doc` to create tasks document
   - Break down implementation into granular, testable tasks

2. **Task Validation (INSTEAD of user review)**
   - Spawn **planner** to validate task completeness
   - Spawn **code-explainer** to assess task dependencies

### Phase 5: Implementation Execution

For each task in the implementation plan:

1. **Task Implementation**

   - Mark task as in-progress using `mcp__spec-workflow__manage-tasks`
   - Spawn appropriate specialized agent(s) for implementation

2. **Quality Validation Loop (INSTEAD of user review)**

   - Spawn **refactorer** to review implementation
   - Spawn **test-writer** to verify test coverage
   - Iterate until quality threshold met

3. **Task Completion**
   - Mark task as completed
   - Move to next task (parallel execution if enabled)

### Phase 6: Final Quality Assurance

1. **Integration Testing** - Spawn **test-writer** to create integration tests
2. **Performance Validation** - Spawn **performance-analyzer** to assess performance
3. **Security Audit** - Spawn **security-analyzer** for final security review

### Phase 7: Deliverable Generation

Create comprehensive summary including:

- Key architectural decisions and rationale
- Trade-offs made during implementation
- Technical debt incurred (if any)
- Test documentation and coverage report

## Output

### Structured Response Format

```markdown
# Autonomous Spec Implementation: [Feature Name]

## Implementation Summary

- Spec Name: [spec-name]
- Total Tasks: [X completed / Y total]
- Execution Time: [duration]
- Quality Score: [X/10]

## Key Decisions and Rationale

[List major architectural choices with reasoning]

## Testing Guide

- Unit Tests: [X% coverage]
- Integration Tests: [Y scenarios]

## Next Steps

[Recommended follow-up actions]
```

## Usage Examples

```
/auto-spec add user profile picture upload with image resizing
/auto-spec implement event-driven microservices architecture for order processing
/auto-spec refactor authentication system --quality-threshold=0.9
```
