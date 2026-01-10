---
name: create-linear-task-and-pr-from-changes
description: Take local changes, create a Linear task, create a branch (optionally in a worktree), commit, and publish a PR
argument-hint: [--team <id>] [--trunk <branch>] [--create-worktree] [--use-graphite]
allowed-tools: Bash(*), Read(*), Write(*), AskUserQuestion(*), mcp__graphite__run_gt_cmd(*), mcp__linear__create_issue(*), mcp__linear__get_user(*), mcp__linear__list_teams(*), mcp__linear__list_projects(*), mcp__linear__list_issue_labels(*)
---

# Changes to PR Workflow

This command automates the full workflow of taking local changes and turning them into a properly tracked, reviewed PR. It supports two modes:

## Inputs

Parse arguments from `$ARGUMENTS`:

| Argument                | Type    | Required | Description                                                                     |
| ----------------------- | ------- | -------- | ------------------------------------------------------------------------------- |
| `--team`                | string  | No       | Linear team identifier (e.g., "DEV", "ENG"). Prompted if not provided.          |
| `--label`               | string  | No       | Linear label to apply. Prompted if not provided.                                |
| `--due-date`            | string  | No       | Due date for the Linear task (e.g., "2024-01-15", "next friday").               |
| `--project`             | string  | No       | Linear project name. Prompted if not provided.                                  |
| `--priority`            | string  | No       | Priority level (urgent, high, normal, low, none). Prompted if not provided.     |
| `--title`               | string  | No       | Title for the Linear task. Auto-generated from change analysis if not provided. |
| `--trunk`               | string  | No       | Base branch for the PR (e.g., "main", "develop"). Prompted if not provided.     |
| `--create-worktree`     | boolean | No       | Create an isolated git worktree for the changes. Prompted if not provided.      |
| `--setup`               | string  | No       | (Worktree mode only) Setup script to run after creating the worktree.           |
| `--skip-setup`          | boolean | No       | (Worktree mode only) Skip running any setup script.                             |
| `--skip-graphite-track` | boolean | No       | Skip Graphite branch tracking.                                                  |
| `--branch-prefix`       | string  | No       | Custom branch prefix (e.g., "feature", "fix"). Prompted if not provided.        |
| `--include-signature`   | boolean | No       | Include Claude Code signature in commit message. Default: false.                |
| `--use-graphite`        | boolean | No       | Use Graphite CLI for PR creation. Prompted if not provided.                     |

## Workflow Overview

**All prompts happen upfront in Step 2.** Once configuration is collected, the rest of the workflow executes automatically without further user interaction.

**Common Steps (both modes):**

1. **Analyze Changes**: Reads and contextualizes your local uncommitted changes
2. **Collect Configuration**: Prompts for ALL missing options upfront (may be two phases if project selection depends on team)
3. **Create Linear Task**: Creates a Linear issue to track the work (with optional project)
4. **Create Branch**: Creates a new branch (method depends on mode)
5. **Generate Commit**: Creates a conventional commit message and commits changes
6. **Publish PR**: Uses Graphite or GitHub CLI to create and publish the PR

**Worktree Mode** (`--create-worktree`):

- Creates an isolated git worktree in a sibling directory
- Copies Claude settings to the new worktree
- Runs setup scripts (auto-detects package manager)
- Best for parallel development and larger features

**Simple Mode** (default):

- Creates a branch directly in the current repository
- No worktree overhead, faster setup
- Best for quick, self-contained changes

---

## Step 1: Gather Local Changes

First, analyze the current state of the repository:

```bash
# Get current branch and repository info
git rev-parse --show-toplevel
git branch --show-current
git status --porcelain

# Get detailed diff of all changes (staged and unstaged)
git diff HEAD
```

Summarize what the changes do:

- What files are modified/added/deleted
- What is the nature of the changes (feature, fix, refactor, etc.)
- What problem do these changes solve

---

## Step 1.5: Auto-Generate Linear Task Description

Based on the change analysis, automatically generate a **product-focused** Linear task description written from a product perspective. **Do NOT prompt the user for this** - generate it entirely by inferring the user value from the code changes.

**Description Structure (User Story Format):**

```markdown
## User Story

As a [user type], I want [goal/capability] so that [benefit/value].

## Background

<1-2 sentences explaining the context or problem being solved from the user's perspective>

## Acceptance Criteria

- [ ] <Criterion 1 - what the user should be able to do>
- [ ] <Criterion 2 - expected behavior>
- [ ] <Criterion 3 - edge cases handled>
      ...

## Out of Scope

<Optional: What this change intentionally does NOT address>
```

**Guidelines for Description Generation:**

- **Write from the product/user perspective**, not the developer perspective
- Focus on **user value and outcomes**, not implementation details
- **Do NOT include**: file names, technical implementation details, code changes, or developer-focused notes
- Infer the user type from context (e.g., "end user", "admin", "developer using the API")
- Acceptance criteria should be testable from the user's perspective
- Keep language accessible to non-technical stakeholders
- If the change is purely technical (refactor, performance), frame it in terms of user impact (e.g., "faster load times", "more reliable experience")

