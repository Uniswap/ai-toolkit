# CLAUDE.md - development-productivity

## Overview

This plugin provides documentation, research, test generation, document generation, and prompt
optimization tools for Claude Code.

## Plugin Components

### Skills (./skills/)

- **generate-document**: Generate professional documents in multiple formats (PDF, DOCX, HTML, ODT, EPUB, RTF) using pandoc
- **generate-tests**: Generate comprehensive tests with advanced testing strategies
- **optimize-prompt**: Optimize AI prompts for better model performance
- **research-topic**: Research topics combining web search with codebase analysis
- **update-claude-docs**: Update CLAUDE.md documentation files after code changes

### Commands (./commands/)

- **claude-init-plus**: Initialize CLAUDE.md files at all core nodes in a workspace (run once to bootstrap)
- **update-claude-md**: Sync CLAUDE.md files based on staged git changes (run after each significant commit)

### Agents (./agents/)

- **documentation-agent**: Comprehensive documentation agent (API docs, READMEs, architecture docs, CLAUDE.md management, quality verification)
- **claude-docs-initializer-agent**: Initializes CLAUDE.md files for new projects via deep repo analysis
- **researcher-agent**: Conducts thorough research on topics
- **prompt-engineer-agent**: Optimizes prompts for AI models
- **test-writer-agent**: Generates comprehensive tests with edge case identification
- **agent-tester-agent**: Validates agent behaviors and runs automated agent tests

## CLAUDE.md Content Model (v2.2.0)

As of v2.2.0, all commands, skills, and agents in this plugin follow Anthropic's progressive
disclosure best practices for CLAUDE.md content:

- **Target**: under 200 lines per CLAUDE.md (not 500 tokens/2000 characters)
- **Content**: conventions, gotchas, and team preferences — not structural inventory
- **Excluded**: file listings, dependency tables, `[TODO]` placeholders, standard idioms
- **Factoring**: topic-specific rules go in `.claude/rules/<topic>.md` with optional `paths`
  frontmatter; external docs are referenced via `@path` imports
- **Deduplication**: subdirectory CLAUDE.md files complement, not repeat, ancestor files

## Conventions

- Skills are the primary interface; agents are invoked via `Task(subagent_type:agent-name)`
- `claude-init-plus` runs once (bootstraps); `update-claude-md` runs on each significant change
- The `documentation-agent` consolidates doc-writer, claude-docs-manager, and fact-checker agents
- `generate-tests` supports: jest, vitest, pytest, cypress, playwright

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
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
