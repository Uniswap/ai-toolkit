---
description: Orchestrate comprehensive pull request review using specialized agents for architecture, security, performance, testing, and maintainability analysis.
argument-hint: [branch|commit-range] [--depth standard|comprehensive] [--suggest-fixes] [--check-coverage]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git log:*), Bash(git show:*), Task(subagent_type:agent-orchestrator), Task(subagent_type:*), Read(*), Grep(*)
---

## Inputs

Parse arguments from `$ARGUMENTS`:

- **branch/commit-range**: Optional specific branch or commit range (defaults to working changes)
- **--depth**: Review depth (standard|comprehensive) - default: standard
- **--suggest-fixes**: Generate fix patches (default: true)
- **--check-coverage**: Verify test coverage (default: true)
- **--focus**: Specific concerns (architecture|security|performance|all) - default: all
- **--baseline**: Compare against baseline branch (default: main/master)

Examples:

- `/review-pr` (reviews current uncommitted changes)
- `/review-pr feature-branch --depth comprehensive`
- `/review-pr HEAD~3..HEAD --focus security --suggest-fixes`
- `/review-pr main...develop --check-coverage`

## Context Gathering

First, gather comprehensive context via Bash:

```bash
# Current state
git branch --show-current
git status --porcelain

# Determine diff scope
if [[ -z "$ARGUMENTS" ]]; then
  git diff --unified=3 HEAD
else
  git log --oneline -20 $ARGUMENTS
  git diff --unified=3 $ARGUMENTS
fi

# File statistics
git diff --stat $TARGET
git diff --name-status $TARGET

# Commit messages for context
git log --format="%h %s" -10 $TARGET
```

## Task

Orchestrate comprehensive PR review through multi-agent coordination:

1. **Change Analysis**: Understand the intent and scope
2. **Risk Assessment**: Multi-dimensional risk evaluation
3. **Quality Validation**: Architecture, security, performance checks
4. **Test Coverage**: Verify adequate testing
5. **Fix Generation**: Provide actionable improvements

## Orchestration Strategy

### Standard Review (Default)

Quick, focused review of key concerns:

```typescript
{
  sequential: [
    {
      agent: 'code-explainer',
      task: 'Analyze changed files for intent and patterns',
    },
    {
      agent: 'security-analyzer',
      task: 'Quick vulnerability scan',
    },
    {
      agent: 'style-enforcer',
      task: 'Check style compliance',
    },
    {
      agent: 'test-writer',
      task: 'Identify missing test coverage',
    },
  ];
}
```

### Comprehensive Review (--depth comprehensive)

Deep multi-agent analysis:

```typescript
{
  orchestrator: "agent-orchestrator",
  phases: [
    {
      name: "Impact Analysis",
      parallel: [
        { agent: "code-explainer", focus: "change-intent" },
        { agent: "context-loader", focus: "affected-systems" }
      ]
    },
    {
      name: "Quality Assessment",
      parallel: [
        { agent: "architect-reviewer", focus: "design-consistency" },
        { agent: "security-analyzer", focus: "vulnerability-assessment" },
        { agent: "performance-analyzer", focus: "performance-impact" },
        { agent: "style-enforcer", focus: "code-standards" }
      ]
    },
    {
      name: "Test & Documentation",
      parallel: [
        { agent: "test-writer", focus: "coverage-gaps" },
        { agent: "test-runner", focus: "regression-testing" },
        { agent: "doc-writer", focus: "documentation-updates" }
      ]
    },
    {
      name: "Fix Generation",
      sequential: [
        { agent: "refactorer", focus: "improvement-suggestions" },
        { agent: "migration-assistant", focus: "breaking-changes" }
      ]
    }
  ]
}
```

## Output Format

