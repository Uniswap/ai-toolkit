# @uniswap/development-productivity

Documentation, research, test generation, and prompt optimization tools for Claude Code.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install development-productivity
```

## Skills

| Skill                  | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| **generate-tests**     | Generate comprehensive tests with advanced testing strategies  |
| **optimize-prompt**    | Optimize AI prompts for better model performance               |
| **research-topic**     | Research topics by combining web search with codebase analysis |
| **update-claude-docs** | Update CLAUDE.md documentation files after code changes        |

## Commands

| Command             | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `/claude-init-plus` | Initialize or update CLAUDE.md files at all core nodes in workspace |
| `/update-claude-md` | Fast CLAUDE.md sync based on staged git changes                     |

## Agents

| Agent                             | Description                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **documentation-agent**           | Comprehensive documentation agent (API docs, READMEs, architecture docs, CLAUDE.md management, quality verification)              |
| **claude-docs-initializer-agent** | Discovers repository structure and creates initial CLAUDE.md documentation at all appropriate levels                              |
| **researcher-agent**              | Conducts comprehensive research including architectural patterns, technology comparison, security analysis, and codebase patterns |
| **prompt-engineer-agent**         | Expert in analyzing, optimizing, and testing prompts for AI agents and LLMs                                                       |
| **test-writer-agent**             | Generates comprehensive, deterministic tests with advanced testing strategies and edge case identification                        |
| **agent-tester-agent**            | Automated agent testing specialist that validates agent behaviors, tests prompt variations, and detects regressions               |

## Usage Examples

```bash
# Initialize CLAUDE.md documentation
/claude-init-plus

# Quick update after changes
/update-claude-md

# Use skills contextually
"Update the documentation after my changes"     # triggers update-claude-docs
"Research best practices for React hooks"       # triggers research-topic
"Improve this prompt for better results"        # triggers optimize-prompt
"Generate tests for this module"                # triggers generate-tests
```

## License

MIT - Uniswap Labs
