# CLAUDE.md - development-codebase-tools

## Overview

This plugin provides codebase exploration, refactoring, and quality analysis tools for Claude Code.

## Plugin Components

### Skills (./skills/)

- **analyze-code**: Multi-agent code explanation for architecture, patterns, security, and performance
- **analyze-tech-debt**: Identify and prioritize technical debt with remediation plans
- **diagram-excalidraw**: Generate Excalidraw architecture diagrams from codebase analysis
- **explore-codebase**: Deep codebase exploration with architectural understanding
- **refactor-code**: Comprehensive refactoring with safety checks and pattern application

### Agents (./agents/)

- **agent-orchestrator-agent**: Centralized agent orchestration and capability matching
- **code-explainer-agent**: Explains code architecture, patterns, and dependencies
- **code-generator-agent**: Generates production-ready code following patterns (delegates to test-writer-agent for tests)
- **context-loader-agent**: Advanced context management with summarization, checkpointing, and cross-agent sharing
- **debug-assistant-agent**: Advanced debugging with root cause analysis
- **pattern-learner-agent**: Learns and applies codebase patterns
- **performance-analyzer-agent**: Analyzes performance bottlenecks and optimization opportunities
- **refactorer-agent**: Performs safe, incremental refactoring operations
- **security-analyzer-agent**: Identifies security vulnerabilities and recommends fixes
- **style-enforcer-agent**: Enforces code style and conventions

### Hooks (./hooks/)

- **post-edit-lint.sh**: Runs Prettier, ESLint, and TypeScript typecheck after file edits (opt-in)

## Post-Edit Lint Hook

The `post-edit-lint.sh` hook provides automatic formatting and linting after Claude edits files. **This hook is opt-in** to avoid interfering with projects that use different formatters (e.g., Biome).

### Enabling the Hook

Set the environment variable in your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export CLAUDE_POST_EDIT_LINT=1
```

Then restart your terminal or run `source ~/.zshrc`.

### What It Does

When enabled, the hook runs after every `Write` or `Edit` tool use on TypeScript/JavaScript files:

1. **Prettier** - Only runs if a Prettier config is found (`.prettierrc`, `prettier.config.js`, etc.)
2. **ESLint** - Only runs if an ESLint config is found (`.eslintrc`, `eslint.config.js`, etc.)
3. **TypeScript Typecheck** - Only runs in Nx workspaces with a `typecheck` target

### Safety Features

- **Config detection**: Only runs tools if the project has them configured
- **Project isolation**: Detects configs by walking up from the edited file's directory
- **Logging**: All activity logged to `~/.claude/logs/post-edit-lint.log`

### Why Opt-In?

Projects using alternative formatters (Biome, dprint, etc.) would have their formatting overwritten by Prettier's defaults. The opt-in approach ensures users explicitly enable this behavior.

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name-agent)`
- The post-edit-lint hook requires `CLAUDE_POST_EDIT_LINT=1` to be enabled
- Cross-plugin delegation uses `Task(subagent_type:plugin-name:skill-name)`

## File Structure

```text
development-codebase-tools/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── analyze-code/
│   ├── analyze-tech-debt/
│   ├── diagram-excalidraw/
│   ├── explore-codebase/
│   └── refactor-code/
├── agents/
│   ├── agent-orchestrator.md
│   ├── code-explainer.md
│   ├── code-generator.md
│   ├── context-loader.md
│   ├── debug-assistant.md
│   ├── pattern-learner.md
│   ├── performance-analyzer.md
│   ├── refactorer.md
│   ├── security-analyzer.md
│   └── style-enforcer.md
├── hooks/
│   └── post-edit-lint.sh
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
