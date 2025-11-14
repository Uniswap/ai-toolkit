# Commands Package - CLAUDE.md

## Package Overview

This package contains agnostic command definitions for Claude Code. Commands are user-facing interfaces that parse natural language input and delegate specialized work to agents.

### Recent Updates

**Simplified /plan Command (2025-09-30)**: The `/plan` command now creates concise, actionable implementation plans:

- Clear implementation breakdown (typically 5-7 steps for medium tasks)
- Focused on strategic direction (what needs to happen, not how to code it)
- Length-guided output (100-200, 200-400, 400-600 lines by complexity)
- Full integration with `/explore` for context-aware planning
- Optional API design and critical challenges sections
- Testing handled separately during execution (not part of planning)
- Supports all scenarios: simple bug fixes, features, refactors, and complex architectural changes

## Recommended Workflows

### Complete Implementation Workflow (1-2-3-4 Flow)

For optimal results, follow this four-step linear workflow:

1. **Explore**: `/explore <relevant area>`

   - Deep dive into the codebase area
   - Build comprehensive understanding
   - Context automatically flows to next step

2. **Plan**: `/plan <task description>`

   - Uses exploration context automatically
   - Creates clear, actionable implementation plan
   - Generates concise markdown plan file (200-400 lines for medium tasks)

3. **Review**: `/review-plan <plan-file>`

   - Validates plan completeness and feasibility
   - Checks alignment with codebase patterns
   - Identifies risks and improvements

4. **Execute**: `/execute-plan <plan-file>`
   - Reads the plan and implements each step directly
   - Makes code changes using Edit/Write tools
   - Commits at logical completion points
   - Offers optional test/doc generation after completion

### Example Workflow

```bash
# Step 1: Explore and understand the authentication system
/explore authentication and user management

# Step 2: Plan new feature (context from exploration is automatically used)
/plan add two-factor authentication support

# Step 3: Review the generated plan for quality
/review-plan auth-2fa-plan.md

# Step 4: Execute the approved plan
/execute-plan auth-2fa-plan.md
```

**Note for Claude Code**: When context-loader findings exist from a previous `/explore` command, automatically pass them to the planner agent as `context_findings`. The workflow is designed to be seamless with context flowing automatically between commands.

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

### Documentation Commands

- **claude-docs**: Initialize or update CLAUDE.md documentation files based on context and changes
  - Supports both initialization (new repos) and updates (existing repos)
  - Automatically detects mode based on keywords or defaults to update
  - Leverages claude-docs-initializer for discovery-driven initialization
  - Leverages claude-docs-manager for change-driven updates

### Core Development Commands

- **explain-file**: Analyze and explain code structure
- **fix-bug**: Debug and fix issues with root cause analysis
- **refactor**: Refactor code for better structure
- **explore**: Deep dive into codebase areas

### Testing & Quality Commands

- **gen-tests**: Generate comprehensive tests with scenario generation and edge case identification
- **review-code**: Multi-agent code review for architecture, security, performance, and style
- **review-pr**: Review pull requests for quality
- **review-plan**: Review implementation plans for quality
- **work-through-pr-comments**: Methodically work through PR comments in a conversational workflow, presenting solution options and implementing approved changes

### Planning & Implementation Commands

- **plan**: Create clear, actionable implementation plans with step-by-step breakdown
- **execute-plan**: Execute implementation plans step-by-step with direct code changes
- **implement-spec**: Orchestrate spec-workflow task implementation with parallel agent coordination
- **auto-spec**: Fully autonomous spec-driven development with multi-agent consensus building
- **split-stack**: Automatically split a monolithic branch into a logical, reviewable stack of PRs using semantic analysis and Graphite
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

1. **Planning Phase**: Use `/plan` to create clear implementation plans

   - Step-by-step implementation breakdown (typically 5-7 steps for medium tasks)
   - API design and data structures when needed
   - Critical challenges and mitigation strategies
   - Files to modify and create

