---
description: Review code changes for quality, security, and performance. Use when user says "review my changes", "do a code review", "check this for issues", "analyze code quality", "security review", "performance review", "is this PR ready", or needs architecture, security, performance, and style analysis.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git log:*), Bash(git show:*), Task, Read, Grep, Glob
model: opus
---

# Code Reviewer

Comprehensive code review using multi-agent coordination for architecture, security, performance, and style analysis.

## When to Activate

- User asks for code review (any context)
- User wants changes reviewed before merge
- User needs security or performance analysis
- User asks "is this ready?"
- PR quality check needed
- User mentions reviewing changes before commit/PR
- User asks about code issues or improvements

## Inputs

Parse from request:

- **paths**: Files or directories to review (defaults to current git changes)
- **--depth**: Review depth (standard|comprehensive) - default: standard
- **--focus**: Specific aspects (architecture|security|performance|all) - default: all
- **--suggest-fixes**: Generate fix suggestions (default: true)
- **--check-tests**: Review test coverage (default: false)
- **--baseline**: Compare against baseline branch (default: main)

## Quick Process

1. **Gather Context**: Get diff, changed files, commit messages
2. **Analyze**: Understand intent and scope
3. **Multi-Agent Review**: Architecture, security, performance, style
4. **Generate Fixes**: Actionable improvements
5. **Summarize**: Recommendation with action items

## Review Depth

| Depth             | Agents | Focus                            |
| ----------------- | ------ | -------------------------------- |
| **Standard**      | 4      | Quick validation of key concerns |
| **Comprehensive** | 8+     | Deep multi-phase analysis        |

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

Invoke agents to coordinate parallel analysis:

- **Code Quality**: style-enforcer, refactorer, code-explainer
- **Architecture & Design**: pattern consistency, design validation
- **Security & Performance**: security-analyzer, performance-analyzer
- **Testing**: test-writer (coverage gaps)

### Phase 3: Deep Analysis (if --depth comprehensive)

For comprehensive review, additional specialized analysis:

- **Dependency Analysis**: Check for circular dependencies, validate imports
- **Pattern Consistency**: Compare with existing patterns, identify deviations
- **Impact Analysis**: Assess breaking changes, affected components

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

## Review Categories

- **Architecture**: Pattern compliance, SOLID, dependencies
- **Security**: Vulnerabilities, auth, injection risks
- **Performance**: Complexity, queries, caching
- **Maintainability**: Complexity, coverage, duplication
- **Testing**: Coverage gaps, test quality

## Specialized Review Modes

### Architecture Focus (`--focus architecture`)

- Emphasize design patterns and structure
- Validate SOLID principles
- Check dependency management
- Assess modularity and coupling

### Security Focus (`--focus security`)

- Deep vulnerability scanning
- Input validation checks
- Authentication/authorization review
- Secrets and credential scanning

### Performance Focus (`--focus performance`)

- Algorithm complexity analysis
- Memory usage patterns
- Database query optimization
- Caching opportunities

## Output Format

Provides:

- **Summary**: Intent, scope, risk assessment, files reviewed, issues by severity
- **Findings**: By severity (critical, major, minor) with file, line, explanation
- **Architecture Insights**: Patterns, violations, recommendations
- **Security Report**: Vulnerabilities, severity, mitigation
- **Performance Report**: Bottlenecks, impact, optimization
- **Test Coverage**: Current coverage, gaps, suggested tests
- **Action Plan**: Must-fix, should-fix, consider lists
- **Patches**: Actionable diffs with automated fix commands

## Recommendation

Returns: `approve`, `request-changes`, or `comment`

## Examples

```text
"Review my code changes"
"Check this file for security issues"
"Deep review of src/api/ focusing on performance"
"Review code quality in the authentication module"
"Is this PR ready to merge?"
```

## Delegation

Invokes specialized agents (style-enforcer, security-analyzer, performance-analyzer, code-explainer, refactorer, test-writer) for comprehensive multi-dimensional analysis.
