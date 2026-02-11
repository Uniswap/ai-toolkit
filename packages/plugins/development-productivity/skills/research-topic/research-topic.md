---
description: Research external documentation and best practices. Use when user says "look up the docs for this library", "research best practices for implementing caching", "how do other projects handle authentication", "check the official documentation for this API", "compare our implementation with industry standards", or "what's the recommended way to structure this".
allowed-tools: WebSearch, WebFetch, Read, Glob, Grep, Bash(git ls-files:*), Bash(git log:*), Task(subagent_type:researcher-agent)
model: opus
---

# Topic Researcher

Research topics by combining web documentation with internal codebase analysis.

## When to Activate

- User asks about external documentation
- Best practices research needed
- Comparing implementations with industry standards
- Learning about libraries or frameworks
- Understanding how other projects solve problems
- Documentation lookup needed

## Quick Process

1. **Parse Query**: Extract topic, sources, codebase context
2. **Web Search**: Find relevant documentation and resources
3. **Codebase Analysis**: Analyze related patterns and implementations
4. **Synthesize**: Combine findings from both sources
5. **Recommend**: Provide actionable insights

## Input Parsing

Extract from request:

- `query`: Main research question or topic
- `sources`: Specific sources mentioned (e.g., "check MDN", "anthropic docs")
- `codebase_context`: Related files/patterns to analyze

## Output Format

Return structured findings:

- **Summary**: Executive summary of findings
- **Key Findings**: Main discoveries from research
- **Codebase Insights**: Relevant patterns from code
- **Recommendations**: Actionable next steps
- **Warnings**: Important gotchas or risks
- **References**: Sources consulted with links

## Examples

```
"Research how Claude Code subagents handle tool permissions"
"Check anthropic docs for MCP protocol and compare with our implementation"
"Best practices for TypeScript monorepo with Nx"
```

## Delegation

Invokes the **researcher-agent** with query, sources, and codebase context.
