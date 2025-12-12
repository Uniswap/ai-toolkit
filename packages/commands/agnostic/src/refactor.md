---
description: Orchestrate comprehensive refactoring with architectural analysis, pattern application, and incremental safety checks.
argument-hint: <path|glob> [--strategy safe|aggressive|architectural] [--goal readability|performance|maintainability|testability|all]
allowed-tools: Read(*), Grep(*), Bash(git diff:*), Bash(git show:*), Task(subagent_type:refactorer), Task(subagent_type:style-enforcer), Task(subagent_type:code-explainer), Task(subagent_type:test-writer), Task(subagent_type:agent-orchestrator)
---

## Inputs

Parse arguments from `$ARGUMENTS`:

- **path**: Target file, directory, or glob pattern
- **--strategy**: Refactoring approach (safe|aggressive|architectural) - default: safe
- **--goal**: Optimization target (readability|performance|maintainability|testability|all) - default: readability
- **--patterns**: Apply specific design patterns (e.g., "factory,observer")
- **--validate**: Run validation after refactoring (default: true)
- **--batch-size**: Number of changes per patch (default: 3 for safe, 10 for aggressive)

Examples:

- `/refactor src/utils/helpers.ts`
- `/refactor src/api/*.ts --strategy aggressive --goal performance`
- `/refactor src/core/ --strategy architectural --patterns "repository,facade"`
- `/refactor src/legacy/ --goal testability --validate`

## Task

Orchestrate sophisticated refactoring through multi-agent coordination:

1. **Code Analysis**: Understand current structure and issues
2. **Pattern Identification**: Detect applicable design patterns
3. **Refactoring Strategy**: Plan incremental, safe transformations
4. **Validation**: Ensure behavior preservation
5. **Test Generation**: Create tests for refactored code

## Orchestration Strategy

### Safe Refactoring (Default)

Incremental, low-risk improvements:

```typescript
{
  phases: [
    {
      name: 'Analysis',
      agent: 'code-explainer',
      task: 'Identify refactoring opportunities',
    },
    {
      name: 'Style Fixes',
      agent: 'style-enforcer',
      task: 'Apply automatic style improvements',
    },
    {
      name: 'Small Refactors',
      agent: 'refactorer',
      task: 'Generate minimal, safe patches',
    },
  ];
}
```

### Aggressive Refactoring

Comprehensive restructuring with validation:

```typescript
{
  orchestrator: "agent-orchestrator",
  parallel: [
    {
      agent: "refactorer",
      focus: "structural-improvements"
    },
    {
      agent: "style-enforcer",
      focus: "comprehensive-cleanup"
    },
    {
      agent: "test-writer",
      focus: "regression-test-generation"
    }
  ],
  validation: {
    agent: "test-runner",
    task: "Verify behavior preservation"
  }
}
```

### Architectural Refactoring

System-wide pattern application:

1. **Pattern Analysis**:

   - Identify current anti-patterns
   - Determine applicable design patterns
   - Plan migration strategy

2. **Coordinated Refactoring**:
   - **refactorer**: Structural changes
   - **code-generator**: New pattern implementations
   - **migration-assistant**: Gradual migration plan
   - **test-writer**: Comprehensive test coverage

## Output Format

```typescript
{
  summary: {
    filesAnalyzed: number;
    refactoringsProposed: number;
    estimatedImprovement: {
      readability: number; // % improvement
      performance: number;
      maintainability: number;
      testability: number;
    };
    risk: 'low' | 'medium' | 'high';
  };

  analysis: {
    currentIssues: Array<{
      type: string; // e.g., "Code duplication", "High complexity"
      severity: 'critical' | 'high' | 'medium' | 'low';
      location: string;
      metrics: object; // Relevant metrics
    }>;
    patterns: {
      detected: string[]; // Current patterns
      antiPatterns: string[]; // Anti-patterns found
      applicable: string[]; // Patterns that could be applied
    };
  };

  patches: Array<{
    id: string;
    file: string;
    type: string; // e.g., "Extract Method", "Introduce Parameter Object"
    description: string;
    diff: string; // Git-style diff
    impact: {
      loc: number; // Lines changed
      complexity: number; // Complexity reduction
      risk: 'low' | 'medium' | 'high';
    };
    dependencies: string[]; // Other patches this depends on
    validation: {
      testsNeeded: boolean;
      testsGenerated: string[]; // Generated test files
      breakingChange: boolean;
    };
  }>;

  migrationPlan?: { // For architectural refactoring
    phases: Array<{
      name: string;
      description: string;
      patches: string[]; // Patch IDs
      validation: string; // How to validate
      rollback: string; // Rollback procedure
    }>;
    timeline: string; // Estimated timeline
    risks: string[]; // Identified risks
  };

  followups: {
    immediate: string[]; // Can be done now
    shortTerm: string[]; // Should be done soon
    longTerm: string[]; // Future improvements
    monitoring: string[]; // Metrics to track
  };

  validation: {
    testCoverage: {
      before: number;
      after: number;
      newTests: string[];
    };
    behaviorPreserved: boolean;
    performanceImpact: string; // e.g., "+10% faster", "negligible"
    regressionRisks: string[];
  };
}
```

## Refactoring Strategies by Goal

### Readability Goal

Focus on code clarity:

- Extract complex expressions
- Rename variables for clarity
- Simplify conditional logic
- Add intermediate variables
- Remove magic numbers

### Performance Goal

Optimize execution:

- Algorithm improvements
- Caching implementations
- Query optimization
- Lazy loading
- Parallel processing

### Maintainability Goal

Improve structure:

- Extract modules
- Reduce coupling
- Increase cohesion
- Apply SOLID principles
- Remove code duplication

### Testability Goal

Enable better testing:

- Dependency injection
- Extract pure functions
- Mock-friendly interfaces
- Reduce side effects
- Isolate business logic

## Pattern Application

When `--patterns` specified:

```typescript
{
  patternApplication: {
    requested: string[]; // Patterns requested
    applicable: Array<{
      pattern: string;
      location: string;
      rationale: string;
      implementation: string; // How to apply
    }>;
    notApplicable: Array<{
      pattern: string;
      reason: string; // Why it can't be applied
    }>;
  };
}
```

## Safety Mechanisms

### Incremental Application

- Small, reviewable patches
- Dependency ordering
- Rollback procedures
- Validation checkpoints

### Risk Assessment

Each patch includes:

- Breaking change analysis
- Dependency impact
- Test coverage requirements
- Performance implications

### Validation Steps

1. **Static Analysis**: Type checking, linting
2. **Test Execution**: Run existing tests
3. **Behavior Comparison**: Input/output validation
4. **Performance Benchmarking**: Measure impact
5. **Manual Review**: Require approval for high-risk changes

## Examples

### Basic Readability Refactoring

```bash
/refactor src/utils/helpers.ts
# Safe, incremental improvements for readability
```

### Performance Optimization

```bash
/refactor src/api/handlers.ts --goal performance --strategy aggressive
# Aggressive performance optimizations with validation
```

### Architectural Pattern Application

```bash
/refactor src/services/ --strategy architectural --patterns "repository,unit-of-work"
# Apply repository and unit-of-work patterns
```

### Testability Improvement

```bash
/refactor src/core/logic.ts --goal testability --validate
# Refactor for better testability with validation
```

## Best Practices

1. **Start Safe**: Begin with safe strategy for critical code
2. **Validate Always**: Enable validation for production code
3. **Incremental Application**: Apply patches gradually
4. **Review Each Patch**: Manually review before applying
5. **Test Coverage First**: Ensure tests exist before refactoring
6. **Track Metrics**: Monitor improvement metrics over time
