---
name: claude-init-plus
description: Initialize or update CLAUDE.md files at all core nodes in the workspace
argument-hint: (no arguments - scans entire workspace automatically)
allowed-tools: Glob(*), Read(*), Write(*), Edit(*), Bash(tree:*), Bash(find:*), Bash(git:*)
---

# `/claude-init-plus` - Intelligent CLAUDE.md Generation

## Purpose

Scan the workspace to identify "core nodes" and generate/update CLAUDE.md files at each node. Works with any workspace type: monorepos (Nx, Turborepo, Lerna, npm/yarn/pnpm workspaces), single-repo projects, or any language ecosystem.

This creates documentation that helps future Claude Code sessions understand the project without reading every file.

## Core Node Definition

A directory is a **core node** if it meets **either** criterion:

1. **Has a package manifest** (Always a core node)
   - JavaScript/TypeScript: `package.json`
   - Rust: `Cargo.toml`
   - Python: `pyproject.toml`, `setup.py`
   - Go: `go.mod`
   - Java: `pom.xml`, `build.gradle`, `build.gradle.kts`
   - Swift: `Package.swift`
   - Ruby: `Gemfile`, `.gemspec`
   - PHP: `composer.json`

2. **Is a working directory**:
   - Contains ONLY files (no subdirectories), OR
   - Contains files + subdirectories where ALL subdirectories contain ONLY files (max 1 nesting level)

## Usage

```bash
/claude-init-plus
```

## Execution Flow

### Phase 1: Discovery

**Step 1: Use Git for Fast Discovery (Preferred)**

```bash
# Get all files tracked by git (automatically excludes ignored files)
git ls-files

# Find all package manifests
git ls-files | grep -E '(package\.json|Cargo\.toml|pyproject\.toml|...)$'
```

**Step 2: Identify Core Nodes Using BFS**

Traverse workspace using BFS (breadth-first search):

- RULE 1 (HIGHEST PRIORITY): Check for package manifest
- RULE 2: Check if working directory (leaf or 1-level nested)

**Exclusion List:**
`.git`, `node_modules`, `.nx`, `.expo`, `dist`, `build`, `.next`, `.vercel`, `.yarn`, `coverage`, `.turbo`, `.cache`, `logs`, `target`, `__pycache__`, `venv`, `.venv`

**Step 3: Categorize Core Nodes**

Group by:

- **Type**: Package vs. Working Directory
- **Language**: JavaScript/TypeScript, Rust, Python, Go, Java, Swift, Ruby, PHP, Other
- **Purpose**: Inferred from path and manifest

### Phase 2: User Confirmation

**REQUIRED: Get user confirmation before any file creation/modification**

Present summary:

- Found {count} core nodes
- Packages by language
- Working Directories
- Actions needed (create/update/skip counts)

### Phase 3: Generation

## Critical Preservation Rules

### Never Modify (Tier 1: Absolute Protection)

1. User-written sections (not from templates)
2. Custom section headings
3. Personal notes, warnings, tips
4. Code examples written by users
5. First-person language

### Modify with Caution (Tier 2: Surgical Updates Only)

1. Command lists (ADD only, never REMOVE without confirmation)
2. Dependency lists (ADD/REMOVE based on manifest changes)
3. File structure listings (ADD new files/dirs only)

### Can Regenerate (Tier 3: Auto-Generated)

1. Sections marked: `<!-- AUTO-GENERATED - DO NOT EDIT -->`
2. Content that exactly matches package manifest

## Length Constraints

**CRITICAL: All generated CLAUDE.md files MUST be concise and focused.**

- **Token Limit**: 500 tokens or less (~2000 characters)
- Use bullet points instead of paragraphs
- Include only essential commands/dependencies
- Avoid verbose descriptions (5-10 words max per item)

## Content Template

```markdown
# {Directory or Package Name}

## Overview
{1-2 sentence description of purpose}

## {Commands|Scripts|Tasks} (if package manifest exists)
{List available commands/scripts/tasks from manifest}

## {Dependencies|Requirements} (if package manifest exists)
<!-- AUTO-GENERATED - Updated by /update-claude-md -->
- **{package}** ({version}) - {purpose in 5-10 words}

## Key Files (if working directory without manifest)
- `{filename}` - {purpose}

## Structure (optional - if >5 subdirectories)
{Brief overview of subdirectory organization}

## Auto-Update Instructions
After changes to files in this directory, run `/update-claude-md`
```

## Success Criteria & Verification

**After generation, verify (REQUIRED):**

1. **File Validity**: File created/updated, not empty, has required sections
2. **Content Quality**: All commands documented, no placeholders, dependencies have descriptions
3. **File Size**: Must be ≤2000 characters

**Mark as FAILURE if:**

- ANY Write/Edit operation failed
- File size is 0 bytes or exceeds 2000 characters
- Required sections missing

## Error Handling

- **Permission Denied**: Offer to skip, fix permissions, or cancel
- **Cannot Parse Manifest**: Offer to skip, create without dependency info, or cancel
- **No Core Nodes Found**: Display info and suggest running on specific subdirectories

## Summary Report Format

Generate markdown report with:

- **Summary**: Totals for nodes found, files created/updated/skipped, errors
- **Packages**: Grouped by language with status
- **Working Directories**: List with status
- **Errors & Warnings**: Details for any failures
- **Next Steps**: Checklist for user follow-up
