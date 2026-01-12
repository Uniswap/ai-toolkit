---
name: daily-standup
description: Generate daily standup reports from GitHub and Linear. Use when user says "what did I work on yesterday", "generate my standup update", "summarize my recent activity", "what's on my plate today", or "prepare my daily update for the team".
user-invocable: true
allowed-tools: Task(mcp__linear__*), Task(mcp__github__*), Read, Glob
model: haiku
---

# Daily Standup Generator

Generate daily standup reports by aggregating activity from GitHub and Linear.

## When to Activate

- Morning standup preparation
- User asks "what did I work on?"
- User wants activity summary
- User preparing team update
- User asks about their tasks

## What It Does

1. **Fetch Linear Issues**: Get assigned tasks by status
2. **Fetch GitHub Activity**: PRs, commits, reviews (last 24h)
3. **Organize by Status**: In Progress, Todo, Backlog
4. **Generate Update**: Team-ready message

## Output Format

**GitHub Activity (Last 24 Hours)**:

- PRs opened, updated, or merged
- Code reviews completed
- Commits pushed

**Currently Working On** (In Progress):

- Issue titles with priority
- Links to issues

**Up Next** (Todo):

- Prioritized upcoming work

**Blockers/Help Needed**:

- Issues needing team support

## Parameters

| Parameter | Description                      | Default              |
| --------- | -------------------------------- | -------------------- |
| `user:`   | Linear user (email, name, or ID) | "me"                 |
| `github:` | GitHub username                  | (prompts if missing) |

## Usage

Basic (will prompt for GitHub username):

```
"Generate my daily standup"
```

With GitHub username:

```
"Daily standup for github:wkoutre"
```

For another team member:

```
"Standup for user:john@example.com github:johndoe"
```

## Notes

- Requires Linear and GitHub MCP servers
- Filters to Uniswap organization repositories
- Generates Slack-ready formatted output
