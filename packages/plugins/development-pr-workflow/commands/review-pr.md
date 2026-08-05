---
description: Orchestrate comprehensive pull request review using specialized agents for architecture, security, performance, testing, and maintainability analysis.
argument-hint: [branch|commit-range] [--depth standard|comprehensive] [--suggest-fixes] [--check-coverage]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git log:*), Bash(git show:*), Task(subagent_type:development-codebase-tools:agent-orchestrator-agent), Task(subagent_type:*), Read(*), Grep(*)
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

Quick, focused review of key concerns. Every agent below lives in a sibling plugin, so the
`plugin:agent-name` qualifier is required — a bare name will not resolve. This is the
maximum staffing, not a roster to complete: skip any agent whose dimension the diff does
not raise, and read the diff directly when that answers the question faster than a
subagent would.

```typescript
{
  sequential: [
    {
      agent: 'development-codebase-tools:code-explainer-agent',
      task: 'Analyze changed files for intent and patterns',
    },
    {
      agent: 'development-codebase-tools:security-analyzer-agent',
      task: 'Quick vulnerability scan',
    },
    {
      agent: 'development-codebase-tools:style-enforcer-agent',
      task: 'Check style compliance',
    },
    {
      agent: 'development-productivity:test-writer-agent',
      task: 'Identify missing test coverage',
    },
  ];
}
```

### Comprehensive Review (--depth comprehensive)

Deep multi-agent analysis using **development-codebase-tools:agent-orchestrator-agent**.

The pipeline below is the **maximum** staffing for a broad, cross-cutting diff — not a
roster to complete. Skip any phase the diff does not raise, and drop individual agents
within a phase for the same reason: a docs-only change needs neither the security nor the
performance pass, and a diff touching one file rarely needs impact analysis at all. Every
agent lives in a sibling plugin, so the `plugin:agent-name` qualifier is required.

```typescript
{
  // Provided by the development-codebase-tools plugin.
  // Fallback: If unavailable, execute phases sequentially without orchestration
  orchestrator: "development-codebase-tools:agent-orchestrator-agent",
  phases: [
    {
      name: "Impact Analysis",
      parallel: [
        { agent: "development-codebase-tools:code-explainer-agent", focus: "change-intent" },
        { agent: "development-codebase-tools:context-loader-agent", focus: "affected-systems" }
      ]
    },
    {
      name: "Quality Assessment",
      parallel: [
        { agent: "development-planning:plan-reviewer-agent", focus: "design-consistency" },
        { agent: "development-codebase-tools:security-analyzer-agent", focus: "vulnerability-assessment" },
        { agent: "development-codebase-tools:performance-analyzer-agent", focus: "performance-impact" },
        { agent: "development-codebase-tools:style-enforcer-agent", focus: "code-standards" }
      ]
    },
    {
      name: "Test & Documentation",
      parallel: [
        { agent: "development-productivity:test-writer-agent", focus: "coverage-gaps" },
        { agent: "development-productivity:agent-tester-agent", focus: "regression-testing" },
        { agent: "development-productivity:documentation-agent", focus: "documentation-updates" }
      ]
    },
    {
      name: "Fix Generation",
      sequential: [
        { agent: "development-codebase-tools:refactorer-agent", focus: "improvement-suggestions" },
        { agent: "uniswap-integrations:migration-assistant-agent", focus: "breaking-changes" }
      ]
    }
  ]
}
```

**Fallback (if the orchestrator agent is not available)**: Execute each phase sequentially, invoking agents directly without parallel coordination. The review will still cover all aspects but may take longer.

## Output Format

Report every genuine finding. Assign each a severity rather than dropping it — do not omit
a finding because it is minor, because you are unsure it is real, or because the list is
getting long. Record uncertainty on the finding itself ("possible", "worth confirming").
The `--focus` and `--severity` flags filter what is *presented*; they never narrow what is
looked for.

Every numeric field below must come from a tool you actually ran. If the measurement was
not taken, omit the field — do not estimate it. Keep each finding to 2-4 sentences.

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
      // Qualitative bands, not scores. A 0-10 number here would be an unmeasured
      // estimate dressed up as data. Omit any dimension the diff does not touch.
      breakdown: {
        architecture?: 'low' | 'medium' | 'high';
        security?: 'low' | 'medium' | 'high';
        performance?: 'low' | 'medium' | 'high';
        maintainability?: 'low' | 'medium' | 'high';
        testing?: 'low' | 'medium' | 'high';
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
      benchmark?: string; // Only if an actual benchmark was run
    }>;
    // Include ONLY if a complexity tool was actually run against both revisions
    // (eslint complexity rule, `lizard`, `radon`, etc.). Cite the tool. An
    // eyeballed cyclomatic number is a fabrication — omit the field instead.
    complexity?: {
      tool: string;
      before: number;
      after: number;
    };
  };

  testingReview: {
    // Include ONLY when a real coverage run produced these numbers. Omit the whole
    // block when no coverage report was generated — never estimate a percentage.
    coverage?: {
      source: string; // Command or report file the numbers came from
      current: number; // Measured coverage %
      required?: number; // From project config, if one sets a threshold
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
      // Qualitative band. A 0-100 score has no measured input behind it.
      assessment: 'strong' | 'adequate' | 'thin' | 'absent';
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
