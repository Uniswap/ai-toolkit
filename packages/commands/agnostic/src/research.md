---
description: Research a topic by combining web search with codebase analysis for comprehensive understanding.
argument-hint: <topic or question to research>
allowed-tools: WebSearch(*), WebFetch(*), Bash(git ls-files:*), Bash(git log:*), Bash(git show:*)
---

## Inputs

Parse natural language query to extract:

- `query`: The main research question or topic
- `sources`: Specific sources mentioned (e.g., "check anthropic docs", "search MDN")
- `codebase_context`: Related files/patterns to analyze (e.g., "compare with existing commands")

Examples:

- `/research how do Claude Code subagents handle tool permissions`
- `/research check anthropic docs for MCP protocol and compare with our implementation`
- `/research best practices for TypeScript monorepo with Nx, focusing on package boundaries`
- `/research how other CLI tools handle interactive prompts, check existing patterns in commands/`

## Task

Conduct comprehensive research combining external documentation with internal codebase analysis:

1. Search relevant web documentation and resources
2. Analyze related codebase patterns and implementations
3. Synthesize findings from both sources
4. Identify gaps, opportunities, and best practices
5. Provide actionable insights and recommendations

## Delegation

Invoke **researcher** with:

- `query`: The research question
- `sources`: Optional list of specific sources to check
- `codebase_context`: Optional files/patterns to analyze

## Output

Return structured research findings:

- `summary`: Executive summary of findings
- `key_findings`: Main discoveries from research
- `codebase_insights`: Relevant patterns from code (when applicable)
- `recommendations`: Actionable next steps
- `warnings`: Important gotchas or risks
- `references`: Sources consulted with links