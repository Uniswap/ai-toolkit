# CLAUDE.md - development-planning

## Overview

This plugin provides implementation planning and execution workflows for Claude Code.

## Plugin Components

### Skills (./skills/)

- **implementation-planner**: Creates comprehensive implementation plans with step-by-step breakdowns
- **plan-executor**: Executes plans step-by-step with progress tracking
- **plan-reviewer**: Reviews plans for completeness, feasibility, and alignment with codebase patterns
- **plan-swarm**: Multi-agent collaborative plan refinement through expert discussion

### Agents (./agents/)

- **planner**: Core planning agent that creates actionable implementation plans
- **plan-reviewer**: Validates plans for completeness and feasibility
- **context-loader**: Loads and understands codebase context for informed planning

## Recommended Workflow

1. **Explore** (optional): Use codebase-explorer skill to understand the area
2. **Plan**: Use implementation-planner skill to create a plan
3. **Review**: Use plan-reviewer skill to validate the plan
4. **Execute**: Use plan-executor skill to implement the plan

## Integration Notes

- Skills are the primary interface for all workflows (contextual + explicit invocation)
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- Context flows automatically between exploration and planning phases

## File Structure

```text
development-planning/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── implementation-planner/
│   ├── plan-executor/
│   ├── plan-reviewer/
│   └── plan-swarm/
├── agents/
│   ├── planner.md
│   ├── plan-reviewer.md
│   └── context-loader.md
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
