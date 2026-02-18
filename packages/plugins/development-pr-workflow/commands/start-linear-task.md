---
description: Start working on a new Linear task by creating a worktree environment. Either provide an existing Linear ticket ID or describe the work to create a new task.
argument-hint: [<ticket-id> | --prompt "<description>"] [--team <id>] [--trunk <branch>] [--use-graphite true/false] [--start-working] [--start-prompt "<prompt>"]
allowed-tools: Bash(*), Read(*), Write(*), AskUserQuestion(*), mcp__graphite__run_gt_cmd(*), mcp__github__create_pull_request(*), mcp__linear__create_issue(*), mcp__linear__get_issue(*), mcp__linear__get_user(*), mcp__linear__list_teams(*), mcp__linear__list_projects(*), mcp__linear__list_issue_labels(*)
---

# Start Linear Task Workflow

This command sets up a development environment for working on a Linear task. Unlike `linear-task-and-pr-from-changes` which handles existing local changes, this command is for **starting fresh** when you don't have any changes yet.

## Two Modes of Operation

1. **Existing Ticket Mode**: Provide a Linear ticket ID (e.g., `DEV-123`) to work on an existing task
2. **New Task Mode**: Provide a description/prompt to create a new Linear task

## Inputs

Parse arguments from `$ARGUMENTS`:

| Argument          | Type    | Required | Description                                                                                  |
| ----------------- | ------- | -------- | -------------------------------------------------------------------------------------------- |
| `<ticket-id>`     | string  | No\*     | Existing Linear ticket ID (e.g., "DEV-123"). Mutually exclusive with --prompt.               |
| `--prompt`        | string  | No\*     | Description of the work to do. Creates a new Linear task. Mutually exclusive with ticket-id. |
| `--team`          | string  | No       | Linear team identifier (e.g., "DEV", "ENG"). Prompted if not provided.                       |
| `--project`       | string  | No       | Linear project name. Prompted if not provided.                                               |
| `--priority`      | string  | No       | Priority level (urgent, high, normal, low, none). Prompted if not provided.                  |
| `--label`         | string  | No       | Linear label to apply.                                                                       |
| `--due-date`      | string  | No       | Due date for the Linear task (e.g., "2024-01-15", "next friday").                            |
| `--trunk`         | string  | No       | Target branch for PR (e.g., "main", "develop"). Prompted if not provided.                    |
| `--worktree_base` | string  | No       | Branch to create the worktree FROM (e.g., "next", "main"). Prompted if not provided.         |
| `--branch-prefix` | string  | No       | Custom branch prefix (e.g., "feature", "fix"). Prompted if not provided.                     |
| `--setup`         | string  | No       | Setup script to run after creating the worktree.                                             |
| `--skip-setup`    | boolean | No       | Skip running any setup script.                                                               |
| `--use-graphite`  | boolean | No       | Use Graphite (true) or standard git (false). Prompted if not set.                            |
| `--start-working` | boolean | No       | Automatically cd into worktree and start working (skips prompt).                             |
| `--start-prompt`  | string  | No       | Custom prompt to use when starting work. Implies `--start-working`.                          |

\*Either `<ticket-id>` OR `--prompt` is required. If neither is provided, the user will be prompted.

## Workflow Overview

**All prompts happen upfront in Step 2.** Once configuration is collected, the rest of the workflow executes automatically without further user interaction.

1. **Parse Input**: Determine if using existing ticket or creating new task
2. **Collect Configuration**: Prompts for ALL missing options upfront
3. **Get/Create Linear Task**: Fetch existing task OR create new task from prompt
4. **Create Worktree**: Set up isolated git worktree for development
5. **Output Summary**: Display worktree path and next steps
6. **Start Working (Optional)**: Optionally cd into worktree and begin work with a prompt

---

## Step 1: Parse Input and Determine Mode

First, parse `$ARGUMENTS` to determine the mode:

```bash
# Check for ticket ID pattern (e.g., DEV-123, TEAM-456)
# This is typically the first positional argument
TICKET_PATTERN="^[A-Z]+-[0-9]+$"

# Parse arguments
TICKET_ID=""
PROMPT=""
# ... other arguments from the table above
```

**Mode Detection Logic:**

1. If first argument matches `TICKET_PATTERN` → Existing Ticket Mode
2. If `--prompt` is provided → New Task Mode
3. If neither → Prompt user to choose

---

## Step 2: Collect Configuration

**IMPORTANT: Collect all missing information upfront.** Do not prompt the user at multiple steps throughout the workflow.

### Phase 1: Mode Selection (if needed)

If neither ticket ID nor prompt was provided, ask the user:

```
AskUserQuestion:
- Mode: "How would you like to start?"
  - "Enter existing Linear ticket ID" → Prompt for ticket ID
  - "Describe new work to create a task" → Prompt for description
```

### Phase 2: Fetch Linear User and Teams (REQUIRED)

**CRITICAL: Before presenting ANY prompts, you MUST fetch the Linear user to get the username for branch prefix options.**

