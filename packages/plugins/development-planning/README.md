# @uniswap/plugin-planning

Implementation planning and execution workflows for Claude Code with multi-agent collaboration.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install plugin-planning
```

## Skills

This plugin provides the following skills:

| Skill | Description |
| ----- | ----------- |
| **implementation-planner** | Create implementation plans for features and changes |
| **plan-executor** | Execute implementation plans step-by-step |
| **plan-reviewer** | Review plans for completeness and feasibility |
| **plan-swarm** | Refine plans through multi-agent expert discussion |

## Commands

| Command | Description |
| ------- | ----------- |
| `/plan` | Create clear, actionable implementation plans |
| `/execute-plan` | Execute a plan file step-by-step |
| `/review-plan` | Review an implementation plan for quality |

## Agents

| Agent | Description |
| ----- | ----------- |
| **planner** | Creates clear, actionable implementation plans |

## Usage Examples

```bash
# Create an implementation plan
/plan add user authentication with OAuth2

# Review a plan before execution
/review-plan auth-plan.md

# Execute a plan
/execute-plan auth-plan.md
```

## Workflow

The recommended workflow is:

1. **Plan**: Use `/plan` to create a clear implementation plan
2. **Review**: Use `/review-plan` to validate the plan
3. **Execute**: Use `/execute-plan` to implement the plan

For complex features, use the `plan-swarm` skill to get multi-agent perspectives on your approach.

## License

MIT - Uniswap Labs
