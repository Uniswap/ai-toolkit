# Skills Package - CLAUDE.md

## Overview

This package contains Claude Code skills - model-invoked capabilities that Claude automatically uses when relevant. Unlike commands (which require explicit user invocation via `/command`), skills are automatically discovered and applied based on their descriptions.

## Skill Structure

Skills follow the Claude Code plugin skill format:

```
src/
  skill-name/
    SKILL.md       # Required: YAML frontmatter + instructions
    (optional files...)
```

### SKILL.md Format

```markdown
---
name: skill-name
description: Brief description of when Claude should use this skill
---

## Purpose
What this skill helps with

## When to Use
Trigger conditions

## Approach
How to apply this skill

## Best Practices
Tips and guidelines
```

## Available Skills

- **pdf**: Read and analyze PDF documents
- **xlsx**: Work with Excel spreadsheets
- **jupyter-notebook**: Analyze and edit Jupyter notebooks

## Adding New Skills

1. Create a new directory in `src/` with your skill name (lowercase, hyphens)
2. Add a `SKILL.md` file with required YAML frontmatter (`name`, `description`)
3. Include any supporting files (docs, templates, examples)
4. Run `npx nx run @ai-toolkit/skills-agnostic:generate-index` to update the index

## Key Concepts

- **Model-invoked**: Claude decides when to use skills based on context
- **Description is critical**: Write clear descriptions so Claude knows when to apply the skill
- **Progressive disclosure**: Supporting files are loaded only when needed
- **Tool restrictions**: Use `allowed-tools` in frontmatter to limit available tools

## Build & Development

```bash
# Generate index from skill files
npx nx run @ai-toolkit/skills-agnostic:generate-index

# Build the package
npx nx run @ai-toolkit/skills-agnostic:build
```
