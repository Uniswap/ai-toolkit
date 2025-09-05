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
- Full integration with `/explore` for context-aware planning
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
   - Creates hierarchical implementation plan
   - Generates detailed markdown plan file

3. **Review**: `/review-plan <plan-file>`

   - Validates plan completeness and feasibility
   - Checks alignment with codebase patterns
   - Identifies risks and improvements

4. **Execute**: `/execute-plan <plan-file>`
   - Orchestrates multi-agent implementation
   - Handles parallel execution and dependencies
   - Applies quality gates between phases

### Example Workflow

```bash
# Step 1: Explore and understand the authentication system
/explore authentication and user management

# Step 2: Plan new feature (context from exploration is automatically used)
/plan add two-factor authentication support

# Step 3: Review the generated plan for quality
/review-plan auth-2fa-plan.md

# Step 4: Execute the approved plan
/execute-plan auth-2fa-plan.md --parallel
```

### Quick Execution

For simple tasks, you can skip to execution directly:

```bash
/execute-plan "fix the login validation bug"
# Creates and executes a quick plan inline
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

### Planning & Implementation Commands

- **plan**: Create comprehensive implementation plans with hierarchical task decomposition
- **execute-plan**: Execute implementation plans using intelligent agent orchestration (standalone, no spec-workflow required)
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

2. **Execution Phase**: Use `/execute-plan` to orchestrate implementation

   - Reads plans created by `/plan` command or any markdown plan
   - Accepts inline task descriptions for quick execution
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
/explore authentication system

# Step 2: Create a comprehensive plan
/plan add OAuth2 integration with Google and GitHub

# Step 3: Execute the plan using intelligent orchestration
/execute-plan oauth-plan.md

# The execute-plan command will:
# - Parse the plan structure and dependencies
# - Coordinate appropriate agents:
#   - code-generator for new OAuth modules
#   - test-writer for authentication tests
#   - security-analyzer for vulnerability checks
#   - documentation-agent for API docs
# - Handle parallel execution where possible
# - Apply quality gates between phases
```

## Recent Changes

### Latest Updates (2025-09-05)

- **execute-plan**: New standalone command for executing implementation plans
  - Works with any markdown plan file or inline task descriptions
  - No spec-workflow dependencies required
  - Supports parallel execution, quality gates, and meta-agent optimization
  - Perfect companion to the `/plan` command for complete planning-to-execution workflow

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

### Previous Changes

- **Consolidated Planning**: Merged `/plan-feature` into `/plan` for unified planning
- **Removed /implement**: Orchestration is properly handled by agent-orchestrator, not commands
- **Added /monitor**: New command for comprehensive observability setup
- **Enhanced /plan**: Now includes hierarchical decomposition, agent assignments, and risk assessment
- **Enhanced /fix-bug**: Added root cause analysis and prevention recommendations
- **Philosophy Clarification**: Commands are specialists; orchestration belongs to the orchestrator
