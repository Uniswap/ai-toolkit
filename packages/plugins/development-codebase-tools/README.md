# @uniswap/development-codebase-tools

Codebase exploration, refactoring, and quality analysis tools for Claude Code.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install development-codebase-tools
```

## Skills

| Skill                  | Description                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **codebase-explorer**  | Deep codebase exploration and understanding                                        |
| **code-analyzer**      | Multi-agent code explanation for architecture, patterns, security, and performance |
| **code-refactorer**    | Comprehensive refactoring with safety checks and pattern application               |
| **code-reviewer**      | Code review for bugs, logic errors, security, and quality issues                   |
| **tech-debt-analyzer** | Identify and prioritize technical debt with remediation plans                      |

## Agents

| Agent                    | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| **code-explainer**       | Explains code architecture, patterns, and dependencies          |
| **code-generator**       | Generates production-ready code following patterns              |
| **debug-assistant**      | Advanced debugging with root cause analysis                     |
| **deduplicator**         | Identifies and eliminates code duplication                      |
| **pattern-learner**      | Learns and applies codebase patterns                            |
| **performance-analyzer** | Analyzes performance bottlenecks and optimization opportunities |
| **refactorer**           | Performs safe, incremental refactoring operations               |
| **security-analyzer**    | Identifies security vulnerabilities and recommends fixes        |
| **style-enforcer**       | Enforces code style and conventions                             |

## Hooks

| Hook                  | Description                            |
| --------------------- | -------------------------------------- |
| **post-edit-lint.sh** | Automatically lint files after editing |

## Usage Examples

```bash
# Use skills contextually
"How does the authentication system work?"     # triggers codebase-explorer
"Explain this file to me"                      # triggers code-analyzer
"Refactor this code to use the strategy pattern" # triggers code-refactorer
"Review this code for any issues"              # triggers code-reviewer
"What technical debt exists in this module?"   # triggers tech-debt-analyzer
```

## License

MIT - Uniswap Labs
