---
description: Initialize or update CLAUDE.md documentation files based on context and changes
argument-hint: <natural language request about documentation>
allowed-tools: Read(*), Write(*.md), Edit(*.md), MultiEdit(*.md), Glob(*), Grep(*), LS(*), Bash(git:*), Task(*)
---

# Claude-Docs Command

Intelligently manages CLAUDE.md documentation files across your repository. Supports both initialization of new documentation and updates based on changes.

## Common Input Processing

Accept natural language input and extract intent:

- **Input text**: Parse the user's request to understand intent
  - **"init" keywords**: "init", "initialize", "setup", "create", "bootstrap", "start"
    - Triggers: "init docs", "initialize documentation", "setup CLAUDE.md files"
    - Routes to: **INIT Path** (claude-docs-initializer agent)
  - **"update" keywords**: "update", "refresh", "sync", "maintain" (or no init keywords)
    - Triggers: "update docs", "sync documentation", "refresh based on changes"
    - Routes to: **UPDATE Path** (claude-docs-manager agent)
  - **Additional keywords**:
    - **"git" keywords**: "git changes", "uncommitted", "staged", "diff"
    - Path references: "in packages/ui", "for the UI package", specific paths mentioned

- **Mode determination**:
  1. Explicitly check for init keywords first → Use **INIT Path**
  2. Otherwise → Use **UPDATE Path** (default)
  3. Extract any file limit specification (e.g., "init with max 50 files per agent")
  4. For init: Check if CLAUDE.md files already exist (warn if they do)

- **Clarification**: If intent is unclear:
  - For existing repos: "Would you like to initialize new documentation or update existing?"
  - For updates: "Should I update based on current session changes or git diff?"

## UPDATE Path (Default)

### Inputs for Update

- **Derived parameters**:
  - `scope`: Default to `session`, unless git keywords detected
  - `targetPath`: Extracted from path references if mentioned
  - `changeContext`: Why these changes were made (from session/git context)

### Task for Update

1. **Analyze Change Significance**:
   - Identify significant vs insignificant changes
   - Filter out minor fixes, typos, formatting

2. **Single Agent Invocation**:
   - Call claude-docs-manager with all changes
   - Agent handles Documentation Proximity Principle

### Delegation for Update

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

### Output for Update

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

### Examples for Update

```bash
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
/claude-docs "sync the documentation with what I've changed today"
```

## INIT Path

### ⏱️ CRITICAL: User Communication FIRST

**Before invoking any agents, ALWAYS display this performance notice to the user:**

```
⏱️  **Performance Notice**: CLAUDE.md initialization will take 10-15+ minutes for medium-sized repositories.

The process will:
- Analyze your entire repository structure
- Read and parse hundreds of files
- Generate comprehensive documentation at multiple levels
- Create 3-10+ CLAUDE.md files depending on repository size

Please be patient - the process is working even during apparent pauses.
```

**Only after displaying this message should you proceed with repository analysis.**

### Inputs for Init

- **Derived parameters**:
  - `fileLimit`: Default 100 files per agent (or user-specified)
  - `targetPath`: Extracted from path references if mentioned

### Task for Init

1. **Repository Analysis**:
   - Use git to quickly understand structure: `git ls-files | wc -l`
   - Find major boundaries: packages, apps, services
   - Count files per area: `git ls-files [area] | wc -l`
   - Assess complexity by file types and patterns

2. **Intelligent Area Splitting**:
   - Default: 100 files at most per agent (or user-specified limit)
   - Split areas exceeding limits into logical sub-areas
   - Identify natural boundaries (pages vs components, routes vs services)

3. **Build Hierarchical Execution Plan**:
   - Level 1: Parallel leaf agents for split areas
   - Level 2: Area root agents (wait for their leaves)
   - Level 3: Repository root agent (waits for all areas)
   - Track dependencies between levels

