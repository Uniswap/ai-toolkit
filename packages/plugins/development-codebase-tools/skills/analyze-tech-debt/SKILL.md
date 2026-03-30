---
description: Analyze and prioritize technical debt with remediation plans. Use when user says "analyze the technical debt in this codebase", "what's the code quality like in this module", "identify what's slowing down our development", "assess the maintenance burden of this legacy code", "create a plan to pay down our tech debt", or "where should we focus our cleanup efforts".
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Task, WebSearch
model: opus
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
