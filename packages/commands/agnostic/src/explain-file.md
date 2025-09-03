---
description: Comprehensive code explanation using multi-agent analysis for architecture, patterns, security, and performance insights.
argument-hint: <path|glob> [--depth overview|deep|architectural] [--focus patterns|security|performance|all]
allowed-tools: Read(*), Grep(*), Bash(git show:*), Bash(git ls-files:*), Task(subagent_type:code-explainer), Task(subagent_type:security-analyzer), Task(subagent_type:performance-analyzer), Task(subagent_type:context-loader)
---

## Inputs

Parse arguments from `$ARGUMENTS`:

- **path**: File path, directory, or glob pattern (required)
- **--depth**: Analysis depth (overview|deep|architectural) - default: overview
- **--focus**: Specific aspects to emphasize (patterns|security|performance|all) - default: all
- **--compare**: Compare with another file/version for diff analysis
- **--context**: Include surrounding context analysis (default: true for deep/architectural)

Examples:

- `/explain-file src/auth/login.ts`
- `/explain-file src/api/*.ts --depth deep --focus security`
- `/explain-file src/core/ --depth architectural`
- `/explain-file src/utils/validator.ts --compare src/utils/validator.old.ts`

## Task

Provide comprehensive code explanation through multi-agent analysis:

1. **Code Structure Analysis**: Understand architecture and design patterns
2. **Dependency Mapping**: Trace imports and external dependencies
3. **Risk Assessment**: Identify potential issues and vulnerabilities
4. **Performance Analysis**: Evaluate computational complexity
5. **Pattern Recognition**: Identify design patterns and anti-patterns

## Orchestration Strategy

### Single File Analysis (Default)

For simple file explanations, direct delegation:

```typescript
{
  agent: "code-explainer",
  params: {
    path: parsedPath,
    depth: depth,
    focus: ["structure", "patterns", "risks"]
  }
}
```

### Deep Analysis (--depth deep)

Coordinate multiple specialized agents:

```typescript
{
  parallel: [
    {
      agent: 'code-explainer',
      focus: 'architecture-and-patterns',
    },
    {
      agent: 'security-analyzer',
      focus: 'vulnerability-assessment',
    },
    {
      agent: 'performance-analyzer',
      focus: 'complexity-analysis',
    },
  ];
}
```

### Architectural Analysis (--depth architectural)

Full system context analysis:

1. **Context Loading Phase**:

   - Invoke **context-loader** to map surrounding architecture
   - Identify integration points and dependencies
   - Build system-level understanding

2. **Multi-Agent Analysis**:
   - **code-explainer**: Core functionality and patterns
   - **security-analyzer**: Security boundaries and risks
   - **performance-analyzer**: Scalability implications
   - **refactorer**: Improvement opportunities

## Output Format

```typescript
{
  summary: {
    purpose: string; // Primary responsibility
    complexity: 'simple' | 'moderate' | 'complex' | 'highly-complex';
    loc: number; // Lines of code
    maintainability: number; // Score 0-100
  };

  architecture: {
    patterns: Array<{
      pattern: string; // e.g., "Singleton", "Factory", "Observer"
      location: string; // Where in the code
      implementation: string; // How it's implemented
      quality: 'excellent' | 'good' | 'acceptable' | 'needs-improvement';
    }>;
    structure: {
      layers: string[]; // Architectural layers detected
      components: Array<{
        name: string;
        responsibility: string;
        dependencies: string[];
      }>;
      coupling: 'loose' | 'moderate' | 'tight';
    };
  };

  functionality: {
    mainPurpose: string;
    keyFeatures: string[];
    dataFlow: Array<{
      input: string;
      processing: string;
      output: string;
    }>;
    sideEffects: string[]; // External state changes
    invariants: string[]; // Conditions that must always hold
  };

  dependencies: {
    imports: Array<{
      module: string;
      type: 'external' | 'internal' | 'relative';
      usage: string;
      risk: 'low' | 'medium' | 'high';
    }>;
    exports: Array<{
      name: string;
      type: string;
      consumers: string[]; // Who uses this export
    }>;
    circular: string[]; // Any circular dependencies detected
  };

  risks: {
    security: Array<{
      type: string; // e.g., "SQL Injection", "XSS"
      severity: 'critical' | 'high' | 'medium' | 'low';
      location: string;
      mitigation: string;
    }>;
    performance: Array<{
      issue: string; // e.g., "N+1 queries", "Memory leak"
      impact: 'high' | 'medium' | 'low';
      location: string;
      suggestion: string;
    }>;
    maintainability: Array<{
      issue: string; // e.g., "High complexity", "Code duplication"
      metric: string; // Specific metric violated
      suggestion: string;
    }>;
  };

  improvements: {
    immediate: string[]; // Quick wins
    refactoring: Array<{
      type: string; // e.g., "Extract method", "Introduce parameter object"
      rationale: string;
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
    }>;
    architectural: string[]; // Larger structural improvements
  };

  testing: {
    coverage: number; // Estimated test coverage
    testability: 'high' | 'medium' | 'low';
    suggestedTests: string[]; // Types of tests needed
    mockingStrategy: string; // How to mock dependencies
  };

  documentation: {
    inline: 'comprehensive' | 'adequate' | 'minimal' | 'missing';
    publicApi: boolean; // Has public API documentation
    examples: boolean; // Has usage examples
    suggestions: string[]; // Documentation improvements
  };
}
```

## Specialized Analysis Modes

### Pattern Focus

When `--focus patterns`:

- Emphasize design pattern identification
- Analyze SOLID principle compliance
- Identify anti-patterns and code smells
- Suggest pattern-based refactoring

### Security Focus

When `--focus security`:

- Deep vulnerability scanning
- Input validation analysis
- Authentication/authorization review
- Dependency vulnerability check
- Sensitive data handling

### Performance Focus

When `--focus performance`:

- Algorithm complexity analysis (Big O)
- Memory usage patterns
- Database query optimization
- Caching opportunities
- Async/concurrent processing

## Comparison Mode

When `--compare` is specified:

```typescript
{
  comparison: {
    added: string[]; // New functionality
    removed: string[]; // Deleted functionality
    modified: Array<{
      component: string;
      before: string;
      after: string;
      impact: string;
    }>;
    improvements: string[]; // Positive changes
    regressions: string[]; // Negative changes
    riskDelta: 'increased' | 'decreased' | 'unchanged';
  };
}
```

## Examples

### Basic File Explanation

```bash
/explain-file src/utils/validator.ts
# Quick overview of the validator utility
```

### Deep Security Analysis

```bash
/explain-file src/api/auth.ts --depth deep --focus security
# Comprehensive security analysis of authentication code
```

### Architectural Analysis

```bash
/explain-file src/core/ --depth architectural
# Full architectural analysis of core module
```

### Comparison Analysis

```bash
/explain-file src/service.ts --compare main:src/service.ts
# Compare current version with main branch
```

## Integration Points

### IDE Integration

- Hover explanations for complex code
- Inline risk indicators
- Architecture visualization

### Documentation Generation

- Auto-generate API documentation
- Create architecture diagrams
- Generate README sections

### Code Review

- Automated explanation for reviewers
- Risk assessment for changes
- Pattern compliance checking

## Best Practices

1. **Start Simple**: Use overview mode for quick understanding
2. **Deep Dive Strategically**: Use deep analysis for critical code
3. **Focus Areas**: Use focused analysis for specific concerns
4. **Regular Analysis**: Run on changed files during review
5. **Document Findings**: Save architectural analyses for onboarding
6. **Track Improvements**: Monitor risk scores over time