Example execution plan for large monorepo:
```
Level 1 (Parallel leaf documentation):
  - Agent A: "Document user-facing frontend pages in /frontend/pages/user (50 files)"
  - Agent B: "Document admin frontend pages in /frontend/pages/admin (45 files)"
  - Agent C: "Document shared UI components in /frontend/components (80 files)"
  - Agent D: "Document backend API routes in /backend/routes (60 files)"
  - Agent E: "Document backend services in /backend/services (40 files)"

Level 2 (Area roots - wait for their leaves):
  - Agent F: "Create frontend root CLAUDE.md" (waits for A,B,C)
  - Agent G: "Create backend root CLAUDE.md" (waits for D,E)

Level 3 (Repository root - wait for all areas):
  - Agent H: "Create repository root CLAUDE.md with documentation management rules" (waits for F,G) - uses claude-docs-manager
```

4. **Execute Plan with Task Tool**:
   - Run Level 1 agents in parallel
   - Collect coordinationContext from each
   - Run Level 2 with context from their leaves
   - Run Level 3 with all area contexts
   - Aggregate all results

### Delegation for Init

Execute hierarchical parallelized documentation creation:

#### Phase 1: Repository Analysis

**⚠️ CRITICAL: ALWAYS prefer git commands over find/glob for discovery!**
- Git automatically excludes node_modules, build outputs, and ignored files
- Only use find/glob as fallback for non-git repositories
- If using find, MUST use `*/node_modules/*` not `./node_modules/*` for exclusions

Quickly analyze repository structure using git:
- Get total file count: `git ls-files | wc -l`
- Find package boundaries: `git ls-files | grep 'package\.json$'`
- Identify tech stacks used and major directories and their sizes
- Determine complexity based on file patterns and structure

#### Phase 2: Create Execution Plan

Based on analysis, determine splitting strategy

#### Phase 3: Execute Level 1 - Parallel Leaf Documentation

Invoke multiple **claude-docs-initializer** agents in PARALLEL:

For each Level 1 agent:
- `target`: "Document [specific area description] in [path]"
- `siblingContext`: "Other agents are documenting: [list of other Level 1 areas]"

Agents work simultaneously on different areas.

#### Phase 4: Execute Level 2 - Area Root Documentation

After Level 1 agents complete for an area, invoke **claude-docs-initializer**:

- `target`: "Create root CLAUDE.md for the [area] summarizing its architecture"
- `siblingContext`: "Other root agents are creating: [list of other area roots]"
- `completedContext`: [Concatenated coordinationContext from relevant Level 1 agents]

#### Phase 5: Execute Level 3 - Repository Root

After all Level 2 agents complete, invoke **claude-docs-manager**:

- `changes`: Empty list (no specific file changes for init)
- `changeContext`: "Initial repository documentation setup"
- `projectInfo`: [Gathered project metadata from analysis]
- `rootGuidelines`: null (creating for first time)
- `isRoot`: true (triggers inclusion of Documentation Management rules)
- `completedContext`: [Concatenated coordinationContext from all Level 2 agents]

**Note**: We use claude-docs-manager here specifically to ensure the Documentation Management rules are properly included in the root CLAUDE.md.

### Output for Init

Return aggregated results from all agents (claude-docs-initializer for all levels except repository root, claude-docs-manager for repository root only):
```yaml
summary: |
  Repository analysis: [monorepo with X packages | single app | library]
  Execution: [N agents in parallel across M levels]
  Successfully created [total] CLAUDE.md files
  Total files analyzed: [sum across all agents]

executionPlan:
  level1Agents: 5 # Parallel leaf documentation
  level2Agents: 2 # Area roots
  level3Agents: 1 # Repository root
  totalExecutionTime: "2m 34s"

createdFilesByLevel:
  leafDocumentation:
    - agent: "frontend-user-pages"
      files: 3
      paths: ["/frontend/pages/user/CLAUDE.md", ...]
    - agent: "frontend-admin-pages"
      files: 2
      paths: ["/frontend/pages/admin/CLAUDE.md", ...]

  areaRoots:
    - path: "/frontend/CLAUDE.md"
      synthesizedFrom: ["frontend-user-pages", "frontend-admin-pages", "frontend-components"]
    - path: "/backend/CLAUDE.md"
      synthesizedFrom: ["backend-routes", "backend-services"]

  repositoryRoot:
    - path: "/CLAUDE.md"
      synthesizedFrom: ["frontend-root", "backend-root", "database"]

architecturalFindings: # Aggregated from all agents
  frontend: "Next.js 14 with App Router, Tailwind CSS, 234 total components"
  backend: "Express with layered architecture, 23 RESTful endpoints"
  database: "PostgreSQL with Prisma ORM, 15 models"
  patterns: "Consistent use of TypeScript, feature-based organization"

recommendations: # Collected from all agents
  - "Split large UserDashboard component (500+ lines)"
  - "Add CLAUDE.md for growing analytics module"
  - "Consider documenting complex auth flow separately"

errors: # Any failures across all agents
  - agent: "frontend-utils"
    error: "Failed to analyze due to circular dependencies"
```

