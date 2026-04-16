---
description: Analyze and prioritize technical debt with remediation plans. Use when user says "analyze the technical debt in this codebase", "what's the code quality like in this module", "identify what's slowing down our development", "assess the maintenance burden of this legacy code", "create a plan to pay down our tech debt", or "where should we focus our cleanup efforts".
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(git blame:*), Task, WebSearch
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

## Execution Process

1. **Scope the target** — Identify which packages, modules, or files to analyze. If no scope is given, use the entire repository.
2. **Collect code signals** — Use `Glob` and `Grep` to find: files over 500 lines, deeply nested code (≥4 levels of indentation), `TODO`/`FIXME`/`HACK` comments, and `any` types in TypeScript files.
3. **Examine git history** — Run `git log --since="6 months ago" --format="%H %s" --stat` to identify high-churn files. Run `git log --oneline --grep="fix\|bug\|hotfix" -- <path>` on suspect files to spot chronic bug areas.
4. **Assess test coverage** — Use `Glob("**/*.test.*")` and `Glob("**/*.spec.*")` to find test files. Cross-reference with source files to identify untested modules. Estimate coverage as (test file count / source file count) × 100.
5. **Score and prioritize each item** — Assign impact (hours/month lost), effort (hours to fix), and risk (critical/high/medium/low). Compute ROI = (monthly_impact × 12) / effort.
6. **Write the report** — Output a Debt Metrics Dashboard followed by a Prioritized Roadmap. Categorize items as Quick Wins (high ROI, <4h effort), Medium-Term, or Long-Term.

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
high_churn_files:
  - path: src/auth/login.ts
    commits_6mo: 47
files_over_500_lines:
  count: 12
  worst: src/legacy/processor.ts (1842 lines)
todo_fixme_count:
  total: 83
  hotspots: [src/payments/, src/legacy/]
test_coverage_estimate:
  ratio: 45%
  target: 80%
```

### Prioritized Roadmap

- **Quick Wins**: High ROI, <4h effort (Week 1–2)
- **Medium-Term**: Refactors and feature-level changes (Month 1–3)
- **Long-Term**: Architecture changes (Quarter 2–4)

### Per-Item Format

Each item includes: location, description, estimated effort, monthly velocity savings, ROI %, and recommended fix.

### ROI Calculations

Each item includes:

- Effort estimate
- Monthly savings
- ROI percentage
- Payback period

## Examples

```
"Analyze the technical debt in the auth module"
"What's slowing down development in packages/legacy?"
"Create a cleanup roadmap for next quarter"
"Where should we focus refactoring efforts this sprint?"
```
