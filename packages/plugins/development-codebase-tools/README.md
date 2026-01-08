# @uniswap/plugin-codebase-tools

Codebase exploration, refactoring, and quality analysis tools for Claude Code.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install plugin-codebase-tools
```

## Skills

| Skill | Description |
| ----- | ----------- |
| **codebase-explorer** | Deep codebase exploration and understanding |
| **code-refactorer** | Comprehensive refactoring with safety checks |
| **tech-debt-analyzer** | Identify and prioritize technical debt |

## Commands

| Command | Description |
| ------- | ----------- |
| `/explore` | Deep dive into a codebase area |
| `/refactor` | Refactor code with safety checks |
| `/explain-file` | Explain code structure and purpose |

## Agents

| Agent | Description |
| ----- | ----------- |
| **code-explainer** | Explains code architecture and patterns |
| **refactorer** | Performs safe, incremental refactoring |
| **security-analyzer** | Identifies security vulnerabilities |

## Hooks

| Hook | Description |
| ---- | ----------- |
| **post-edit-lint.sh** | Automatically lint files after editing |

## Usage Examples

```bash
# Explore the authentication system
/explore authentication and user sessions

# Refactor a module
/refactor src/utils/helpers.ts --strategy=safe

# Explain a complex file
/explain-file src/core/engine.ts
```

## License

MIT - Uniswap Labs
