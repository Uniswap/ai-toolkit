---
description: Create and manage git worktrees with spec-workflow, Graphite, and Linear integration. Use when user says "create a worktree", "set up a new worktree", "work on feature in isolation", "create isolated branch", or needs to set up a git worktree with tooling integration.
allowed-tools: Bash(*), Read(*), Write(*), AskUserQuestion(*), mcp__graphite__run_gt_cmd(*), mcp__linear__get_issue(*)
---

# Git Worktree Orchestrator

Create and manage a git worktree based on the current directory and a branch name, with optional spec-workflow setup, Graphite integration, setup scripts, and Linear task automation.

## When to Activate

- User wants to create a git worktree
- User needs isolated development environment for a feature
- User asks about working on branches in parallel
- User mentions spec-workflow integration with worktrees
- User wants to automate Linear task completion in a worktree

## Prerequisites

- git (2.5+ for worktree support)
- claude CLI (for MCP registration)
- gh (optional, for PR creation)
- gt (optional, for Graphite integration)

## Workflow Steps

### Step 1: Directory Setup

- Detect appropriate worktrees directory
- Create as sibling to repo root (e.g., `repo.worktrees/`)

### Step 2: Branch Detection and Worktree Creation

Handle three scenarios:

1. **Local branch exists**: Use existing branch
2. **Remote branch exists**: Create local tracking branch
3. **New branch**: Create from current HEAD

### Step 3: Spec-Workflow Setup

Create symlink to `.spec-workflow` directory from root repository.

### Step 4: Claude Settings Copy

Copy `.claude/settings.local.json` to preserve local settings.

### Step 5: MCP Registration

Register spec-workflow MCP:

```bash
claude mcp add spec-workflow "npx @uniswap/spec-workflow-mcp@latest" "$NEW_DIR"
```

### Step 6: Graphite Integration (Optional)

If enabled:

1. Prompt for trunk branch
2. Run `gt track --trunk <branch>`

### Step 7: Setup Script Execution (Optional)

Execute setup script or inline command in worktree.

### Step 8: Linear Task Automation (Optional)

If Linear task ID provided, optionally spawn Claude Code to:

1. Read Linear task details
2. Understand requirements
3. Implement task autonomously
4. Run tests and linting
5. Commit changes

## Arguments

- **branch** (required): Branch name for the worktree
- **--graphite, -g**: Enable Graphite integration
- **--trunk <branch>**: Trunk branch for Graphite
- **--setup <script>**: Setup script or command to run
- **linear_task_id**: Linear task to complete autonomously

## Directory Structure

```
/path/to/repo/              # Main repository
/path/to/repo.worktrees/    # Worktrees directory
  ├── feature-branch-1/     # Worktree for feature-branch-1
  ├── feature-branch-2/     # Worktree for feature-branch-2
  └── bugfix-123/           # Worktree for bugfix-123
```

## Examples

```
"Create a worktree for feature/new-auth"
"Set up isolated environment for bugfix"
"Create worktree with Graphite tracking on main"
"Make a worktree and run npm install"
"Create worktree for Linear task DEV-1234"
```

## Integration Notes

- **Spec Workflow**: Symlinks `.spec-workflow` for MCP functionality
- **Claude Settings**: Copies local settings for consistency
- **Linear Integration**: Autonomous task completion
- **Graphite Integration**: Branch stack management
- **Setup Scripts**: Custom initialization after creation

## Merging Work Back

After completing work:

1. Commit and push changes
2. Create PR using `/create-pr` or `gh pr create`
3. Merge through normal review process
4. Clean up worktree when done