```
# Get current Linear user (for assignee and username prefix)
linear_user = mcp__linear__get_user(query="me")
LINEAR_USER_ID = linear_user.id
LINEAR_USERNAME = linear_user.displayName.lower().replace(" ", "").replace("-", "")
# Example: "Nick Koutrelakos" → "nickkoutrelakos"

# Get available teams
teams = mcp__linear__list_teams()
```

### Phase 3: Collect Independent Fields

Follow the shared configuration collection instructions in `@../shared/linear-task-config.md`.

**Pre-set these variables from command-line arguments before the shared config:**

- `TEAM` from `--team` (if provided)
- `PROJECT` from `--project` (if provided)
- `PRIORITY` from `--priority` (if provided)
- `LABEL` from `--label` (if provided)
- `BRANCH_PREFIX` from `--branch-prefix` (if provided)
- `TRUNK_BRANCH` from `--trunk` (if provided)
- `WORKTREE_BASE` from `--worktree_base` (if provided)
- `DUE_DATE` from `--due-date` (if provided)

**IMPORTANT: When prompting for branch prefix, the first option MUST be the user's personal namespace:**

```
Branch Prefix options:
1. "{LINEAR_USERNAME}/" (Recommended) - e.g., "nickkoutrelakos/"
2. "feature/" - Standard feature convention
3. "fix/" - For bug fixes
4. "chore/" - For maintenance tasks
5. "Custom" - Enter a custom prefix
```

