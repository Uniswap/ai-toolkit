# AI Toolkit Agents

Specialized AI agents for Claude Code that perform specific analysis and implementation tasks.

## Overview

This package contains 30+ specialized agents that work together to handle complex software development tasks. Each agent excels at a specific domain, from code generation to security analysis to documentation management.

## Key Agents

### Documentation & Context Management
- **claude-docs-initializer**: Initialize comprehensive CLAUDE.md documentation across repositories
- **claude-docs-manager**: Update CLAUDE.md files based on code changes
- **context-loader**: Advanced context management and cross-agent sharing
- **doc-writer**: Generate API docs, READMEs, and architecture documentation

### Development & Quality
- **code-generator**: Create production-ready code with tests
- **debug-assistant**: Root cause analysis and fix validation
- **refactorer**: Architectural refactoring with safe strategies
- **test-writer**: Comprehensive test generation with edge cases

### Analysis & Review
- **code-explainer**: Deep code analysis and pattern recognition
- **security-analyzer**: Vulnerability assessment and threat modeling
- **performance-analyzer**: Bottleneck identification and optimization
- **style-enforcer**: Multi-language style enforcement

### Orchestration & Meta-Learning
- **agent-orchestrator**: Coordinate multiple agents for complex tasks
- **agent-optimizer**: Continuously improve agent performance
- **pattern-learner**: Extract and apply reusable patterns
- **feedback-collector**: Transform feedback into improvements

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for comprehensive architectural documentation.

## Usage

Agents are invoked by commands, not directly by users. They inherit tool permissions from the invoking command and return structured data.

## Development

To add a new agent:
1. Create a markdown file in `src/` following the agent template
2. Run `bunx nx run @ai-toolkit/agents-agnostic:generate-index` to update the index

## License

Part of the AI Toolkit monorepo.