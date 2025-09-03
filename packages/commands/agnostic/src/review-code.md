---
description: Comprehensive code review using multiple specialized agents for architecture, security, performance, and style analysis.
argument-hint: [paths...] [--depth shallow|deep] [--focus architecture|security|performance|all]
allowed-tools: Read(*), Grep(*), Task(subagent_type:agent-orchestrator), Task(subagent_type:*)
---

## Inputs

Parse arguments from `$ARGUMENTS`:

- **paths**: Files or directories to review (defaults to current changes)
- **--depth**: Review depth (shallow|deep) - default: shallow
- **--focus**: Specific aspects to focus on (architecture|security|performance|all) - default: all
- **--suggest-fixes**: Generate fix suggestions (default: true)
- **--check-tests**: Review test coverage (default: false)
- **--compare-baseline**: Compare against baseline branch (default: main)

Examples:

- `/review-code` (reviews current uncommitted changes)
- `/review-code src/api/ --depth deep --focus security`
- `/review-code src/components/Form.tsx --check-tests`
- `/review-code . --focus architecture --compare-baseline develop`

## Task

Perform comprehensive code review by orchestrating specialized analysis agents:

1. **Multi-Aspect Analysis**: Architecture, security, performance, and style
2. **Risk Assessment**: Identify potential issues and their severity
3. **Fix Suggestions**: Provide actionable improvement recommendations
4. **Pattern Validation**: Ensure consistency with codebase patterns
5. **Test Coverage**: Verify adequate testing (if requested)

## Orchestration Strategy

### Phase 1: Code Analysis Preparation

1. **Identify Review Scope**:

   - If no paths provided, get current git changes
   - Expand directories to file lists
   - Filter by file types and patterns

2. **Context Loading**:
   - Invoke **context-loader** to understand surrounding code
   - Identify architectural patterns and conventions
   - Load relevant documentation and standards

### Phase 2: Multi-Agent Review

Invoke **agent-orchestrator** to coordinate parallel analysis:

```typescript
{
  task: "Comprehensive code review",
  complexity: "complex",
  parallelGroups: [
    {
      name: "Code Quality",
      agents: [
        { agent: "style-enforcer", focus: "style-compliance" },
        { agent: "refactorer", focus: "improvement-opportunities" },
        { agent: "code-explainer", focus: "complexity-analysis" }
      ]
    },
    {
      name: "Architecture & Design",
      agents: [
        { agent: "architect-reviewer", focus: "pattern-consistency" },
        { agent: "plan-reviewer", focus: "design-validation" }
      ]
    },
    {
      name: "Security & Performance",
      agents: [
        { agent: "security-analyzer", focus: "vulnerability-assessment" },
        { agent: "performance-analyzer", focus: "bottleneck-detection" }
      ]
    },
    {
      name: "Testing",
      agents: [
        { agent: "test-writer", focus: "coverage-gaps" },
        { agent: "test-runner", focus: "test-validation" }
      ]
    }
  ]
}
```

### Phase 3: Deep Analysis (if --depth deep)

For deep review, additional specialized analysis:

1. **Dependency Analysis**:

   - Check for circular dependencies
   - Validate import structures
   - Identify unused dependencies

2. **Pattern Consistency**:

   - Compare with existing patterns
   - Identify deviations from standards
   - Suggest pattern alignment

3. **Impact Analysis**:
   - Assess breaking changes
   - Identify affected components
   - Evaluate migration requirements

### Phase 4: Result Aggregation

Combine insights from all agents:

1. **Issue Prioritization**:

   - Critical: Security vulnerabilities, breaking changes
   - High: Performance issues, architectural violations
   - Medium: Style inconsistencies, missing tests
   - Low: Minor improvements, documentation

2. **Fix Generation**:

   - Automated fixes for style issues
   - Refactoring suggestions with examples
   - Security patches with explanations

3. **Consensus Building**:
   - Resolve conflicting recommendations
   - Prioritize based on impact and effort
   - Generate unified action plan

## Output Format