```typescript
{
  summary: {
    intent: string; // What this PR is trying to achieve
    scope: {
      files: number;
      insertions: number;
      deletions: number;
      components: string[]; // Affected components
    };
    risk: {
      overall: 'low' | 'medium' | 'high' | 'critical';
      breakdown: {
        architecture: number; // 0-10 scale
        security: number;
        performance: number;
        maintainability: number;
        testing: number;
      };
    };
    recommendation: 'approve' | 'request-changes' | 'comment';
  };

  findings: {
    critical: Array<{
      type: string; // e.g., "Security Vulnerability", "Breaking Change"
      file: string;
      line: number;
      description: string;
      suggestion: string;
      agent: string; // Which agent found this
    }>;

    major: Array<{
      type: string;
      file: string;
      line: number;
      description: string;
      suggestion: string;
      autoFixAvailable: boolean;
    }>;

    minor: Array<{
      type: string;
      file: string;
      line: number;
      description: string;
      suggestion: string;
    }>;

    positive: string[]; // Good practices observed
  };

  architectureReview?: {
    patternCompliance: boolean;
    designConsistency: 'excellent' | 'good' | 'acceptable' | 'poor';
    suggestions: Array<{
      pattern: string;
      rationale: string;
      example: string;
    }>;
    breakingChanges: Array<{
      component: string;
      change: string;
      impact: string;
      migration: string; // Migration guide
    }>;
  };

  securityReview?: {
    vulnerabilities: Array<{
      type: string; // e.g., "SQL Injection", "XSS", "CSRF"
      severity: 'critical' | 'high' | 'medium' | 'low';
      file: string;
      line: number;
      fix: string; // Suggested fix
      cwe: string; // CWE identifier
    }>;
    dependencies: Array<{
      package: string;
      version: string;
      vulnerabilities: string[];
      recommendation: string;
    }>;
  };

  performanceReview?: {
    issues: Array<{
      type: string; // e.g., "N+1 Query", "Memory Leak", "Inefficient Algorithm"
      file: string;
      line: number;
      impact: 'high' | 'medium' | 'low';
      optimization: string;
      benchmark?: string; // Expected improvement
    }>;
    complexity: {
      before: number; // Cyclomatic complexity
      after: number;
      delta: string; // e.g., "+15%", "-5%"
    };
  };

  testingReview: {
    coverage: {
      current: number; // Current coverage %
      required: number; // Required coverage %
      gap: number; // Coverage gap
      uncoveredFiles: Array<{
        file: string;
        uncoveredLines: number[];
      }>;
    };
    missingTests: Array<{
      file: string;
      functionality: string;
      suggestedTests: string[];
      generatedTests?: string; // Generated test code
    }>;
    testQuality: {
      score: number; // 0-100
      issues: string[]; // e.g., "No edge case testing", "Missing mocks"
    };
  };

  patches: Array<{
    id: string;
    type: 'fix' | 'improvement' | 'style' | 'documentation';
    file: string;
    description: string;
    diff: string; // Git-style patch
    automated: boolean; // Can be auto-applied
    priority: 'must-fix' | 'should-fix' | 'nice-to-have';
    command?: string; // Command to apply patch
  }>;

  documentation: {
    needed: boolean;
    missing: string[]; // What documentation is missing
    suggestions: Array<{
      type: string; // e.g., "API docs", "README update", "Migration guide"
      content: string; // Suggested content
    }>;
  };

  actionItems: {
    mustFix: string[]; // Blocking issues
    shouldFix: string[]; // Important but not blocking
    consider: string[]; // Suggestions for improvement
    automated: Array<{ // Auto-applicable fixes
      description: string;
      command: string;
    }>;
  };
}
```

## Review Categories

### Architecture Review

- Design pattern compliance
- SOLID principle violations
- Dependency management
- Module boundaries
- API consistency

### Security Review

- Input validation
- Authentication/authorization
- Injection vulnerabilities
- Sensitive data exposure
- Dependency vulnerabilities

### Performance Review

- Algorithm complexity
- Database query efficiency
- Memory management
- Caching opportunities
- Async/concurrent issues

### Maintainability Review

- Code complexity
- Documentation coverage
- Test coverage
- Technical debt
- Code duplication

## Integration Features

### GitHub/GitLab Integration

```typescript
{
  prMetadata: {
    number: number;
    title: string;
    author: string;
    labels: string[];
    milestone: string;
  };

  comments: Array<{
    file: string;
    line: number;
    comment: string;
    severity: 'blocking' | 'important' | 'suggestion';
  }>;

  checkStatus: {
    passed: boolean;
    checks: Array<{
      name: string;
      status: 'passed' | 'failed' | 'warning';
      details: string;
    }>;
  };
}
```

## Examples

### Quick Review of Working Changes

```bash
/review-pr
# Reviews uncommitted changes with standard depth
```

### Comprehensive Feature Branch Review

```bash
/review-pr feature/new-api --depth comprehensive --check-coverage
# Deep review with test coverage verification
```

### Security-Focused Review

```bash
/review-pr HEAD~5..HEAD --focus security --suggest-fixes
# Security audit of last 5 commits with fix suggestions
```

### Pre-Merge Final Review

```bash
/review-pr main...feature-branch --depth comprehensive --baseline main
# Full review comparing feature branch against main
```

## Best Practices

1. **Early Reviews**: Run on draft PRs for early feedback
2. **Incremental Reviews**: Review commits as they're added
3. **Focus Reviews**: Use focused reviews for faster feedback
4. **Automate Fixes**: Apply automated fixes to save time
5. **Track Metrics**: Monitor PR quality metrics over time
6. **CI Integration**: Include in CI/CD pipelines for consistency
