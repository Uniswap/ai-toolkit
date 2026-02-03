# CLAUDE.md - development-planning

## Overview

This plugin provides the complete implementation lifecycle for Claude Code: planning, execution, and PR creation. It handles steps 1-5 of the canonical development workflow.

## Plugin Components

### Skills (./skills/)

- **create-pr**: Creates Graphite PRs with auto-generated conventional commit messages
- **execute-plan**: Executes plans step-by-step with progress tracking; supports **single PR mode** (default) and **Graphite stack mode** for creating one PR per logical chunk
- **generate-commit-message**: Generates well-structured git commit messages
- **plan-implementation**: Creates comprehensive implementation plans with step-by-step breakdowns
- **plan-swarm**: Multi-agent collaborative plan refinement through expert discussion
- **review-plan**: Reviews plans for completeness, feasibility, and alignment with codebase patterns

### Shared (./shared/)

- **graphite-stack-execution.md**: Comprehensive guide for creating Graphite PR stacks incrementally during plan execution

### Agents (./agents/)

- **planner**: Core planning agent that creates actionable implementation plans
- **plan-reviewer**: Validates plans for completeness and feasibility
- **pr-creator**: Creates well-formatted PRs with comprehensive descriptions
- **commit-message-generator**: Generates structured git commit messages

> **Note**: The `context-loader` agent has been moved to `development-codebase-tools` for centralized context management. Planning agents can still delegate to it via `Task(subagent_type:context-loader)`.

## Canonical Development Workflow

This plugin handles **steps 1-5** of the canonical development workflow:

1. **Explore** → 2. **Plan** → 3. **Review Plan** → 4. **Execute** → 5. **PR Creation** (this plugin)

After PR creation, use `development-pr-workflow` for: 6. **PR Review** → 7. **Merge**

### Recommended Workflow

1. **Explore** (optional): Use explore-codebase skill to understand the area
2. **Plan**: Use plan-implementation skill to create a plan
3. **Review**: Use review-plan skill to validate the plan
4. **Execute**: Use execute-plan skill to implement the plan
5. **Create PR**: execute-plan offers PR creation at completion, or use create-pr skill directly

## Integration Notes

- Skills are the primary interface for all workflows (contextual + explicit invocation)
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- Context flows automatically between exploration and planning phases
- execute-plan can seamlessly invoke pr-creator after implementation completes

## Related Plugins

For spec-driven development workflows (requirements, design, and tasks documents), see the **spec-workflow** plugin which provides:

- `/auto-spec` - Autonomous spec creation and implementation
- `/implement-spec` - Execute spec-workflow tasks

## File Structure

```text
development-planning/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── create-pr/
│   ├── execute-plan/
│   │   ├── execute-plan.md
│   │   └── execution-guide.md
│   ├── generate-commit-message/
│   ├── plan-implementation/
│   ├── plan-swarm/
│   └── review-plan/
├── shared/
│   └── graphite-stack-execution.md
├── agents/
│   ├── commit-message-generator.md
│   ├── plan-reviewer.md
│   ├── planner.md
│   └── pr-creator.md
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
