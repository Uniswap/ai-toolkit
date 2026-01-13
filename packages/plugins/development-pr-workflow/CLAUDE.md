# CLAUDE.md - development-pr-workflow

## Overview

This plugin provides pull request management workflows for Claude Code, including PR creation, review, issue resolution, and Graphite stack management.

## Plugin Components

### Skills (./skills/)

- **pr-reviewer**: Comprehensive PR review using multiple specialized agents
- **pr-creator**: Create Graphite PRs with auto-generated conventional commit messages
- **pr-issue-resolver**: Address PR review comments and fix CI failures
- **graphite-stack-updater**: Update Graphite PR stacks by resolving comments and syncing
- **commit-message-generator**: Generate well-structured git commit messages
- **git-worktree-orchestrator**: Create and manage git worktrees for parallel development
- **stack-splitter**: Split monolithic branches into logical PR stacks

### Commands (./commands/)

- **review-pr**: Comprehensive multi-agent PR review for architecture, security, performance
- **work-through-pr-comments**: Methodically work through PR comments in a conversational workflow
- **address-pr-issues**: Review and fix PR comments and CI failures to make PRs merge-ready
- **linear-task-and-pr-from-changes**: Take local changes, create a Linear task, create a branch (optionally in a worktree), commit, and publish a PR
- **start-linear-task**: Start working on a new Linear task by creating a worktree environment (for when you have no local changes yet)

### Shared (./shared/)

- **setup-worktree-core**: Reusable worktree setup logic used by multiple commands
- **linear-task-config**: Reusable Linear task configuration collection (team, project, priority, etc.)

### Agents (./agents/)

- **pr-creator**: Creates well-formatted PRs with comprehensive descriptions
- **pr-reviewer**: Reviews PRs for code quality, security, performance
- **stack-splitter**: Splits monolithic branches into logical PR stacks
- **commit-message-generator**: Generates structured git commit messages

### MCP Integration (./.mcp.json)

This plugin bundles the Graphite MCP server for:

- Stacked PR creation and management
- PR submission with `gt submit`
- Stack synchronization with `gt sync`

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
│   ├── pr-reviewer/
│   ├── pr-creator/
│   ├── pr-issue-resolver/
│   ├── graphite-stack-updater/
│   ├── commit-message-generator/
│   ├── git-worktree-orchestrator/
│   └── stack-splitter/
├── commands/
│   ├── review-pr.md
│   ├── work-through-pr-comments.md
│   ├── address-pr-issues.md
│   ├── linear-task-and-pr-from-changes.md
│   └── start-linear-task.md
├── shared/
│   ├── setup-worktree-core.md
│   └── linear-task-config.md
├── agents/
│   ├── pr-creator.md
│   ├── pr-reviewer.md
│   ├── stack-splitter.md
│   └── commit-message-generator.md
├── .mcp.json
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
