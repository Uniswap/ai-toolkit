---
description: Initialize or update CLAUDE.md documentation files based on context and changes
argument-hint: <natural language request about documentation>
allowed-tools: Read(*), Write(*.md), Edit(*.md), MultiEdit(*.md), Glob(*), Grep(*), LS(*), Bash(git:*), Task(*)
---

# Claude-Docs Command

Intelligently manages CLAUDE.md documentation files across your repository. Supports both initialization of new documentation and updates based on changes.

## Inputs

Accept natural language input and extract intent:

- **Input text**: Parse the user's request to understand intent
  - **"init" keywords**: "init", "initialize", "setup", "create", "bootstrap", "start"
    - Triggers: "init docs", "initialize documentation", "setup CLAUDE.md files"
    - Routes to: **claude-docs-initializer** agent
  - **"update" keywords**: "update", "refresh", "sync", "maintain" (or no init keywords)
    - Triggers: "update docs", "sync documentation", "refresh based on changes"
    - Routes to: **claude-docs-manager** agent
  - **"git" keywords**: "git changes", "uncommitted", "staged", "diff"
  - Path references: "in packages/ui", "for the UI package", specific paths mentioned

- **Derived parameters**:
  - `mode`: Explicitly check for init keywords first, otherwise assume update
  - `scope`: For updates - default to `session`, unless git keywords detected
  - `targetPath`: Extracted from path references if mentioned

- **Clarification**: If intent is unclear:
  - For existing repos: "Would you like to initialize new documentation or update existing?"
  - For updates: "Should I update based on current session changes or git diff?"

## Task

Orchestrate intelligent CLAUDE.md file management:

1. **Parse Intent & Determine Mode**:
   - Check for initialization keywords → Use **init** mode
   - Otherwise → Use **update** mode
   - For updates: Determine scope (session/git/path)
   - For init: Check if CLAUDE.md files already exist (warn if they do)

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
   
3. **Prepare Change List**:
   - Find repository root (where .git exists)
   - Collect all significant changes with their full paths
   - Include change context explaining why modifications were made
   - Filter out insignificant changes (typos, formatting, minor bug fixes)

4. **Single Agent Invocation**:
   - Call claude-docs-manager ONCE with ALL changes
   - Agent will identify all affected CLAUDE.md files
   - Agent will update each file at the appropriate scope
   - Agent handles the Documentation Proximity Principle internally

## Delegation

### For Initialization Mode:

Invoke **claude-docs-initializer** with:
- `rootPath`: Repository root path (where .git exists)
- `projectInfo`: Basic project metadata (if detected)
  - `name`: Project name from package.json
  - `type`: Project type (monorepo, library, app, etc.)
  - `techStack`: Initially detected technologies
  - `packageManager`: npm, yarn, bun, pnpm, etc.
- `maxDepth`: Optional depth limit from root directory (default: 5)

The agent will:
- Perform deep repository analysis
- Identify all directories needing documentation
- Create CLAUDE.md files at appropriate levels
- Return comprehensive initialization results

### For Update Mode:

Invoke **claude-docs-manager** with:
- `changes`: Complete list of all significant file changes
  - `filePath`: Absolute path to changed file
  - `changeType`: added|modified|deleted
  - `description`: Brief description of the change
- `changeContext`: Why these changes were made (from session/git context)
- `projectInfo`: Basic project metadata
  - `name`: Project/package name
  - `type`: Project type (monorepo, library, app, etc.)
  - `techStack`: Detected technologies
  - `packageManager`: npm, yarn, bun, etc.
- `rootGuidelines`: (Optional) Key guidelines from existing root CLAUDE.md

The agent will:
- Identify ALL CLAUDE.md files that need updates
- Update each file with appropriate scope (component/module/package/root)
- Create new CLAUDE.md files where needed
- Return all updated files in a single response

## Output

### For Initialization:

Return results from claude-docs-initializer:
```yaml
summary: |
  Repository type: [monorepo|single-package|library]
  Successfully created N CLAUDE.md files
  Analyzed X directories
  
createdFiles:
  - path: /path/to/CLAUDE.md
    level: root|package|module|component
    keyFindings: [what was discovered]

discoveredPatterns:
  architecture: [detected architecture]
  conventions: [coding conventions found]
  
errors:
  - path: /path/to/failed/CLAUDE.md
    error: [error message]
```

### For Updates:

Return results from claude-docs-manager:
```yaml
summary: |
  Successfully updated N CLAUDE.md files
  Created: X files
  Updated: Y files
  Skipped: Z files (changes not relevant at those levels)
  
updatedFiles:
  - path: /path/to/CLAUDE.md
    operation: created|updated
    changes: [what was added/modified in this file]
    scope: root|package|module|component

skippedFiles:
  - path: /path/to/CLAUDE.md
    reason: "Changes don't affect this level's documentation"

errors:
  - path: /path/to/failed/CLAUDE.md
    error: [error message]
```

## Examples

```bash
# Initialize new documentation (first time setup)
/claude-docs init
/claude-docs initialize documentation
/claude-docs setup CLAUDE.md files
/claude-docs "create initial documentation for this repo"
/claude-docs "bootstrap the CLAUDE.md files"

# Update based on current session changes (default)
/claude-docs update
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

1. **Mode Detection**: Check for init keywords first, default to update mode
2. **Agent Selection**: Route to appropriate agent based on mode
   - Initialization → claude-docs-initializer (discovery-driven)
   - Updates → claude-docs-manager (change-driven)
3. **Significance Detection**: For updates, only pass meaningful changes
4. **Session-First Default**: For updates, prioritize session changes unless specified
5. **Comprehensive Init**: Initializer analyzes entire codebase for complete context
6. **Single Invocation**: Each agent processes everything in one call
7. **Preserve Custom Content**: Both agents respect user-added content
8. **Documentation Hierarchy**: Both agents understand and respect level-appropriate content