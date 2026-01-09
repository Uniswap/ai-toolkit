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

| Skill                   | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| **claude-docs-updater** | Update CLAUDE.md documentation files after code changes        |
| **topic-researcher**    | Research topics by combining web search with codebase analysis |
| **prompt-optimizer**    | Optimize AI prompts for better model performance               |
| **test-generator**      | Generate comprehensive tests with advanced testing strategies  |

## Commands

| Command             | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `/claude-init-plus` | Initialize or update CLAUDE.md files at all core nodes in workspace |
| `/update-claude-md` | Fast CLAUDE.md sync based on staged git changes                     |

## Agents

| Agent                        | Description                                                               |
| ---------------------------- | ------------------------------------------------------------------------- |
| **doc-writer**               | Writes comprehensive documentation (API docs, READMEs, architecture docs) |
| **researcher**               | Conducts thorough research on topics                                      |
| **prompt-engineer**          | Optimizes prompts for AI models                                           |
| **test-writer**              | Generates comprehensive tests with edge case identification               |
| **test-runner**              | Validates agent behaviors and runs automated tests                        |
| **claude-docs-manager**      | Manages CLAUDE.md documentation updates                                   |
| **claude-docs-initializer**  | Initializes CLAUDE.md files for new projects                              |
| **claude-docs-fact-checker** | Verifies CLAUDE.md accuracy against codebase                              |

## Usage Examples

```bash
# Initialize CLAUDE.md documentation
/claude-init-plus

# Quick update after changes
/update-claude-md

# Use skills contextually
"Update the documentation after my changes"     # triggers claude-docs-updater
"Research best practices for React hooks"       # triggers topic-researcher
"Improve this prompt for better results"        # triggers prompt-optimizer
"Generate tests for this module"                # triggers test-generator
```

## License

MIT - Uniswap Labs
