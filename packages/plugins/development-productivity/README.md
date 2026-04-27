# @uniswap/development-productivity

Documentation, research, test generation, document generation, and prompt optimization tools for Claude Code.

## Installation

```bash
# Add marketplace (if not already added)
claude /plugin add-marketplace github:Uniswap/ai-toolkit

# Install this plugin
claude /plugin install development-productivity
```

## Skills

| Skill                    | Description                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| **audit-dependencies**   | Audit dependencies for security vulnerabilities and outdated packages; apply safe updates |
| **generate-document**    | Generate professional documents (PDF, DOCX, HTML, ODT, EPUB, RTF) using pandoc |
| **generate-tests**       | Generate comprehensive tests with advanced testing strategies                  |
| **optimize-prompt**      | Optimize AI prompts for better model performance                               |
| **research-topic**       | Research topics by combining web search with codebase analysis                 |
| **update-claude-docs**   | Update CLAUDE.md documentation files after code changes                        |

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

## Hooks

| Hook                      | Event  | Description                                                              |
| ------------------------- | ------ | ------------------------------------------------------------------------ |
| **claude-md-maintenance** | `Stop` | Reminds Claude to run `/update-claude-md` after significant code changes |

### Enabling the CLAUDE.md Maintenance Hook

This hook is **opt-in** and disabled by default. To activate it for a project:

1. Create `.claude/development-productivity.local.md` in your project root:

   ```markdown
   ---
   enabled: true
   ---
   ```

2. Restart Claude Code for the hook to take effect.

3. Add `.claude/*.local.md` to your `.gitignore` to keep the setting local to your machine:

   ```
   .claude/*.local.md
   ```

**What it does:** After each Claude Code session (Stop event), the hook checks git for non-trivial changes — new files, modifications to `package.json`/`project.json`, or more than 50 lines changed. If detected, it injects a reminder for Claude to run `/update-claude-md` to keep CLAUDE.md in sync. The hook is non-blocking: it never prevents Claude from finishing.

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
"Export this analysis to PDF"                   # triggers generate-document
"Create a Word doc from these findings"         # triggers generate-document
"Generate an HTML report"                       # triggers generate-document
"Audit my dependencies"                         # triggers audit-dependencies
"Check for vulnerable packages --fix"           # triggers audit-dependencies + apply patches
"Dependency health check"                       # triggers audit-dependencies
```

## License

MIT - Uniswap Labs
