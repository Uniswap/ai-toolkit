---
name: git-worktree-orchestrator
description: Create and manage a git worktree based on the current directory and a branch name, with optional spec-workflow setup, Graphite integration, and Linear task automation.
argument-hint: <branch-name> [--graphite [--trunk <branch>]] [--setup <script-or-command>] [linear-task-id]
---

# Git Worktree Orchestrator

Create and manage a git worktree based on the current directory and a branch name. After creating the worktree, it copies the .spec-workflow directory, adds the spec-workflow MCP, and can optionally commit/push, open a PR, and clean up the worktree. It also copies other files from the root git worktree into the newly created worktree.

Supports Graphite integration to track the new branch on top of a trunk branch, and can run a setup script immediately after creating the worktree.

Optionally accepts a Linear task ID to automatically spawn a new Claude Code instance that will complete the task autonomously.

## Usage

```bash
# Create worktree for a new branch
/git-worktree-orchestrator add-new-color

# Create worktree with Graphite tracking (will prompt for trunk branch)
/git-worktree-orchestrator feature/new-ui --graphite

# Create worktree with Graphite tracking on specific trunk
/git-worktree-orchestrator feature/new-ui --graphite --trunk main

# Create worktree and run a setup script
/git-worktree-orchestrator feature/setup-test --setup "./scripts/setup-dev.sh"

# Create worktree and run an inline setup command
/git-worktree-orchestrator feature/npm-setup --setup "npm install && npm run build"

# Full example with all options
/git-worktree-orchestrator feature/auth-system --graphite --trunk main --setup "npm ci" DEV-1234
```

## Arguments

- **branch** (required): Branch name to create/use for the worktree
- **--graphite, -g** (optional): Enable Graphite integration to track the branch
- **--trunk <branch>** (optional): Trunk branch name for Graphite tracking (defaults to prompting user, or 'main' if not specified)
- **--setup <script-or-command>** (optional): Setup script file path or inline command to run after creating the worktree
- **linear_task_id** (optional): Linear task ID (e.g., DEV-1234) to complete autonomously in the new worktree

## Prerequisites

- git (2.5+ for worktree support)
- claude CLI (for MCP registration and spawning new instances)
- gh (optional, for PR creation)
- gt (optional, for Graphite integration)

## Workflow Steps

### Step 1: Directory Setup

The command detects the appropriate worktrees directory:

- If already in a worktree (path contains `.worktrees`), extracts the worktrees root
- Otherwise, creates worktrees as a sibling to the repo root (e.g., `repo.worktrees/`)

### Step 2: Branch Detection and Worktree Creation

Handles three scenarios:

1. **Local branch exists**: Uses existing branch
2. **Remote branch exists**: Creates local tracking branch from remote
3. **New branch**: Creates new branch from current HEAD

### Step 3: Spec-Workflow Setup

Creates a symlink to the `.spec-workflow` directory from the root repository, enabling spec-workflow functionality in the new worktree.

### Step 4: Claude Settings Copy

Copies `.claude/settings.local.json` to the new worktree to preserve local Claude Code settings.

### Step 5: MCP Registration

Registers the spec-workflow MCP with Claude for the new worktree directory:

```bash
claude mcp add spec-workflow "npx @uniswap/spec-workflow-mcp@latest" "$NEW_DIR"
```

### Step 6: Graphite Integration (Optional)

If Graphite is enabled (via `--graphite` flag or user prompt):

1. Prompts for trunk branch if not provided via `--trunk`
2. Runs `gt track` in the new worktree to track the branch on top of the trunk branch

```bash
gt track --trunk "$TRUNK_BRANCH"
```

### Step 7: Setup Script Execution (Optional)

If a setup script is provided (via `--setup` flag or user prompt):

1. Detects whether the input is a file path or inline command
2. If file: validates existence and executes it
3. If inline command: executes directly in the worktree directory

```bash
# File execution
if [[ -f "$SETUP_SCRIPT" ]]; then
  bash "$SETUP_SCRIPT"
else
  # Inline command execution
  eval "$SETUP_SCRIPT"
fi
```

### Step 8: Optional Operations

Interactive prompts for:

