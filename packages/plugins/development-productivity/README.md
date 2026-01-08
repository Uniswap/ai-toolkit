# @uniswap/plugin-productivity

Documentation, research, and prompt optimization tools for Claude Code.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install plugin-productivity
```

## Skills

| Skill | Description |
| ----- | ----------- |
| **claude-docs-updater** | Update CLAUDE.md documentation files after code changes |
| **topic-researcher** | Research topics by combining web search with codebase analysis |
| **prompt-optimizer** | Optimize AI prompts for better model performance |

## Commands

| Command | Description |
| ------- | ----------- |
| `/claude-docs` | Initialize or update CLAUDE.md documentation |
| `/research` | Research a topic with web and codebase analysis |
| `/gen-tests` | Generate comprehensive test suites |

## Agents

| Agent | Description |
| ----- | ----------- |
| **doc-writer** | Writes comprehensive documentation |
| **researcher** | Conducts thorough research on topics |
| **prompt-engineer** | Optimizes prompts for AI models |

## Usage Examples

```bash
# Update documentation after changes
/claude-docs

# Research a topic
/research best practices for React state management

# Generate tests for a module
/gen-tests src/utils/validation.ts
```

## License

MIT - Uniswap Labs
