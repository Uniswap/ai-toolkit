---
description: Comprehensive code explanation and analysis. Use when user says "explain this file to me", "what does this code do", "analyze the security of this module", "review the performance of this function", or "help me understand this architecture".
allowed-tools: Read, Grep, Glob, Bash(git show:*), Bash(git ls-files:*), Task(subagent_type:code-explainer-agent), Task(subagent_type:security-analyzer-agent), Task(subagent_type:performance-analyzer-agent), Task(subagent_type:context-loader-agent)
model: opus
---

# Code Analyzer

Provide comprehensive code explanation through multi-agent analysis for architecture, patterns, security, and performance insights.

## Execution Steps

1. **Identify the target** — Extract the file path or module name from the user's request. If no target is specified, ask: "Which file or module would you like me to analyze?"

2. **Verify the target exists** — Use `Read` or `Glob` to confirm the file exists. If it doesn't, report and stop: "Could not find `<path>`. Please check the path and try again."

3. **Infer analysis depth** from the user's request:

   - `overview` — request uses words like "quick", "summary", "briefly", "what does this do"
   - `deep` — request mentions "security", "performance", "vulnerabilities", "thorough", "deep", "comprehensive"
   - `architectural` — request mentions "architecture", "system", "how does this fit", "overall design"
   - Default to `deep` when depth is ambiguous

4. **Dispatch agents** based on depth:

   - `overview`: spawn **code-explainer-agent** only; pass the file path and its contents
   - `deep`: spawn **code-explainer-agent** + **security-analyzer-agent** + **performance-analyzer-agent** in parallel
   - `architectural`: run **context-loader-agent** first to gather system-level context, then spawn **code-explainer-agent** + **security-analyzer-agent** + **performance-analyzer-agent** in parallel with that context

5. **Synthesize results** — Combine agent outputs into a single structured report. Integrate and deduplicate findings; do not dump raw agent output.

6. **Handle agent failures** — If an agent errors or returns empty output, note it in the report ("Security analysis unavailable") and continue with remaining results.

## Analysis Depth

| Depth           | Description            | Agents Used                                             |
| --------------- | ---------------------- | ------------------------------------------------------- |
| `overview`      | Quick summary          | code-explainer                                          |
| `deep`          | Comprehensive analysis | code-explainer, security-analyzer, performance-analyzer |
| `architectural` | System-level context   | All agents + context-loader                             |

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

For simple explanations, use **code-explainer-agent** directly.

For deep analysis, coordinate:

- **code-explainer-agent**: Architecture and patterns
- **security-analyzer-agent**: Vulnerability assessment
- **performance-analyzer-agent**: Complexity analysis
- **context-loader-agent**: System-level context

## Examples

```
"Explain src/auth/login.ts to me"
"What does this API endpoint do?"
"Analyze the security of the payment module"
"Is there anything wrong with this code?"
```

## Detailed Reference

For output schemas and advanced options, see [explain-file-guide.md](explain-file-guide.md).
