# Agents Package - CLAUDE.md

## Package Overview

This package contains agnostic agent definitions for Claude Code. Agents are specialized submodules that perform specific analysis or implementation tasks when invoked by commands.

## Agent Architecture

Agents are designed as focused, single-purpose modules:
- **No Direct User Interaction**: Agents are invoked by commands, not users
- **Tool Permission Inheritance**: Agents use tools allowed by the invoking command
- **Structured Input/Output**: Clear contracts for data exchange
- **Specialized Capabilities**: Each agent excels at one specific task

## Available Agents

- **context-loader**: Deep reconnaissance for codebase understanding
- **code-explainer**: Analyze and explain complex code
- **debug-assistant**: Identify and diagnose bugs
- **doc-writer**: Generate documentation and comments
- **planner**: Create detailed implementation plans (no code writing)
- **refactorer**: Improve code structure with safe patches
- **researcher**: Combine web docs with codebase analysis
- **style-enforcer**: Ensure code style consistency
- **test-writer**: Create comprehensive test cases

## Agent Structure

All agents follow this pattern:

```yaml
---
name: agent-name
description: Specialized purpose
---

# Agent Name

## Mission
[Agent's specialized purpose and constraints]

## Inputs
[Expected parameter format]

## Process/Output
[Methodology and return format]

## Guidelines
[Important constraints and principles]
```

## Context-Aware Agents

### Planner Agent Integration

The **planner** agent is designed to work seamlessly with **context-loader**:

1. **Context-loader** provides deep codebase understanding:
   - Key components and responsibilities
   - Patterns and conventions
   - Dependencies and integrations
   - Known gotchas and edge cases
   - Testing approaches

2. **Planner** uses these findings to create better plans:
   - Leverages identified patterns
   - Respects existing conventions
   - Accounts for known gotchas
   - Aligns with testing strategies
   - References specific components

This integration ensures plans are grounded in actual codebase reality rather than assumptions.

## Key Design Principles

1. **Single Responsibility**: Each agent has one clear purpose
2. **No Code in Analysis Agents**: Reconnaissance agents don't write code
3. **Structured Data Exchange**: Clear input/output contracts
4. **Tool Permission Inheritance**: Agents don't define their own tools
5. **Ultrathink When Needed**: Some agents (like planner) require maximum thinking

## Guidelines for Agents

### Analysis Agents (context-loader, code-explainer, researcher)
- Focus on understanding and explaining
- Return structured findings
- NO CODE WRITING principle

### Implementation Agents (refactorer, test-writer)
- Create specific code changes
- Follow existing patterns
- Return executable patches or code

### Planning Agents (planner)
- Maximum thinking budget (ultrathink)
- No unnecessary features or extras
- Context-aware when findings provided
- Detailed but readable output

## Recent Changes

- Added **planner** agent with ultrathink requirement
- Enhanced context integration between context-loader and planner
- Implemented strict "no extras" policy for planning
- Added context_findings parameter support for better integration