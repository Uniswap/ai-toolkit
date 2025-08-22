# Commands Package - CLAUDE.md

## Package Overview

This package contains agnostic command definitions for Claude Code. Commands are user-facing interfaces that parse natural language input and delegate specialized work to agents.

## Recommended Workflows

### Context-Aware Planning Workflow

For optimal planning results, use this two-step process:

1. **Build Context First**: `/understand-area <relevant area>`
   - Invokes the context-loader agent to deeply analyze the codebase area
   - Returns structured findings about components, patterns, dependencies, and gotchas

2. **Plan with Context**: `/plan <task description>`
   - Claude Code automatically passes context-loader findings to the planner
   - Creates implementation plans that respect existing patterns
   - Accounts for known edge cases and gotchas
   - No flags needed - context is used automatically when available

Example:
```bash
# First, understand the authentication system
/understand-area authentication and user management

# Then, plan new feature (context is automatically used)
/plan add two-factor authentication support
```

**Note for Claude Code**: When context-loader findings exist from a previous `/understand-area` command, automatically pass them to the planner agent as `context_findings`. This happens seamlessly without user intervention.

## Command Structure

All commands follow this pattern:

```yaml
---
description: Brief user-facing description
argument-hint: <usage pattern with flags>
allowed-tools: Tool1(*), Tool2(pattern:*), etc.
---

# Command Name

## Inputs
[Parse arguments and extract parameters]

## Task
[High-level objective]

## Delegation
Invoke **agent-name** with parameters

## Output
[Structured response format]
```

## Available Commands

- **explain-file**: Analyze and explain code structure
- **fix-bug**: Debug and fix issues in code
- **gen-tests**: Generate comprehensive test suites
- **plan**: Create detailed implementation plans without code
- **plan-feature**: Plan implementation for new features
- **refactor**: Refactor code for better structure
- **research**: Combine web search with codebase analysis
- **review-pr**: Review pull requests for quality
- **understand-area**: Deep dive into codebase areas

## Key Design Principles

1. **Commands Don't Execute**: They parse input and delegate to agents
2. **Tool Permissions Cascade**: Commands define allowed-tools that agents inherit
3. **Natural Language First**: Commands accept flexible natural language input
4. **Structured Output**: All commands return structured, predictable output

## Integration with Agents

Commands delegate work to specialized agents:
- Commands handle user interaction and argument parsing
- Agents perform the actual analysis or implementation work
- Tool permissions flow from command to agent
- Agents return structured data that commands format for users

## Recent Changes

- Added `/plan` command that integrates with context-loader findings
- Enhanced workflow documentation for context-aware planning
- Updated command structure to support optional context parameters