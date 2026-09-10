# Documentation Guides

## Purpose

Developer guides and tutorials for the AI Toolkit. Provides in-depth documentation on creating custom components, understanding architecture, and extending functionality.

## Guide Files

### Creating Agents

- **File**: `creating-agents.md`
- **Purpose**: Comprehensive guide for creating custom AI agents
- **Topics**:
  - Agent definition format
  - Capabilities and specializations
  - Tool access patterns
  - Integration with commands
  - Testing and validation
  - Best practices

### Claude Integration

- **File**: `claude-integration.md`
- **Purpose**: Complete guide to Claude AI integration in the AI Toolkit
- **Topics**:
  - CLAUDE.md auto-generation system (`/claude-init-plus`, `/update-claude-md`)
  - Why CLAUDE.md files are important for AI context
  - Using Claude Code locally for development
  - Claude-powered GitHub Actions workflows
  - Best practices and troubleshooting
  - Security considerations

### Expected Content Structure

Each guide should follow this structure:

```markdown
# Guide Title

## Overview

What this guide covers

## Prerequisites

Required knowledge and tools

## Step-by-Step Instructions

1. First step with examples
2. Second step with examples
   ...

## Common Pitfalls

Issues to avoid

## Examples

Working examples

## Next Steps

Related guides and resources
```

## Guide Categories

### Planned Guides

Future guides to be added:

1. **Creating Commands** - Guide for custom slash commands
2. **Workflow Orchestration** - Multi-agent workflows
3. **MCP Server Integration** - Adding MCP servers
4. **Testing Strategies** - Testing agents and commands
5. **Contributing** - How to contribute to AI Toolkit
6. **Architecture Overview** - System design and patterns
7. **Configuration Guide** - Claude Code configuration options
8. **Migration Guide** - Upgrading between versions

## Guide Development

### Creating New Guides

1. **Identify need**:

   - Common questions
   - Frequently asked how-tos
   - Complex features

2. **Create outline**:

   - Overview
   - Prerequisites
   - Step-by-step instructions
   - Examples
   - Troubleshooting

3. **Write content**:

   - Clear, concise language
   - Code examples with explanations
   - Screenshots where helpful
   - Links to related docs

4. **Review and test**:

   - Follow guide yourself
   - Have others review
   - Ensure examples work

5. **Publish**:
   - Add to this directory
   - Link from README
   - Update this CLAUDE.md

### Guide Standards

- **Markdown format**: All guides use GitHub-flavored markdown
- **Code blocks**: Include language identifiers for syntax highlighting
- **Examples**: Working, tested examples
- **Links**: Relative links to other docs
- **Images**: Store in `docs/images/` if needed
- **Updates**: Keep guides current with releases

## Related Documentation

- Examples: `../examples/CLAUDE.md`
- README files: `../readmes/CLAUDE.md`
- Project README: `../../README.md`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
