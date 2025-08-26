---
description: Initialize or update CLAUDE.md documentation files based on context and changes
argument-hint: <natural language request about documentation>
allowed-tools: Read(*), Write(*.md), Edit(*.md), MultiEdit(*.md), Glob(*), Grep(*), LS(*), Bash(git:*), Task(*)
---

# Claude-Docs Command

Intelligently manages CLAUDE.md documentation files across your repository based on natural language input and context.

## Inputs

Accept natural language input and extract intent:

- **Input text**: Parse the user's request to understand intent
  - "init" keywords: "initialize", "setup", "create"
  - "update" keywords: "update", "refresh", "sync", "maintain"
  - "git" keywords: "git changes", "uncommitted", "staged", "diff"
  - Path references: "in packages/ui", "for the UI package", specific paths mentioned

- **Derived parameters**:
  - `mode`: Inferred from keywords (init/update/auto)
  - `scope`: Default to `session`, unless git keywords detected or path specified
  - `targetPath`: Extracted from path references if mentioned

- **Clarification**: If intent is unclear, ask the user:
  - "Would you like to update based on current session changes or git diff?"
  - "Which directory would you like to focus on?"

## Task

Orchestrate intelligent CLAUDE.md file management:

1. **Parse Intent & Determine Scope**:
   - Default to `session` scope (changes in current Claude Code session)
   - Switch to `git` if git keywords detected in input
   - Use `path` scope if specific directory mentioned
   - For `init`: Process entire repository structure

2. **Analyze Change Significance**:
   Determine which changes warrant CLAUDE.md updates:
   - **Significant changes** (trigger updates):
     - New files/components added
     - Major refactoring or architectural changes
     - API changes or new exports
     - New dependencies added
     - Configuration changes (package.json, tsconfig, etc.)
     - Pattern/convention changes
   - **Insignificant changes** (skip updates):
     - Minor bug fixes
     - Typo corrections
     - Small formatting changes
     - Internal implementation details that don't affect architecture
     - Test file updates (unless testing approach changes)
   
3. **Identify Affected Directories**:
   - Find repository root (where .git exists)
   - Map changed files to their parent directories
   - Determine which directories need CLAUDE.md updates based on significance
   - **Root CLAUDE.md**: Only update for major project-wide changes:
     - New packages/modules added
     - Tech stack changes
     - Major workflow updates
     - Project configuration changes
   - **Selective Subdirectory Processing**:
     - Only create CLAUDE.md for "important" directories (see subagent criteria)
     - Typical depth limit: 3-4 levels from root (unless package boundary)
     - Skip noise directories: tests, configs, build outputs, assets

4. **Orchestrate Updates**:
   - Process root CLAUDE.md first if needed (with isRoot=true)
   - Process affected package directories (single-directory focus)
   - Handle subdirectory recommendations from subagent responses

## Delegation

For root directory (if significant changes detected):
Invoke **claude-docs-manager** with:
- `targetPath`: Repository root path
- `isRoot`: true
- `changes`: List of significant changes affecting project-wide scope
- `changeContext`: Why these changes were made (from session context)
- `projectInfo`: Basic project metadata

For each affected directory:
Invoke **claude-docs-manager** with:
- `targetPath`: Directory path (single directory only)
- `isRoot`: false
- `changes`: List of changes specific to this directory
- `changeContext`: Why these changes were made
- `projectInfo`: Basic project metadata
- `rootGuidelines`: Key guidelines from root CLAUDE.md (if exists)

Handle subdirectory recommendations:
- If subagent returns `subdirectoriesToProcess`, invoke subagent for each
- Continue recursively until no more subdirectories need processing

## Output

Return aggregated results:
```yaml
summary: |
  Successfully processed N directories
  Created: X files
  Updated: Y files
  Skipped: Z files (no significant changes)
  
operations:
  - path: /path/to/CLAUDE.md
    operation: created|updated|skipped
    reason: [why this operation was performed]
    significantChanges: [list of changes that triggered update]

skippedDueToInsignificance:
  - path: /path/to/skipped/directory
    changes: [minor changes that didn't warrant update]

errors:
  - path: /path/to/failed/CLAUDE.md
    error: [error message]
```

## Examples

```bash
# Initialize entire repository
/claude-docs initialize the documentation

# Update based on current session changes (default)
/claude-docs update the docs
/claude-docs sync documentation with my changes

# Update based on git changes
/claude-docs update based on git diff
/claude-docs sync with uncommitted changes

# Process specific package
/claude-docs update the UI package documentation
/claude-docs refresh docs for packages/ui

# Natural language requests
/claude-docs "I just refactored the API layer, update the relevant docs"
/claude-docs "initialize CLAUDE.md files for this monorepo"
/claude-docs "sync the documentation with what I've changed today"
```

## Implementation Notes

1. **Natural Language Understanding**: Parse user intent from free-form text
2. **Significance Detection**: Only update CLAUDE.md for meaningful changes
3. **Session-First Default**: Prioritize current session changes unless specified
4. **Single-Directory Focus**: Each subagent invocation handles one directory
5. **Recursive Processing**: Handle subdirectory recommendations from subagent
6. **Preserve Custom Content**: Respect user-added content in existing files
7. **Context Propagation**: Pass change context and rationale to subagent
8. **Smart Root Updates**: Only update root CLAUDE.md for project-wide changes