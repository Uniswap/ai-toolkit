---
description: Generate well-structured git commit messages. Use when user says "generate commit message", "write a commit", "what should my commit message be", "create commit message for these changes", or needs help crafting conventional commit messages.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Task(subagent_type:commit-message-generator-agent)
---

# Commit Message Generator

Generate a structured git commit message based on current changes and repository patterns.

## When to Activate

- User asks for help with commit message
- User wants to generate a commit message
- User needs conventional commit formatting
- User asks "what should my commit say"

## Quick Process

1. **Gather Git Information**:

   - Run `git status` to see staged and unstaged changes
   - Run `git diff --cached` to get detailed staged changes
   - Run `git diff` to get unstaged changes (if any)
   - Run `git log --oneline -10` to understand repository commit patterns

2. **Parse Input**: Extract any scope or focus area from user's request

3. **Generate Message**: Create commit message following conventional format:
   - Concise summary line (≤100 characters)
   - Detailed explanation of WHAT and WHY (1-3 paragraphs)
   - Claude Code signature

## Output Format

Generate commit message in this format:

```
<type>(<scope>): <summary>

<body explaining WHAT changed and WHY>

🤖 Generated with [Claude Code](https://claude.ai/code)
```

**Types**: feat, fix, docs, style, refactor, test, chore, perf, ci, build

## Examples

```
"Generate a commit message"
"What should my commit say for these auth changes"
"Write commit message focusing on the API updates"
"Create commit for database migration"
```

## Delegation

Invokes the **commit-message-generator-agent** with:

- staged_changes: git diff --cached output
- unstaged_changes: git diff output (for context)
- commit_history: recent git log for pattern matching
- scope: optional focus area from user

## Safety

- Never executes `git commit` - only generates message text
- Shows message in code block for easy copying
- Requires git repository with changes
