# CLAUDE.md - development-productivity

## Overview

This plugin provides documentation, research, test generation, and prompt optimization tools for Claude Code.

## Plugin Components

### Skills (./skills/)

- **generate-tests**: Generate comprehensive tests with advanced testing strategies
- **optimize-prompt**: Optimize AI prompts for better model performance
- **research-topic**: Research topics combining web search with codebase analysis
- **update-claude-docs**: Update CLAUDE.md documentation files after code changes

### Commands (./commands/)

- **claude-init-plus**: Initialize/update CLAUDE.md files at all core nodes in workspace
- **update-claude-md**: Fast CLAUDE.md sync based on staged git changes

### Agents (./agents/)

- **documentation**: Comprehensive documentation agent (API docs, READMEs, architecture docs, CLAUDE.md management, quality verification)
- **claude-docs-initializer**: Initializes CLAUDE.md files for new projects via deep repo analysis
- **researcher**: Conducts thorough research on topics
- **prompt-engineer**: Optimizes prompts for AI models
- **test-writer**: Generates comprehensive tests with edge case identification
- **agent-tester**: Validates agent behaviors and runs automated agent tests (tests agents, not code)

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- test-generator supports multiple frameworks (jest, vitest, pytest, cypress, playwright)
- The `documentation` agent consolidates previous doc-writer, claude-docs-manager, and claude-docs-fact-checker agents

## File Structure

```text
development-productivity/
├── .claude-plugin/
│   └── plugin.json
├── skills/
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
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
