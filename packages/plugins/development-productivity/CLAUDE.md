# CLAUDE.md - development-productivity

## Overview

This plugin provides documentation, research, test generation, document generation, and prompt optimization tools for Claude Code.

## Plugin Components

### Skills (./skills/)

- **generate-document**: Generate professional documents in multiple formats (PDF, DOCX, HTML, ODT, EPUB, RTF) using pandoc
- **generate-tests**: Generate comprehensive tests with advanced testing strategies
- **optimize-prompt**: Optimize AI prompts for better model performance
- **research-topic**: Research topics combining web search with codebase analysis
- **update-claude-docs**: Update CLAUDE.md documentation files after code changes

### Commands (./commands/)

- **claude-init-plus**: Initialize/update CLAUDE.md files at all core nodes in workspace
- **update-claude-md**: Fast CLAUDE.md sync based on staged git changes

### Agents (./agents/)

- **documentation-agent**: Comprehensive documentation agent (API docs, READMEs, architecture docs, CLAUDE.md management, quality verification)
- **claude-docs-initializer-agent**: Initializes CLAUDE.md files for new projects via deep repo analysis
- **researcher-agent**: Conducts thorough research on topics
- **prompt-engineer-agent**: Optimizes prompts for AI models
- **test-writer-agent**: Generates comprehensive tests with edge case identification
- **agent-tester-agent**: Validates agent behaviors and runs automated agent tests (tests agents, not code)

### Hooks (./hooks/)

- **claude-md-maintenance.sh**: Stop hook that reminds Claude to run `/update-claude-md` after significant structural changes. Opt-in via `.claude/development-productivity.local.md` with `enabled: true`.

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- generate-tests skill supports multiple frameworks (jest, vitest, pytest, cypress, playwright)
- The `documentation-agent` consolidates previous doc-writer, claude-docs-manager, and claude-docs-fact-checker agents

## File Structure

```text
development-productivity/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── generate-document/
│   ├── generate-tests/
│   ├── optimize-prompt/
│   ├── research-topic/
│   └── update-claude-docs/
├── commands/
│   ├── claude-init-plus.md
│   └── update-claude-md.md
├── agents/
│   ├── documentation.md
│   ├── claude-docs-initializer.md
│   ├── researcher.md
│   ├── prompt-engineer.md
│   ├── test-writer.md
│   └── agent-tester.md
├── hooks/
│   ├── hooks.json
│   └── claude-md-maintenance.sh
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```

## Hook Configuration (Opt-In)

The `claude-md-maintenance` hook is disabled by default. To enable it per project, create:

```markdown
## <!-- .claude/development-productivity.local.md -->

## enabled: true
```

Add `.claude/*.local.md` to your project's `.gitignore` to keep the setting local.
