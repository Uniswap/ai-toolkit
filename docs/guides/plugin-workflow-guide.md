# Plugin Workflow Guide

This guide documents the canonical development workflows across the Uniswap AI Toolkit plugins.

## Plugin Overview

| Plugin                     | Purpose                                         | Workflow Steps |
| -------------------------- | ----------------------------------------------- | -------------- |
| development-codebase-tools | Codebase exploration, analysis, and refactoring | Step 1         |
| development-planning       | Planning, execution, and PR creation            | Steps 2-5      |
| development-pr-workflow    | PR review, feedback, and merge                  | Steps 6-7      |
| development-productivity   | Testing, documentation, and research            | Cross-cutting  |
| uniswap-integrations       | External service integrations (Linear, Notion)  | Cross-cutting  |

## Canonical Development Workflow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CANONICAL DEVELOPMENT WORKFLOW                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │  1. EXPLORE │  development-codebase-tools                                │
│  │             │  Skills: explore-codebase, analyze-code                    │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │   2. PLAN   │  development-planning                                      │
│  │             │  Skill: plan-implementation                                │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │  3. REVIEW  │  development-planning                                      │
│  │    PLAN     │  Skill: review-plan                                        │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 4. EXECUTE  │  development-planning                                      │
│  │             │  Skill: execute-plan                                       │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 5. CREATE   │  development-planning                                      │
│  │    PR       │  Skill: create-pr                                          │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ 6. PR       │  development-pr-workflow                                   │
│  │    REVIEW   │  Skill: review-code                                        │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │  7. MERGE   │  development-pr-workflow                                   │
│  │             │  Skill: resolve-pr-issues                                  │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Decision Tree: Which Plugin/Skill to Use?

### "I need to understand the codebase..."

→ Use **development-codebase-tools**

| Scenario                           | Skill/Agent                |
| ---------------------------------- | -------------------------- |
| "How does feature X work?"         | explore-codebase           |
| "Explain this file to me"          | analyze-code               |
| "What patterns does this use?"     | pattern-learner agent      |
| "Is this code secure?"             | security-analyzer agent    |
| "What are the performance issues?" | performance-analyzer agent |

### "I need to implement something..."

→ Use **development-planning**

| Scenario                            | Skill                   |
| ----------------------------------- | ----------------------- |
| "Plan how to implement X"           | plan-implementation     |
| "Is this plan complete?"            | review-plan             |
| "Get multiple perspectives on plan" | plan-swarm              |
| "Implement this plan"               | execute-plan            |
| "Create a PR for my changes"        | create-pr               |
| "Generate a commit message"         | generate-commit-message |

### "I need to manage a PR..."

→ Use **development-pr-workflow**

| Scenario                            | Skill/Command                   |
| ----------------------------------- | ------------------------------- |
| "Review this PR"                    | review-code                     |
| "Address PR comments"               | work-through-pr-comments        |
| "Fix CI failures"                   | resolve-pr-issues               |
| "Split into smaller PRs" (Graphite) | split-graphite-stack            |
| "Update my PR stack" (Graphite)     | update-graphite-stack           |
| "Start working on a Linear task"    | start-linear-task               |
| "Create task + PR from changes"     | linear-task-and-pr-from-changes |

#### Quick Commands for Linear + PR Workflow

These are frequently used commands for rapid task and PR creation:

##### `/development-pr-workflow:start-linear-task`

**Use when:** You're starting fresh work on a new task or feature.

**What it does:**

