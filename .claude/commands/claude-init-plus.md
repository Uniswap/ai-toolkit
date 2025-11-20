---
description: Initialize or update CLAUDE.md files at all core nodes in the workspace
argument-hint: (no arguments - scans entire workspace automatically)
allowed-tools: Glob(*), Read(*), Write(*), Edit(*), Bash(tree:*), Bash(find:*), mcp__nx-mcp__nx_workspace, mcp__nx-mcp__nx_project_details
---

# `/claude-init-plus` - Intelligent CLAUDE.md Generation

## Purpose

Scan the Nx workspace to identify "core nodes" and generate/update CLAUDE.md files at each node. This creates documentation that helps future Claude Code sessions understand the project without reading every file.

## Core Node Definition

A directory is a **core node** if it meets **either** criterion:

1. **Has `package.json`** (Nx app/library) → Always a core node
2. **Is a working directory**:
   - Contains ONLY files (no subdirectories), OR
   - Contains files + subdirectories where ALL subdirectories contain ONLY files (max 1 nesting level)

**Examples:**

- ✅ `apps/qr-code-management/` (has package.json)
- ✅ `.github/workflows/` (only files)
- ✅ `apps/app/src/components/` (files + shallow subdirs with only files)
- ❌ `apps/` (container with multi-level dirs)
- ❌ `.git/` (deep structure)

## Usage

```bash
/claude-init-plus
```

## Execution Flow

### Phase 1: Discovery & Analysis

**Step 1: Check Prerequisites**

```bash
# Verify in workspace root
nx_workspace → Get workspace structure
```

**Step 2: Find All Core Nodes**

Traverse workspace using BFS (breadth-first search):

```
For each directory:
  1. Check exclusion list (skip if matches)
  2. Apply core node detection:

     RULE 1 (HIGHEST PRIORITY): Check for package.json
     if [ -f "$dir/package.json" ]; then
       → Mark as Core Node (Nx Project)
       → Record type: "nx-project"
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
`.git`, `node_modules`, `.nx`, `.expo`, `dist`, `build`, `.next`, `.vercel`, `.yarn`, `coverage`, `.turbo`, `.cache`, `logs`

**Step 3: Categorize Core Nodes**

For each core node:

- If has `package.json` → Use `nx_project_details` to get project info
- Otherwise → Analyze directory contents to determine purpose

### Phase 2: User Confirmation

**REQUIRED: Get user confirmation before any file creation/modification**

Present summary:

```
Found {count} core nodes:

Nx Projects ({count}):
  Apps ({count}): {list paths}
  Libraries ({count}): {list paths}

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

If user selects "review":

```
For each file requiring action:
  {path}/CLAUDE.md - {CREATE | UPDATE}
  Sections: {list sections}
  Size: ~{lines} lines

  Skip this file? (y/N):
```

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
2. Dependency lists (ADD/REMOVE based on package.json changes)
3. File structure listings (ADD new files/dirs only)

**Update Method for Tier 2:**

- Use Edit tool with precise old_string/new_string
- Never rewrite entire sections
- Preserve formatting (maintain list style, sort order)

### Can Regenerate (Tier 3: Auto-Generated)

1. Sections marked: `<!-- AUTO-GENERATED - DO NOT EDIT -->`
2. Content that exactly matches package.json/project.json

**Verification (REQUIRED before every update):**

- [ ] Is section marked AUTO-GENERATED? (If no → Tier 2 rules)
- [ ] Will change remove existing text? (If yes → flag for review)
- [ ] Using Edit tool with specific old_string? (If no → STOP)
- [ ] Preserving formatting? (If no → adjust)

**If ANY checklist item fails → DO NOT auto-apply → Show user for confirmation**

## Content Templates

### For Nx Projects

**Minimal sections (always include):**

```markdown
# {Project Name}

## Overview
{1-2 sentence description of purpose}

## Key Commands
{List Nx targets from project.json:}
- `nx {target} {project}` - {description}

## Dependencies
<!-- AUTO-GENERATED - Updated by /update-claude-md -->
{For each main dependency:}
- **{package}** ({version}) - {purpose in 5-10 words}

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory or subdirectories,
Claude Code MUST run `/update-claude-md` before presenting results to
ensure this documentation stays synchronized with the codebase.
```

**Extended sections (add if applicable):**

- "Project Structure" (if >5 directories)
- "Architecture" (if has state management libs)
- "Testing" (if has test files)
- "Environment Variables" (if has .env.example)
- "Troubleshooting" (leave blank for user to fill)

### For Working Directories

```markdown
# {Directory Name}

## Purpose
{What this directory contains}

## Key Files
{Important files:}
- `{filename}` - {purpose}

## Conventions
{Naming patterns, structure rules}

## Auto-Update Instructions

After changes here, run `/update-claude-md` to keep documentation current.
```

## Implementation Steps

**For Each Core Node:**

1. **Check if CLAUDE.md exists**

   ```bash
   Read {node-path}/CLAUDE.md
   ```

