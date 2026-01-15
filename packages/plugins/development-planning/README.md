# @uniswap/development-planning

Implementation planning, execution, and PR creation workflows for Claude Code with multi-agent collaboration.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install development-planning
```

## Skills

This plugin provides the following skills:

| Skill                        | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| **implementation-planner**   | Create implementation plans for features and changes |
| **plan-executor**            | Execute implementation plans step-by-step            |
| **plan-reviewer**            | Review plans for completeness and feasibility        |
| **plan-swarm**               | Refine plans through multi-agent expert discussion   |
| **pr-creator**               | Create Graphite PRs with conventional commits        |
| **commit-message-generator** | Generate well-structured git commit messages         |

## Agents

| Agent                        | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| **planner**                  | Creates clear, actionable implementation plans             |
| **plan-reviewer**            | Validates plans for completeness and feasibility           |
| **context-loader**           | Loads and understands codebase context for planning        |
| **pr-creator**               | Creates well-formatted PRs with comprehensive descriptions |
| **commit-message-generator** | Generates structured git commit messages                   |

## Usage Examples

```bash
# Use skills contextually for individual workflow steps
"Help me plan out the implementation for user authentication"  # triggers implementation-planner
"Review this plan for completeness"                             # triggers plan-reviewer
"Execute the plan in auth-plan.md"                              # triggers plan-executor
"Create a PR for my changes"                                    # triggers pr-creator
"Generate a commit message for these changes"                   # triggers commit-message-generator
```

## Canonical Development Workflow

This plugin handles **steps 1-5** of the canonical development workflow:

```text
1. Explore → 2. Plan → 3. Review Plan → 4. Execute → 5. PR Creation (this plugin)
                                                            ↓
6. PR Review → 7. Merge (use development-pr-workflow plugin)
```

### Recommended Workflow

1. **Explore** (optional): Use codebase-explorer skill to understand the area
2. **Plan**: Use implementation-planner skill to create a plan
3. **Review**: Use plan-reviewer skill to validate the plan
4. **Execute**: Use plan-executor skill to implement the plan
5. **Create PR**: plan-executor offers PR creation at completion, or use pr-creator skill directly

For complex features, use the `plan-swarm` skill to get multi-agent perspectives on your approach.

## Spec-Driven Development

For structured spec-driven development with requirements, design, and tasks documents, see the **spec-workflow** plugin:

```bash
claude /plugin install spec-workflow
```

The spec-workflow plugin provides:

- `/auto-spec` - Autonomous spec creation and implementation
- `/implement-spec` - Execute spec-workflow tasks

## License

MIT - Uniswap Labs
