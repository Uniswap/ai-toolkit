# CLAUDE.md - development-productivity

## Overview

This plugin provides documentation, research, test generation, and prompt optimization tools for Claude Code.

## Plugin Components

### Skills (./skills/)

- **claude-docs-updater**: Update CLAUDE.md documentation files after code changes
- **topic-researcher**: Research topics combining web search with codebase analysis
- **prompt-optimizer**: Optimize AI prompts for better model performance
- **test-generator**: Generate comprehensive tests with advanced testing strategies

### Commands (./commands/)

- **claude-init-plus**: Initialize/update CLAUDE.md files at all core nodes in workspace
- **update-claude-md**: Fast CLAUDE.md sync based on staged git changes

### Agents (./agents/)

- **doc-writer**: Writes comprehensive documentation (API docs, READMEs, architecture docs)
- **researcher**: Conducts thorough research on topics
- **prompt-engineer**: Optimizes prompts for AI models
- **test-writer**: Generates comprehensive tests with edge case identification
- **test-runner**: Validates agent behaviors and runs automated tests
- **claude-docs-manager**: Manages CLAUDE.md documentation updates
- **claude-docs-initializer**: Initializes CLAUDE.md files for new projects
- **claude-docs-fact-checker**: Verifies CLAUDE.md accuracy against codebase

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- test-generator supports multiple frameworks (jest, vitest, pytest, cypress, playwright)

## File Structure

```text
development-productivity/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── claude-docs-updater/
│   ├── topic-researcher/
│   ├── prompt-optimizer/
│   └── test-generator/
├── commands/
│   ├── claude-init-plus.md
│   └── update-claude-md.md
├── agents/
│   ├── doc-writer.md
│   ├── researcher.md
│   ├── prompt-engineer.md
│   ├── test-writer.md
│   ├── test-runner.md
│   ├── claude-docs-manager.md
│   ├── claude-docs-initializer.md
│   └── claude-docs-fact-checker.md
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
