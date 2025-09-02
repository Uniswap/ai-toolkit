---
description: Orchestrate implementation of spec-workflow tasks using intelligent agent coordination, parallel execution, and quality gates.
argument-hint: <spec-name> [--task task-id] [--parallel] [--dry-run]
allowed-tools: Read(*), Task(subagent_type:agent-orchestrator), Task(subagent_type:*), mcp__spec-workflow__manage-tasks(*), mcp__spec-workflow__get-spec-context(*)
---

## Inputs

Parse arguments from `$ARGUMENTS`:

- **spec-name**: Name of the spec to implement from `.spec-workflow/specs/`
- **--task**: Specific task ID to implement (optional, defaults to next pending)
- **--parallel**: Enable parallel execution of independent tasks
- **--dry-run**: Preview the orchestration plan without executing
- **--quality-gates**: Enable quality checks between phases (default: true)
- **--meta-agents**: Enable meta-agent optimization during execution (default: false)

Examples:

- `/implement-spec user-authentication`
- `/implement-spec payment-integration --task 3.2`
- `/implement-spec refactor-api --parallel --meta-agents`
- `/implement-spec migration-plan --dry-run`

## Task

Orchestrate the implementation of spec-workflow tasks through intelligent agent coordination:

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

Invoke **agent-orchestrator** with comprehensive context:

```typescript
{
  task: "Implement spec tasks",
  complexity: "highly-complex",
  decomposition: {
    specs: loadedSpecs,
    tasks: pendingTasks,
    dependencies: taskDependencies
  },
  execution: {
    strategy: parallel ? "hybrid" : "sequential",
    metaAgents: enableMetaAgents,
    qualityGates: enableQualityGates
  }
}
```

The orchestrator will:

- Discover all available agents
- Use **agent-capability-analyst** for optimal matching
- Coordinate specialized agents for each task
- Handle parallel execution groups
- Manage result aggregation and conflict resolution

### Phase 3: Task Execution

For each task, the orchestrator coordinates:

1. **Code Implementation Tasks**:

   - **code-generator**: Create new implementations
   - **test-writer**: Generate accompanying tests
   - **doc-writer**: Update documentation

2. **Refactoring Tasks**:

   - **refactorer**: Structural improvements
   - **style-enforcer**: Code style compliance
   - **test-runner**: Regression testing

3. **Infrastructure Tasks**:

   - **infrastructure-agent**: Cloud/scaling setup
   - **cicd-agent**: Pipeline configuration
   - **monitor**: Observability setup

4. **Migration Tasks**:
   - **migration-assistant**: Version upgrades
   - **test-runner**: Compatibility testing
   - **doc-writer**: Migration guides

### Phase 4: Quality Gates

Between task groups, apply quality checks:

1. **Code Quality**:

   - **style-enforcer**: Verify code standards
   - **security-analyzer**: Security audit
   - **performance-analyzer**: Performance validation

2. **Test Coverage**:

   - **test-runner**: Execute generated tests
   - **test-writer**: Fill coverage gaps

3. **Documentation**:
   - **doc-writer**: Ensure docs are updated
   - **review-plan**: Validate against original spec

## Meta-Agent Integration

When `--meta-agents` is enabled:

1. **Continuous Optimization**:

   - **agent-optimizer**: Monitor agent performance
   - **prompt-engineer**: Refine delegation prompts
   - **pattern-learner**: Extract reusable patterns

2. **Feedback Loop**:
   - **feedback-collector**: Gather quality metrics
   - Apply optimizations to ongoing tasks
   - Store learnings for future executions

## Output Format

```typescript
{
  summary: {
    spec: string; // Spec name
    tasksCompleted: number;
    tasksRemaining: number;
    executionTime: number; // milliseconds
    parallelSpeedup: number; // if parallel execution used
  };

  executionPlan: {
    phases: Array<{
      name: string;
      tasks: string[];
      agents: string[];
      executionType: 'parallel' | 'sequential';
      dependencies: string[];
    }>;
  };

  results: Array<{
    taskId: string;
    taskDescription: string;
    status: 'completed' | 'failed' | 'skipped';
    agent: string;
    output: any; // Agent-specific output
    duration: number;
    qualityMetrics?: {
      confidence: number;
      coverage: number;
      issues: string[];
    };
  }>;

  metaInsights?: { // If meta-agents enabled
    optimizations: string[];
    patterns: string[];
    recommendations: string[];
  };

  nextSteps: {
    remainingTasks: string[];
    blockers: string[];
    recommendations: string[];
  };
}
```

## Error Handling

### Task Failures

- Automatic retry with refined prompts
- Fallback to alternative agents
- Mark task as blocked if unrecoverable
- Continue with non-dependent tasks

### Dependency Violations

- Detect circular dependencies
- Reorder tasks when possible
- Report unresolvable conflicts

### Quality Gate Failures

- Report specific issues
- Suggest remediation steps
- Option to continue with warnings
- Rollback capability for critical failures

## Examples

### Basic Implementation

```bash
/implement-spec user-authentication
# Implements next pending task in user-authentication spec
```

### Parallel Implementation

```bash
/implement-spec api-refactor --parallel
# Executes independent tasks in parallel for faster completion
```

### Specific Task Implementation

```bash
/implement-spec payment-integration --task 3.2
# Implements specific task 3.2 from payment-integration spec
```

### Dry Run with Meta-Agents

```bash
/implement-spec migration-plan --dry-run --meta-agents
# Preview execution plan with optimization insights
```

## Integration with Spec Workflow

This command seamlessly integrates with the spec-workflow system:

1. **Reads from**: `.spec-workflow/specs/[spec-name]/`

   - requirements.md
   - design.md
   - tasks.md

2. **Updates**: Task status in tasks.md

   - Marks tasks as in-progress when starting
   - Marks tasks as completed when successful
   - Adds notes for failed/blocked tasks

3. **Coordination**: Works with spec-workflow dashboard
   - Real-time status updates
   - Progress tracking
   - Approval integration for critical tasks

## Best Practices

1. **Start Small**: Begin with single task implementation before parallel
2. **Enable Quality Gates**: Catch issues early in the implementation
3. **Use Dry Run**: Preview complex orchestrations before execution
4. **Monitor Progress**: Check spec-workflow dashboard during execution
5. **Review Outputs**: Validate generated code meets requirements
6. **Iterate**: Use meta-agent insights to improve future implementations
