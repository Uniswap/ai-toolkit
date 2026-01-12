---
description: Methodically work through GitHub pull request comments in a conversational workflow, analyzing each comment, presenting solution options, gathering your decisions, and implementing approved changes.
argument-hint: <pr-number> OR <owner/repo> <pr-number>
allowed-tools: Bash(*), Read(*), Write(*), Edit(*), Grep(*), Glob(*), AskUserQuestion(*), mcp__github__get_pull_request(*), mcp__github__get_pull_request_comments(*), mcp__github__get_pull_request_reviews(*)
---

# Work Through PR Comments

Methodically work through GitHub pull request comments in a conversational workflow, analyzing each comment, presenting solution options, gathering your decisions, and implementing approved changes.

## Usage

```bash
/work-through-pr-comments <pr-number>           # Work through comments on PR in current repo
/work-through-pr-comments <owner/repo> <pr-number>  # Work through comments on PR in specific repo
```

## Workflow Overview

This command implements a **conversational, methodical workflow** for addressing PR comments:

1. **Fetch PR Details**: Get PR information, reviews, and inline comments
2. **Analyze Each Comment**: For each comment, provide context and analysis
3. **Present Options**: Suggest multiple solution approaches with pros/cons
4. **Gather Decisions**: Ask you which approach to take
5. **Implement Changes**: Make the approved changes
6. **Verify**: Test and validate the changes
7. **Repeat**: Move to next comment until all are addressed
8. **Commit**: Offer to create a single commit with all changes

## Step-by-Step Process

### Step 1: Parse Input and Detect Repository

- Parse command arguments for PR number and optional owner/repo
- If only PR number provided, detect from git remote
- Validate PR exists and is accessible

### Step 2: Fetch PR Data

Fetch all PR-related data in parallel:

- PR details (title, author, state)
- Inline comments (code review comments)
- Review comments (from review body)

### Step 3: Organize and Categorize Comments

- Collect all comments into a unified list
- Sort by creation date (oldest first)
- Categorize by type (inline vs review)

### Step 4: Process Each Comment Conversationally

For each comment:

1. **Display Context**: Show author, type, location, comment body
2. **Show Code Context**: If inline comment, show relevant code section
3. **Provide Analysis**: Explain what reviewer is asking and why
4. **Present Options**: 2-3 solution approaches with pros/cons
5. **Get User Decision**: Use AskUserQuestion for choice
6. **Implement**: Make changes based on selected option

### Step 5: Summary and Commit

After processing all comments:

- Show summary of changes
- Run code quality checks (format, lint)
- Show git status
- Offer to commit all changes

## Workflow Principles

### 1. Conversational Approach

- One comment at a time
- Clear context always shown
- Ask questions, wait for decisions
- Support custom responses

### 2. Methodical Analysis

For each comment:

- Understand Intent
- Identify Impact
- Assess Complexity
- Consider Tradeoffs
- Provide Recommendation

### 3. Present Options

Always provide **2-3 options** with:

- Clear, concise description
- Pros and cons for each
- Your recommendation (with reasoning)
- "Custom" option for user-provided solutions
- "Skip" option for deferring

### 4. Quality Checks

Before offering to commit:

- Run code formatting
- Run markdown linting (if applicable)
- Run affected linting
- Show git status for review

## Example

```
/work-through-pr-comments 154

📋 Analyzing PR #154 in Uniswap/ai-toolkit...

Found 3 comment(s) to address

================================================================================
📝 Comment 1/3
================================================================================

**Author**: Melvillian
**Type**: Inline code comment
**Location**: `scripts/lefthook/lint-markdown.sh:14`
**Comment**:
> security-nit: pin to `npx markdownlint-cli2@v1.18.1 --fix`

## 🤔 My Analysis

The reviewer is raising a security concern about using `npx` without version pinning...

## 💡 Suggested Solutions

**Option A**: Pin to exact version in script
- ✅ Pros: Clear version, reproducible builds
- ❌ Cons: Version duplication

**Option B**: Use locally installed version (`npm exec`)
- ✅ Pros: Single source of truth
- ❌ Cons: Requires npm install first

**💭 My Recommendation**: Option B

How would you like to address this comment?
○ Option A
● Option B
○ Custom
○ Skip
```

## Error Handling

- **No Comments Found**: Notify user PR has no review comments
- **Invalid PR Number**: Show verification steps
- **File Read Failures**: Continue without file context
- **Git Operation Failures**: Provide manual commands

## Notes

- Emphasizes conversation and collaboration
- Always wait for user decisions
- Support user's custom solutions
- Track all changes for comprehensive summary
- Create single, well-formatted commit
