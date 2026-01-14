# @uniswap/development-pr-workflow

Pull request review and management workflows for Claude Code with Graphite integration.

> **Note**: PR creation and commit message generation have moved to the `development-planning` plugin to enable a seamless workflow: plan → execute → create PR.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install development-pr-workflow
```

## Skills

| Skill                      | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| **code-reviewer**          | Comprehensive code review using specialized agents          |
| **pr-issue-resolver**      | Address PR review comments and fix CI failures              |
| **graphite-stack-updater** | Update Graphite PR stacks by resolving comments and syncing |
| **stack-splitter**         | Split monolithic branches into logical PR stacks            |

## Commands

| Command                            | Description                                  |
| ---------------------------------- | -------------------------------------------- |
| `/review-pr`                       | Review a pull request comprehensively        |
| `/work-through-pr-comments`        | Methodically address PR comments             |
| `/address-pr-issues`               | Review and fix PR comments and CI failures   |
| `/start-linear-task`               | Start working on a Linear task in a worktree |
| `/linear-task-and-pr-from-changes` | Create Linear task and PR from local changes |

## Agents

| Agent               | Description                                        |
| ------------------- | -------------------------------------------------- |
| **review-executor** | Executes code review tasks and implements feedback |
| **stack-splitter**  | Splits monolithic branches into logical PR stacks  |

## MCP Integration

This plugin includes the Graphite MCP server for seamless PR stack management:

- Create stacked PRs with `gt create`
- Submit stacks with `gt submit`
- Sync and rebase with `gt sync`

## Canonical Development Workflow

This plugin handles **steps 6-7** of the canonical development workflow:

```text
1. Explore → 2. Plan → 3. Review Plan → 4. Execute → 5. PR Creation (use development-planning)
                                                            ↓
                              6. PR Review → 7. Merge (this plugin)
```

## Usage Examples

```bash
# Review an open PR
/review-pr 123

# Work through review comments
/work-through-pr-comments

# Address PR issues and CI failures
/address-pr-issues

# Start working on a Linear task
/start-linear-task DEV-123

# Use skills contextually
"Review my PR for any issues"                       # triggers code-reviewer skill
"Help me split this large branch into smaller PRs"  # triggers stack-splitter skill
```

## License

MIT - Uniswap Labs
