---
name: claude-init-plus
description: Initialize or update CLAUDE.md files at all core nodes in the workspace
argument-hint: (no arguments - scans entire workspace automatically)
allowed-tools: Glob(*), Read(*), Write(*), Edit(*), Bash(tree:*), Bash(find:*), Bash(git:*)
---

# `/claude-init-plus` - Intelligent CLAUDE.md Generation

## Purpose

Scan the workspace to identify "core nodes" and generate CLAUDE.md files at each node.
Works with any workspace type: monorepos (Nx, Turborepo, Lerna, npm/yarn/pnpm workspaces),
single-repo projects, or any language ecosystem.

Generated CLAUDE.md files follow **progressive disclosure**: concise (under 200 lines),
focused on conventions and gotchas that Claude cannot infer from reading code, with
topic-specific rules factored into `.claude/rules/` files and external docs referenced
via `@path` imports rather than inlined.

Use `/claude-init-plus` **once** to initialize the workspace. Use `/update-claude-md`
to keep documentation current on each significant change.

## Core Node Definition

A directory is a **core node** if it meets **either** criterion:

1. **Has a package manifest** (always a core node)

   - JavaScript/TypeScript: `package.json`
   - Rust: `Cargo.toml`
   - Python: `pyproject.toml`, `setup.py`
   - Go: `go.mod`
   - Java: `pom.xml`, `build.gradle`, `build.gradle.kts`
   - Swift: `Package.swift`
   - Ruby: `Gemfile`, `.gemspec`
   - PHP: `composer.json`

2. **Is a working directory**:
   - Contains only files (no subdirectories), OR
   - Contains files + subdirectories where all subdirectories contain only files (max 1 nesting level)

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

- RULE 1 (highest priority): Check for package manifest
- RULE 2: Check if working directory (leaf or 1-level nested)

**Exclusion List:**
`.git`, `node_modules`, `.nx`, `.expo`, `dist`, `build`, `.next`, `.vercel`, `.yarn`,
`coverage`, `.turbo`, `.cache`, `logs`, `target`, `__pycache__`, `venv`, `.venv`

**Step 3: Categorize Core Nodes**

Group by:

- **Type**: Package vs. Working Directory
- **Language**: JavaScript/TypeScript, Rust, Python, Go, Java, Swift, Ruby, PHP, Other
- **Purpose**: Inferred from path and manifest

### Phase 2: User Confirmation

**Required: Get user confirmation before any file creation/modification**

Present summary:

- Found {count} core nodes
- Packages by language
- Working Directories
- Actions needed (create/update/skip counts)
- Whether `.claude/rules/` scaffolding will be offered

### Phase 3: Generation

## Content Model

### What to Generate

Each CLAUDE.md should answer: **"What would a capable developer need to know about this
package that they cannot figure out by reading the code?"**

Generate content in these categories only:

1. **Overview** (1-2 sentences): What this package does and its role in the larger system
2. **Non-obvious commands**: Commands that are non-standard, require env vars, or have
   important ordering requirements. Skip commands that are self-evident from package.json
3. **Conventions and gotchas**: Project-specific patterns, constraints, or behaviors that
   regularly surprise contributors. Skip standard language or framework conventions
4. **External doc references**: Use `@path/to/file` syntax to reference READMEs,
   architecture docs, or design decisions rather than inlining them

### What NOT to Generate

- `## Dependencies` sections listing package versions (Claude can read package.json)
- `## Key Files` or `## Structure` sections listing directory contents (Claude can use `git ls-files`)
- `## Architecture` sections describing what Claude can infer from reading the code
- `[TODO]` placeholder entries
- Self-evident commands like `npm test` or `npm run build` that need no elaboration
- Standard language idioms or well-known framework patterns

## Content Templates

### Root CLAUDE.md Template

```markdown
# {Project Name}

{1-2 sentence description of the project and its purpose}

## Essential Commands

{Only commands that are non-obvious, require env vars, or have constraints}
{Skip standard build/test/lint if they work as expected}

## Conventions and Gotchas

{Non-obvious patterns, constraints, or behaviors specific to this project}
{Each entry should answer: "what would trip up a new contributor?"}

## Repository Structure

{Only if the structure is non-obvious or has conventions that affect how to work in it}
{Skip if the directory layout is self-evident}
```

