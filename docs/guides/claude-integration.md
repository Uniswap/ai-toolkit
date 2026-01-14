# Claude Integration Guide

This guide explains how Claude AI is integrated into the AI Toolkit repository, covering both local development with Claude Code and automation via GitHub Actions.

## Table of Contents

1. [Overview](#overview)
2. [CLAUDE.md Auto-Generation System](#claudemd-auto-generation-system)
3. [Why CLAUDE.md Files Matter](#why-claudemd-files-matter)
4. [Using Claude Code Locally](#using-claude-code-locally)
5. [Claude in GitHub Actions](#claude-in-github-actions)
6. [Best Practices](#best-practices)

## Overview

The AI Toolkit repository uses Claude AI in two primary ways:

1. **Local Development**: Developers use [Claude Code](https://claude.ai/code) - Anthropic's official CLI - for AI-assisted development
2. **GitHub Actions**: Automated Claude workflows for PR reviews, issue responses, and welcome messages

Both leverage a system of `CLAUDE.md` files that provide contextual documentation throughout the monorepo, helping Claude understand the codebase without reading every file.

## CLAUDE.md Auto-Generation System

### What are CLAUDE.md Files?

`CLAUDE.md` files are lightweight documentation files (≤2000 characters each) placed throughout the repository at key locations called "core nodes." They serve as context maps for Claude, describing:

- Package/directory purpose and structure
- Available commands and scripts
- Key dependencies and their roles
- Recent changes and architectural decisions

### Core Node Detection

The system identifies two types of core nodes:

1. **Package Nodes**: Directories containing package manifests

   - JavaScript/TypeScript: `package.json`
   - Rust: `Cargo.toml`
   - Python: `pyproject.toml`, `setup.py`
   - Go: `go.mod`
   - And more...

2. **Working Directories**: Directories containing files with minimal nesting (≤1 level deep)
   - Examples: `.github/workflows/`, `src/components/`

### The Two Commands

#### `/claude-init-plus` - Initial Setup

Creates CLAUDE.md files at all core nodes in your workspace.

**Usage:**

```bash
/claude-init-plus
```

**What it does:**

1. Scans the entire workspace using git (fast) or file system (fallback)
2. Identifies all core nodes based on detection rules
3. Groups nodes by type (packages vs. working directories) and language
4. Presents a summary and asks for confirmation
5. Generates concise CLAUDE.md files using standardized templates
6. Verifies each file is ≤2000 characters

**Example output:**

```
Found 47 core nodes:

Packages (42):
  JavaScript/TypeScript: 38 (packages/*, apps/*)
  Python: 2 (scripts/, tools/)
  Rust: 2 (native/*, crates/*)

Working Directories (5):
  .github/workflows/, .github/scripts/, docs/guides/

Actions needed:
  - Create new CLAUDE.md: 35 files
  - Update existing CLAUDE.md: 10 files
  - Already up-to-date: 2 files

Proceed with generation/updates? (y/n/review)
```

#### `/update-claude-md` - Keep Docs in Sync

Intelligently updates CLAUDE.md files based on your staged git changes.

**Usage:**

```bash
# Auto-detect mode (recommended) - analyzes staged changes
/update-claude-md

# Explicit mode - target specific directory
/update-claude-md packages/my-package
```

**What it does:**

1. Runs `git diff --cached --name-status` to get staged changes
2. Groups changed files by their nearest CLAUDE.md
3. Determines if updates are needed (new files, manifest changes, significant code changes)
4. Generates update suggestions for affected CLAUDE.md files
5. Shows summary and asks for confirmation
6. Applies updates using surgical edits (preserves existing content)

**Update triggers:**

- New files added
- `package.json` or `project.json` modified
- Significant code changes (>50 lines)
- New exports or public APIs added

**Performance:**

- Small changes (1-5 files): <1 second
- Medium changes (5-20 files): 1-2 seconds
- Large changes (20+ files): 2-3 seconds

### Content Preservation Rules

The system follows strict rules to protect user-written content:

**Never Modify (Tier 1):**

- User-written sections
- Custom section headings
- Personal notes, warnings, tips
- Code examples written by users
- First-person language

**Modify with Caution (Tier 2):**

- Command lists (ADD only, never REMOVE)
- Dependency lists (ADD/REMOVE based on manifest)
- File structure listings (ADD new files only)

**Can Regenerate (Tier 3):**

- Sections marked `<!-- AUTO-GENERATED - DO NOT EDIT -->`
- Content that exactly matches package manifest

## Why CLAUDE.md Files Matter

### 1. Context Efficiency

Without CLAUDE.md files, Claude must:

- Read dozens of files to understand project structure
- Make assumptions about package purposes
- Discover available commands through trial and error
- Risk context window overflow on large projects

With CLAUDE.md files, Claude:

- Quickly understands structure from concise documentation
- Knows exactly what commands are available
- Sees relationships between packages
- Stays within context limits even on huge monorepos

**Example:**

```
Without CLAUDE.md:
- Read 15+ files to understand package
- 50,000+ tokens consumed
- 30+ seconds

With CLAUDE.md:
- Read 1 file (500 tokens)
- Instant understanding
- 1 second
```

### 2. Consistency Across Sessions

CLAUDE.md files ensure every Claude Code session starts with the same foundational knowledge:

- No need to re-explain project structure
- Consistent understanding of conventions
- Reliable command execution
- Better continuity between sessions

### 3. Living Documentation

Unlike static documentation that becomes outdated:

- CLAUDE.md files update automatically with code changes
- Developers see prompts to update after modifications
- Documentation stays synchronized with codebase
- Self-maintaining knowledge base

### 4. Onboarding Efficiency

New developers (human or AI) benefit from:

- Quick overview of each package's purpose
- Discovery of available tooling and commands
- Understanding of dependencies and relationships
- Context on recent changes and decisions

## Using Claude Code Locally

### Prerequisites

1. Install [Claude Code](https://claude.ai/code)
2. Have an Anthropic API key (set in Claude Code settings)
3. Be in the AI Toolkit repository

### Initial Setup

When starting work in this repository:

```bash
# 1. Navigate to the repository
cd path/to/ai-toolkit

# 2. Initialize CLAUDE.md files (first time only)
/claude-init-plus

# 3. Review the generated files
git diff **/*CLAUDE.md

# 4. Commit the initial documentation
git add **/*CLAUDE.md
git commit -m "docs: initialize CLAUDE.md files"
```

### Daily Workflow

**Before starting work:**

1. Claude Code automatically reads relevant CLAUDE.md files
2. You get instant context about the packages you're working in
3. No need to manually explain project structure

**During development:**

1. Make code changes as usual
2. Stage your changes: `git add .`
3. Update documentation: `/update-claude-md`
4. Review updates: `git diff **/*CLAUDE.md`
5. Commit together: `git commit -m "feat: add feature"`

**Example interaction:**

```
You: Create a new agent for code reviews

Claude: I'll create this in packages/plugins/development-codebase-tools/agents/
       following the agent structure used by the plugin system.

       [Creates agent file]

       Now I'll update the plugin's CLAUDE.md to document this new agent.

       Would you like me to also register it in the plugin.json?
```

### Available Custom Commands

The AI Toolkit provides several custom slash commands:

- `/claude-init-plus` - Initialize CLAUDE.md files
- `/update-claude-md [path]` - Update CLAUDE.md files
- `/work-through-pr-comments <pr-number>` - Address PR feedback
- And more in `.claude/commands/`

### Using Nx Generators

Claude Code can use the Nx generators for MCP server addons:

```bash
# Install MCP server addons
nx generate @uniswap/ai-toolkit-nx-claude:addons
```

**Note**: Agents, skills, and commands are now distributed through plugins. Create them directly in the appropriate plugin directory:

- `packages/plugins/<plugin-name>/agents/` - For agents
- `packages/plugins/<plugin-name>/skills/` - For skills
- `packages/plugins/<plugin-name>/commands/` - For commands

Claude understands these generators and the plugin architecture.

## Claude in GitHub Actions

### Overview of Workflows

The repository includes three Claude-powered GitHub Actions workflows:

1. **claude-code.yml** - Interactive Claude assistant via @mentions
2. **claude-code-review.yml** - Automated PR code reviews
3. **claude-welcome.yml** - Welcome messages for new PRs

All workflows use reusable workflow templates in `.github/workflows/_claude-*.yml`.

### 1. Interactive Assistant (claude-code.yml)

**Purpose**: Respond to @claude mentions in issues, PRs, and comments

**Triggers:**

- Issue comments with `@claude`
- PR review comments with `@claude`
- PR reviews with `@claude`
- New issues with `@claude` in title/body

**Example usage:**

```
Comment on PR: "@claude can you explain how this authentication flow works?"

Claude: [Analyzes the PR files and responds with explanation]
```

**Configuration:**

```yaml
model: 'claude-sonnet-4-5-20250929'
timeout_minutes: 10
custom_instructions: |
  - Follow rules in all CLAUDE.md files
  - Use Nx commands for all operations
  - Run format, lint, typecheck after changes
  - Update CLAUDE.md files after modifications
```

### 2. Automated Code Review (claude-code-review.yml)

**Purpose**: Provide formal GitHub PR reviews with inline comments

**Triggers:**

- PR opened
- PR synchronized (new commits)
- PR marked ready for review

**Features:**

- Formal reviews (APPROVE/REQUEST_CHANGES/COMMENT)
- Inline comments on specific code lines
- Auto-resolution of fixed issues
- Iterative review tracking
- Patch-ID based caching (no duplicate reviews after rebase)

**Configuration:**

```yaml
model: 'claude-haiku-4-5' # Cost-effective for reviews
timeout_minutes: 20
# Optional: restrict to read-only tools
allowed_tools: 'Read,Grep,Glob,Bash(git log),Bash(git diff)'
```

**Example review:**

```
Review Status: REQUEST_CHANGES

General Comments:
- Good implementation of the authentication system
- Consider adding error handling for edge cases
- Missing tests for the new endpoints

Inline Comments:
  src/auth/handler.ts:42
  ⚠️ This function should validate the token format before parsing

  src/auth/handler.ts:67
  💡 Consider extracting this logic into a separate utility function
```

### 3. Welcome Message (claude-welcome.yml)

**Purpose**: Post friendly welcome messages on new PRs

**Triggers:**

- PR opened

**Configuration:**

```yaml
welcome_message: |
  👋 Hi! I'm Claude, an AI assistant here to help with code reviews
  and answer questions. Tag me with `@claude` followed by your request.

  💡 Tip: Ask me to explain code, suggest improvements, or review changes.
```

### Security Considerations

All workflows follow security best practices:

1. **Action Pinning**: External actions pinned to commit hashes
2. **Secret Management**: API keys stored in GitHub secrets
3. **Permission Scoping**: Minimal required permissions
4. **Concurrency Control**: Prevents duplicate/conflicting runs
5. **Input Validation**: User inputs sanitized

**Example:**

```yaml
# ✅ GOOD: Pinned to commit hash with version comment
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4

# ❌ BAD: Using tag or branch
- uses: actions/checkout@v4
```

### Adding Claude to Your Own Workflows

To add Claude to a custom workflow:

```yaml
name: My Custom Workflow

on:
  # Your triggers

jobs:
  claude-task:
    uses: ./.github/workflows/_claude-main.yml
    with:
      model: 'claude-sonnet-4-5-20250929'
      custom_instructions: |
        Your task-specific instructions here
      timeout_minutes: 15
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Available parameters:**

- `model`: Claude model to use (sonnet, haiku, opus)
- `custom_instructions`: Task-specific guidance
- `timeout_minutes`: Maximum execution time
- `allowed_tools`: Restrict available tools (optional)
- `max_turns`: Conversation turn limit (default: 15)

## Best Practices

### For CLAUDE.md Files

**DO:**

- ✅ Run `/update-claude-md` after significant changes
- ✅ Keep files concise (≤2000 characters)
- ✅ Add context about "why" decisions were made
- ✅ Update dependency descriptions with purpose
- ✅ Commit CLAUDE.md changes with related code

**DON'T:**

- ❌ Manually edit auto-generated sections
- ❌ Let CLAUDE.md files become stale
- ❌ Write verbose explanations (use bullet points)
- ❌ Skip the verification step after generation
- ❌ Ignore the character limit warnings

### For Claude Code

**DO:**

- ✅ Let Claude read CLAUDE.md files (automatic)
- ✅ Stage changes before running `/update-claude-md`
- ✅ Review generated code before committing
- ✅ Use Nx commands (Claude knows them from CLAUDE.md)
- ✅ Ask Claude to explain its reasoning

**DON'T:**

- ❌ Assume Claude knows undocumented conventions
- ❌ Skip code quality checks (format, lint, typecheck)
- ❌ Commit without reviewing Claude's changes
- ❌ Use Claude for security-sensitive operations without review
- ❌ Ignore Claude's questions or requests for clarification

### For GitHub Actions

**DO:**

- ✅ Pin external actions to commit hashes
- ✅ Use appropriate models (haiku for reviews, sonnet for complex tasks)
- ✅ Set reasonable timeout limits
- ✅ Test workflows in PRs before merging
- ✅ Monitor API usage and costs

**DON'T:**

- ❌ Grant excessive permissions to workflows
- ❌ Use opus model unnecessarily (expensive)
- ❌ Skip security scanning (Bullfrog, etc.)
- ❌ Hardcode secrets in workflow files
- ❌ Allow unlimited conversation turns

### General Guidelines

1. **Trust but verify**: Claude is powerful but review its work
2. **Provide context**: CLAUDE.md files help, but add specifics when needed
3. **Iterate**: Claude learns from feedback - provide it!
4. **Stay organized**: Keep CLAUDE.md files up-to-date for best results
5. **Monitor usage**: Track API costs and adjust model usage accordingly

## Troubleshooting

### CLAUDE.md Issues

**Problem**: `/claude-init-plus` creates too many files

**Solution**: Some directories may be excluded. Check the exclusion list in the command documentation.

**Problem**: CLAUDE.md file exceeds 2000 characters

**Solution**: The command will automatically trim. If manual editing is needed:

- Remove optional sections (Structure, etc.)
- Shorten dependency descriptions
- List only top 5-10 most important dependencies

**Problem**: `/update-claude-md` doesn't detect my changes

**Solution**: Make sure changes are staged with `git add` first.

### Claude Code Issues

**Problem**: Claude doesn't understand project structure

**Solution**: Run `/claude-init-plus` if CLAUDE.md files don't exist, or `/update-claude-md` if they're outdated.

**Problem**: Claude can't find Nx commands

**Solution**: Check that the package's CLAUDE.md documents available commands/scripts.

### GitHub Actions Issues

**Problem**: Workflow doesn't trigger on @claude mentions

**Solution**: Ensure the comment/issue body contains exactly `@claude` (case-sensitive).

**Problem**: Claude API rate limits hit

**Solution**:

- Use haiku model for high-volume tasks
- Reduce timeout_minutes
- Add concurrency controls
- Implement caching strategies

**Problem**: Workflow times out

**Solution**:

- Increase timeout_minutes
- Use a faster model (haiku instead of sonnet)
- Reduce the scope of the task
- Split into multiple smaller workflows

## Additional Resources

- [Claude Code Documentation](https://claude.ai/code)
- [Creating Agents Guide](./creating-agents.md)
- [AI Toolkit README](../../README.md)
- [GitHub Actions Workflows](../../.github/workflows/CLAUDE.md)
- [Custom Commands](../../.claude/commands/)

## Contributing

When contributing to this repository:

1. Initialize/update CLAUDE.md files for affected packages
2. Follow Nx monorepo conventions
3. Run code quality checks (format, lint, typecheck)
4. Test with Claude Code locally before pushing
5. Let Claude workflows review your PRs

## Conclusion

Claude integration in the AI Toolkit repository creates a powerful feedback loop:

1. **CLAUDE.md files** provide consistent context for Claude
2. **Claude Code** helps developers work efficiently locally
3. **GitHub Actions** automate reviews and assistance
4. **Auto-updates** keep documentation synchronized
5. **Better context** leads to better AI assistance

By maintaining this system, we ensure that both human developers and AI assistants have the knowledge they need to work effectively in this monorepo.