- **Linear task ID**: Enter task ID if not provided via arguments
- **Commit and push**: Stage and push initial changes
- **Create PR**: Create a pull request via `gh` or provide URL for manual creation
- **Cleanup**: Remove the worktree after work is complete

### Step 9: Linear Task Automation

If a Linear task ID is provided, optionally spawns a new Claude Code instance to:

1. Read the Linear task details using Linear MCP tools
2. Understand requirements and acceptance criteria
3. Set up the repository (install dependencies, etc.)
4. Implement the task autonomously
5. Run tests and linting
6. Commit changes with descriptive messages
7. Provide a summary of completed work

## Execution Script

```bash
#!/usr/bin/env bash
set -euo pipefail

# Initialize variables
BRANCH=""
LINEAR_TASK_ID=""
USE_GRAPHITE=""
TRUNK_BRANCH=""
SETUP_SCRIPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --graphite|-g)
      USE_GRAPHITE="true"
      shift
      ;;
    --trunk)
      if [[ -n "${2:-}" && ! "$2" =~ ^- ]]; then
        TRUNK_BRANCH="$2"
        shift 2
      else
        echo "Error: --trunk requires a branch name argument"
        exit 1
      fi
      ;;
    --setup)
      if [[ -n "${2:-}" && ! "$2" =~ ^- ]]; then
        SETUP_SCRIPT="$2"
        shift 2
      else
        echo "Error: --setup requires a script path or command argument"
        exit 1
      fi
      ;;
    -*)
      echo "Error: Unknown option: $1"
      echo "Usage: <command> <branch-name> [--graphite| -g] [--trunk <branch>] [--setup <script-or-command>] [linear-task-id]"
      exit 1
      ;;
    *)
      # Positional arguments: first is branch, second is linear_task_id
      if [[ -z "$BRANCH" ]]; then
        BRANCH="$1"
      elif [[ -z "$LINEAR_TASK_ID" ]]; then
        LINEAR_TASK_ID="$1"
      else
        echo "Error: Unexpected argument: $1"
        exit 1
      fi
      shift
      ;;
  esac
done

# Also check for env-provided variables as fallback
BRANCH="${BRANCH:-${branch:-}}"
LINEAR_TASK_ID="${LINEAR_TASK_ID:-${linear_task_id:-}}"
USE_GRAPHITE="${USE_GRAPHITE:-${use_graphite:-}}"
TRUNK_BRANCH="${TRUNK_BRANCH:-${trunk_branch:-}}"
SETUP_SCRIPT="${SETUP_SCRIPT:-${setup_script:-}}"

if [[ -z "${BRANCH:-}" ]]; then
  echo "Error: branch name is required."
  echo "Usage: <command> <branch-name> [--graphite | -g] [--trunk <branch>] [--setup <script-or-command>] [linear-task-id]"
  exit 1
fi

# Ensure we are inside a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository."
  exit 1
fi
REPO_ROOT="$(git rev-parse --show-toplevel)"
CWD="$(pwd)"

# Determine the worktrees directory
# If we're in a worktree (path contains .worktrees), extract the worktrees root
# Otherwise, create worktrees as a sibling to the repo root
if [[ "$CWD" =~ ^(.*\.worktrees) ]]; then
  # We're in a worktree, extract the .worktrees directory path
  WORKTREES_DIR="${BASH_REMATCH[1]}"
  echo "Detected existing worktrees directory: $WORKTREES_DIR"
else
  # We're in the main repo, use/create a .worktrees sibling directory
  WORKTREES_DIR="${REPO_ROOT}.worktrees"
  echo "Using worktrees directory: $WORKTREES_DIR"
fi

# Create the worktrees directory if it doesn't exist
mkdir -p "$WORKTREES_DIR"

NEW_DIR="${WORKTREES_DIR}/${BRANCH}"

if [[ -e "$NEW_DIR" ]]; then
  echo "Target directory already exists: $NEW_DIR"
  read -r -p "Continue and reuse it? (y/N): " RESP || true
  if [[ ! "$RESP" =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 1
  fi
fi

# Determine branch existence and create the worktree
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  CREATE_CMD=(git worktree add "$NEW_DIR" "$BRANCH")
elif git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  # Remote branch exists; create local tracking branch from it
  CREATE_CMD=(git worktree add -b "$BRANCH" "$NEW_DIR" "origin/$BRANCH")
else
  # Brand-new branch off current HEAD
  CREATE_CMD=(git worktree add -b "$BRANCH" "$NEW_DIR")
fi

echo "Creating worktree: ${CREATE_CMD[*]}"
"${CREATE_CMD[@]}"

echo "Worktree created at: $NEW_DIR"

# Symlink .spec-workflow directory
if [[ -d "$REPO_ROOT/.spec-workflow" ]]; then
  echo "Creating symlink for .spec-workflow in new worktree..."
  if [[ -e "$NEW_DIR/.spec-workflow" ]]; then
    echo "Warning: $NEW_DIR/.spec-workflow already exists"
    read -r -p "Remove existing and create symlink? (y/N): " RESP || true
    if [[ "$RESP" =~ ^[Yy]$ ]]; then
      rm -rf "$NEW_DIR/.spec-workflow"
    else
      echo "Keeping existing .spec-workflow directory"
    fi
  fi
  if [[ ! -e "$NEW_DIR/.spec-workflow" ]]; then
    ln -s "$REPO_ROOT/.spec-workflow" "$NEW_DIR/.spec-workflow"
    echo "Symlinked .spec-workflow: $NEW_DIR/.spec-workflow -> $REPO_ROOT/.spec-workflow"
  fi
else
  echo "No .spec-workflow directory found in $REPO_ROOT; skipping symlink."
fi

# Copy .claude/settings.local.json file
if [[ -f "$REPO_ROOT/.claude/settings.local.json" ]]; then
  echo "Copying .claude/settings.local.json to new worktree..."
  mkdir -p "$NEW_DIR/.claude"
  if [[ -e "$NEW_DIR/.claude/settings.local.json" ]]; then
    echo "Warning: $NEW_DIR/.claude/settings.local.json already exists"
    read -r -p "Overwrite existing file? (y/N): " RESP || true
    if [[ "$RESP" =~ ^[Yy]$ ]]; then
      cp "$REPO_ROOT/.claude/settings.local.json" "$NEW_DIR/.claude/settings.local.json"
      echo "Copied .claude/settings.local.json to $NEW_DIR/.claude/"
    else
      echo "Keeping existing .claude/settings.local.json file"
    fi
  else
    cp "$REPO_ROOT/.claude/settings.local.json" "$NEW_DIR/.claude/settings.local.json"
    echo "Copied .claude/settings.local.json to $NEW_DIR/.claude/"
  fi
else
  echo "No .claude/settings.local.json file found in $REPO_ROOT; skipping copy."
fi

# Add the spec-workflow MCP to the new project directory
if command -v claude >/dev/null 2>&1; then
  echo "Registering spec-workflow MCP with Claude for: $NEW_DIR"
  if ! claude mcp add spec-workflow "npx @uniswap/spec-workflow-mcp@latest" "$NEW_DIR"; then
    echo "Warning: Failed to add spec-workflow MCP. You can run this manually:"
    echo "  claude mcp add spec-workflow npx @uniswap/spec-workflow-mcp@latest \"$NEW_DIR\""
  fi
else
  echo "Warning: 'claude' CLI not found. Skipping MCP registration. Run manually later:"
  echo "  claude mcp add spec-workflow npx @uniswap/spec-workflow-mcp@latest \"$NEW_DIR\""
fi

# Prompt for Graphite usage if not specified
if [[ -z "${USE_GRAPHITE:-}" ]]; then
  echo ""
  read -r -p "Use Graphite to track this branch? (y/N): " GRAPHITE_RESP || true
  if [[ "$GRAPHITE_RESP" =~ ^[Yy]$ ]]; then
    USE_GRAPHITE="true"
  fi
fi

# Graphite integration
if [[ "${USE_GRAPHITE:-}" == "true" ]]; then
  echo ""
  echo "============================================"
  echo "Graphite Integration"
  echo "============================================"

  if ! command -v gt >/dev/null 2>&1; then
    echo "Warning: 'gt' (Graphite CLI) not found. Skipping Graphite setup."
    echo "Install it from: https://graphite.dev/docs/installing-the-cli"
  else
    # Prompt for trunk branch if not provided
    if [[ -z "${TRUNK_BRANCH:-}" ]]; then
      DEFAULT_TRUNK="$(git -C "$NEW_DIR" remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p')" || DEFAULT_TRUNK=""
      DEFAULT_TRUNK="${DEFAULT_TRUNK:-main}"
      read -r -p "Enter trunk branch name [$DEFAULT_TRUNK]: " TRUNK_INPUT || true
      TRUNK_BRANCH="${TRUNK_INPUT:-$DEFAULT_TRUNK}"
    fi

    echo "Tracking branch '$BRANCH' on top of trunk '$TRUNK_BRANCH'..."
    if ! gt -C "$NEW_DIR" track --trunk "$TRUNK_BRANCH"; then
      echo "Warning: Failed to track branch with Graphite. You can run this manually:"
      echo "  cd \"$NEW_DIR\" && gt track --trunk \"$TRUNK_BRANCH\""
    else
      echo "Successfully tracked branch with Graphite."
    fi
  fi
fi

# Prompt for setup script if not provided
if [[ -z "${SETUP_SCRIPT:-}" ]]; then
  echo ""
  read -r -p "Run a setup script/command in the new worktree? (y/N): " SETUP_RESP || true
  if [[ "$SETUP_RESP" =~ ^[Yy]$ ]]; then
    read -r -p "Enter script path or inline command: " SETUP_SCRIPT || true
  fi
fi

# Execute setup script if provided
if [[ -n "${SETUP_SCRIPT:-}" ]]; then
  echo ""
  echo "============================================"
  echo "Running Setup Script"
  echo "============================================"
  echo "Executing: $SETUP_SCRIPT"
  echo ""

  # Change to the new worktree directory for script execution
  pushd "$NEW_DIR" >/dev/null

  # Check if it's a file path (absolute or relative to original directory)
  SCRIPT_PATH=""
  if [[ -f "$SETUP_SCRIPT" ]]; then
    SCRIPT_PATH="$SETUP_SCRIPT"
  elif [[ -f "$CWD/$SETUP_SCRIPT" ]]; then
    SCRIPT_PATH="$CWD/$SETUP_SCRIPT"
  elif [[ -f "$REPO_ROOT/$SETUP_SCRIPT" ]]; then
    SCRIPT_PATH="$REPO_ROOT/$SETUP_SCRIPT"
  fi

  if [[ -n "$SCRIPT_PATH" ]]; then
    echo "Running script file: $SCRIPT_PATH"
    if [[ -x "$SCRIPT_PATH" ]]; then
      "$SCRIPT_PATH"
    else
      bash "$SCRIPT_PATH"
    fi
  else
    # Treat as inline command
    echo "Running inline command..."
    eval "$SETUP_SCRIPT"
  fi

  SETUP_EXIT_CODE=$?
  popd >/dev/null

  if [[ $SETUP_EXIT_CODE -eq 0 ]]; then
    echo "Setup script completed successfully."
  else
    echo "Warning: Setup script exited with code $SETUP_EXIT_CODE"
  fi
fi

# Prompt for Linear task ID if not provided
if [[ -z "${LINEAR_TASK_ID:-}" ]]; then
  echo ""
  read -r -p "Enter Linear task ID (optional, press Enter to skip): " LINEAR_TASK_ID || true
  LINEAR_TASK_ID="${LINEAR_TASK_ID:-}"
fi

# Optionally commit and push changes
read -r -p "Commit and push changes from $NEW_DIR now? (y/N): " DO_CP || true
if [[ "$DO_CP" =~ ^[Yy]$ ]]; then
  read -r -p "Commit message [chore: initial setup for $BRANCH]: " COMMIT_MSG || true
  COMMIT_MSG="${COMMIT_MSG:-chore: initial setup for $BRANCH}"
  git -C "$NEW_DIR" add -A
  if git -C "$NEW_DIR" diff --cached --quiet; then
    echo "No changes to commit in $NEW_DIR."
  else
    git -C "$NEW_DIR" commit -m "$COMMIT_MSG"
  fi
  # Push branch (set upstream if needed)
  if git -C "$NEW_DIR" rev-parse --symbolic-full-name --abbrev-ref @{u} >/dev/null 2>&1; then
    git -C "$NEW_DIR" push
  else
    git -C "$NEW_DIR" push -u origin "$BRANCH"
  fi
fi

# Optionally create a PR
read -r -p "Create a pull request for $BRANCH? (y/N): " DO_PR || true
if [[ "$DO_PR" =~ ^[Yy]$ ]]; then
  DEFAULT_BASE="$(git -C "$NEW_DIR" remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p')" || DEFAULT_BASE=""
  if [[ -z "$DEFAULT_BASE" ]]; then
    echo "Warning: Could not detect default branch from remote. Using 'main'."
  fi
  DEFAULT_BASE="${DEFAULT_BASE:-main}"
  if command -v gh >/dev/null 2>&1; then
    if ! gh -C "$NEW_DIR" pr create --fill --base "$DEFAULT_BASE" --head "$BRANCH"; then
      echo "Warning: PR creation with 'gh' failed."
    fi
  else
    ORIGIN_URL="$(git -C "$NEW_DIR" remote get-url origin)"
    REPO_SLUG=""
    if [[ "$ORIGIN_URL" =~ ^git@github.com:(.*)\\.git$ ]]; then
      REPO_SLUG="${BASH_REMATCH[1]}"
    elif [[ "$ORIGIN_URL" =~ ^https://github.com/(.*)\\.git$ ]]; then
      REPO_SLUG="${BASH_REMATCH[1]}"
    elif [[ "$ORIGIN_URL" =~ ^https://github.com/(.*)$ ]]; then
      REPO_SLUG="${BASH_REMATCH[1]}"
    fi
    if [[ -n "$REPO_SLUG" ]]; then
      PR_URL="https://github.com/${REPO_SLUG}/compare/${DEFAULT_BASE}...${BRANCH}?expand=1"
      echo "Open this URL to create a PR:"
      echo "  $PR_URL"
      if command -v open >/dev/null 2>&1; then
        read -r -p "Open PR URL in browser now? (y/N): " DO_OPEN || true
        [[ "$DO_OPEN" =~ ^[Yy]$ ]] && open "$PR_URL" || true
      fi
    else
      echo "Could not parse origin URL; open a PR manually on your hosting provider."
    fi
  fi
fi

# Optionally clean up the worktree
read -r -p "Remove the worktree $NEW_DIR from the main repo now? (y/N): " DO_CLEAN || true
if [[ "$DO_CLEAN" =~ ^[Yy]$ ]]; then
  # Ensure we are not in the worktree being removed
  if [[ "$PWD" == "$NEW_DIR" ]]; then
    echo "You are currently in the worktree. Please change directories and run cleanup again."
  else
    if ! git -C "$REPO_ROOT" worktree remove "$NEW_DIR"; then
      read -r -p "Worktree removal failed. Force removal? (y/N): " DO_FORCE || true
      [[ "$DO_FORCE" =~ ^[Yy]$ ]] && git -C "$REPO_ROOT" worktree remove --force "$NEW_DIR" || true
    fi
  fi
fi

# Spawn new Claude Code instance to complete Linear task autonomously
if [[ -n "${LINEAR_TASK_ID:-}" ]]; then
  echo ""
  echo "============================================"
  echo "Linear Task Integration"
  echo "============================================"
  echo "Linear task ID provided: $LINEAR_TASK_ID"
  echo ""

  if command -v claude >/dev/null 2>&1; then
    read -r -p "Launch new Claude Code instance to complete this task autonomously? (y/N): " DO_LAUNCH || true
    if [[ "$DO_LAUNCH" =~ ^[Yy]$ ]]; then
      echo "Spawning new Claude Code instance in $NEW_DIR..."
      echo ""

      # Create a prompt file for the autonomous task completion
      PROMPT="I'm working in a new git worktree to complete Linear task $LINEAR_TASK_ID.

Please:
1. Read the Linear task details using the Linear MCP tools
2. Understand the requirements and acceptance criteria
3. Set up the repository if needed (install dependencies, etc.)
4. Implement the task autonomously
5. Run tests and linting to ensure quality
6. Commit the changes with a descriptive commit message
7. Provide a summary of what was completed

Work autonomously and make reasonable decisions to complete the task efficiently."

      # Launch Claude Code with the prompt (use absolute path instead of cd)
      echo "Opening Claude Code in $NEW_DIR with task completion prompt..."
      claude "$NEW_DIR" --prompt "$PROMPT" &

      echo "New Claude Code instance launched in background."
      echo "Check the new window/tab for progress."
      echo ""
    else
      echo "Skipping automatic task completion."
      echo "You can manually work on task $LINEAR_TASK_ID in: $NEW_DIR"
      echo ""
    fi
  else
    echo "Warning: 'claude' CLI not found. Cannot spawn new instance."
    echo "Install it to use automatic task completion: https://claude.ai/download"
    echo "You can manually work on task $LINEAR_TASK_ID in: $NEW_DIR"
    echo ""
  fi
fi

echo ""
echo "============================================"
echo "Done! Worktree created at: $NEW_DIR"
echo "============================================"
echo ""
echo "To change to the new worktree directory, run:"
echo "  cd \"$NEW_DIR\""
echo ""
if [[ -n "${LINEAR_TASK_ID:-}" ]]; then
  echo "Linear task: $LINEAR_TASK_ID"
  echo ""
fi
```