1. Prompts you to provide a Linear task ID (e.g., `LIN-123`) or describe new work
2. Creates a new Linear task if one doesn't exist
3. Creates an isolated [git worktree](https://git-scm.com/docs/git-worktree) for the task
4. Checks out a properly named branch (e.g., `feature/lin-123-add-oauth`)
5. Sets up the environment so you can start coding immediately

**Example:**

```bash
/development-pr-workflow:start-linear-task

# Claude will ask: "What task are you working on?"
# You can respond with:
#   - An existing task: "LIN-123"
#   - New work: "Add OAuth2 authentication to the API"
```

**Why worktrees?** Worktrees let you work on multiple tasks in parallel without stashing or switching branches. Each task gets its own isolated directory.

---

##### `/development-pr-workflow:linear-task-and-pr-from-changes`

**Use when:** You've already made local changes and want to formalize them into a tracked task with a PR.

**What it does:**

1. Analyzes your current uncommitted/staged changes
2. Creates a new Linear task with a description based on your changes
3. Creates a new branch (optionally in a worktree)
4. Commits your changes with a conventional commit message
5. Pushes and creates a PR linked to the Linear task

**Example:**

```bash
# You've made some changes locally...
git status  # Shows modified files

/development-pr-workflow:linear-task-and-pr-from-changes

# Claude will:
#   1. Analyze your changes
#   2. Ask for task details or infer from the changes
#   3. Create Linear task → branch → commit → PR
```

**When to use which:**

| Scenario                                     | Command                           |
| -------------------------------------------- | --------------------------------- |
| Starting new work from scratch               | `start-linear-task`               |
| Already have local changes to formalize      | `linear-task-and-pr-from-changes` |
| Quick spike that turned into real work       | `linear-task-and-pr-from-changes` |
| Assigned a Linear task, ready to start       | `start-linear-task`               |

### "I need documentation or tests..."

→ Use **development-productivity**

| Scenario                         | Skill/Command      |
| -------------------------------- | ------------------ |
| "Write tests for this code"      | generate-tests     |
| "Update CLAUDE.md documentation" | update-claude-docs |
| "Research best practices for X"  | research-topic     |
| "Optimize this prompt"           | optimize-prompt    |

### "I need external integrations..."

→ Use **uniswap-integrations**

| Scenario                        | Skill/MCP          |
| ------------------------------- | ------------------ |
| "What did I work on yesterday?" | daily-standup      |
| "Refine this Linear task"       | refine-linear-task |
| "Search Notion for X"           | Notion MCP         |
| "Query Linear issues"           | Linear MCP         |
| "Run Nx commands"               | Nx MCP             |

## Workflow Examples

### Example 1: New Feature Development

```text
1. Explore: "Help me understand the authentication system"
   → development-codebase-tools: explore-codebase

2. Plan: "Plan how to add OAuth2 support"
   → development-planning: plan-implementation

3. Review: "Is this plan complete?"
   → development-planning: review-plan

4. Execute: "Implement the OAuth2 plan"
   → development-planning: execute-plan

5. Create PR: "Create a PR for these changes"
   → development-planning: create-pr

6. Review: "Review my PR"
   → development-pr-workflow: review-code

7. Fix Issues: "Address the review comments"
   → development-pr-workflow: work-through-pr-comments
```

### Example 2: Bug Fix with Linear Integration

```text
1. Start Task: "/start-linear-task LIN-123"
   → development-pr-workflow: Creates worktree, checks out branch

2. Explore: "What's causing this bug?"
   → development-codebase-tools: analyze-code

3. Fix: Make code changes

4. Test: "Write tests for my fix"
   → development-productivity: generate-tests

5. Create PR: Execute creates PR automatically
   → development-planning: create-pr

6. Update Linear: Status updated automatically
   → uniswap-integrations: Linear MCP
```

### Example 3: Code Review Workflow

```text
1. Comprehensive Review: "/review-pr 123"
   → development-pr-workflow: Multi-agent review

2. Address Comments: "Work through the PR comments"
   → development-pr-workflow: work-through-pr-comments

3. Fix CI: "Fix the failing CI"
   → development-pr-workflow: resolve-pr-issues
```

## Cross-Plugin Context Sharing

The plugins share context through the centralized **context-loader** agent in development-codebase-tools:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXT SHARING FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  development-codebase-tools                                     │
│  └── context-loader (centralized)                               │
│       │                                                         │
│       ├──→ development-planning                                 │
│       │    └── planner, plan-reviewer use context               │
│       │                                                         │
│       ├──→ development-pr-workflow                              │
│       │    └── review-executor uses context                     │
│       │                                                         │
│       └──→ development-productivity                             │
│            └── researcher, test-writer use context              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Orchestration

The **agent-orchestrator** in development-codebase-tools coordinates multi-agent workflows:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Request                                                   │
│       │                                                         │
│       ▼                                                         │
│  agent-orchestrator                                             │
│       │                                                         │
│       ├──→ Capability Matching                                  │
│       │    └── Selects best agent(s) for task                   │
│       │                                                         │
│       ├──→ Context Loading                                      │
│       │    └── Delegates to context-loader                      │
│       │                                                         │
│       └──→ Task Execution                                       │
│            └── Coordinates agent execution                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Git Workflow Support

Both standard Git and Graphite workflows are supported:

### Standard Git + GitHub CLI (Default)

- Works out of the box
- Uses `git push` and `gh pr create`
- Suitable for most development workflows

### Graphite (Opt-in)

- Enable with `--use-graphite` flag
- Supports stacked PRs
- Features: stack-splitter, graphite-stack-updater

## Related Documentation

- [Creating Agents](./creating-agents.md) - How to create custom agents
- [Claude Integration](./claude-integration.md) - Claude Code integration details
- [Autonomous Tasks](./autonomous-claude-tasks.md) - Running autonomous workflows