**Note:** For this command, `CREATE_WORKTREE` is always true (that's the purpose of this command). Do NOT prompt for it.

**Note:** `USE_GRAPHITE` determines whether to use Graphite or standard git for branch tracking and PR workflows. **Users are always prompted to choose unless they explicitly pass `--use-graphite true` or `--use-graphite false`.**

### Phase 4: Team-Dependent Fields

After team is selected, prompt for project (via shared config).

---

## Step 3: Get or Create Linear Task

### If Existing Ticket Mode

Fetch the task details:

```
task = mcp__linear__get_issue(id=TICKET_ID)

TASK_ID = task.identifier       # e.g., "DEV-123"
TASK_TITLE = task.title
TASK_URL = task.url
TEAM = task.team.key            # Override team from ticket
```

### If New Task Mode

Generate a task description and create the task:

**Task Description Structure (User Story Format):**

```markdown
## User Story

As a [user type], I want [goal/capability] so that [benefit/value].

## Background

<1-2 sentences explaining the context or problem being solved from the user's perspective>

## Acceptance Criteria

- [ ] <Criterion 1 - what the user should be able to do>
- [ ] <Criterion 2 - expected behavior>
- [ ] <Criterion 3 - edge cases handled>
```

**Guidelines for Description Generation:**

- Write from the product/user perspective, not developer perspective
- Focus on user value and outcomes, not implementation details
- Infer user type from context (e.g., "end user", "admin", "developer")
- Acceptance criteria should be testable from user's perspective
- If the work is purely technical, frame in terms of user impact

**Create the task:**

```
mcp__linear__create_issue with:
- team: TEAM
- title: <generated from PROMPT or user-provided>
- description: <generated user story>
- priority: PRIORITY_NUMBER (0=none, 1=urgent, 2=high, 3=normal, 4=low)
- assignee: "me"
- labels: [LABEL] (if provided)
- project: PROJECT (or null if "None")
- dueDate: DUE_DATE (if provided)
```

Capture the result:

```
TASK_ID = created_issue.identifier   # e.g., "DEV-123"
TASK_TITLE = created_issue.title
TASK_URL = created_issue.url
```

---

## Step 4: Create Branch Name

Derive the branch name using the selected prefix and task:

```bash
# Slugify the title (lowercase, replace spaces with hyphens, remove special chars)
SLUG=$(echo "$TASK_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)

BRANCH_NAME="${BRANCH_PREFIX}/${TASK_ID}-${SLUG}"
```

---

## Step 5: Create Worktree

Set configuration variables and follow the shared worktree setup instructions in `@../shared/setup-worktree-core.md`:

```bash
# Configuration for shared worktree setup
BRANCH_NAME="${BRANCH_NAME}"
SETUP_SCRIPT="${setup:-}"
SKIP_SETUP="${skip_setup:-}"
USE_GRAPHITE="${use_graphite:-false}"  # Default to standard git
TRUNK_BRANCH="${TRUNK_BRANCH}"
WORKTREE_BASE="${WORKTREE_BASE}"  # Branch to create worktree FROM (start point)
SKIP_INDEX_RESET=""
```

Follow the complete worktree setup workflow defined in `@../shared/setup-worktree-core.md`. The shared setup handles:

- Worktrees directory detection and creation
- Git worktree creation with proper branch setup
- Claude settings copying (`.claude/` directory)
- Branch tracking configuration (Graphite if `USE_GRAPHITE=true`, otherwise standard git)
- Auto-detection and execution of setup scripts (npm, yarn, pnpm, bun)
- Git index reset for corruption prevention

---

## Step 6: Output Summary

Display a summary of what was created:

```
✅ Development Environment Ready!

📋 Linear Task: {TASK_ID} - {TASK_TITLE}
   {TASK_URL}

📁 Worktree: {WORKTREE_PATH}

🌿 Branch: {BRANCH_NAME}
   Created from: {WORKTREE_BASE}
   PR target: {TRUNK_BRANCH}

⚙️  Configuration:
   ✓ Claude settings copied
   ✓ Branch tracking: {USE_GRAPHITE ? "Graphite" : "Standard git"} ({BRANCH_NAME} → {TRUNK_BRANCH})
   ✓ Setup script completed (auto-detected: npm ci)
   ✓ Git index reset (corruption prevention)

To start working:
  cd "{WORKTREE_PATH}"

When ready to create a PR (standard git):
  /linear-task-and-pr-from-changes --trunk {TRUNK_BRANCH}

Or with Graphite (if USE_GRAPHITE was enabled):
  /linear-task-and-pr-from-changes --trunk {TRUNK_BRANCH} --use-graphite
```

---

## Step 7: Autonomous Task Completion (Optional)

After displaying the summary, offer the user the option to begin autonomous task implementation in the new worktree.

### If `--start-working` flag was provided

Skip the prompt and proceed directly to autonomous task completion.

### If `--start-prompt` was provided

Skip all prompts and use the provided prompt to start work immediately.

### Otherwise, prompt the user

```
AskUserQuestion:
- Start Work: "Would you like to cd into the worktree and start working autonomously?"
  - "Yes, start autonomous implementation (Recommended)" → Proceed to autonomous completion
  - "No, I'll work manually" → End workflow (show manual instructions)
```

### If user selects "Yes"

Prompt for the starting prompt:

```
AskUserQuestion:
- Prompt: "What prompt would you like to start with?"
  - "Use default autonomous prompt (Recommended)" → Use default prompt below
  - "Enter custom prompt" → Allow user to provide free-form input
```

**Default Prompt:**

```
Work on Linear task {TASK_ID}. Follow this autonomous workflow:

1. Read the Linear task details to understand requirements
2. Create an implementation plan
3. Implement the task following existing codebase patterns
4. Run tests and linting, fixing any issues
5. Commit changes with a conventional commit message

When complete, summarize what was implemented and any remaining work.
```

### Autonomous Execution Steps

1. **Change directory** to the worktree path:

   ```bash
   cd "{WORKTREE_PATH}"
   ```

2. **Begin autonomous work** by processing the selected prompt. Claude will:

   - **Read Linear task details** via `mcp__linear__get_issue` to understand requirements
   - **Analyze the codebase** to understand existing patterns and conventions
   - **Plan the implementation** using the planning workflow
   - **Implement the task** following codebase patterns
   - **Run tests and linting** to ensure quality (detect available scripts/targets from package.json or project.json)
   - **Commit changes** with a conventional commit message

3. **Report completion** with a summary of:
   - What was implemented
   - Files created/modified
   - Tests passing/failing
   - Any remaining work or follow-ups

### If user selects "No"

Display the existing manual instructions:

```
To start working:
  cd "{WORKTREE_PATH}"

When ready to create a PR (standard git):
  /linear-task-and-pr-from-changes --trunk {TRUNK_BRANCH}

Or with Graphite (if USE_GRAPHITE was enabled):
  /linear-task-and-pr-from-changes --trunk {TRUNK_BRANCH} --use-graphite
```

---

## Error Handling

- **No ticket ID or prompt provided**: Prompt user to choose mode
- **Invalid ticket ID**: Report error and ask for correct ID
- **Ticket not found**: Report error with suggestion to check ID
- **Linear MCP not available**: Provide instructions for setup
- **Worktree creation fails**: Clean up and provide manual instructions
- **Target directory exists**: Prompt to reuse or choose different name
- **Setup script fails**: Log warning and continue (non-blocking)
- **Graphite tracking fails**: Log warning and provide manual command

---

## Usage Examples

### Start from existing ticket

```
/start-linear-task DEV-123
```

### Start with a description (creates new task)

```
/start-linear-task --prompt "Add dark mode toggle to settings page"
```

### With team and priority pre-specified

```
/start-linear-task --prompt "Fix login timeout issue" --team DEV --priority high
```

### With full configuration

```
/start-linear-task DEV-456 --trunk develop --branch-prefix feature --skip-graphite
```

### Interactive mode (no arguments)

```
/start-linear-task
```

This will prompt for mode selection (existing ticket vs. new task) and all configuration.

### Auto-start working with default prompt

```
/start-linear-task DEV-123 --start-working
```

Creates worktree and immediately starts working with the default prompt.

### Auto-start with custom prompt

```
/start-linear-task --prompt "Add caching layer" --start-prompt "Implement a Redis caching layer for the API endpoints"
```

Creates the task, worktree, and immediately starts working with the custom prompt.

---

## Prerequisites

- **git** (2.5+ for worktree support)
- **gh** (GitHub CLI) - required for standard git workflow (default)
- **gt** (Graphite CLI) - optional, only required if using `--use-graphite true`
- **Linear MCP** (configured for Linear API access)

Arguments: $ARGUMENTS