---

## Step 2: Collect ALL Configuration Upfront

**IMPORTANT: Collect all missing information in a SINGLE prompt at the beginning.** Do not prompt the user at multiple steps throughout the workflow. Use `AskUserQuestion` with multiple questions to gather everything at once.

First, check which arguments were provided via command line. Then, for ALL missing arguments, present them together in one prompt.

**Information to Collect (prompt for any not provided as arguments):**

| Field               | Required | Default        | Notes                                                                      |
| ------------------- | -------- | -------------- | -------------------------------------------------------------------------- |
| Team                | Yes      | -              | Linear team identifier. Use `mcp__linear__list_teams` to list options.     |
| Project             | No       | None           | Linear project within the selected team. **Fetched after team selection.** |
| Title               | Yes      | Auto-generated | From change analysis if not provided                                       |
| Priority            | Yes      | -              | urgent, high, normal, low, none                                            |
| Base Branch (trunk) | Yes      | -              | Target branch for PR (e.g., "main", "develop")                             |
| Branch Prefix       | Yes      | -              | Options: username, feature, fix, chore, or custom                          |
| Use Graphite        | Yes      | -              | true = `gt submit`, false = `gh pr create`                                 |
| Create Worktree     | Yes      | -              | true = isolated worktree, false = branch in current repo                   |
| Label               | No       | None           | Linear label(s) to apply                                                   |
| Due Date            | No       | None           | Task due date                                                              |

**Dependent Fields (require prior selection):**

- **Project** depends on **Team** - After team is selected, fetch projects via `mcp__linear__list_projects` with the team filter to show available projects

**Branch Prefix Options** (present if not provided):

**IMPORTANT**: Before presenting branch prefix options, fetch the current Linear user via `mcp__linear__get_user` with query "me" to get their display name. Convert to lowercase and remove spaces for the username prefix.