```typescript
{
  summary: {
    filesReviewed: number;
    issuesFound: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    fixesAvailable: number;
    estimatedEffort: string; // "minutes", "hours", "days"
  };

  issues: Array<{
    file: string;
    line: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'architecture' | 'security' | 'performance' | 'style' | 'testing';
    issue: string;
    explanation: string;
    agent: string; // Which agent identified this
    suggestion?: {
      fix: string; // Suggested fix
      automated: boolean; // Can be auto-applied
      example?: string; // Code example
    };
  }>;

  architectureInsights?: {
    patterns: string[]; // Identified patterns
    violations: string[]; // Pattern violations
    recommendations: string[]; // Architectural improvements
  };

  securityReport?: {
    vulnerabilities: Array<{
      type: string; // e.g., "SQL Injection", "XSS"
      severity: 'critical' | 'high' | 'medium' | 'low';
      location: string;
      mitigation: string;
    }>;
    bestPractices: string[]; // Security best practices to follow
  };

  performanceReport?: {
    bottlenecks: Array<{
      location: string;
      issue: string;
      impact: 'high' | 'medium' | 'low';
      optimization: string;
    }>;
    metrics: {
      complexity: number; // Cyclomatic complexity
      memoryUsage: string; // Estimated memory impact
      timeComplexity: string; // Big O notation
    };
  };

  testCoverage?: {
    current: number; // Current coverage percentage
    recommended: number; // Recommended coverage
    gaps: Array<{
      file: string;
      uncoveredLines: number[];
      suggestedTests: string[];
    }>;
  };

  actionPlan: {
    immediate: string[]; // Fix now (critical/high)
    shortTerm: string[]; // Fix soon (medium)
    longTerm: string[]; // Consider for future (low)
    automated: Array<{ // Auto-applicable fixes
      file: string;
      fix: string;
      command: string; // Command to apply
    }>;
  };
}
```

## Specialized Review Modes

### Architecture Focus

When `--focus architecture`:

- Emphasize design patterns and structure
- Validate SOLID principles
- Check dependency management
- Assess modularity and coupling

### Security Focus

When `--focus security`:

- Deep vulnerability scanning
- Input validation checks
- Authentication/authorization review
- Dependency vulnerability checks
- Secrets and credential scanning

### Performance Focus

When `--focus performance`:

- Algorithm complexity analysis
- Memory usage patterns
- Database query optimization
- Caching opportunities
- Async/concurrent processing

## Quality Gates Integration

The review can serve as a quality gate:

```typescript
{
  passed: boolean; // Overall pass/fail
  blockers: string[]; // Critical issues blocking merge
  warnings: string[]; // Non-blocking concerns
  score: number; // Quality score (0-100)
  recommendation: 'approve' | 'request-changes' | 'comment';
}
```

## Examples

### Basic Review of Current Changes

```bash
/review-code
# Reviews all uncommitted changes with standard depth
```

### Deep Security Review

```bash
/review-code src/api/ --depth deep --focus security
# Comprehensive security analysis of API code
```

### Architecture Review with Fixes

```bash
/review-code src/core/ --focus architecture --suggest-fixes
# Reviews architecture and provides refactoring suggestions
```

### Pre-Merge Comprehensive Review

```bash
/review-code . --depth deep --check-tests --compare-baseline main
# Full review comparing against main branch
```

## Integration Points

### Git Integration

- Automatically detect changed files
- Compare against baseline branches
- Generate commit-ready fixes

### CI/CD Integration

- Exit codes for pass/fail
- Machine-readable output format
- Threshold configuration

### IDE Integration

- Inline issue annotations
- Quick-fix suggestions
- Real-time feedback

## Best Practices

1. **Regular Reviews**: Run on every significant change
2. **Focus Areas**: Use focused reviews for faster feedback
3. **Incremental Fixes**: Address critical issues first
4. **Automation**: Apply automated fixes to save time
5. **Team Standards**: Configure thresholds per team preferences
6. **Learning**: Use insights to improve coding practices
