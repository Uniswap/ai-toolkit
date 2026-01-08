# Skills Directory - Claude Code Skills

This directory contains Claude Code skills that provide specialized, multi-step workflows for common development tasks.

## Recent Changes

### Semantic Trigger Improvements (2026-01-07)

All 14 skill descriptions were rewritten to use natural language example phrases instead of keyword-based "Triggers:" lists. This improves Claude Code's semantic matching for automatic skill invocation.

**Previous format (keyword-based):**

```yaml
description: Update CLAUDE.md documentation files
Triggers: "update claude.md", "sync docs", "document changes"
```

**New format (natural language examples):**

```yaml
description: Update CLAUDE.md documentation files after code changes. Use when user says "update the CLAUDE.md", "sync the docs with my changes", "document what I changed", "update documentation for this package", or after making significant code modifications that should be reflected in project documentation.
```

**Why this matters:**

- Claude Code uses semantic matching, not exact string matching
- Natural language examples provide context for when to invoke skills
- Multiple concrete user phrases help Claude identify intent
- More intuitive for users - they can speak naturally

## Skill Description Pattern

Each skill description now follows this structure:

1. **Brief summary** - What the skill does (1 sentence)
2. **Activation phrase** - "Use when user says..."
3. **Example user phrases** - Multiple concrete examples in quotes
4. **Context triggers** - Additional conditions for automatic activation

Example structure:

```
[Brief summary]. Use when user says "[example 1]", "[example 2]", "[example 3]", or [contextual trigger].
```

## Skills Catalog

### Documentation & Planning

- **claude-docs-updater** - Update CLAUDE.md files after code changes
- **implementation-planner** - Create implementation plans through multi-agent refinement
- **plan-executor** - Execute plans step-by-step with progress tracking
- **plan-reviewer** - Review plans for completeness and feasibility
- **plan-swarm** - Collaborative plan refinement through multi-agent discussion

### Code Quality & Analysis

- **code-refactorer** - Orchestrate comprehensive refactoring with safety checks
- **codebase-explorer** - Deep codebase exploration and understanding
- **tech-debt-analyzer** - Identify and prioritize technical debt with remediation plans
- **prompt-optimizer** - Optimize AI prompts for better model performance

### Pull Request & Review

- **pr-creator** - Create Graphite PRs with auto-generated commit messages
- **pr-issue-resolver** - Address PR review comments and fix CI failures
- **pr-reviewer** - Comprehensive PR review using specialized agents
- **graphite-stack-updater** - Update Graphite PR stacks by resolving comments and syncing

### Research & Discovery

- **topic-researcher** - Research topics by combining web search with codebase analysis

## Implementation Details

### SKILL.md Format

Each skill uses SKILL.md files with YAML frontmatter:

```yaml
---
name: skill-name
description: Natural language description with example user phrases
allowed-tools: Read, Write, Edit, Bash(git*), Glob, Grep
model: opus | sonnet-3.5 | sonnet-4.5
---

# Skill Implementation

...markdown content with instructions for Claude...
```

### Automatic Invocation

Claude Code automatically invokes skills when:

1. User phrase semantically matches description examples
2. Contextual triggers are met (e.g., "after making changes")
3. User explicitly requests skill by name (e.g., "/review-pr")

### Tool Restrictions

Skills specify allowed tools via `allowed-tools` in frontmatter. This restricts what the skill agent can access, improving:

- Security - Limited scope of operations
- Performance - Fewer tool options to consider
- Reliability - Clear boundaries for skill behavior

## Best Practices for Skill Descriptions

When creating or updating skill descriptions:

1. **Start with a clear summary** - One sentence, active voice
2. **Use "Use when user says..."** - Signals example phrases coming
3. **Provide 3-5 concrete examples** - Actual phrases users would type
4. **Vary the language** - Different ways to express same intent
5. **Include contextual triggers** - When skill should auto-activate
6. **Avoid technical jargon in examples** - Use natural language

**Good example:**

```
Analyze and prioritize technical debt with remediation plans. Use when user says "analyze the technical debt in this codebase", "what's the code quality like in this module", "identify what's slowing down our development", or "where should we focus our cleanup efforts".
```

**Bad example (old style):**

```
Technical debt analysis and prioritization.
Triggers: "technical debt", "tech debt", "code quality", "debt analysis"
```

## Adding New Skills

To add a new skill:

1. Create directory: `skills/[skill-name]/`
2. Add `SKILL.md` with proper frontmatter and natural language description
3. Update this CLAUDE.md with the new skill in the catalog
4. Follow the description pattern established above

## Related Documentation

- Root CLAUDE.md - Project-wide guidelines
- packages/ai-toolkit-nx-claude/CLAUDE.md - Generator for creating new skills
- .claude-plugin/marketplace.json - Skill metadata for marketplace