1. **Username (Recommended)** - Derived from Linear user's display name
2. **feature/** - Standard feature branch convention
3. **fix/** - For bug fixes
4. **chore/** - For maintenance tasks
5. **Custom** - Let user enter their own prefix

**Prompting Flow** (two phases):

```
# ============================================
# PHASE 1: Collect team and independent fields
# ============================================
linear_user = mcp__linear__get_user(query="me")
username_prefix = linear_user.displayName.lower().replace(" ", "")
teams = mcp__linear__list_teams()

# Prompt for ALL missing fields in Phase 1
AskUserQuestion (Phase 1):
- Team: "Which Linear team?" (options from teams list)
- Priority: "Priority level?" (urgent/high/normal/low/none)
- Base Branch: "Target branch for PR?" (main/develop/other)
- Branch Prefix: "What branch prefix should be used?"
- Use Graphite: "PR creation method?" (Graphite/GitHub CLI)
- Create Worktree: "Create isolated worktree?" (Yes/No)

# ============================================
# PHASE 2: ALWAYS prompt for project selection
# ============================================
selected_team = <from Phase 1 answer or --team argument>
projects = mcp__linear__list_projects(team=selected_team)

AskUserQuestion (Phase 2):
- Project: "Which project should this task be added to?"
```

**Auto-applied (never prompt):**

- **Assignee**: Current authenticated user (via `mcp__linear__get_user` with "me")
- **Description**: Auto-generated **user story** inferred from code changes (Step 1.5)

---

## Step 3: Create Linear Task

Use the Linear MCP to create the task with the **auto-generated user story description** from Step 1.5:

```
mcp__linear__create_issue with:
- team: <selected team>
- title: <task title - auto-generated or user-provided>
- description: <AUTO-GENERATED user story from Step 1.5>
- priority: <selected priority as number: 0=none, 1=urgent, 2=high, 3=normal, 4=low>
- assignee: "me"
- labels: [<selected labels>]
- project: <selected project from Phase 2, or null if "None" selected>
- dueDate: <parsed due date>
```

Capture the created issue identifier (e.g., "DEV-123") for branch naming.

---

## Step 4: Create Branch

First, derive the branch name using the selected prefix and task:

```bash
BRANCH_PREFIX="<selected-prefix>"
TASK_ID="<task-identifier>"  # e.g., "DEV-123"
SLUG="<slug-from-title>"     # e.g., "add-user-auth"
BRANCH_NAME="${BRANCH_PREFIX}/${TASK_ID}-${SLUG}"
```

---

### If `--create-worktree` — Worktree Mode

Set configuration variables and follow the shared worktree setup instructions:

```bash
# Configuration for shared worktree setup
BRANCH_NAME="${BRANCH_NAME}"
SETUP_SCRIPT="${setup:-}"
SKIP_SETUP="${skip_setup:-}"
SKIP_GRAPHITE_TRACK="${skip_graphite_track:-}"
TRUNK_BRANCH="${trunk}"
SKIP_INDEX_RESET=""
```

The shared setup will create the worktree, copy settings, configure Graphite, and run setup scripts.

**Move Changes to Worktree:**

```bash
# Stash changes in current directory
git stash push -m "changes-to-pr: temporary stash for $BRANCH_NAME"

# Apply stash to new worktree
cd "$WORKTREES_DIR/$BRANCH_NAME"
git stash pop
```

---

### If Simple Mode (default)

Create a new branch in the current repository:

```bash
WORKING_DIR=$(pwd)

# Create and checkout new branch from trunk
git fetch origin "$TRUNK_BRANCH"
git checkout -b "$BRANCH_NAME" "origin/$TRUNK_BRANCH"

# Track with Graphite (unless skip_graphite_track is true)
if [ -z "$SKIP_GRAPHITE_TRACK" ]; then
  gt track --branch "$BRANCH_NAME" --parent "$TRUNK_BRANCH"
fi
```

---

## Step 5: Generate Commit Message

Analyze the changes and generate a conventional commit message:

**Format:**

```
<type>(<scope>): <description>

<body explaining WHAT and WHY>

Resolves: <LINEAR-ISSUE-ID>
```

**Optional signature** (only if `--include-signature`):

```
🤖 Generated with [Claude Code](https://claude.ai/code)
```

**Types:** feat, fix, docs, style, refactor, perf, test, build, ci, chore

---

## Step 6: Commit Changes

```bash
cd "$WORKING_DIR"
git add -A
SKIP_CLAUDE=1 git commit -m "<generated commit message>"
```

---

## Step 7: Create and Publish PR

**If using Graphite (`--use-graphite`):**

```bash
cd "$WORKING_DIR"
gt submit --publish --no-edit --no-interactive

PR_URL=$(gt pr --show-url 2>/dev/null || gh pr view --json url -q '.url')
gh pr edit "$PR_URL" --title "<PR title>" --body "<PR description>"
```

**If using GitHub CLI (default):**

```bash
cd "$WORKING_DIR"
git push -u origin "$BRANCH_NAME"
gh pr create --base "$TRUNK_BRANCH" --title "<PR title>" --body "<PR description>"
```

---

## Output

### Worktree Mode Output

```
✅ Workflow Complete!

📋 Linear Task: DEV-123 - <title>
   https://linear.app/team/issue/DEV-123

📁 Worktree: /path/to/repo.worktrees/johndoe/DEV-123-task-slug

🌿 Branch: johndoe/DEV-123-task-slug → main

⚙️  Worktree Configuration:
   ✓ Claude settings copied
   ✓ Graphite tracking: johndoe/DEV-123-task-slug → main
   ✓ Setup script completed (auto-detected: npm ci)
   ✓ Git index reset (corruption prevention)

🔗 PR: https://github.com/org/repo/pull/456

To continue working:
  cd "/path/to/repo.worktrees/johndoe/DEV-123-task-slug"
```

### Simple Mode Output

```
✅ Workflow Complete!

📋 Linear Task: DEV-123 - <title>
   https://linear.app/team/issue/DEV-123

🌿 Branch: johndoe/DEV-123-task-slug → main
   ✓ Graphite tracking enabled

🔗 PR: https://github.com/org/repo/pull/456

You are now on branch: johndoe/DEV-123-task-slug
```

---

## Error Handling

**Common to Both Modes:**

- **No changes detected**: Inform user there are no changes to process
- **Linear MCP not available**: Provide instructions for setting up Linear MCP
- **Graphite not installed**: Use GitHub CLI instead, or install Graphite
- **Graphite tracking fails**: Log warning and provide manual command
- **Commit fails**: Report the error and suggest resolution

**Worktree Mode Only:**

- **Worktree creation fails**: Clean up and provide manual instructions
- **Target directory already exists**: Prompt user to reuse existing worktree or abort
- **Setup script fails**: Log warning with exit code and continue (non-blocking)
- **Git index corruption**: Reset the index by deleting `$GIT_DIR/index` and running `git reset HEAD`

**Simple Mode Only:**

- **Branch already exists**: Prompt user to checkout existing branch or create with different name
- **Uncommitted changes conflict**: Stash changes first or resolve conflicts

---

## Usage Examples

### Basic Usage (will prompt for all required details)

```
/create-linear-task-and-pr-from-changes
```

### Quick PR with Simple Branch (no worktree)

```
/create-linear-task-and-pr-from-changes --trunk main
```

### Full Worktree Setup for Parallel Development

```
/create-linear-task-and-pr-from-changes --create-worktree --trunk main
```

### With Team and Priority Specified

```
/create-linear-task-and-pr-from-changes --team DEV --priority high
```

### Using GitHub CLI Instead of Graphite

```
/create-linear-task-and-pr-from-changes --team DEV --use-graphite false --trunk main
```

---

## Prerequisites

- **git** (2.5+ for worktree support)
- **gt** (Graphite CLI) - optional if using `--use-graphite false`
- **gh** (GitHub CLI) - optional if using Graphite
- **Linear MCP** (configured for Linear API access)

Arguments: $ARGUMENTS
