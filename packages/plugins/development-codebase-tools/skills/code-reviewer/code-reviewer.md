---
description: Comprehensive multi-agent code review. Use when user says "review my code", "check this for issues", "analyze code quality", "security review", "performance review", or needs architecture, security, performance, and style analysis of code changes.
allowed-tools: Read(*), Grep(*), Glob(*), Task(subagent_type:agent-orchestrator), Task(subagent_type:context-loader), Task(subagent_type:style-enforcer), Task(subagent_type:security-analyzer), Task(subagent_type:performance-analyzer), Task(subagent_type:code-explainer), Task(subagent_type:refactorer), Task(subagent_type:test-writer), Task(subagent_type:agent-tester)
---

# Code Reviewer

Comprehensive code review using multiple specialized agents for architecture, security, performance, and style analysis.

## When to Activate

- User asks for code review
- User wants to check code quality
- User needs security or performance analysis
- User mentions reviewing changes before commit/PR
- User asks about code issues or improvements

## Inputs

Parse from request:

- **paths**: Files or directories to review (defaults to current changes)
- **--depth**: Review depth (shallow|deep) - default: shallow
- **--focus**: Specific aspects (architecture|security|performance|all) - default: all
- **--suggest-fixes**: Generate fix suggestions (default: true)
- **--check-tests**: Review test coverage (default: false)
- **--compare-baseline**: Compare against baseline branch (default: main)

## Quick Process

1. **Identify Review Scope**: Get current git changes or specified paths
2. **Context Loading**: Load surrounding code context and patterns
3. **Multi-Agent Review**: Coordinate parallel analysis agents
4. **Result Aggregation**: Combine insights and prioritize issues
5. **Action Plan**: Generate prioritized fixes and recommendations

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

- **Code Quality**: style-enforcer, refactorer, code-explainer
- **Architecture & Design**: pattern consistency, design validation
- **Security & Performance**: security-analyzer, performance-analyzer
- **Testing**: test-writer (coverage gaps), agent-tester (validation)

### Phase 3: Deep Analysis (if --depth deep)

For deep review, additional specialized analysis:

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

## Output Format

Return structured results:

- **Summary**: Files reviewed, issues by severity, fixes available
- **Issues**: File, line, severity, category, explanation, suggestion
- **Architecture Insights**: Patterns, violations, recommendations
- **Security Report**: Vulnerabilities, severity, mitigation
- **Performance Report**: Bottlenecks, impact, optimization
- **Test Coverage**: Current coverage, gaps, suggested tests
- **Action Plan**: Immediate, short-term, long-term, automated fixes

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

## Examples

```
"Review my code changes"
"Check this file for security issues"
"Deep review of src/api/ focusing on performance"
"Review code quality in the authentication module"
```

## Delegation

Invokes the **agent-orchestrator** with review context, focus areas, and depth configuration to coordinate specialized analysis agents.
