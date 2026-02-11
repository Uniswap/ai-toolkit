# Spec-Workflow Plugin

## Purpose

This plugin provides autonomous spec-driven development workflow with multi-agent collaboration, specification management, and task orchestration. It's designed for teams who follow structured, spec-driven development practices.

## File Structure

```text
spec-workflow/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── .mcp.json                 # MCP server configuration
├── skills/
│   ├── auto-spec/
│   │   ├── auto-spec.md     # Autonomous spec creation command
│   │   └── SKILL.md -> auto-spec.md
│   └── implement-spec/
│       ├── implement-spec.md # Spec task orchestration
│       └── SKILL.md -> implement-spec.md
├── package.json
├── project.json
├── CLAUDE.md
└── README.md
```

## Components

### Skills (2)

| Skill            | File                                      | Purpose                                      |
| ---------------- | ----------------------------------------- | -------------------------------------------- |
| `auto-spec`      | `skills/auto-spec/auto-spec.md`           | Fully autonomous spec-driven development     |
| `implement-spec` | `skills/implement-spec/implement-spec.md` | Orchestrate execution of spec-workflow tasks |

### Commands (2)

| Command           | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `/auto-spec`      | Start autonomous spec creation and implementation |
| `/implement-spec` | Execute existing spec-workflow tasks              |

### MCP Server (1)

| Server          | Package                      | Purpose                                    |
| --------------- | ---------------------------- | ------------------------------------------ |
| `spec-workflow` | `@uniswap/spec-workflow-mcp` | Dashboard, task management, spec documents |

## Key Concepts

### Spec-Workflow Directory Structure

The plugin expects/creates a `.spec-workflow/` directory:

```text
.spec-workflow/
├── specs/
│   └── <spec-name>/
│       ├── requirements.md   # Feature requirements
│       ├── design.md         # Architecture and design
│       └── tasks.md          # Implementation tasks
└── steering/
    ├── product.md            # Product context
    ├── tech.md               # Technical standards
    └── structure.md          # Codebase structure
```

### MCP Tools Used

The skills in this plugin primarily use these MCP tools:

- `mcp__spec-workflow__spec-workflow-guide` - Get workflow instructions
- `mcp__spec-workflow__create-spec-doc` - Create specification documents
- `mcp__spec-workflow__get-spec-context` - Load existing spec documents
- `mcp__spec-workflow__manage-tasks` - Task status management
- `mcp__spec-workflow__get-steering-context` - Load steering documents
- `mcp__spec-workflow__get-template-context` - Get document templates

## Development Guidelines

### Adding New Skills

1. Create a new directory under `skills/`
2. Add the skill markdown file
3. Create a symlink: `ln -s <skill>.md SKILL.md`
4. Update `plugin.json` skills and commands arrays

### Testing Changes

```bash
# Validate plugin structure
nx run spec-workflow:validate

# Lint markdown files
nx run spec-workflow:lint-markdown
```

## Dependencies

This plugin has no code dependencies - it's a pure markdown-based Claude Code plugin.

However, it requires the `@uniswap/spec-workflow-mcp` package to be running for full functionality. The MCP server is configured automatically via `.mcp.json`.

## Cross-Plugin Integration

The skills in this plugin can invoke agents from other plugins:

- `planner-agent` (from development-planning)
- `plan-reviewer-agent` (from development-planning)
- `refactorer-agent` (from development-codebase-tools)
- `code-explainer-agent` (from development-codebase-tools)
- `test-writer-agent` (from development-productivity)
- `documentation-agent` (from development-productivity)
- `security-analyzer-agent` (from development-codebase-tools)
- `performance-analyzer-agent` (from development-codebase-tools)

This is done via the `Task(subagent_type:*)` mechanism and doesn't require explicit dependencies.
