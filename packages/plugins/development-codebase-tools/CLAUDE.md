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
│   ├── analyze-code/
│   ├── analyze-tech-debt/
│   ├── diagram-excalidraw/
│   ├── explore-codebase/
│   └── refactor-code/
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