2. **If file doesn't exist:**
   - Select appropriate template (Nx project vs. working directory)
   - Gather information:
     - For Nx projects: Use `nx_project_details` for targets, dependencies
     - For working dirs: List files, infer purpose
   - Populate template with gathered info
   - Add dependency descriptions:

     ```
     For each dependency:
       1. Check if commonly known (react, next.js, etc.) → Use standard description
       2. Otherwise: Add [TODO: Add description]
     ```

   - Write file using Write tool
   - Report: "✅ Created {path}/CLAUDE.md"

3. **If file exists:**
   - Read current content
   - Parse into sections
   - Compare with current project state:
     - Missing Nx targets?
     - New dependencies?
     - Outdated information?
   - If significant gaps found:

     ```
     Show user:
       Found existing CLAUDE.md at {path}

       Proposed updates:
       1. {Section} - {change description}
       2. {Section} - {change description}

       Show detailed diff? (y/n):
     ```

   - If user confirms, apply updates using Edit tool
   - Report: "✅ Updated {path}/CLAUDE.md ({n} sections)"

4. **If file is up-to-date:**
   - Report: "⏭️  Skipped {path}/CLAUDE.md (up-to-date)"

## Success Criteria & Verification

**After generation, verify (REQUIRED):**

1. **File Validity**

   ```bash
   # Check file was created/updated
   test -f {path}/CLAUDE.md

   # Check file is not empty
   test -s {path}/CLAUDE.md

   # Verify contains required sections
   grep -q "## Overview" {path}/CLAUDE.md
   grep -q "## Auto-Update Instructions" {path}/CLAUDE.md
   ```

2. **Content Quality**
   - For Nx projects: All targets from project.json documented
   - No placeholder text like "[Project Name]" remains
   - All dependency entries have descriptions (even if [TODO])

3. **Required Sections Present**
   - Every CLAUDE.md MUST have:

     - ## Overview (or ## Purpose)

     - ## Auto-Update Instructions

   - Nx projects MUST also have:

     - ## Key Commands

     - ## Dependencies

**Mark as FAILURE if:**

- ANY Write/Edit operation failed
- File size is 0 bytes
- Required sections missing
- Cannot parse as valid Markdown

## Error Handling

**Permission Denied:**

```
❌ Permission denied: {path}

Options:
1. Skip this directory (may cause incomplete documentation)
2. Fix permissions: chmod -R u+rw {path}
3. Cancel operation

Choose (1/2/3):
```

**Corrupted package.json:**

```
⚠️  Cannot parse {path}/package.json
Syntax error: {message}

Options:
1. Skip this project
2. Create CLAUDE.md without dependency info
3. Cancel operation

Choose (1/2/3):
```

**No Nx workspace detected:**

```
❌ ERROR: Not in an Nx workspace

This command requires an Nx monorepo.

Current directory: {pwd}
```

→ STOP EXECUTION

## Summary Report Format

Use this EXACT format:

```markdown
# CLAUDE.md Initialization Report

## Summary Statistics
- **Total core nodes found:** {count}
- **CLAUDE.md files created:** {count}
- **CLAUDE.md files updated:** {count}
- **Skipped (up-to-date):** {count}
- **Errors encountered:** {count}

## Nx Projects ({count} projects)

### Applications ({count})
{For each app:}
{✅|⏭️|❌} {relative-path} - {action}

### Libraries ({count})
{For each lib:}
{✅|⏭️|❌} {relative-path} - {action}

## Working Directories ({count} directories)
{For each dir:}
{✅|⏭️|❌} {relative-path} - {action}

## Errors & Warnings
{If any:}
- **Path:** {path}
- **Error:** {message}
- **Recommendation:** {how to fix}

## Next Steps
- [ ] Review generated CLAUDE.md files for accuracy
- [ ] Add descriptions where marked [TODO]
- [ ] Test: Make a small change, run `/update-claude-md`
- [ ] Commit new/updated CLAUDE.md files
```

## Decision Flowchart

```
START
  ↓
Check Nx Workspace ──NO──> ERROR: Not Nx workspace → END
  ↓ YES
Scan for Core Nodes
  ↓
Core Nodes Found? ──NO──> Report: No core nodes → END
  ↓ YES
Present Summary to User
  ↓
User Approves? ──NO──> Report: Cancelled by user → END
  ↓ YES
For Each Core Node:
  ↓
  CLAUDE.md Exists?
    ↓ NO                      ↓ YES
  Generate New          Compare with Current State
    ↓                          ↓
  Write File            Needs Update? ──NO──> Skip
    ↓                          ↓ YES
  Success? ──NO──> Log Error     Show Diff, Get Confirmation
    ↓ YES                      ↓
  Report Created        User Approves? ──NO──> Skip
                              ↓ YES
                        Apply Updates
                              ↓
                        Success? ──NO──> Log Error
                              ↓ YES
                        Report Updated
  ↓
Generate Summary Report
  ↓
Verify All Operations
  ↓
Report Final Status
  ↓
END
```

## Integration with /update-claude-md

Every generated CLAUDE.md includes auto-update instructions. This creates a self-maintaining system:

1. `/claude-init-plus` creates initial structure
2. `/update-claude-md` keeps it current as code evolves
3. Claude Code automatically maintains context
