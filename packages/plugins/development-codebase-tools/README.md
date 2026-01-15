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

| Skill                     | Description                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **code-analyzer**         | Multi-agent code explanation for architecture, patterns, security, and performance |
| **code-refactorer**       | Comprehensive refactoring with safety checks and pattern application               |
| **codebase-explorer**     | Deep codebase exploration and understanding                                        |
| **excalidraw-diagrammer** | Generate Excalidraw architecture diagrams from codebase analysis                   |
| **tech-debt-analyzer**    | Identify and prioritize technical debt with remediation plans                      |

## Agents

| Agent                    | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| **code-explainer**       | Explains code architecture, patterns, and dependencies               |
| **code-generator**       | Generates production-ready code (delegates to test-writer for tests) |
| **debug-assistant**      | Advanced debugging with root cause analysis                          |
| **pattern-learner**      | Learns and applies codebase patterns                                 |
| **performance-analyzer** | Analyzes performance bottlenecks and optimization opportunities      |
| **refactorer**           | Performs safe, incremental refactoring operations                    |
| **security-analyzer**    | Identifies security vulnerabilities and recommends fixes             |
| **style-enforcer**       | Enforces code style and conventions                                  |

## Hooks

| Hook                  | Description                            |
| --------------------- | -------------------------------------- |
| **post-edit-lint.sh** | Automatically lint files after editing |

## Usage Examples

```bash
# Use skills contextually
"Explain this file to me"                        # triggers code-analyzer
"Refactor this code to use the strategy pattern" # triggers code-refactorer
"How does the authentication system work?"       # triggers codebase-explorer
"Create an architecture diagram of this system"  # triggers excalidraw-diagrammer
"What technical debt exists in this module?"     # triggers tech-debt-analyzer
```

## License

MIT - Uniswap Labs
