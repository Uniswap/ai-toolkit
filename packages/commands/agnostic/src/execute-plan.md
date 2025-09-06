---
description: Execute implementation plans using intelligent agent coordination, parallel execution, and quality gates.
argument-hint: <plan-file|task-description> [--task task-id] [--parallel] [--dry-run]
allowed-tools: Read(*), Task(subagent_type:agent-orchestrator), Task(subagent_type:*), Glob(*), Grep(*)
---

## Workflow Integration

This command is **Step 4** of the implementation workflow:

1. Explore → 2. Plan → 3. Review → 4. **Execute**

### Complete Workflow Example

```bash
# Step 1: Explore and understand the area
/explore authentication system

# Step 2: Plan the implementation (uses exploration context automatically)
/plan add OAuth2 with Google and GitHub

# Step 3: Review the generated plan
/review-plan oauth-plan.md

# Step 4: Execute the approved plan
/execute-plan oauth-plan.md --parallel
```

## Inputs

Parse arguments from `$ARGUMENTS`:

- **plan-source**: Either a path to a plan file (markdown) or inline task description
- **--task**: Specific task ID to implement (optional, defaults to next pending)
- **--parallel**: Enable parallel execution of independent tasks
- **--dry-run**: Preview the orchestration plan without executing
- **--quality-gates**: Enable quality checks between phases (default: true)
- **--meta-agents**: Enable meta-agent optimization during execution (default: false)

Examples:

- `/execute-plan ./implementation-plan.md`
- `/execute-plan "refactor authentication to use JWT tokens"`
- `/execute-plan project-plan.md --task 3.2`
- `/execute-plan ./feature-plan.md --parallel --meta-agents`
- `/execute-plan migration-plan.md --dry-run`

## Task

Orchestrate the execution of implementation plans through intelligent agent coordination:

1. **Load Plan**: Parse plan from file or create from task description
2. **Task Analysis**: Decompose tasks and identify dependencies
3. **Agent Selection**: Match tasks to specialized agents based on capabilities
4. **Execution Orchestration**: Coordinate parallel/sequential execution
5. **Quality Assurance**: Validate outputs and ensure consistency

## Plan Loading Strategy

### From Plan File

When given a markdown file path:

1. **Read plan file** using Read tool
2. **Parse structure** to extract:

   - Task hierarchy (epic/story/subtask levels)
   - Dependencies between tasks
   - Agent assignments (if specified)
   - Acceptance criteria
   - Resource estimates

3. **Identify executable tasks**:
   - Filter for pending/not-started tasks
   - Respect task dependencies
   - Honor specified task ID if provided

### From Task Description

When given an inline task description:

1. **Quick planning**: Generate lightweight execution plan
2. **Decompose into subtasks** based on complexity
3. **Auto-assign agents** based on task requirements
4. **Determine execution order** from natural dependencies

## Agent Orchestration

Invoke **agent-orchestrator** with comprehensive context:

```typescript
{
  task: "Execute implementation plan",
  complexity: "highly-complex",
  decomposition: {
    plan: loadedPlan,
    tasks: executableTasks,
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

## Task Execution

For each task, the orchestrator coordinates:

### Code Implementation Tasks

- **code-generator**: Create new implementations
- **test-writer**: Generate accompanying tests
- **doc-writer**: Update documentation

### Refactoring Tasks

- **refactorer**: Structural improvements
- **style-enforcer**: Code style compliance
- **test-runner**: Regression testing

### Infrastructure Tasks

- **infrastructure-agent**: Cloud/scaling setup
- **cicd-agent**: Pipeline configuration
- **deployment-engineer**: Deployment automation

### Migration Tasks

- **migration-assistant**: Version upgrades
- **test-runner**: Compatibility testing
- **doc-writer**: Migration guides

## Quality Gates

Between task groups, apply quality checks:

### Code Quality

- **style-enforcer**: Verify code standards
- **security-analyzer**: Security audit
- **performance-analyzer**: Performance validation

### Test Coverage

- **test-runner**: Execute generated tests
- **test-writer**: Fill coverage gaps

### Documentation

- **doc-writer**: Ensure docs are updated
- **code-reviewer**: Validate against plan requirements

## Meta-Agent Integration

When `--meta-agents` is enabled:

### Continuous Optimization

- **agent-optimizer**: Monitor agent performance
- **prompt-engineer**: Refine delegation prompts
- **pattern-learner**: Extract reusable patterns

### Feedback Loop

- **feedback-collector**: Gather quality metrics
- Apply optimizations to ongoing tasks
- Store learnings for future executions

## Output Format

```typescript
{
  summary: {
    planSource: string; // File path or "inline task"
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

### Execute Plan from File

```bash
/execute-plan ./feature-plan.md
# Executes tasks from the plan file
```

### Parallel Execution

```bash
/execute-plan ./api-refactor-plan.md --parallel
# Executes independent tasks in parallel for faster completion
```

### Execute Specific Task

```bash
/execute-plan implementation.md --task 3.2
# Executes specific task 3.2 from the plan
```

### Quick Execution from Description

```bash
/execute-plan "add user authentication with JWT tokens"
# Creates and executes a quick plan from the description
```

### Dry Run with Meta-Agents

```bash
/execute-plan migration-plan.md --dry-run --meta-agents
# Preview execution plan with optimization insights
```

## Integration with Workflow Commands

This command completes the implementation workflow:

### From Exploration to Execution

1. **Explore**: `/explore <area>`

   - Builds deep understanding of the codebase area
   - Context automatically flows to planning

2. **Plan**: `/plan <task>`

   - Uses exploration context automatically
   - Creates detailed plan in markdown file
   - Includes task hierarchy and dependencies

3. **Review**: `/review-plan <plan-file>`

   - Validates plan completeness and feasibility
   - Checks alignment with codebase patterns
   - Identifies risks and improvements

4. **Execute**: `/execute-plan <plan-file>`
   - Reads the approved plan
   - Orchestrates implementation
   - Applies quality gates

### Quick Execution

For simple tasks, you can skip directly to execution:

```bash
/execute-plan "fix the login bug"
# Creates and executes a quick plan inline
```

## Plan File Format

Accepts markdown files with the following structure:

### Minimal Format

```markdown
## Tasks

- [ ] Task 1 description
- [ ] Task 2 description
  - [ ] Subtask 2.1
  - [ ] Subtask 2.2
```

### Full Format (from /plan command)

```markdown
## Task Hierarchy

### 1. Epic: Feature Name

#### 1.1 Story: Component

##### 1.1.1 Subtask: Implementation detail

- **Status**: pending
- **Agent**: code-generator
- **Dependencies**: [1.1.2]
- **Acceptance Criteria**:
  - Criterion 1
  - Criterion 2
```

## Best Practices

1. **Start Small**: Begin with single task execution before parallel
2. **Enable Quality Gates**: Catch issues early in the implementation
3. **Use Dry Run**: Preview complex orchestrations before execution
4. **Review Generated Code**: Validate output meets requirements
5. **Iterate**: Use meta-agent insights to improve future executions
6. **Leverage /plan**: Use `/plan` command for complex tasks to generate detailed plans first
