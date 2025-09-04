# Commands Package - CLAUDE.md

## Package Overview

This package contains agnostic command definitions for Claude Code. Commands are user-facing interfaces that parse natural language input and delegate specialized work to agents.

### Recent Updates

**Enhanced /plan Command (Consolidated)**: The `/plan` command now includes all planning capabilities in a single unified command:

- Hierarchical task decomposition (epic/story/subtask levels)
- Intelligent agent assignment suggestions for each task
- Comprehensive risk assessment matrix with mitigation strategies
- Team composition recommendations for parallel execution
- Automatic complexity detection and adaptive planning
- Full integration with `/understand-area` for context-aware planning
- Supports all scenarios: simple bug fixes, features, refactors, and complex architectural changes

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

### Core Development Commands

- **explain-file**: Analyze and explain code structure
- **fix-bug**: Debug and fix issues with root cause analysis
- **refactor**: Refactor code for better structure
- **understand-area**: Deep dive into codebase areas

### Testing & Quality Commands

- **gen-tests**: Generate comprehensive tests with scenario generation and edge case identification
- **review-code**: Multi-agent code review for architecture, security, performance, and style
- **review-pr**: Review pull requests for quality
- **review-plan**: Review implementation plans for quality

### Planning & Implementation Commands

- **plan**: Create comprehensive implementation plans with hierarchical task decomposition
- **implement-spec**: Orchestrate spec-workflow task implementation with parallel agent coordination
- **research**: Combine web search with codebase analysis

### Infrastructure & Operations Commands

- **deploy**: Orchestrate deployments with infrastructure setup and CI/CD configuration
- **monitor**: Set up monitoring with metrics, alerts, and dashboards

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

## Implementation Philosophy

Rather than having a single "implement everything" command, we maintain the principle of specialization:

### Workflow for Implementation

1. **Planning Phase**: Use `/plan` to create detailed implementation plans

   - Hierarchical task decomposition (epic/story/subtask)
   - Agent assignment suggestions for each task
   - Risk assessment and mitigation strategies
   - Dependency analysis and execution order

2. **Orchestration**: The **agent-orchestrator** handles multi-agent coordination

   - Reads plans created by `/plan` command
   - Coordinates multiple specialized agents
   - Manages parallel vs sequential execution
   - Handles task dependencies and quality gates

3. **Specialized Execution**: Individual commands handle specific tasks
   - `/fix-bug` for debugging and fixes
   - `/refactor` for code improvements
   - `/gen-tests` for test generation
   - `/monitor` for observability setup

### Why No Universal "Implement" Command?

Each command is a specialist that excels at one thing. An "implement everything" command would:

- Violate the principle of specialization
- Duplicate the orchestrator's coordination role
- Create unnecessary complexity
- Reduce clarity about what's actually happening

Instead, the **agent-orchestrator** serves as the conductor, coordinating specialized agents based on plans, while each command maintains its focused expertise.

Example workflow:

```bash
# Step 1: Understand the codebase area
/understand-area authentication system

# Step 2: Create a comprehensive plan
/plan add OAuth2 integration with Google and GitHub

# Step 3: The orchestrator coordinates implementation
# Based on the plan, it will invoke appropriate agents:
# - code-generator for new OAuth modules
# - test-writer for authentication tests
# - security-analyzer for vulnerability checks
# - documentation-agent for API docs
```

## Recent Changes (2025-08-30)

### New Commands Added

- **implement-spec**: Orchestrates spec-workflow task implementation with intelligent agent coordination
- **review-code**: Comprehensive multi-agent code review for architecture, security, and performance
- **deploy**: Full deployment orchestration with infrastructure setup and CI/CD configuration

### Commands Enhanced to Agent Orchestration Standard

All commands now leverage sophisticated multi-agent orchestration:

- **explain-file**: Enhanced with multi-agent analysis for architecture, patterns, security, and performance

  - Added architectural depth analysis with full context loading
  - Integrated parallel agent coordination for comprehensive insights
  - Support for comparison mode and specialized focus areas

- **refactor**: Transformed into orchestrated refactoring system

  - Added architectural refactoring with pattern application
  - Integrated validation and test generation
  - Support for safe, aggressive, and architectural strategies

- **review-pr**: Upgraded to comprehensive PR review orchestration

  - Multi-phase agent coordination for deep analysis
  - Integrated architecture, security, performance, and test coverage review
  - Added GitHub/GitLab integration features

- **gen-tests**: Upgraded with advanced testing strategies
  - Added support for property-based and mutation testing
  - Integrated test maintenance recommendations
  - Enhanced orchestration for complex test generation

### Previous Changes

- **Consolidated Planning**: Merged `/plan-feature` into `/plan` for unified planning
- **Removed /implement**: Orchestration is properly handled by agent-orchestrator, not commands
- **Added /monitor**: New command for comprehensive observability setup
- **Enhanced /plan**: Now includes hierarchical decomposition, agent assignments, and risk assessment
- **Enhanced /fix-bug**: Added root cause analysis and prevention recommendations
- **Philosophy Clarification**: Commands are specialists; orchestration belongs to the orchestrator
