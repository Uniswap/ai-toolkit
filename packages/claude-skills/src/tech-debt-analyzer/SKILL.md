---
name: tech-debt-analyzer
description: Identify, quantify, and prioritize technical debt with actionable remediation plans. Use PROACTIVELY when user mentions technical debt, code quality issues, maintenance challenges, or wants to understand what's slowing development. Triggers: "technical debt", "tech debt", "code quality", "maintenance burden", "what's slowing us down", "legacy code", "cleanup needed", "code health", "debt analysis".
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Task, WebSearch
---

# Technical Debt Analyzer

Identify, quantify, and prioritize technical debt with ROI-based remediation plans.

## When to Activate

- User mentions technical debt
- Code quality assessment needed
- Understanding what's slowing development
- Legacy code evaluation
- Maintenance burden analysis

## Debt Categories

### Code Debt

- **Duplicated Code**: Copy-paste, repeated logic
- **Complex Code**: High cyclomatic complexity, deep nesting
- **Poor Structure**: Circular dependencies, coupling issues

### Architecture Debt

- **Design Flaws**: Missing abstractions, violations
- **Technology Debt**: Outdated frameworks, deprecated APIs

### Testing Debt

- **Coverage Gaps**: Untested paths, missing edge cases
- **Test Quality**: Brittle, slow, or flaky tests

### Documentation Debt

- Missing API docs, undocumented complex logic

### Infrastructure Debt

- Manual deployments, missing monitoring

## Impact Assessment

Calculates real cost:

- Development velocity impact (hours/month)
- Quality impact (bug rate, fix time)
- Risk assessment (critical/high/medium/low)

## Output Format

### Debt Metrics Dashboard

```yaml
cyclomatic_complexity:
  current: 15.2
  target: 10.0
code_duplication:
  percentage: 23%
  target: 5%
test_coverage:
  unit: 45%
  target: 80%
```

### Prioritized Roadmap

- **Quick Wins**: High value, low effort (Week 1-2)
- **Medium-Term**: Features, refactors (Month 1-3)
- **Long-Term**: Architecture changes (Quarter 2-4)

### ROI Calculations

Each item includes:

- Effort estimate
- Monthly savings
- ROI percentage
- Payback period

## Prevention Strategy

Includes quality gates:

- Pre-commit hooks
- CI pipeline checks
- Code review requirements
- Debt budget tracking

## Detailed Reference

For metrics, strategies, and templates, see [debt-guide.md](debt-guide.md).
