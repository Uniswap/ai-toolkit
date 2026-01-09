---
name: code-analyzer
description: Comprehensive code explanation and analysis. Use when user says "explain this file to me", "what does this code do", "analyze the security of this module", "review the performance of this function", or "help me understand this architecture".
allowed-tools: Read, Grep, Glob, Bash(git show:*), Bash(git ls-files:*), Task(subagent_type:code-explainer), Task(subagent_type:security-analyzer), Task(subagent_type:performance-analyzer), Task(subagent_type:context-loader)
model: sonnet
---

# Code Analyzer

Provide comprehensive code explanation through multi-agent analysis for architecture, patterns, security, and performance insights.

## When to Activate

- User asks "what does this code do?"
- User wants code explained
- User asks about security or performance
- User wants to understand patterns in code
- Before making changes to unfamiliar code

## Quick Process

1. **Structure Analysis**: Understand architecture and patterns
2. **Dependency Mapping**: Trace imports and dependencies
3. **Risk Assessment**: Identify vulnerabilities and issues
4. **Performance Analysis**: Evaluate complexity
5. **Pattern Recognition**: Identify design patterns

## Analysis Depth

| Depth | Description | Agents Used |
| --- | --- | --- |
| `overview` | Quick summary | code-explainer |
| `deep` | Comprehensive analysis | code-explainer, security-analyzer, performance-analyzer |
| `architectural` | System-level context | All agents + context-loader |

## Focus Areas

- **patterns**: Design patterns, SOLID, anti-patterns
- **security**: Vulnerabilities, input validation, auth
- **performance**: Algorithm complexity, memory, queries
- **all**: Complete analysis (default)

## Output Includes

- **Summary**: Purpose, complexity, maintainability score
- **Architecture**: Patterns, layers, coupling analysis
- **Functionality**: Main purpose, data flow, side effects
- **Dependencies**: Imports, exports, circular dependencies
- **Risks**: Security, performance, maintainability issues
- **Improvements**: Quick wins and refactoring suggestions

## Delegation

For simple explanations, use **code-explainer** directly.

For deep analysis, coordinate:

- **code-explainer**: Architecture and patterns
- **security-analyzer**: Vulnerability assessment
- **performance-analyzer**: Complexity analysis
- **context-loader**: System-level context

## Examples

```
"Explain src/auth/login.ts to me"
"What does this API endpoint do?"
"Analyze the security of the payment module"
"Is there anything wrong with this code?"
```

## Detailed Reference

For output schemas and advanced options, see [explain-file-guide.md](explain-file-guide.md).
