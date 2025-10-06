# AI Toolkit Commands

User-facing commands for Claude Code that parse natural language and orchestrate specialized agents.

## Overview

This package contains 19 commands that provide natural language interfaces for complex software development tasks. Commands parse user input and delegate work to specialized agents.

## Key Commands

### Documentation Management
- **claude-docs**: Initialize or update CLAUDE.md documentation files
  - Auto-detects initialization vs update mode
  - Supports session, git, or path-based scope
  - Leverages specialized documentation agents

### Planning & Implementation
- **plan**: Create comprehensive implementation plans with task decomposition
- **execute-plan**: Execute plans with intelligent agent orchestration
- **auto-spec**: Fully autonomous spec-driven development
- **implement-spec**: Orchestrate spec-workflow task implementation

### Development & Quality
- **fix-bug**: Debug with root cause analysis and prevention
- **refactor**: Comprehensive refactoring with architectural analysis
- **gen-tests**: Generate tests with edge cases and scenarios
- **review-code**: Multi-agent code review for quality analysis

### Analysis & Research
- **explore**: Deep dive into codebase areas
- **explain-file**: Multi-agent code explanation
- **research**: Combine web search with codebase analysis

### Operations & Infrastructure
- **deploy**: Orchestrate deployments with CI/CD setup
- **monitor**: Set up comprehensive application monitoring

## Recommended Workflow

Follow the 1-2-3-4 workflow for optimal results:

1. **Explore**: `/explore <area>` - Build understanding
2. **Plan**: `/plan <task>` - Create implementation plan
3. **Review**: `/review-plan <file>` - Validate plan
4. **Execute**: `/execute-plan <file>` - Implement with agents

## Design Principles

- **Commands Don't Execute**: Parse input and delegate to agents
- **Natural Language First**: Accept flexible user input
- **Tool Permissions Cascade**: Define allowed-tools for agents
- **Structured Output**: Return predictable, formatted results

## Development

To add a new command:
1. Create a markdown file in `src/` following the command template
2. Define `description`, `argument-hint`, and `allowed-tools`
3. Run `bunx nx run @ai-toolkit/commands-agnostic:generate-index`

## License

Part of the AI Toolkit monorepo.