### Examples for Init

```bash
# Initialize new documentation (first time setup)
/claude-docs init
/claude-docs initialize documentation
/claude-docs setup CLAUDE.md files

# Initialize with custom file limit per agent
/claude-docs init with max 50 files per agent
/claude-docs initialize docs limiting each agent to 100 files

# Initialize for large repository (automatic splitting)
/claude-docs "create initial documentation for this large monorepo"
# → Analyzes repo, finds 3000+ files
# → Splits into 8 parallel agents across 3 levels
# → Creates comprehensive hierarchical documentation

# Natural language requests
/claude-docs "initialize CLAUDE.md files for this monorepo"
```

## Example Workflow

### Large Next.js + Supabase Monorepo - Init Path

When user runs: `/claude-docs init`

1. **Quick Analysis** determines:
   ```
   Total files: 2500
   Frontend: /app (1800 files)
   Backend: /api (500 files)
   Database: /supabase (200 files)
   ```

2. **Intelligent Splitting** creates plan:
   ```
   Frontend needs splitting (1800 > 100):
   - /app/(user) → 450 files (complex pages) → split to 150x3
   - /app/(admin) → 350 files (complex) → split to 175x2
   - /app/components → 600 files (simple UI) → split to 300x2
   - /app/lib → 400 files (utilities) → split to 200x2

   Backend needs splitting (500 > 100):
   - /api/routes → 300 files → split to 150x2
   - /api/services → 200 files → split to 100x2

   Database ok as single (200 files, moderate complexity)
   ```

3. **Hierarchical Execution**:
   ```
   Level 1 (14 agents in parallel):
   ├── frontend-user-1 (150 files)
   ├── frontend-user-2 (150 files)
   ├── frontend-user-3 (150 files)
   ├── frontend-admin-1 (175 files)
   ├── frontend-admin-2 (175 files)
   ├── frontend-components-1 (300 files)
   ├── frontend-components-2 (300 files)
   ├── frontend-lib-1 (200 files)
   ├── frontend-lib-2 (200 files)
   ├── backend-routes-1 (150 files)
   ├── backend-routes-2 (150 files)
   ├── backend-services-1 (100 files)
   ├── backend-services-2 (100 files)
   └── database (200 files)

   Level 2 (2 agents, wait for their leaves):
   ├── frontend-root (waits for 9 frontend agents)
   └── backend-root (waits for 4 backend agents)

   Level 3 (1 agent, waits for all):
   └── repository-root (waits for frontend-root, backend-root, database) - claude-docs-manager
   ```

4. **Result**: 17 agents total, 14 run in parallel initially, creating comprehensive documentation in ~2-3 minutes instead of 15+ minutes sequentially.

## Implementation Notes

1. **Mode Detection**: Check for init keywords first, default to update mode
2. **Agent Orchestration**:
   - **INIT Path**: Parallel multi-agent hierarchical execution
     - Level 1: Multiple agents work on different areas simultaneously
     - Level 2: Area roots synthesize findings from their leaves
     - Level 3: Repository root consolidates all area summaries
   - **UPDATE Path**: Single claude-docs-manager agent (change-driven)
3. **Intelligent Splitting** (INIT Path only):
   - Default 100 files per agent (configurable)
   - Complexity scoring adjusts effective limits
   - Natural boundary detection (pages/components, routes/services)
4. **Context Flow** (INIT Path):
   - Leaf agents generate coordinationContext
   - Area roots receive and synthesize leaf contexts
   - Repository root receives all area contexts
5. **Parallel Execution**: Use Task tool to spawn multiple agents simultaneously
6. **Session-First Default**: For updates, prioritize session changes unless specified
7. **Preserve Custom Content**: Both agents respect user-added content sections
8. **Documentation Hierarchy**: Agents create docs only at their assigned level