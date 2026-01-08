# Claude Skills Package

## Overview

The `@ai-toolkit/claude-skills` package contains skill definitions for Claude Code. Skills are directory-based configurations that define advanced workflows, combining prompts, tools, and optional model specifications.

**Note**: This is a markdown-only package with no build step. Skills are read directly from `src/` by Claude Code via the plugin marketplace.

## Package Structure

```text
packages/claude-skills/
├── src/
│   ├── claude-docs-updater/SKILL.md
│   ├── code-refactorer/SKILL.md
│   ├── codebase-explorer/{SKILL.md, exploration-guide.md}
│   ├── graphite-stack-updater/SKILL.md
│   ├── implementation-planner/{SKILL.md, planning-guide.md}
│   ├── plan-executor/{SKILL.md, execution-guide.md}
│   ├── plan-reviewer/SKILL.md
│   ├── plan-swarm/SKILL.md
│   ├── pr-creator/SKILL.md
│   ├── pr-issue-resolver/{SKILL.md, pr-guide.md}
│   ├── pr-reviewer/SKILL.md
│   ├── prompt-optimizer/SKILL.md
│   ├── tech-debt-analyzer/SKILL.md
│   └── topic-researcher/SKILL.md
├── package.json
└── CLAUDE.md
```

## Plugin Grouping

Skills are grouped into 4 plugins in `.claude-plugin/marketplace.json`:

| Plugin                | Skills                                                             |
| --------------------- | ------------------------------------------------------------------ |
| `planning-skills`     | implementation-planner, plan-executor, plan-reviewer, plan-swarm   |
| `pr-skills`           | pr-reviewer, pr-creator, pr-issue-resolver, graphite-stack-updater |
| `codebase-skills`     | codebase-explorer, code-refactorer, tech-debt-analyzer             |
| `productivity-skills` | claude-docs-updater, topic-researcher, prompt-optimizer            |

## SKILL.md Format

Each skill is a directory containing:

1. **SKILL.md** (required): Main skill definition with YAML frontmatter
2. **Additional .md files** (optional): Supporting documentation (guides, examples)

```yaml
---
name: skill-name
description: Brief description of the skill
allowed-tools: Read, Write, Edit, Bash(git:*), Task(subagent_type:*)
model: opus  # Optional: specify model
---

# Skill Name

## Purpose
[What this skill does]

## When to Use
[Trigger conditions and use cases]

## Process
[Step-by-step workflow]

## Output
[Expected output format]
```

## Distribution

Skills are distributed via the Claude Code plugin marketplace:

1. Skills are defined in `.claude-plugin/marketplace.json`
2. Enterprise users can deploy via MDM managed-settings.json (see `docs/enterprise/`)
3. Skills can also be manually installed to `~/.claude/skills/` or `./.claude/skills/`

## Adding New Skills

1. Create skill directory: `mkdir -p src/my-new-skill`
2. Create SKILL.md with YAML frontmatter
3. Add optional guide files
4. Update `.claude-plugin/marketplace.json` to include the skill in a plugin

## Related Packages

- `@ai-toolkit/commands-agnostic`: Command definitions
- `@ai-toolkit/agents-agnostic`: Agent definitions
- `@uniswap/ai-toolkit-nx-claude`: Nx generators for installation
