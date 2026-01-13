---
name: shared:linear-task-config
title: Linear Task Configuration (Shared)
user-invocable: false
description: |
  Shared configuration collection logic for Linear task creation workflows.
  This file provides reusable prompting instructions that other commands reference.
schemaVersion: 1
notes: |
  This is a shared instructions file within the development-pr-workflow plugin.

  When referenced by another command, these variables may already be set from arguments:
    - TEAM: Linear team identifier (optional, will prompt if not set)
    - PROJECT: Linear project name (optional, will prompt after team selection)
    - PRIORITY: Priority level (optional, will prompt if not set)
    - LABEL: Linear label to apply (optional)
    - BRANCH_PREFIX: Custom branch prefix (optional, will prompt if not set)
    - TRUNK_BRANCH: Target branch for PR / Graphite parent (optional, will prompt if not set)
    - WORKTREE_BASE: Branch to create worktree FROM (optional, defaults to current branch if not set)
    - USE_GRAPHITE: Whether to use Graphite CLI (optional, will prompt if not set)
    - TASK_TITLE: Title for the Linear task (optional, may be auto-generated or user-provided)
    - DUE_DATE: Due date for the task (optional)

  After execution, these variables will be set:
    - All of the above (either from arguments or user prompts)
    - LINEAR_USER_ID: The current user's Linear ID
    - LINEAR_USERNAME: The current user's username (for branch prefix)
---

# Shared Linear Task Configuration Instructions

These instructions provide the configuration collection logic for Linear task workflows. Commands that reference this file should:

1. Parse any command-line arguments that pre-set configuration values
2. Reference this file to collect remaining configuration
3. Continue with command-specific logic after configuration is collected

---

## Phase 1: Fetch Required Data

Before prompting, fetch data needed to present options:

```
# Get current Linear user (for assignee and username prefix)
linear_user = mcp__linear__get_user(query="me")
LINEAR_USER_ID = linear_user.id
LINEAR_USERNAME = linear_user.displayName.lower().replace(" ", "").replace("-", "")

# Get available teams
teams = mcp__linear__list_teams()
```

---

## Phase 2: Collect Independent Configuration

**IMPORTANT: Collect all missing fields in a SINGLE prompt using `AskUserQuestion` with multiple questions.**

For any fields not already set from command-line arguments, prompt the user:

### Configuration Fields (Phase 2)

| Field           | Required | Notes                                                                                   |
| --------------- | -------- | --------------------------------------------------------------------------------------- |
| Team            | Yes      | Linear team identifier. Options from `mcp__linear__list_teams`.                         |
| Priority        | Yes      | Options: urgent, high, normal, low, none                                                |
| Trunk Branch    | Yes      | Target branch for PR / Graphite parent (e.g., "main", "develop")                        |
| Worktree Base   | No       | Branch to create worktree FROM (defaults to current branch if not specified)            |
| Branch Prefix   | Yes      | Options: username (from LINEAR_USERNAME), feature/, fix/, chore/, or custom             |
| Use Graphite    | Yes      | true = `gt submit`, false = `gh pr create`                                              |
| Create Worktree | Yes      | true = isolated worktree, false = branch in current repo (if applicable to the command) |

### Branch Prefix Options

Present these options (customize the username option with the actual LINEAR_USERNAME):

1. **{LINEAR_USERNAME}/** (Recommended) - Personal branch namespace
2. **feature/** - Standard feature branch convention
3. **fix/** - For bug fixes
4. **chore/** - For maintenance tasks
5. **Custom** - Let user enter their own prefix

### Example AskUserQuestion (Phase 2)

```
AskUserQuestion with questions:
- Team: "Which Linear team?" (options from teams list + "Other")
- Priority: "Priority level?" (urgent/high/normal/low/none)
- Trunk Branch: "Target branch for PR?" (main/develop/Other)
- Worktree Base: "Create worktree from which branch?" (current branch/main/develop/Other)
- Branch Prefix: "Branch prefix?" ({LINEAR_USERNAME}/feature/fix/chore/Custom)
- Use Graphite: "PR creation method?" (Graphite CLI/GitHub CLI)
```

**Note:** For "Worktree Base", show the current branch name as the first/recommended option. This determines which commits the new branch will include.

---

## Phase 3: Collect Team-Dependent Configuration

After team is selected, fetch and prompt for project:

```
# Fetch projects for the selected team
projects = mcp__linear__list_projects(team=TEAM)

AskUserQuestion:
- Project: "Which project should this task be added to?" (options from projects + "None")
```

---

## Phase 4: Optional Configuration

If not already set, these fields are optional and can be skipped:

| Field    | Required | Notes                                                     |
| -------- | -------- | --------------------------------------------------------- |
| Label    | No       | Linear label(s) to apply. Fetch with `list_issue_labels`. |
| Due Date | No       | Task due date in ISO format                               |

---

## Priority Mapping

When creating the Linear task, map priority strings to numbers:

| String | Number |
| ------ | ------ |
| none   | 0      |
| urgent | 1      |
| high   | 2      |
| normal | 3      |
| low    | 4      |

---

## Output Variables

After executing these instructions, the following variables will be available:

| Variable          | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `TEAM`            | Selected Linear team identifier                             |
| `PROJECT`         | Selected Linear project (or null if "None")                 |
| `PRIORITY`        | Selected priority level (string)                            |
| `PRIORITY_NUMBER` | Priority as number for API call                             |
| `LABEL`           | Selected label(s) (if any)                                  |
| `BRANCH_PREFIX`   | Selected branch prefix (e.g., "johndoe", "feature")         |
| `TRUNK_BRANCH`    | Target branch for PR / Graphite parent                      |
| `WORKTREE_BASE`   | Branch to create worktree from (defaults to current branch) |
| `USE_GRAPHITE`    | Boolean - whether to use Graphite CLI                       |
| `LINEAR_USER_ID`  | Current user's Linear ID                                    |
| `LINEAR_USERNAME` | Current user's username (derived from display name)         |
| `DUE_DATE`        | Due date in ISO format (if provided)                        |

---

## Usage Example

A command referencing this shared config:

```markdown
## Step 2: Collect Configuration

Follow the shared configuration collection instructions in `@../shared/linear-task-config.md`.

Set these variables from command-line arguments before referencing:

- `TEAM` from `--team` argument (if provided)
- `PRIORITY` from `--priority` argument (if provided)
- etc.

After the shared config completes, all configuration variables will be set.
```
