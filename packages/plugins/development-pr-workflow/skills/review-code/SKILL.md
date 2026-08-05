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

| Depth             | Agent ceiling | Focus                            |
| ----------------- | ------------- | -------------------------------- |
| **Standard**      | up to 4       | Quick validation of key concerns |
| **Comprehensive** | up to 8       | Deep multi-phase analysis        |

These are ceilings, not quotas. Staff only the dimensions the diff actually raises — a
change that touches no code, config, or capability grants does not need a security agent,
and a diff with no new dependencies does not need a dependency pass. "Docs-only" is not the
same test: markdown frontmatter can carry `allowed-tools` grants, so a docs diff can still
change what a component is permitted to do. Do not spawn an agent for analysis that would finish in a
handful of direct tool calls; read the diff yourself instead.

## Orchestration Strategy

### Phase 1: Code Analysis Preparation

1. **Identify Review Scope**:

   - If no paths provided, get current git changes
   - Expand directories to file lists
   - Filter by file types and patterns

2. **Context Loading**:
   - Invoke `development-codebase-tools:context-loader-agent` to understand surrounding code
   - Identify architectural patterns and conventions
   - Load relevant documentation and standards

### Phase 2: Multi-Agent Review

Invoke agents to coordinate parallel analysis. Every agent below lives in a sibling plugin,
so the `plugin:agent-name` qualifier is required — a bare name will not resolve:

- **Code Quality**: `development-codebase-tools:style-enforcer-agent`,
  `development-codebase-tools:refactorer-agent`,
  `development-codebase-tools:code-explainer-agent`
- **Architecture & Design**: pattern consistency, design validation
- **Security & Performance**: `development-codebase-tools:security-analyzer-agent`,
  `development-codebase-tools:performance-analyzer-agent`
- **Testing**: `development-productivity:test-writer-agent` (coverage gaps)

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

Report every genuine finding. Mark each with a severity rather than dropping it — do not
omit a finding because it is low-severity, because you are unsure it is a real problem, or
because the list is getting long. Uncertainty is a note on the finding ("possible", "worth
confirming"), not a reason to discard it. Filtering by severity or concern happens at
presentation time, when the reader decides what to act on, never at discovery time.

Keep each finding to 2-4 sentences and each section to what a reviewer can act on. The
summary should fit on one screen.

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

Invokes specialized agents from sibling plugins for multi-dimensional analysis:
`development-codebase-tools:style-enforcer-agent`,
`development-codebase-tools:security-analyzer-agent`,
`development-codebase-tools:performance-analyzer-agent`,
`development-codebase-tools:code-explainer-agent`,
`development-codebase-tools:refactorer-agent`,
`development-codebase-tools:context-loader-agent`, and
`development-productivity:test-writer-agent`.

Delegate only when a dimension needs its own sustained analysis. Reviewing a small diff
directly is cheaper and more accurate than fanning out.