2. **Execution Phase**: Use `/execute-plan` to implement the plan

   - Reads plan file and executes each step sequentially
   - Makes code changes directly using Edit/Write tools
   - Runs tests and validates changes as needed
   - Commits code at logical completion points
   - Offers optional test/doc generation after core implementation

3. **Specialized Execution**: Individual commands handle specific tasks
   - `/fix-bug` for debugging and fixes
   - `/refactor` for code improvements
   - `/gen-tests` for test generation
   - `/monitor` for observability setup

### Why No Universal "Implement" Command?

Each command is a specialist that excels at one thing. An "implement everything" command would:

- Violate the principle of specialization
- Create unnecessary complexity
- Reduce clarity about what's actually happening

Instead, `/execute-plan` follows the plan step-by-step, implementing changes directly while maintaining focus.

Example workflow:

```bash
# Step 1: Understand the codebase area
/explore authentication system

# Step 2: Create a clear implementation plan
/plan add OAuth2 integration with Google and GitHub

# Step 3: Execute the plan
/execute-plan oauth-plan.md

# The execute-plan command will:
# - Read the plan file and parse implementation steps
# - Implement each step using Edit/Write tools
# - Run tests and validate changes
# - Commit code at logical points
# - Offer optional test/doc generation when done
```

## Recent Changes

### Claude-Docs Command Integration (Latest)

- **claude-docs**: New command for comprehensive CLAUDE.md management
  - Natural language interface for documentation operations
  - Intelligent intent detection (init vs update modes)
  - Automatic scope determination (session/git/path)
  - Delegates to specialized documentation agents
  - Supports both repository initialization and incremental updates
  - Integration with Documentation Proximity Principle
  - **Restructured documentation**: Separated UPDATE and INIT paths into distinct sections for clarity
    - UPDATE Path (default): Single-agent change-driven updates
    - INIT Path: Multi-agent hierarchical documentation creation

### Previous Updates (2025-09-06)

- **auto-spec**: New command for fully autonomous spec-driven development
  - Creates and implements complete spec workflows with multi-agent collaboration
  - Bypasses manual review steps through intelligent consensus-building
  - Orchestrates requirements, design, tasks, and implementation phases
  - Includes comprehensive error handling and quality validation
  - Perfect for autonomous feature development with minimal supervision

### /execute-plan Command Simplification (2025-10-01)

- **Simplified execution**: Removed orchestration layers, parallel execution, and quality gates
- **Direct implementation**: Claude Code executes steps directly using Edit/Write tools
- **Sequential execution**: Steps are implemented in order, following the plan
- **Optional follow-ups**: Test and documentation generation offered after core implementation
- **Better alignment**: Matches the simplified planner philosophy (strategic plan → direct execution)

### Previous Updates (2025-08-30)

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

### /plan Command Simplification (2025-09-30)

- **Simplified planning output**: Removed hierarchical task decomposition, agent assignments, and risk matrices
- **Focus on strategic direction**: Plans now focus on WHAT needs to happen, not HOW to code it
- **Length guidance**: Added explicit targets (100-200, 200-400, 400-600 lines by complexity)
- **Testing separation**: Testing now handled during execution, not in planning phase
- **Clearer scope**: Plan structure simplified to 7 core sections (Overview, Scope, Current State, API Design, Steps, Files, Challenges)
- **Better separation of concerns**: Planning for strategy, execution for orchestration

### Previous Changes

- **Consolidated Planning**: Merged `/plan-feature` into `/plan` for unified planning
- **Removed /implement**: Orchestration is properly handled by agent-orchestrator, not commands
- **Added /monitor**: New command for comprehensive observability setup
- **Enhanced /fix-bug**: Added root cause analysis and prevention recommendations
- **Philosophy Clarification**: Commands are specialists; orchestration belongs to the orchestrator
