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

| Skill                   | Description                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **analyze-bundle**      | Analyze web application bundle size — heaviest modules, tree-shaking gaps, duplicate packages, code-splitting opportunities |
| **analyze-code**        | Multi-agent code explanation for architecture, patterns, security, and performance                                          |
| **analyze-dead-code**   | Find unused exports, unreachable modules, and dead files with confidence-ranked removal guidance                            |
| **analyze-migrations**  | Static safety analysis of database migration files (locks, data loss, rollback gaps)                                        |
| **analyze-tech-debt**   | Identify and prioritize technical debt with remediation plans                                                               |
| **audit-accessibility** | Audit UI components for WCAG 2.1 AA compliance with severity-grouped violations                                             |
| **debug-issue**         | Systematic debugging workflow — from vague symptom to root cause analysis and validated fix                                 |
| **diagram-excalidraw**  | Generate Excalidraw architecture diagrams from codebase analysis                                                            |
| **explore-codebase**    | Deep codebase exploration and understanding                                                                                 |
| **mermaid-diagram**     | Generate Mermaid diagrams from codebase analysis                                                                            |
| **refactor-code**       | Comprehensive refactoring with safety checks and pattern application                                                        |
| **strengthen-types**    | Audit and harden TypeScript type safety — find `any`, unsafe casts, and missing return types                                |

## Agents

| Agent                          | Description                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **agent-orchestrator-agent**   | Coordinates multiple AI agents for complex multi-step tasks; decomposes tasks, matches specialists, and executes in parallel where possible |
| **code-explainer-agent**       | Explains what code does, how it's structured, and why it's designed that way; delegates security/performance concerns to specialist agents  |
| **code-generator-agent**       | Generates production-ready code (delegates to test-writer-agent for tests)                                                                  |
| **context-loader-agent**       | Advanced context management with summarization and cross-agent sharing                                                                      |
| **debug-assistant-agent**      | Advanced debugging with root cause analysis                                                                                                 |
| **pattern-learner-agent**      | Learns and applies codebase patterns                                                                                                        |
| **performance-analyzer-agent** | Analyzes performance bottlenecks and optimization opportunities                                                                             |
| **refactorer-agent**           | Performs safe, incremental refactoring operations                                                                                           |
| **security-analyzer-agent**    | Identifies security vulnerabilities and recommends fixes                                                                                    |
| **style-enforcer-agent**       | Enforces code style and conventions                                                                                                         |

## Hooks

| Hook                  | Description                            |
| --------------------- | -------------------------------------- |
| **post-edit-lint.sh** | Automatically lint files after editing |

## Usage Examples

```bash
# Use skills contextually
"Explain this file to me"                        # triggers analyze-code
"Refactor this code to use the strategy pattern" # triggers refactor-code
"How does the authentication system work?"       # triggers explore-codebase
"Create an architecture diagram of this system"  # triggers diagram-excalidraw
"What technical debt exists in this module?"     # triggers analyze-tech-debt
"Run a type safety audit on this codebase"       # triggers strengthen-types
"I'm getting a TypeError in the auth module"     # triggers debug-issue
"This keeps crashing in production, help me fix it" # triggers debug-issue
"Find all dead code and unused exports"           # triggers analyze-dead-code
"Check accessibility in src/components"           # triggers audit-accessibility
"Find WCAG violations in LoginForm.tsx"           # triggers audit-accessibility
"Are these migrations safe to run in production?" # triggers analyze-migrations
```

## License

MIT - Uniswap Labs
