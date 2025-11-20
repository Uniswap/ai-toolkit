---
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

1. **Has a package manifest** → Always a core node

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

**Examples:**

- ✅ `apps/web/` (has package.json)
- ✅ `backend/api/` (has Cargo.toml)
- ✅ `.github/workflows/` (only files)
- ✅ `src/components/` (files + shallow subdirs with only files)
- ❌ `apps/` (container with multi-level dirs)
- ❌ `.git/` (deep structure)
- ❌ `node_modules/` (excluded by default)

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
git ls-files | grep -E '(package\.json|Cargo\.toml|pyproject\.toml|setup\.py|go\.mod|pom\.xml|build\.gradle|Package\.swift|Gemfile|.*\.gemspec|composer\.json)$'
```

**Fallback: Use find if not a git repo**

```bash
find . -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/.nx/*' \
  -not -path '*/.cache/*' \
  -not -path '*/target/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/venv/*' \
  -not -path '*/.venv/*'
```

**Step 2: Identify Core Nodes Using BFS**

Traverse workspace using BFS (breadth-first search):

```
For each directory:
  1. Check exclusion list (skip if matches)
  2. Apply core node detection:

     RULE 1 (HIGHEST PRIORITY): Check for package manifest
     if [ -f "$dir/package.json" ]; then
       → Mark as Core Node (Package: npm-package, JavaScript/TypeScript)
       → Read manifest for name, scripts, dependencies
       → Skip to next directory
     elif [ -f "$dir/Cargo.toml" ]; then
       → Mark as Core Node (Package: cargo-package, Rust)
       → Read manifest for name, dependencies
       → Skip to next directory
     elif [ -f "$dir/pyproject.toml" ]; then
       → Mark as Core Node (Package: python-package, Python)
       → Read manifest for name, scripts, dependencies
       → Skip to next directory
     elif [ -f "$dir/setup.py" ]; then
       → Mark as Core Node (Package: python-package, Python)
       → Read setup.py for basic info
       → Skip to next directory
     elif [ -f "$dir/go.mod" ]; then
       → Mark as Core Node (Package: go-module, Go)
       → Read go.mod for module name
       → Skip to next directory
     elif [ -f "$dir/pom.xml" ]; then
       → Mark as Core Node (Package: maven-project, Java)
       → Read pom.xml for artifactId, groupId
       → Skip to next directory
     elif [ -f "$dir/build.gradle" ] || [ -f "$dir/build.gradle.kts" ]; then
       → Mark as Core Node (Package: gradle-project, Java/Kotlin)
       → Read build.gradle for project info
       → Skip to next directory
     elif [ -f "$dir/Package.swift" ]; then
       → Mark as Core Node (Package: swift-package, Swift)
       → Read Package.swift for package name
       → Skip to next directory
     elif [ -f "$dir/Gemfile" ] || [ -f "$dir"/*.gemspec ]; then
       → Mark as Core Node (Package: ruby-gem, Ruby)
       → Read Gemfile or .gemspec for gem info
       → Skip to next directory
     elif [ -f "$dir/composer.json" ]; then
       → Mark as Core Node (Package: composer-package, PHP)
       → Read composer.json for name, scripts
       → Skip to next directory
     fi

     RULE 2: Check if working directory
     files=( "$dir"/* )           # Get all files
     subdirs=( "$dir"/*/ )        # Get all subdirectories

     # Case A: Only files, no subdirectories
     if [ ${#subdirs[@]} -eq 0 ] && [ ${#files[@]} -gt 0 ]; then
       → Mark as Core Node (Working Directory - Leaf)
       → Record type: "working-dir-leaf"
     fi

     # Case B: Files + shallow subdirectories (1 level max)
     if [ ${#files[@]} -gt 0 ] && [ ${#subdirs[@]} -gt 0 ]; then
       all_subdirs_are_leaves=true
       for subdir in "${subdirs[@]}"; do
         if find "$subdir" -mindepth 1 -type d | grep -q .; then
           all_subdirs_are_leaves=false
           break
         fi
       done

       if [ "$all_subdirs_are_leaves" = true ]; then
         → Mark as Core Node (Working Directory - 1-Level)
         → Record type: "working-dir-nested"
       fi
     fi

  3. If not a core node, continue traversing into subdirectories
```

**Exclusion List:**
`.git`, `node_modules`, `.nx`, `.expo`, `dist`, `build`, `.next`, `.vercel`, `.yarn`, `coverage`, `.turbo`, `.cache`, `logs`, `target`, `__pycache__`, `venv`, `.venv`

**Step 3: Categorize Core Nodes**

Group core nodes by:

- **Type**: Package vs. Working Directory
- **Language**: JavaScript/TypeScript, Rust, Python, Go, Java, Swift, Ruby, PHP, Other
- **Purpose**: Inferred from path and manifest (app, library, tooling, workflow, etc.)

### Phase 2: User Confirmation

**REQUIRED: Get user confirmation before any file creation/modification**

Present summary:

```
Found {count} core nodes:

Packages ({count}):
  JavaScript/TypeScript: {count} ({list paths})
  Rust: {count} ({list paths})
  Python: {count} ({list paths})
  Go: {count} ({list paths})
  Java: {count} ({list paths})
  Other: {count} ({list paths})

Working Directories ({count}):
  {list paths}

Actions needed:
  - Create new CLAUDE.md: {count} files
  - Update existing CLAUDE.md: {count} files
  - Already up-to-date: {count} files

Proceed with generation/updates? (y/n/review)
  y = Apply all
  n = Cancel
  review = Show what will be created/updated for each file
```

If user selects "review", show details for each file and allow selective skipping.

### Phase 3: Generation

## ⚠️ CRITICAL PRESERVATION RULES

**THESE RULES MUST BE FOLLOWED - VIOLATIONS CAUSE DATA LOSS**

### Never Modify (Tier 1: Absolute Protection)

1. User-written sections (not from templates)
2. Custom section headings (e.g., "## Our Team's Conventions")
3. Personal notes, warnings, tips added by users
4. Code examples written by users
5. First-person language ("I", "we", "our approach")

### Modify with Caution (Tier 2: Surgical Updates Only)

1. Command lists (ADD only, never REMOVE without confirmation)
2. Dependency lists (ADD/REMOVE based on manifest changes)
3. File structure listings (ADD new files/dirs only)

**Update Method for Tier 2:**

- Use Edit tool with precise old_string/new_string
- Never rewrite entire sections
- Preserve formatting (maintain list style, sort order)

### Can Regenerate (Tier 3: Auto-Generated)

1. Sections marked: `<!-- AUTO-GENERATED - DO NOT EDIT -->`
2. Content that exactly matches package manifest

**Verification (REQUIRED before every update):**

- [ ] Is section marked AUTO-GENERATED? (If no → Tier 2 rules)
- [ ] Will change remove existing text? (If yes → flag for review)
- [ ] Using Edit tool with specific old_string? (If no → STOP)
- [ ] Preserving formatting? (If no → adjust)

**If ANY checklist item fails → DO NOT auto-apply → Show user for confirmation**

## Length Constraints

**CRITICAL: All generated CLAUDE.md files MUST be concise and focused.**

- **Token Limit**: 500 tokens or less (~2000 characters in English)
- **Why**: Keeps documentation scannable and focused on essentials
- **How to achieve**:
  - Use bullet points instead of paragraphs
  - Include only essential commands/dependencies
  - Avoid verbose descriptions (5-10 words max per item)
  - Skip redundant sections
  - Use `[TODO]` placeholders instead of long explanations

**Before writing any CLAUDE.md file:**

1. Count approximate characters (use `wc -c` or similar)
2. If >2000 characters, trim non-essential content:
   - Remove optional sections (Structure, etc.)
   - Shorten dependency descriptions
   - Consolidate similar items
3. Verify final output is ≤2000 characters

## Content Template

Use this adaptive template for ALL core nodes:

```markdown
# {Directory or Package Name}

## Overview

{1-2 sentence description of purpose}
{For packages: "This is a {language} {type} that..."}
{For working dirs: "This directory contains..."}

## {Commands|Scripts|Tasks} (if package manifest exists)

{List available commands/scripts/tasks from manifest}

{Example formats by manifest type:}

- package.json: `npm run {script}` or `nx {target} {project}`
- Cargo.toml: `cargo {command}` (build, test, run, etc.)
- pyproject.toml: `poetry run {script}` or `python -m {module}`
- go.mod: `go {command}` (build, test, run, etc.)
- pom.xml: `mvn {goal}` (compile, test, package, etc.)
- build.gradle: `./gradlew {task}` or `gradle {task}`
- Gemfile: `bundle exec {command}`
- composer.json: `composer {script}`

## {Dependencies|Requirements} (if package manifest exists)

<!-- AUTO-GENERATED - Updated by /update-claude-md -->

{For each main dependency:}

- **{package}** ({version}) - {purpose in 5-10 words or [TODO: Add description]}

## Key Files (if working directory without manifest)

{For important files:}

- `{filename}` - {purpose}

## Structure (optional - if >5 subdirectories)

{Brief overview of subdirectory organization}

## Auto-Update Instructions

After changes to files in this directory or subdirectories, run `/update-claude-md`
to keep this documentation synchronized with the codebase.
```

**Template Variables:**

- `{Directory or Package Name}`: Derived from path or manifest name field
- `{language}`: Detected from manifest type (JavaScript, Rust, Python, etc.)
- `{type}`: Detected from manifest (package, module, workspace member, etc.)
- Commands section: Generated based on manifest type
- Dependencies section: Only for directories with manifests

## Implementation Steps

**For Each Core Node:**

1. **Check if CLAUDE.md exists**

   ```bash
   Read {node-path}/CLAUDE.md
   ```

2. **If file doesn't exist:**

   - Select appropriate template
   - Gather information:
     - For packages: Read manifest for name, description, commands, dependencies
     - For working dirs: List files, infer purpose
   - Populate template with gathered info
   - Add dependency descriptions (use standard descriptions for common packages, [TODO] for others)
   - **Verify length constraint**: Check character count is ≤2000 characters
   - If too long, trim by:
     - Limiting dependency list to top 5-10 most important
     - Using shorter descriptions (5-10 words max)
     - Removing optional sections
   - Write file using Write tool
   - Report: "✅ Created {path}/CLAUDE.md ({n} chars)"

3. **If file exists:**

   - Read current content
   - Parse into sections
   - Compare with current project state (missing commands, new dependencies, outdated info)
   - If significant gaps found, show user proposed updates
   - If user confirms, apply updates using Edit tool (following preservation rules)
   - Report: "✅ Updated {path}/CLAUDE.md ({n} sections)"

4. **If file is up-to-date:**
   - Report: "⏭️ Skipped {path}/CLAUDE.md (up-to-date)"

## Success Criteria & Verification

**After generation, verify (REQUIRED):**

1. **File Validity**

   ```bash
   # Check file was created/updated
   test -f {path}/CLAUDE.md

   # Check file is not empty
   test -s {path}/CLAUDE.md

   # Verify contains required sections
   grep -q "## Overview" {path}/CLAUDE.md || grep -q "## Purpose" {path}/CLAUDE.md
   grep -q "## Auto-Update Instructions" {path}/CLAUDE.md
   ```

2. **Content Quality**

   - For packages: All commands/scripts/tasks from manifest documented
   - No placeholder text like "[Project Name]" remains
   - All dependency entries have descriptions (even if [TODO])
   - **File size**: Must be ≤2000 characters (verify with `wc -c`)
   - If >2000 characters, file is TOO VERBOSE and must be trimmed

3. **Required Sections Present**

   - Every CLAUDE.md MUST have:

     - ## Overview (or ## Purpose)

     - ## Auto-Update Instructions

   - Packages MUST also have:

     - ## Commands (or ## Scripts or ## Tasks)

     - ## Dependencies (or ## Requirements)

**Mark as FAILURE if:**

- ANY Write/Edit operation failed
- File size is 0 bytes
- File size exceeds 2000 characters (too verbose)
- Required sections missing
- Cannot parse as valid Markdown

## Error Handling

**Permission Denied**: Offer to skip, fix permissions (`chmod -R u+rw`), or cancel

**Cannot Parse Manifest**: Offer to skip, create without dependency info, or cancel

**No Core Nodes Found**: Display info message explaining detection criteria and suggest running on specific subdirectories

For all errors: Present clear options, explain consequences, await user decision.

## Summary Report Format

Generate a markdown report with:

- **Summary**: Totals for nodes found, files created/updated/skipped, errors
- **Packages**: Grouped by language with status (✅/⏭️/❌)
- **Working Directories**: List with status
- **Errors & Warnings**: Details for any failures with recommendations
- **Next Steps**: Checklist for user follow-up actions

## Integration with /update-claude-md

Every generated CLAUDE.md includes auto-update instructions. This creates a self-maintaining system:

1. `/claude-init-plus` creates initial structure
2. `/update-claude-md` keeps it current as code evolves
3. Claude Code automatically maintains context
