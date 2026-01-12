---
name: shared:setup-worktree-core
title: Worktree Setup Core (Shared)
user-invocable: false
description: |
  Shared worktree setup logic used by multiple slash commands.
  This file provides reusable instructions that other commands reference.
  Can also be invoked directly for simple worktree creation.
schemaVersion: 1
arguments:
  - name: branch
    type: string
    required: false
    description: Branch name to create/use for the worktree. Required if invoked directly.
  - name: setup
    type: string
    required: false
    description: Setup script path or inline command to run after creating the worktree. If not provided, auto-detects package manager and runs install.
  - name: trunk
    type: string
    required: false
    description: Base branch for Graphite tracking. Required when graphite tracking is enabled (no default).
  - name: skip_graphite
    type: boolean
    required: false
    description: Skip Graphite branch tracking.
  - name: skip_setup
    type: boolean
    required: false
    description: Skip running any setup script, including auto-detected package manager install.
  - name: skip_index_reset
    type: boolean
    required: false
    description: Skip git index reset after setup.
notes: |
  This is a shared instructions file within the development-pr-workflow plugin.

  When referenced by another command, these variables should be set:
    - BRANCH_NAME: The branch name for the worktree (required)
    - SETUP_SCRIPT: Script/command to run after worktree creation (optional, auto-detects package manager if not set)
    - SKIP_SETUP: Set to "true" to skip setup script entirely (optional)
    - SKIP_GRAPHITE_TRACK: Set to "true" to skip Graphite tracking (optional)
    - TRUNK_BRANCH: Base branch for Graphite (required when graphite enabled, no default)
    - SKIP_INDEX_RESET: Set to "true" to skip git index reset (optional)
---

# Shared Worktree Setup Instructions

These instructions provide the core worktree setup logic. Commands that reference this file should:

1. Set required variables (especially `BRANCH_NAME`)
2. Reference this file
3. Continue with command-specific logic after worktree is configured

---

## Prerequisites Check

Ensure we're inside a git repository and capture essential paths:

```bash
# Ensure we are inside a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository."
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
CWD="$(pwd)"
```

---

## Step 1: Determine Worktrees Directory

Detect if we're already in a worktree and find/create the appropriate worktrees directory:

```bash
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

NEW_DIR="${WORKTREES_DIR}/${BRANCH_NAME}"
```

---

## Step 2: Handle Existing Directory

Check if target directory exists and handle appropriately:

```bash
if [[ -e "$NEW_DIR" ]]; then
  echo "Target directory already exists: $NEW_DIR"
  # Prompt user to reuse or abort
  # The calling command should handle this interaction
fi
```

---

## Step 3: Create Worktree

Determine branch existence and create the worktree with the appropriate strategy:

```bash
# Determine branch existence and create the worktree
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  # Local branch exists - just add worktree pointing to it
  git worktree add "$NEW_DIR" "$BRANCH_NAME"
elif git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null 2>&1; then
  # Remote branch exists - create local tracking branch from it
  git worktree add -b "$BRANCH_NAME" "$NEW_DIR" "origin/$BRANCH_NAME"
else
  # Brand-new branch off current HEAD
  git worktree add -b "$BRANCH_NAME" "$NEW_DIR"
fi

echo "Worktree created at: $NEW_DIR"
```

---

## Step 4: Configure Worktree - Claude Settings

Copy `.claude/settings.local.json` to the new worktree to preserve local Claude Code settings:

```bash
if [[ -f "$REPO_ROOT/.claude/settings.local.json" ]]; then
  echo "Copying .claude/settings.local.json to new worktree..."
  mkdir -p "$NEW_DIR/.claude"
  if [[ -e "$NEW_DIR/.claude/settings.local.json" ]]; then
    echo "Warning: $NEW_DIR/.claude/settings.local.json already exists"
    # Prompt to overwrite or keep existing
  else
    cp "$REPO_ROOT/.claude/settings.local.json" "$NEW_DIR/.claude/settings.local.json"
    echo "Copied .claude/settings.local.json to $NEW_DIR/.claude/"
  fi
else
  echo "No .claude/settings.local.json file found in $REPO_ROOT; skipping copy."
fi
```

---

## Step 5: Configure Worktree - Graphite Integration (Optional)

Track the branch with Graphite.
**Skip this step if `SKIP_GRAPHITE_TRACK` is set to "true".**
**TRUNK_BRANCH is required when graphite tracking is enabled (no default).**

```bash
if [[ "${SKIP_GRAPHITE_TRACK:-}" != "true" ]]; then
  # Validate trunk branch is provided
  if [[ -z "${TRUNK_BRANCH:-}" ]]; then
    echo "Error: TRUNK_BRANCH is required when Graphite tracking is enabled."
    echo "Either provide a trunk branch or set SKIP_GRAPHITE_TRACK=true"
    exit 1
  fi

  if command -v gt >/dev/null 2>&1; then
    echo "Tracking branch '$BRANCH_NAME' on top of parent '$TRUNK_BRANCH'..."
    if ! gt -C "$NEW_DIR" track --parent "$TRUNK_BRANCH"; then
      echo "Warning: Failed to track branch with Graphite. You can run this manually:"
      echo "  cd \"$NEW_DIR\" && gt track --parent \"$TRUNK_BRANCH\""
    else
      echo "Successfully tracked branch with Graphite."
    fi
  else
    echo "Warning: 'gt' (Graphite CLI) not found. Skipping Graphite setup."
    echo "Install it from: https://graphite.dev/docs/installing-the-cli"
  fi
fi
```

