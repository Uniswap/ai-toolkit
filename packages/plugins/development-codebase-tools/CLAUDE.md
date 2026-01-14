# CLAUDE.md - development-codebase-tools

## Overview

This plugin provides codebase exploration, refactoring, and quality analysis tools for Claude Code.

## Plugin Components

### Skills (./skills/)

- **codebase-explorer**: Deep codebase exploration with architectural understanding
- **code-refactorer**: Comprehensive refactoring with safety checks and pattern application
- **tech-debt-analyzer**: Identify and prioritize technical debt with remediation plans
- **code-analyzer**: Multi-agent code explanation for architecture, patterns, security, and performance
- **excalidraw-diagrammer**: Generate Excalidraw architecture diagrams from codebase analysis

### Agents (./agents/)

- **code-explainer**: Explains code architecture, patterns, and dependencies
- **refactorer**: Performs safe, incremental refactoring operations
- **security-analyzer**: Identifies security vulnerabilities and recommends fixes
- **performance-analyzer**: Analyzes performance bottlenecks and optimization opportunities
- **debug-assistant**: Advanced debugging with root cause analysis
- **style-enforcer**: Enforces code style and conventions
- **deduplicator**: Identifies and eliminates code duplication
- **code-generator**: Generates production-ready code following patterns
- **pattern-learner**: Learns and applies codebase patterns

### Hooks (./hooks/)

- **post-edit-lint.sh**: Automatically runs linting after file edits

## Integration Notes

- Skills are the primary interface for all workflows
- Agents are auto-discovered from the `agents/` directory
- Skills invoke agents via `Task(subagent_type:agent-name)`
- The post-edit-lint hook runs automatically after file modifications

## File Structure

```text
development-codebase-tools/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── codebase-explorer/
│   ├── code-refactorer/
│   ├── tech-debt-analyzer/
│   ├── code-analyzer/
│   └── excalidraw-diagrammer/
├── agents/
│   ├── code-explainer.md
│   ├── refactorer.md
│   ├── security-analyzer.md
│   ├── performance-analyzer.md
│   ├── debug-assistant.md
│   ├── style-enforcer.md
│   ├── deduplicator.md
│   ├── code-generator.md
│   └── pattern-learner.md
├── hooks/
│   └── post-edit-lint.sh
├── project.json
├── package.json
├── CLAUDE.md
└── README.md
```
