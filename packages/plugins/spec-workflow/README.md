# Spec-Workflow Plugin

Autonomous spec-driven development workflow with multi-agent collaboration, specification management, and task orchestration for Claude Code.

## Overview

This plugin provides a structured approach to implementing features through specification documents. It's designed for teams who prefer spec-driven development where requirements, design, and tasks are documented before implementation begins.

**Note**: This plugin is optional and should only be installed if your team uses spec-driven development workflows. It requires the `@uniswap/spec-workflow-mcp` server for full functionality.

## Prerequisites

- Claude Code CLI
- The spec-workflow MCP server (`@uniswap/spec-workflow-mcp`) will be automatically configured when this plugin is installed

## Installation

```bash
claude /plugin install spec-workflow
```

## Components

### Skills

| Skill            | Description                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| `auto-spec`      | Fully autonomous spec creation and implementation with multi-agent collaboration |
| `implement-spec` | Orchestrate implementation of existing spec-workflow tasks                       |

### Commands

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `/auto-spec`      | Start autonomous spec-driven development |
| `/implement-spec` | Execute existing spec-workflow tasks     |

### MCP Server

| Server          | Description                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `spec-workflow` | Provides dashboard, task management, and spec document handling via `@uniswap/spec-workflow-mcp` |

## Usage

### Autonomous Spec Creation

Use `/auto-spec` when you want Claude to:

1. Generate requirements document from your feature description
2. Create design document with architectural decisions
3. Break down implementation into granular tasks
4. Implement all tasks with quality validation
5. Return a comprehensive summary

```bash
/auto-spec add user authentication with OAuth2 and JWT tokens
/auto-spec implement event-driven order processing system
```

### Implementing Existing Specs

Use `/implement-spec` when you have existing spec documents in `.spec-workflow/specs/`:

```bash
/implement-spec user-authentication
/implement-spec payment-integration --parallel
```

## Directory Structure

When using spec-workflow, your project will have:

```
.spec-workflow/
├── specs/
│   └── <spec-name>/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
└── steering/
    ├── product.md
    ├── tech.md
    └── structure.md
```

## When to Use This Plugin

Use this plugin if:

- Your team follows spec-driven development practices
- You want structured documentation for features before implementation
- You need multi-agent collaboration for complex features
- You prefer autonomous implementation with quality gates

**Don't use this plugin if:**

- You prefer ad-hoc development without formal specifications
- Your features are simple enough to implement directly
- You don't need the overhead of spec document management

## Related Plugins

- `development-planning` - General implementation planning (non-spec-driven)
- `development-pr-workflow` - PR management after implementation
- `development-codebase-tools` - Code analysis and exploration

## License

MIT