---

## Step 6: Run Setup Script (with Auto-Detection)

Run a setup script or auto-detect and run package manager install.
**Skip this step entirely if `SKIP_SETUP` is set to "true".**

If `SETUP_SCRIPT` is not provided, auto-detects the package manager by lockfile presence:

- `bun.lockb` or `bun.lock` -> `bun install`
- `pnpm-lock.yaml` -> `pnpm install`
- `yarn.lock` -> `yarn install`
- `package-lock.json` -> `npm ci`
- `package.json` only -> `npm install`

```bash
if [[ "${SKIP_SETUP:-}" != "true" ]]; then
  # Auto-detect package manager if SETUP_SCRIPT not provided
  if [[ -z "${SETUP_SCRIPT:-}" ]]; then
    if [[ -f "$REPO_ROOT/bun.lockb" ]] || [[ -f "$REPO_ROOT/bun.lock" ]]; then
      SETUP_SCRIPT="bun install"
      SETUP_AUTO_DETECTED="true"
    elif [[ -f "$REPO_ROOT/pnpm-lock.yaml" ]]; then
      SETUP_SCRIPT="pnpm install"
      SETUP_AUTO_DETECTED="true"
    elif [[ -f "$REPO_ROOT/yarn.lock" ]]; then
      SETUP_SCRIPT="yarn install"
      SETUP_AUTO_DETECTED="true"
    elif [[ -f "$REPO_ROOT/package-lock.json" ]]; then
      SETUP_SCRIPT="npm ci"
      SETUP_AUTO_DETECTED="true"
    elif [[ -f "$REPO_ROOT/package.json" ]]; then
      SETUP_SCRIPT="npm install"
      SETUP_AUTO_DETECTED="true"
    fi
  fi

  if [[ -n "${SETUP_SCRIPT:-}" ]]; then
    if [[ "${SETUP_AUTO_DETECTED:-}" == "true" ]]; then
      echo "Running Setup Script (auto-detected)"
    else
      echo "Running Setup Script"
    fi
    echo "Executing: $SETUP_SCRIPT"

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
  else
    echo "No setup script provided and no package manager detected; skipping setup."
  fi
fi
```

---

## Step 7: Reset Git Index (Optional - Corruption Prevention)

After running setup scripts (especially `npm ci` which installs lefthook), reset the git index to prevent corruption from Claude Code hooks.
**Skip this step if `SKIP_INDEX_RESET` is set to "true".**

```bash
if [[ "${SKIP_INDEX_RESET:-}" != "true" ]]; then
  echo "Resetting git index to prevent corruption..."

  # Get the worktree's git directory
  GIT_DIR=$(git -C "$NEW_DIR" rev-parse --git-dir)

  # Delete the potentially corrupted index
  rm -f "$GIT_DIR/index"

  # Rebuild a clean index from HEAD
  git -C "$NEW_DIR" reset HEAD 2>/dev/null || true

  echo "Git index reset successfully"
fi
```

---

## Output Variables

After executing these instructions, the following variables will be available:

| Variable              | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `REPO_ROOT`           | Path to the main repository root                       |
| `WORKTREES_DIR`       | Path to the worktrees directory                        |
| `NEW_DIR`             | Full path to the newly created worktree                |
| `BRANCH_NAME`         | The branch name (input variable)                       |
| `TRUNK_BRANCH`        | The base branch used for Graphite (if applicable)      |
| `SETUP_SCRIPT`        | The setup script that was run (if any)                 |
| `SETUP_AUTO_DETECTED` | "true" if setup script was auto-detected from lockfile |

---

## Configuration Summary Output

Display a summary of what was configured:

```bash
echo ""
echo "Worktree Configuration Summary:"
echo "  Location: $NEW_DIR"
echo "  Branch: $BRANCH_NAME"
[[ -f "$NEW_DIR/.claude/settings.local.json" ]] && echo "  Claude settings: copied" || echo "  Claude settings: skipped"
[[ "${SKIP_GRAPHITE_TRACK:-}" != "true" ]] && echo "  Graphite tracking: $BRANCH_NAME → $TRUNK_BRANCH (parent)" || echo "  Graphite tracking: skipped"
if [[ "${SKIP_SETUP:-}" != "true" ]] && [[ -n "${SETUP_SCRIPT:-}" ]]; then
  if [[ "${SETUP_AUTO_DETECTED:-}" == "true" ]]; then
    echo "  Setup script: executed (auto-detected: $SETUP_SCRIPT)"
  else
    echo "  Setup script: executed ($SETUP_SCRIPT)"
  fi
else
  echo "  Setup script: skipped"
fi
[[ "${SKIP_INDEX_RESET:-}" != "true" ]] && echo "  Index reset: completed" || echo "  Index reset: skipped"
echo ""
```