## Worktree Directory Structure

The command creates worktrees in a sibling directory pattern:

```text
/path/to/repo/              # Main repository
/path/to/repo.worktrees/    # Worktrees directory
  ├── feature-branch-1/     # Worktree for feature-branch-1
  ├── feature-branch-2/     # Worktree for feature-branch-2
  └── bugfix-123/           # Worktree for bugfix-123
```

## Integration Notes

- **Spec Workflow**: Symlinks `.spec-workflow` from the main repo to enable spec-workflow MCP functionality
- **Claude Settings**: Copies local Claude settings to maintain consistent behavior
- **Linear Integration**: Supports autonomous task completion when provided with a Linear task ID
- **Graphite Integration**: Built-in support for `gt track` to manage branch stacks; tracks new branches on specified trunk
- **Setup Scripts**: Runs custom setup scripts or commands (e.g., `npm install`, `./scripts/setup.sh`) after worktree creation

## Merging Work Back

After completing work in a worktree:

1. **Commit and push** changes from the worktree
2. **Create a PR** using `/create-pr` or `gh pr create`
3. **Merge the PR** through your normal review process
4. **Clean up** the worktree when done

Or use `/split-stack` if you need to break your changes into multiple PRs.

## Related Commands

- `/create-pr`: Create pull requests with auto-generated messages
- `/split-stack`: Split large changes into reviewable PR stacks
- `/implement-spec`: Implement spec-workflow tasks
- `/auto-spec`: Autonomous spec-driven development

