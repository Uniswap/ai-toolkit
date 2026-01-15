# CLAUDE.md - development-pr-workflow

## Overview

This plugin provides pull request review and management workflows for Claude Code, including PR review, issue resolution, and Graphite stack management. It supports both **standard Git + GitHub CLI** (default) and **Graphite** workflows.

> **Note**: PR creation and commit message generation have been moved to the `development-planning` plugin to enable a seamless workflow: plan → execute → create PR.

## Git Workflow Support

This plugin supports two PR creation workflows:

### Standard Git + GitHub CLI (Default)

- Uses `git push` and `gh pr create`
- Works with any Git repository
- No additional tooling required beyond standard Git and GitHub CLI
- Enabled by default in all commands

### Graphite (Opt-in)

- Uses `gt submit` for branch tracking and PR creation
- Supports PR stacking and stack management
- Requires Graphite CLI to be installed
- Enable with `--use-graphite` flag

**Graphite-only features:**

- `stack-splitter` - Requires Graphite for PR stacking
- `graphite-stack-updater` - Requires Graphite for stack management

## Plugin Components

### Skills (./skills/)

- **code-reviewer**: Comprehensive code review for architecture, security, performance, and style
- **graphite-stack-updater**: Update Graphite PR stacks by resolving comments and syncing
- **pr-issue-resolver**: Address PR review comments and fix CI failures
- **split-stack**: Split monolithic branches into logical PR stacks

### Commands (./commands/)

- **review-pr**: Comprehensive multi-agent PR review for architecture, security, performance
- **work-through-pr-comments**: Methodically work through PR comments in a conversational workflow
- **address-pr-issues**: Review and fix PR comments and CI failures to make PRs merge-ready
- **linear-task-and-pr-from-changes**: Take local changes, create a Linear task, create a branch (optionally in a worktree), commit, and publish a PR
- **start-linear-task**: Start working on a new Linear task by creating a worktree environment with optional autonomous task completion

### Shared (./shared/)

- **setup-worktree-core**: Reusable worktree setup logic used by multiple commands
- **linear-task-config**: Reusable Linear task configuration collection (team, project, priority, etc.)

### Agents (./agents/)

- **review-executor**: Executes code review tasks and implements feedback
- **stack-splitter**: Splits monolithic branches into logical PR stacks

### MCP Integration (./.mcp.json)

This plugin bundles the Graphite MCP server for optional Graphite workflows:

- Stacked PR creation and management (when `--use-graphite` is set)
- PR submission with `gt submit`
- Stack synchronization with `gt sync`

The GitHub MCP is also used for standard Git workflows with `gh pr create`.

## Canonical Workflow

This plugin handles **steps 6-7** of the canonical development workflow:

1. **Explore** → 2. **Plan** → 3. **Review Plan** → 4. **Execute** → 5. **PR Creation** → 6. **PR Review** (this plugin) → 7. **Merge** (this plugin)

For steps 1-5, use the `development-planning` plugin.

## Architecture Notes

### Code Review Engine

The `code-reviewer` skill provides comprehensive code review capabilities:

- Multi-agent coordination (architecture, security, performance, style)
- Standard and comprehensive review depths
- Focused review modes (architecture, security, performance)
- Structured output with prioritized findings and patches

## Development Guidelines

### Git Worktree Tooling

**IMPORTANT**: When creating or updating any Claude Code tooling (agents, skills, commands) that involves git worktrees, ALWAYS:

1. **Use** the shared `./shared/setup-worktree-core.md` file for worktree setup logic
2. **Reference** it from your skill/command rather than duplicating the workflow
3. **Update** `setup-worktree-core.md` if you need new worktree functionality that could benefit other tools

This ensures consistent worktree behavior across all tooling and avoids duplication.

## Integration Notes

- Skills are the primary interface for all workflows (all have `user-invocable: true`)
- Skills can be invoked via `/skill-name` or auto-discovered based on context
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- Graphite MCP enables stacked PR workflows

## File Structure

```text
development-pr-workflow/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── code-reviewer/
│   ├── graphite-stack-updater/
│   ├── pr-issue-resolver/
│   └── split-stack/
├── commands/
│   ├── address-pr-issues.md
│   ├── linear-task-and-pr-from-changes.md
│   ├── review-pr.md
│   ├── start-linear-task.md
│   └── work-through-pr-comments.md
├── shared/
│   ├── linear-task-config.md
│   └── setup-worktree-core.md
├── agents/
│   ├── review-executor.md
│   └── stack-splitter.md
├── .mcp.json
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
