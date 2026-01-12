---
name: git-worktree-orchestrator
description: Create and manage git worktrees with Graphite and Linear integration. Use when user says "create a worktree", "set up a new worktree", "work on feature in isolation", "create isolated branch", or needs to set up a git worktree with tooling integration.
user-invocable: true
allowed-tools: Bash(*), Read(*), Write(*), AskUserQuestion(*), mcp__graphite__run_gt_cmd(*), mcp__linear__get_issue(*)
---

# Git Worktree Orchestrator

Create and manage a git worktree based on the current directory and a branch name, with optional Graphite integration, setup scripts, and Linear task automation.

## When to Activate

- User wants to create a git worktree
- User needs isolated development environment for a feature
- User asks about working on branches in parallel
- User wants to automate Linear task completion in a worktree

## Arguments

Parse from user input or prompt if not provided:

- **branch** (required): Branch name for the worktree
- **--graphite, -g**: Enable Graphite integration
- **--trunk <branch>**: Trunk branch for Graphite (required if --graphite is set)
- **--setup <script>**: Setup script or command to run after worktree creation
- **--skip-setup**: Skip running any setup script, including auto-detected package manager install
- **--skip-graphite**: Skip Graphite branch tracking
- **--linear <task-id>**: Linear task ID to complete autonomously in the worktree

## Prerequisites

- git (2.5+ for worktree support)
- claude CLI (for MCP registration)
- gh (optional, for PR creation)
- gt (optional, for Graphite integration)

## Workflow

### Step 1: Parse Arguments and Validate

If no branch name is provided, use AskUserQuestion to prompt for it.

If Graphite is enabled but no trunk branch is provided, prompt for it.

### Step 2: Execute Core Worktree Setup

**Reference and follow the shared setup-worktree-core instructions in `@../../shared/setup-worktree-core.md`.**

Set these configuration variables before following the shared instructions:

```bash
BRANCH_NAME="${branch}"
SETUP_SCRIPT="${setup_script:-}"
SKIP_SETUP="${skip_setup}"
SKIP_GRAPHITE_TRACK="${skip_graphite}"
TRUNK_BRANCH="${trunk_branch}"
SKIP_INDEX_RESET=""
```

The shared instructions will:

1. Detect/create the worktrees directory
2. Create the worktree with the branch
3. Copy `.claude/settings.local.json`
4. Track branch with Graphite (if enabled and TRUNK_BRANCH provided)
5. Run setup script (auto-detects package manager if not provided)
6. Reset git index (corruption prevention)

### Step 3: Linear Task Automation (Optional)

If Linear task ID provided, use AskUserQuestion to offer spawning an autonomous Claude Code session.

If yes, the spawned session will:

1. Read Linear task details via `mcp__linear__get_issue`
2. Understand requirements from the task description
3. Implement the task autonomously
4. Run tests and linting
5. Commit changes with conventional commit message

## Directory Structure

```text
/path/to/repo/              # Main repository
/path/to/repo.worktrees/    # Worktrees directory
  ├── feature-branch-1/     # Worktree for feature-branch-1
  ├── feature-branch-2/     # Worktree for feature-branch-2
  └── bugfix-123/           # Worktree for bugfix-123
```

## Examples

```text
"Create a worktree for feature/new-auth"
"Set up isolated environment for bugfix"
"Create worktree with Graphite tracking on main"
"Make a worktree and run npm install"
"Create worktree for Linear task DEV-1234"
```

## Output

Upon completion, display a summary:

```text
✅ Worktree Created Successfully!

📁 Location: /path/to/repo.worktrees/feature-branch
🌿 Branch: feature-branch

Configuration:
  ✓ Claude settings: copied
  ✓ Graphite tracking: feature-branch → main (parent)
  ✓ Setup script: executed (auto-detected: npm ci)
  ✓ Index reset: completed

To start working:
  cd "/path/to/repo.worktrees/feature-branch"

To merge work back:
  1. Commit and push changes
  2. Create PR using /pr-creator or gh pr create
  3. After merge, clean up: git worktree remove "/path/to/repo.worktrees/feature-branch"
```
