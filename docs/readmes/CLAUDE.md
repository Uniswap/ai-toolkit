# Documentation READMEs

## Purpose

Core documentation files for contributing, development workflows, and project processes. Essential reading for contributors and maintainers.

## README Files

### CONTRIBUTING.md

**Purpose**: Guidelines for contributing to the AI Toolkit

**Topics**:

- Code of conduct
- How to report issues
- How to submit pull requests
- Code style requirements
- Testing requirements
- Documentation requirements
- Review process

### DEVELOPMENT.md

**Purpose**: Development setup and workflow documentation

**Topics**:

- Local environment setup
- Prerequisites (Node.js, npm, tools)
- Building the project
- Running tests
- Development commands
- Debugging tips
- Common development tasks

### WORKFLOW.md

**Purpose**: Project workflows and processes

**Topics**:

- Git workflow (branching, commits, merges)
- Release process
- Version management
- CI/CD pipelines
- Deployment procedures
- Maintenance tasks

## Document Standards

### Structure

All README files should:

1. **Start with overview**: What this document covers
2. **Table of contents**: For longer documents
3. **Organized sections**: Clear hierarchy
4. **Code examples**: Where applicable
5. **Links**: References to related docs
6. **Update date**: Last reviewed date

### Style Guide

- **Headings**: Use H1 for title, H2 for main sections, H3 for subsections
- **Code blocks**: Include language identifiers
- **Lists**: Use bullets or numbers consistently
- **Emphasis**: **Bold** for importance, _italic_ for emphasis
- **Links**: Descriptive text, not "click here"

### Example Structure

```markdown
# Document Title

Last updated: YYYY-MM-DD

## Overview

Brief description of what this document covers

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1

Content...

### Subsection 1.1

More detailed content...

## Section 2

Content...
```

## Maintenance

### Regular Updates

These documents should be reviewed:

- **CONTRIBUTING.md**: When process changes
- **DEVELOPMENT.md**: When setup requirements change
- **WORKFLOW.md**: When workflows evolve

### Review Schedule

- **Quarterly**: Review for accuracy
- **On releases**: Update for new features/changes
- **On process changes**: Immediate update

### Update Checklist

When updating README files:

- [ ] Review current content for accuracy
- [ ] Update any changed procedures
- [ ] Add new sections for new features
- [ ] Remove outdated information
- [ ] Update screenshots/examples
- [ ] Test all code examples
- [ ] Update last modified date
- [ ] Run markdown linter
- [ ] Get peer review

## Related Documentation

- Project README: `../../README.md`
- Guides: `../guides/CLAUDE.md`
- Examples: `../examples/CLAUDE.md`
- GitHub workflows: `../../.github/workflows/CLAUDE.md`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
