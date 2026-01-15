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

| Skill                       | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| **create-pr**               | Create Graphite PRs with conventional commits        |
| **execute-plan**            | Execute implementation plans step-by-step            |
| **generate-commit-message** | Generate well-structured git commit messages         |
| **plan-implementation**     | Create implementation plans for features and changes |
| **plan-swarm**              | Refine plans through multi-agent expert discussion   |
| **review-plan**             | Review plans for completeness and feasibility        |

## Agents

| Agent                        | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| **planner**                  | Creates clear, actionable implementation plans             |
| **plan-reviewer**            | Validates plans for completeness and feasibility           |
| **pr-creator**               | Creates well-formatted PRs with comprehensive descriptions |
| **commit-message-generator** | Generates structured git commit messages                   |

> **Note**: The `context-loader` agent has been moved to `development-codebase-tools` for centralized context management. Planning agents can still use it via `Task(subagent_type:context-loader)`.

## Usage Examples

```bash
# Use skills contextually for individual workflow steps
"Create a PR for my changes"                                    # triggers create-pr
"Generate a commit message for these changes"                   # triggers generate-commit-message
"Help me plan out the implementation for user authentication"   # triggers plan-implementation
"Execute the plan in auth-plan.md"                              # triggers execute-plan
"Review this plan for completeness"                             # triggers review-plan
```

## Canonical Development Workflow

This plugin handles **steps 1-5** of the canonical development workflow:

```text
1. Explore → 2. Plan → 3. Review Plan → 4. Execute → 5. PR Creation (this plugin)
                                                            ↓
6. PR Review → 7. Merge (use development-pr-workflow plugin)
```

### Recommended Workflow

1. **Explore** (optional): Use explore-codebase skill to understand the area
2. **Plan**: Use plan-implementation skill to create a plan
3. **Review**: Use review-plan skill to validate the plan
4. **Execute**: Use execute-plan skill to implement the plan
5. **Create PR**: execute-plan offers PR creation at completion, or use create-pr skill directly

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