## Troubleshooting

### "Error: not inside a git repository"

**Solution:** Ensure you're running the command from within a git repository.

### "Target directory already exists"

**Solution:** Either reuse the existing worktree or remove it first:

```bash
git worktree remove /path/to/repo.worktrees/branch-name
```

### "Failed to add spec-workflow MCP"

**Solution:** Run the MCP registration manually:

```bash
claude mcp add spec-workflow "npx @uniswap/spec-workflow-mcp@latest" "/path/to/worktree"
```

### "claude CLI not found"

**Solution:** Install Claude Code from <https://claude.ai/download>

### "gt (Graphite CLI) not found"

**Solution:** Install the Graphite CLI:

```bash
npm install -g @withgraphite/graphite-cli
```

Or follow the installation guide at <https://graphite.dev/docs/installing-the-cli>

### "Failed to track branch with Graphite"

**Solution:** Ensure you're in a Graphite-enabled repository and the trunk branch exists:

```bash
cd /path/to/worktree
gt init  # If not already initialized
gt track --trunk main
```

### "Setup script failed"

**Solution:** Check that your script:

1. Exists at the specified path (relative to CWD or repo root)
2. Has proper execute permissions (`chmod +x script.sh`)
3. Returns exit code 0 on success

You can test the script manually:

```bash
cd /path/to/worktree
./your-script.sh  # or: bash your-script.sh
```

### "Setup command not found"

**Solution:** Inline commands are executed with `eval` in the worktree directory. Ensure:

1. The command is available in your PATH
2. You're using proper shell syntax for chained commands (`&&` for sequential, `;` for independent)

Arguments: $ARGUMENTS