### Package/Module CLAUDE.md Template

```markdown
# {Package Name}

{1-2 sentence description of this package's purpose and role}

## Non-Obvious Commands

{Package-specific commands that have gotchas, required env vars, or non-standard behavior}

## Conventions

{Package-specific patterns or constraints not visible from reading the code}
{e.g., "All public functions must be registered in src/index.ts or they won't be exported"}

## Gotchas

{Known surprising behaviors, footguns, or non-obvious constraints}
{e.g., "This package must not import from @myapp/core — creates a circular dep"}
```

### Working Directory CLAUDE.md Template

```markdown
# {Directory Name}

{1 sentence on what lives here}

## Notes

{Any non-obvious constraints or conventions for this directory}
```

## Hierarchy Deduplication

Each level in the CLAUDE.md hierarchy should **complement** its ancestors, not repeat them.
Before writing any entry to a subdirectory CLAUDE.md, check whether the same information
already exists in any ancestor CLAUDE.md. If it does, omit it from the subdirectory file.

- **Root CLAUDE.md**: Team-wide conventions, repo-wide commands, workspace-level gotchas
- **Package CLAUDE.md**: Package-specific behavior not covered by the root
- **Feature/module CLAUDE.md**: Module-specific constraints or patterns not covered above

When a convention applies only within a specific subtree, put it in the most specific
CLAUDE.md that covers all relevant code, not in the root.

## `.claude/rules/` Scaffolding

When initializing a project that has clear cross-cutting concerns, offer to create
`.claude/rules/<topic>.md` stubs alongside the CLAUDE.md files:

**Offer to create rules stubs for topics such as:**

- `testing.md` — if the project uses a non-standard test runner or patterns
- `api-design.md` — if the project has an API surface with conventions
- `security.md` — if there are security-sensitive areas with specific constraints
- `commit-conventions.md` — if there are non-obvious branching or commit requirements

Rules with `paths` frontmatter only activate when Claude works with matching files,
reducing noise for unrelated work:

```markdown
---
paths:
  - src/api/**/*.ts
---

# API Design Rules

{Conventions here only apply when editing API files}
```

Ask the user before creating any rules files. Rules are optional scaffolding — CLAUDE.md
is the primary artifact.

## Length Constraint

**Target: under 200 lines per CLAUDE.md file.**

If the generated content for a node would exceed 200 lines, factor detailed topic-specific
content into `.claude/rules/<topic>.md` and reference it from the CLAUDE.md instead.

## Critical Preservation Rules

### Never Modify (Tier 1: Absolute Protection)

1. User-written sections (not from templates)
2. Custom section headings not matching template
3. Personal notes, warnings, tips
4. Code examples written by users
5. First-person language

### Update with Caution (Tier 2)

1. Command lists — add only, never remove without confirmation
2. Conventions sections — propose additions, show diff before applying

### Can Regenerate (Tier 3)

1. Sections marked: `<!-- AUTO-GENERATED - DO NOT EDIT -->`
2. Content that exactly matches a generated template with no user modification

## Success Criteria and Verification

**After generation, verify (required):**

1. **File validity**: File created/updated, not empty, has required sections
2. **Content quality**: No `[TODO]` placeholders, conventions are specific and actionable
3. **Length**: Each file is under 200 lines
4. **Deduplication**: No content duplicated from ancestor CLAUDE.md files

**Mark as failure if:**

- Any Write/Edit operation failed
- File size is 0 bytes or exceeds 200 lines
- Required sections are missing
- `[TODO]` placeholder entries are present in the output

## Error Handling

- **Permission Denied**: Offer to skip, fix permissions, or cancel
- **Cannot Parse Manifest**: Offer to skip, create without manifest info, or cancel
- **No Core Nodes Found**: Display info and suggest running on specific subdirectories

## Summary Report Format

Generate a markdown report with:

- **Summary**: Totals for nodes found, files created/updated/skipped, errors
- **Packages**: Grouped by language with status
- **Working Directories**: List with status
- **Rules Files**: Any `.claude/rules/` stubs created
- **Errors and Warnings**: Details for any failures
- **Next Steps**: Checklist for user follow-up, including running `/update-claude-md` after
  the next significant commit
