# CLAUDE.md - development-pr-workflow

## Overview

This plugin provides pull request management workflows for Claude Code, including PR creation, review, issue resolution, and Graphite stack management.

## Plugin Components

### Skills (./skills/)

- **pr-reviewer**: Comprehensive PR review using multiple specialized agents
- **pr-creator**: Create Graphite PRs with auto-generated conventional commit messages
- **pr-issue-resolver**: Address PR review comments and fix CI failures
- **graphite-stack-updater**: Update Graphite PR stacks by resolving comments and syncing

### Commands (./commands/)

- **review-pr**: Comprehensive multi-agent PR review for architecture, security, performance
- **work-through-pr-comments**: Methodically work through PR comments in a conversational workflow
- **address-pr-issues**: Review and fix PR comments and CI failures to make PRs merge-ready

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

## Integration Notes

- Skills are the primary interface for all workflows
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
│   └── graphite-stack-updater/
├── commands/
│   ├── review-pr.md
│   ├── work-through-pr-comments.md
│   └── address-pr-issues.md
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
