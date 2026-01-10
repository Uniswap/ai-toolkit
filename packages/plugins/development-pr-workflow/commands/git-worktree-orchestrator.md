---
name: git-worktree-orchestrator
description: Create and manage git worktrees with spec-workflow, Graphite, and Linear integration. Provides isolated development environments for parallel feature work.
argument-hint: <branch> [--graphite] [--trunk <branch>] [--setup <script>] [--linear <task-id>]
allowed-tools: Bash(*), Read(*), Write(*), AskUserQuestion(*), mcp__graphite__run_gt_cmd(*), mcp__linear__get_issue(*)
---

# Git Worktree Orchestrator

Create and manage a git worktree based on the current directory and a branch name, with optional spec-workflow setup, Graphite integration, setup scripts, and Linear task automation.

## Inputs

Parse arguments from `$ARGUMENTS`:

- **branch** (required): Branch name for the worktree
- **--graphite, -g**: Enable Graphite integration
- **--trunk <branch>**: Trunk branch for Graphite (required if --graphite is set)
- **--setup <script>**: Setup script or command to run after worktree creation
- **--skip-setup**: Skip running any setup script, including auto-detected package manager install
- **--skip-graphite**: Skip Graphite branch tracking
- **--linear <task-id>**: Linear task ID to complete autonomously in the worktree

Examples:

- `/git-worktree-orchestrator feature/new-auth`
- `/git-worktree-orchestrator feature/api-v2 --graphite --trunk main`
- `/git-worktree-orchestrator bugfix/login-timeout --setup "npm install && npm run build"`
- `/git-worktree-orchestrator feature/dark-mode --linear DEV-1234`

## Prerequisites

- git (2.5+ for worktree support)
- claude CLI (for MCP registration)
- gh (optional, for PR creation)
- gt (optional, for Graphite integration)

## Workflow Overview

This command orchestrates the complete worktree setup process:

1. **Directory Setup**: Detect/create worktrees directory as sibling to repo root
2. **Branch Detection**: Handle local, remote, or new branch scenarios
3. **Worktree Creation**: Create the git worktree with the appropriate branch
4. **Claude Settings**: Copy `.claude/settings.local.json` for consistent settings
5. **Graphite Integration**: Optionally track branch with Graphite
6. **Setup Script**: Run setup scripts or auto-detect package manager
7. **Index Reset**: Prevent git index corruption from hooks
8. **Linear Automation**: Optionally spawn autonomous task completion

---

## Step 1: Parse Arguments and Validate

```bash
# Parse arguments
BRANCH_NAME=""
GRAPHITE_ENABLED=false
TRUNK_BRANCH=""
SETUP_SCRIPT=""
SKIP_SETUP=false
SKIP_GRAPHITE=false
LINEAR_TASK_ID=""

# Argument parsing logic
# (Claude will parse $ARGUMENTS and set these variables)
```

If no branch name is provided, prompt the user:

```
AskUserQuestion:
- "What branch name should be used for the worktree?"
```

---

## Step 2: Validate Graphite Configuration

If Graphite is enabled but no trunk branch is provided, prompt:

```
AskUserQuestion:
- "Which branch should be the trunk/parent for Graphite tracking?"
  Options: main, master, develop, [custom]
```

---

## Step 3: Execute Worktree Setup

Set configuration variables for the shared setup:

```bash
# Configuration for shared worktree setup
BRANCH_NAME="${BRANCH_NAME}"
SETUP_SCRIPT="${SETUP_SCRIPT:-}"
SKIP_SETUP="${SKIP_SETUP}"
SKIP_GRAPHITE_TRACK="${SKIP_GRAPHITE}"
TRUNK_BRANCH="${TRUNK_BRANCH}"
SKIP_INDEX_RESET=""
```

**Follow all steps in the shared setup-worktree-core instructions:**

The shared instructions will:

1. Detect/create the worktrees directory
2. Create the worktree with the branch
3. Copy `.claude/settings.local.json`
4. Track branch with Graphite (if enabled and TRUNK_BRANCH provided)
5. Run setup script (auto-detects package manager if not provided)
6. Reset git index (corruption prevention)

---

## Step 4: Spec-Workflow Setup (Optional)

Create symlink to `.spec-workflow` directory from root repository if it exists:

```bash
if [[ -d "$REPO_ROOT/.spec-workflow" ]]; then
  echo "Creating symlink to .spec-workflow..."
  ln -sfn "$REPO_ROOT/.spec-workflow" "$NEW_DIR/.spec-workflow"
  echo "Symlinked .spec-workflow directory"
fi
```

---

## Step 5: MCP Registration (Optional)

Register spec-workflow MCP if available:

```bash
if command -v claude >/dev/null 2>&1 && [[ -d "$NEW_DIR/.spec-workflow" ]]; then
  echo "Registering spec-workflow MCP..."
  claude mcp add spec-workflow "npx @uniswap/spec-workflow-mcp@latest" "$NEW_DIR" || true
fi
```

---

## Step 6: Linear Task Automation (Optional)

If Linear task ID provided, offer to spawn autonomous Claude Code session:

```
AskUserQuestion:
- "Would you like to spawn a new Claude Code instance to autonomously complete the Linear task?"
  Options:
  - Yes, spawn autonomous session
  - No, I'll work on it manually
```

If yes, the spawned session will:

1. Read Linear task details via `mcp__linear__get_issue`
2. Understand requirements from the task description
3. Implement the task autonomously
4. Run tests and linting
5. Commit changes with conventional commit message

---

## Output

Upon completion, display a summary:

```
✅ Worktree Created Successfully!

📁 Location: /path/to/repo.worktrees/feature-branch
🌿 Branch: feature-branch

Configuration:
  ✓ Claude settings: copied
  ✓ Graphite tracking: feature-branch → main (parent)
  ✓ Spec-workflow: linked
  ✓ Setup script: executed (auto-detected: npm ci)
  ✓ Index reset: completed

To start working:
  cd "/path/to/repo.worktrees/feature-branch"

To merge work back:
  1. Commit and push changes
  2. Create PR using /pr-creator or gh pr create
  3. After merge, clean up: git worktree remove "/path/to/repo.worktrees/feature-branch"
```

---

## Directory Structure

The command creates worktrees in a sibling directory pattern:

```text
/path/to/repo/                    # Main repository
/path/to/repo.worktrees/          # Worktrees directory
  ├── feature-branch-1/           # Worktree for feature-branch-1
  ├── feature-branch-2/           # Worktree for feature-branch-2
  └── bugfix-123/                  # Worktree for bugfix-123
```

---

## Error Handling

- **Not a git repository**: Exit with error message
- **Branch already checked out**: Inform user and offer to use existing worktree
- **Target directory exists**: Prompt to reuse or abort
- **Graphite not installed**: Log warning and continue without Graphite
- **Setup script fails**: Log warning with exit code and continue
- **Linear MCP not available**: Skip Linear integration with warning

---

## Integration Notes

- **Spec Workflow**: Symlinks `.spec-workflow` for MCP functionality
- **Claude Settings**: Copies local settings for consistency
- **Linear Integration**: Autonomous task completion via MCP
- **Graphite Integration**: Branch stack management

Arguments: $ARGUMENTS
