# CLAUDE.md - development-codebase-tools

## Overview

This plugin provides codebase exploration, refactoring, and quality analysis tools for Claude Code.

## Plugin Components

### Skills (./skills/)

- **codebase-explorer**: Deep codebase exploration with architectural understanding
- **code-refactorer**: Comprehensive refactoring with safety checks and pattern application
- **code-analyzer**: Multi-agent code explanation for architecture, patterns, security, and performance
- **excalidraw-diagrammer**: Generate Excalidraw architecture diagrams from codebase analysis
- **tech-debt-analyzer**: Identify and prioritize technical debt with remediation plans

### Agents (./agents/)

- **code-explainer**: Explains code architecture, patterns, and dependencies
- **code-generator**: Generates production-ready code following patterns (delegates to test-writer for tests)
- **debug-assistant**: Advanced debugging with root cause analysis
- **pattern-learner**: Learns and applies codebase patterns
- **performance-analyzer**: Analyzes performance bottlenecks and optimization opportunities
- **refactorer**: Performs safe, incremental refactoring operations
- **security-analyzer**: Identifies security vulnerabilities and recommends fixes
- **style-enforcer**: Enforces code style and conventions

### Hooks (./hooks/)

- **post-edit-lint.sh**: Automatically runs linting after file edits

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- The post-edit-lint hook runs automatically after file modifications
- Cross-plugin delegation uses `Task(subagent_type:plugin-name:skill-name)`

## File Structure

```text
development-codebase-tools/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── codebase-explorer/
│   ├── code-refactorer/
│   ├── code-analyzer/
│   ├── excalidraw-diagrammer/
│   └── tech-debt-analyzer/
├── agents/
│   ├── code-explainer.md
│   ├── code-generator.md
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
