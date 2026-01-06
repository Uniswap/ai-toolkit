# Claude Skills Package

## Overview

The `@ai-toolkit/claude-skills` package contains skill definitions for Claude Code. Skills are directory-based configurations that define advanced workflows, combining prompts, tools, and optional model specifications.

## Package Structure

```text
packages/claude-skills/
├── src/
│   ├── claude-docs-updater/
│   │   └── SKILL.md
│   ├── code-refactorer/
│   │   └── SKILL.md
│   ├── codebase-explorer/
│   │   ├── SKILL.md
│   │   └── exploration-guide.md
│   ├── implementation-planner/
│   │   ├── SKILL.md
│   │   └── planning-guide.md
│   ├── plan-executor/
│   │   ├── SKILL.md
│   │   └── execution-guide.md
│   ├── plan-reviewer/
│   │   └── SKILL.md
│   ├── plan-swarm/
│   │   └── SKILL.md
│   ├── pr-creator/
│   │   └── SKILL.md
│   ├── pr-issue-resolver/
│   │   ├── SKILL.md
│   │   └── pr-guide.md
│   ├── pr-reviewer/
│   │   └── SKILL.md
│   ├── prompt-optimizer/
│   │   └── SKILL.md
│   ├── tech-debt-analyzer/
│   │   └── SKILL.md
│   ├── topic-researcher/
│   │   └── SKILL.md
│   └── index.ts              # Auto-generated exports
├── scripts/
│   └── generate.ts           # Index generator script
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
└── CLAUDE.md                 # This file
```

## Skill Format

Each skill is a directory containing:

1. **SKILL.md** (required): Main skill definition with YAML frontmatter
2. **Additional .md files** (optional): Supporting documentation (guides, examples)

### SKILL.md Format

```yaml
---
name: skill-name
description: Brief description of the skill
allowed-tools: Read, Write, Edit, Bash(git:*), Task(subagent_type:*)
model: claude-sonnet-4-5-20250929  # Optional: specify model
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

## Available Skills (14)

### Planning & Execution

| Skill                    | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `implementation-planner` | Create implementation plans through multi-agent refinement |
| `plan-executor`          | Execute plans step-by-step with progress tracking          |
| `plan-reviewer`          | Critically review plans for completeness and feasibility   |
| `plan-swarm`             | Collaborative plan refinement with expert opinions         |

### Code Review & Management

| Skill               | Description                                      |
| ------------------- | ------------------------------------------------ |
| `pr-reviewer`       | Comprehensive PR review with specialized agents  |
| `pr-creator`        | Create Graphite PRs with auto-generated messages |
| `pr-issue-resolver` | Address PR review comments and fix CI failures   |
| `code-refactorer`   | Comprehensive refactoring with safety checks     |

### Research & Documentation

| Skill                 | Description                                   |
| --------------------- | --------------------------------------------- |
| `codebase-explorer`   | Deep codebase exploration and understanding   |
| `topic-researcher`    | Combine web search with codebase analysis     |
| `claude-docs-updater` | Update CLAUDE.md files based on code changes  |
| `tech-debt-analyzer`  | Identify and prioritize technical debt        |
| `prompt-optimizer`    | Optimize prompts for better model performance |

### Version Control

| Skill                    | Description                        |
| ------------------------ | ---------------------------------- |
| `graphite-stack-updater` | Automate Graphite PR stack updates |

## Exports

The package exports:

```typescript
// Skill type definitions
export interface SkillDefinition {
  description: string;
  dirPath: string;
  files: string[];
  allowedTools?: string;
  model?: string;
}

export type Skills = {
  [key in SkillName]: SkillDefinition;
};

// Main skills object
export const skills: Skills;

// Skill names type and array
export type SkillName;
export const skillNames: SkillName[];
```

## Build Process

### Generate Index

The `generate-index` target reads all SKILL.md files and generates `src/index.ts`:

```bash
npx nx run @ai-toolkit/claude-skills:generate-index
```

### Build Package

```bash
npx nx run @ai-toolkit/claude-skills:build
```

This:

1. Runs `generate-index` first (dependency)
2. Compiles TypeScript to `dist/src/`
3. Copies `.md` files to `dist/` preserving directory structure

## Integration with ai-toolkit-nx-claude

This package is a content dependency for `@uniswap/ai-toolkit-nx-claude`:

1. Skills are bundled into the ai-toolkit-nx-claude distribution
2. The init generator can install skills to `~/.claude/skills/` or `./.claude/skills/`
3. Skills are installed as directories (not flat files like commands/agents)

## Adding New Skills

### 1. Create Skill Directory

```bash
mkdir -p src/my-new-skill
```

### 2. Create SKILL.md

```yaml
---
name: my-new-skill
description: Description for the skill selection prompt
allowed-tools: Read, Write, Glob, Grep
---
# My New Skill

[Content following skill format]
```

### 3. Add Optional Guide Files

```bash
# Optional supporting documentation
touch src/my-new-skill/guide.md
```

### 4. Regenerate Index

```bash
npx nx run @ai-toolkit/claude-skills:generate-index
```

### 5. Rebuild Package

```bash
npx nx run @ai-toolkit/claude-skills:build
```

## Development

### Running Tests

```bash
npx nx run @ai-toolkit/claude-skills:test
```

### Linting

```bash
npx nx run @ai-toolkit/claude-skills:lint
```

### Typechecking

```bash
npx nx run @ai-toolkit/claude-skills:typecheck
```

## Dependencies

- `@ai-toolkit/utils`: Shared utilities for YAML parsing

## Related Packages

- `@ai-toolkit/commands-agnostic`: Command definitions
- `@ai-toolkit/agents-agnostic`: Agent definitions
- `@uniswap/ai-toolkit-nx-claude`: Nx generators for installation

## Maintenance

This CLAUDE.md should be updated when:

- New skills are added
- Skill format changes
- Build process changes
- Export API changes
