---
description: Orchestrate implementation of spec-workflow tasks. Use when user says "implement the spec", "execute spec tasks", "run the spec workflow", "implement spec-name tasks", or needs to coordinate agent execution for spec-workflow documents.
allowed-tools: Read(*), Task(subagent_type:agent-orchestrator), Task(subagent_type:*), mcp__spec-workflow__manage-tasks(*), mcp__spec-workflow__get-spec-context(*)
---

# Implement Spec

Orchestrate implementation of spec-workflow tasks using intelligent agent coordination, parallel execution, and quality gates.

## When to Activate

- User wants to implement spec-workflow tasks
- Spec documents exist in `.spec-workflow/specs/`
- User asks to "execute the spec" or "implement spec tasks"
- Coordinated multi-agent task execution is needed

## Inputs

Parse from request:

- **spec-name**: Name of the spec to implement from `.spec-workflow/specs/`
- **--task**: Specific task ID to implement (optional, defaults to next pending)
- **--parallel**: Enable parallel execution of independent tasks
- **--dry-run**: Preview the orchestration plan without executing
- **--quality-gates**: Enable quality checks between phases (default: true)

## Quick Process

1. **Load Spec Context**: Retrieve requirements, design, and tasks from spec-workflow
2. **Task Analysis**: Decompose tasks and identify dependencies
3. **Agent Selection**: Match tasks to specialized agents based on capabilities
4. **Execution Orchestration**: Coordinate parallel/sequential execution
5. **Quality Assurance**: Validate outputs and ensure consistency

## Orchestration Strategy

### Phase 1: Context & Planning

1. **Spec Loading**:

   - Use `mcp__spec-workflow__get-spec-context` to load spec documents
   - Use `mcp__spec-workflow__manage-tasks` to get task status
   - Identify pending tasks and dependencies

2. **Dependency Analysis**:
   - Map task dependencies from the tasks.md structure
   - Identify parallel execution opportunities
   - Determine critical path for sequential tasks

### Phase 2: Agent Orchestration

Invoke **agent-orchestrator** with comprehensive context including:

- Loaded specs and pending tasks
- Task dependencies
- Execution strategy (parallel vs sequential)

The orchestrator will:

- Discover all available agents
- Use **agent-capability-analyst** for optimal matching
- Coordinate specialized agents for each task
- Handle parallel execution groups

### Phase 3: Task Execution

For each task, coordinate:

1. **Code Implementation Tasks**: code-generator, test-writer, documentation
2. **Refactoring Tasks**: refactorer, style-enforcer, agent-tester
3. **Infrastructure Tasks**: infrastructure-agent, cicd-agent
4. **Migration Tasks**: migration-assistant, agent-tester

### Phase 4: Quality Gates

Between task groups, apply quality checks:

- **Code Quality**: style-enforcer, security-analyzer, performance-analyzer
- **Test Coverage**: agent-tester, test-writer
- **Documentation**: documentation, review-plan

## Output Format

Return structured results:

- **Summary**: spec name, tasks completed/remaining, execution time
- **Execution Plan**: phases, tasks, agents, execution type
- **Results**: per-task status, agent used, duration, quality metrics
- **Next Steps**: remaining tasks, blockers, recommendations

## Examples

```
"Implement the user-authentication spec"
"Execute spec tasks for payment-integration"
"Run the api-refactor spec with parallel execution"
"Implement spec migration-plan --dry-run"
```

## Delegation

Invokes the **agent-orchestrator** with spec context, task dependencies, and execution configuration.
