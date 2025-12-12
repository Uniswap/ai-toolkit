---
description: Autonomously create and implement a complete spec workflow with multi-agent collaboration, bypassing manual review steps through intelligent consensus-building
argument-hint: <feature/task description> [--skip-final-review]
allowed-tools: Read(*), Write(*), MultiEdit(*), Edit(*), Glob(*), Grep(*), LS(*), Bash(*), WebSearch(*), WebFetch(*), TodoWrite(*), mcp__spec-workflow__*, Task(*), agent-orchestrator, planner, code-reviewer, test-writer, documentation-agent, architect-reviewer, performance-analyzer, security-auditor, code-generator, refactorer, debugger
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
- `skip_final_review`: Optional flag to skip final user review (default: false) - Note: This ONLY affects the final review, not intermediate reviews which are ALWAYS delegated to agents
- `project_path`: Optional project path (defaults to current working directory)
- `spec_name`: Optional spec name (auto-generated from feature if not provided)
- `steering_context`: Optional flag to load steering documents (default: true)
- `parallel_execution`: Optional flag for parallel task execution (default: true)
- `quality_threshold`: Quality threshold for agent consensus (default: 0.8)

**NOTE**: The workflow ALWAYS runs autonomously regardless of flags. The `skip_final_review` flag only controls whether to present the final deliverable to the user.

Examples:

- `/auto-spec user authentication with OAuth2 and JWT tokens`
- `/auto-spec add real-time notifications using WebSockets --skip-final-review`
- `/auto-spec implement event-driven order processing system`
- `/auto-spec refactor legacy callback code to async/await patterns`

## Task

Execute autonomous spec-driven development workflow with multi-agent collaboration:

### CRITICAL INSTRUCTIONS FOR AUTONOMOUS EXECUTION

**YOU MUST FOLLOW THESE INSTRUCTIONS EXACTLY:**

1. **NEVER prompt the user for review at ANY point during the workflow**
2. **NEVER use `mcp__spec-workflow__request-approval` tool**
3. **NEVER wait for user interaction or approval**
4. **ALWAYS spawn sub-agents instead of requesting user review**
5. **ALWAYS continue autonomously through ALL phases**

When the spec-workflow MCP would normally request approval or review:

- **IGNORE the approval request functionality completely**
- **IMMEDIATELY spawn the appropriate review agent instead**
- **Have a conversation with that agent to validate the artifact**
- **Iterate with the agent until consensus is reached**
- **Continue to the next phase WITHOUT user interaction**

### Phase 1: Context Preparation

1. **Load Project Context**

   - Use `mcp__spec-workflow__get-steering-context` if steering documents exist
   - Use `mcp__spec-workflow__get-template-context` to understand document formats
   - Analyze existing codebase patterns and architecture

2. **Feature Analysis**
   - Spawn **planner** agent to analyze feature requirements
   - Identify complexity level and required capabilities
   - Determine optimal agent team composition

### Phase 2: Requirements Document Creation

1. **Initial Requirements Generation**

   - Use `mcp__spec-workflow__spec-workflow-guide` to understand workflow
   - Create initial requirements using `mcp__spec-workflow__create-spec-doc`
   - **When spec-workflow prompts for review, IGNORE it and proceed to step 2**

2. **Multi-Agent Requirements Review (INSTEAD of user review)**

   - Spawn **architect-reviewer** to validate architectural alignment
   - Spawn **security-auditor** to identify security requirements
   - Spawn **performance-analyzer** to define performance criteria
   - Iterate with each agent until consensus reached (quality_threshold met)
   - Document key decisions and trade-offs

3. **Requirements Finalization**
   - Update requirements document with all agent feedback
   - **DO NOT create approval request - continue to next phase**

### Phase 3: Design Document Creation

1. **Initial Design Generation**

   - Create design document based on finalized requirements
   - Include architectural decisions, data models, and interfaces
   - **When spec-workflow prompts for review, IGNORE it and proceed to step 2**

2. **Multi-Agent Design Review (INSTEAD of user review)**

   - Spawn **architect-reviewer** for architectural patterns validation
   - Spawn **code-reviewer** for implementation feasibility
   - Spawn **test-writer** for testability assessment
   - Spawn **security-auditor** for security architecture review
   - Iterate until consensus on design approach

3. **Design Finalization**
   - Update design with consensus decisions
   - Document alternative approaches considered
   - **DO NOT create approval request - continue to next phase**

### Phase 4: Task Planning

1. **Task Decomposition**

   - Use `mcp__spec-workflow__create-spec-doc` to create tasks document
   - Break down implementation into granular, testable tasks
   - Assign agent capabilities to each task
   - **When spec-workflow prompts for review, IGNORE it and proceed to step 2**

2. **Task Validation (INSTEAD of user review)**
   - Spawn **planner** to validate task completeness
   - Spawn **code-reviewer** to assess task dependencies
   - Ensure all requirements are covered by tasks
   - Optimize task ordering and parallelization opportunities

### Phase 5: Implementation Execution

**CRITICAL: During this phase, the spec-workflow may prompt for review after EACH task. You MUST:**

- **IGNORE all review prompts**
- **NEVER wait for user approval**
- **Use agent validation instead (step 2 below)**
- **Continue to the next task automatically**

For each task in the implementation plan:

