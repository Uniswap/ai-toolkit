# CLAUDE.md - development-planning

## Overview

This plugin provides the complete implementation lifecycle for Claude Code: planning, execution, and PR creation. It handles steps 1-5 of the canonical development workflow.

## Plugin Components

### Skills (./skills/)

- **implementation-planner**: Creates comprehensive implementation plans with step-by-step breakdowns
- **plan-executor**: Executes plans step-by-step with progress tracking
- **plan-reviewer**: Reviews plans for completeness, feasibility, and alignment with codebase patterns
- **plan-swarm**: Multi-agent collaborative plan refinement through expert discussion
- **implement-spec**: Orchestrates the full spec-to-implementation workflow
- **pr-creator**: Creates Graphite PRs with auto-generated conventional commit messages
- **commit-message-generator**: Generates well-structured git commit messages

### Agents (./agents/)

- **planner**: Core planning agent that creates actionable implementation plans
- **plan-reviewer**: Validates plans for completeness and feasibility
- **context-loader**: Loads and understands codebase context for informed planning
- **pr-creator**: Creates well-formatted PRs with comprehensive descriptions
- **commit-message-generator**: Generates structured git commit messages

## Canonical Development Workflow

This plugin handles **steps 1-5** of the canonical development workflow:

1. **Explore** → 2. **Plan** → 3. **Review Plan** → 4. **Execute** → 5. **PR Creation** (this plugin)

After PR creation, use `development-pr-workflow` for: 6. **PR Review** → 7. **Merge**

### Recommended Workflow

1. **Explore** (optional): Use codebase-explorer skill to understand the area
2. **Plan**: Use implementation-planner skill to create a plan
3. **Review**: Use plan-reviewer skill to validate the plan
4. **Execute**: Use plan-executor skill to implement the plan
5. **Create PR**: plan-executor offers PR creation at completion, or use pr-creator skill directly

## Integration Notes

- Skills are the primary interface for all workflows (contextual + explicit invocation)
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- Context flows automatically between exploration and planning phases
- plan-executor can seamlessly invoke pr-creator after implementation completes

## File Structure

```text
development-planning/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── implementation-planner/
│   ├── plan-executor/
│   ├── plan-reviewer/
│   ├── plan-swarm/
│   ├── implement-spec/
│   ├── pr-creator/
│   └── commit-message-generator/
├── agents/
│   ├── planner.md
│   ├── plan-reviewer.md
│   ├── context-loader.md
│   ├── pr-creator.md
│   └── commit-message-generator.md
├── commands/
│   └── auto-spec.md
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