1. **Task Implementation**

   - Mark task as in-progress using `mcp__spec-workflow__manage-tasks`
   - Spawn appropriate specialized agent(s) for implementation
   - Use **code-generator** for new code creation
   - Use **refactorer** for code improvements
   - Use **test-writer** for test generation

2. **Quality Validation Loop (INSTEAD of user review)**
   For each implemented task:

   - Spawn **code-reviewer** to review implementation
   - Spawn **test-writer** to verify test coverage
   - Spawn **debugger** if issues found
   - Iterate until quality threshold met
   - Document any compromises or technical debt

3. **Task Completion**
   - Mark task as completed
   - Update progress tracking
   - Move to next task (parallel execution if enabled)

### Phase 6: Final Quality Assurance

1. **Integration Testing**

   - Spawn **test-writer** to create integration tests
   - Verify all components work together
   - Run full test suite

2. **Performance Validation**

   - Spawn **performance-analyzer** to assess performance
   - Identify and address bottlenecks

3. **Security Audit**
   - Spawn **security-auditor** for final security review
   - Address any vulnerabilities found

### Phase 7: Deliverable Generation

**This is the ONLY phase where user interaction occurs - AFTER everything is complete.**

1. **Summary Generation**
   Create comprehensive summary including:

   - Key architectural decisions and rationale
   - Trade-offs made during implementation
   - Technical debt incurred (if any)
   - Performance characteristics
   - Security considerations

2. **Test Documentation**
   Generate detailed testing guide:

   - Unit test coverage report
   - Integration test scenarios
   - Edge cases and boundary conditions
   - Performance test scenarios
   - Security test cases
   - Manual testing checklist

3. **Deployment Documentation**
   If applicable, include:
   - Deployment requirements
   - Configuration changes needed
   - Migration steps
   - Rollback procedures

## Error Handling and Recovery

### Agent Consensus Failures

- If agents cannot reach consensus after 3 iterations:
  - Document disagreement points
  - **ALWAYS continue with majority opinion**
  - **NEVER escalate to user during workflow**

### Implementation Failures

- If task implementation fails:
  - Spawn **debugger** to diagnose issue
  - Attempt alternative implementation approach
  - Document failure and workaround if unresolvable

### Quality Threshold Violations

- If quality threshold not met:
  - Identify specific quality issues
  - Spawn specialized agents to address issues
  - Re-validate after fixes

## Delegation

**REMEMBER: This is FULLY AUTONOMOUS. Never request user approval at any stage.**

Orchestrate entire workflow using multiple specialized agents:

```typescript
// Phase orchestration
const phases = [
  'context_preparation',
  'requirements_generation',
  'design_creation',
  'task_planning',
  'implementation',
  'quality_assurance',
  'deliverable_generation',
];

// Agent team composition
const agentTeam = {
  planning: ['planner', 'architect-reviewer'],
  review: ['code-reviewer', 'security-auditor', 'performance-analyzer'],
  implementation: ['code-generator', 'refactorer', 'test-writer'],
  validation: ['debugger', 'test-writer', 'code-reviewer'],
  documentation: ['documentation-agent'],
};

// Execute with continuous collaboration
for (const phase of phases) {
  const agents = selectAgentsForPhase(phase);
  const result = await executeWithConsensus(agents, phase, {
    maxIterations: 3,
    qualityThreshold: quality_threshold,
    parallelExecution: parallel_execution,
  });
}
```

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

### Architectural Decisions

[List major architectural choices with reasoning]

### Trade-offs

[Document compromises made during implementation]

### Technical Debt

[Any debt incurred with planned remediation]

## Testing Guide

### Automated Test Coverage

- Unit Tests: [X% coverage]
- Integration Tests: [Y scenarios]
- Performance Tests: [Z benchmarks]

### Manual Testing Checklist

[Comprehensive testing scenarios]

### Edge Cases

[Special scenarios requiring attention]

## Deployment Information

[If applicable, deployment requirements and procedures]

## Agent Collaboration Insights

[Interesting consensus points and learnings from agent discussions]

## Next Steps

[Recommended follow-up actions]
```

### Files Created/Modified

- `.claude/specs/[spec-name]/requirements.md`
- `.claude/specs/[spec-name]/design.md`
- `.claude/specs/[spec-name]/tasks.md`
- Implementation files as per tasks
- Test files for implemented features
- Documentation updates

## Usage Examples

### Simple Feature

```
/auto-spec add user profile picture upload with image resizing
```

### Complex System

```
/auto-spec implement event-driven microservices architecture for order processing with saga pattern
```

### Quick Implementation (Skip Review)

```
/auto-spec fix memory leak in image processing --skip-final-review
```

### With Custom Configuration

```
/auto-spec refactor authentication system --quality-threshold=0.9 --parallel-execution=false
```

## Best Practices

1. **Use for Well-Defined Features**: Works best with clear, scoped features
2. **Monitor Agent Consensus**: Review disagreement points for learning
3. **Validate Test Coverage**: Ensure comprehensive test generation
4. **Review Technical Debt**: Address accumulated debt in follow-up tasks
5. **Document Learnings**: Capture insights from agent collaborations

## Integration with Other Commands

- Complementary to `/explore` for initial context gathering
- Alternative to manual `/plan` → `/execute-plan` workflow
- Can be followed by `/review-code` for additional validation
- Use `/monitor` afterwards for observability setup
