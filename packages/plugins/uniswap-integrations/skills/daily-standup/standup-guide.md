---
name: daily-standup
description: This provides a daily standup, checking GitHub and Linear over the past day and providing a summary of what you&#39;ve been working on and what you will continue to work on.
model: claude-haiku-4-5
---

## Workflow Process

This workflow uses the Linear MCP and GitHub MCP to:

1. Fetch all issues assigned to a user (defaults to you)
2. Filter for incomplete/in-progress issues
3. Organize them by priority and status
4. Fetch GitHub activity from the last 24 hours across all repositories in the in the Uniswap GitHub organization
5. Generate a friendly team update message combining Linear issues and GitHub activity

## Execution Steps

1. **Parse Arguments**: Extract optional parameters

   - Linear user: defaults to "me" (authenticated user)
   - GitHub username: must be provided by user (prompt if not specified)
   - Parse from `$ARGUMENTS` for `user:` and `github:` parameters

2. **Prompt for GitHub Username** (if not provided):

   - Check if `github:` parameter was provided in `$ARGUMENTS`
   - If not provided, ask the user: "What is your GitHub username for the Uniswap organization?"
   - Store the response for use in GitHub queries

3. **Fetch Linear Issues**: Get all issues assigned to the specified user

   - Use `mcp__linear__list_issues` with assignee parameter
   - Filter by state (exclude completed/cancelled)

4. **Analyze Issues**: Review issue details including:

   - Title and description
   - Current status (Backlog, Todo, In Progress, etc.)
   - Priority level (Urgent, High, Normal, Low)
   - Project/team association
   - Recent comments or updates
   - Due dates

5. **Fetch GitHub Activity** (last 24 hours):

   - Use GitHub MCP search tools to find activity from the specified user
   - Filter for Uniswap organization repositories only
   - Include:
     - Pull requests created, updated, or reviewed
     - Commits pushed
     - PR comments and reviews
     - Issues opened or commented on
   - Search queries to use:
     - `org:Uniswap author:<username> created:>YYYY-MM-DD` (for PRs/issues)
     - `org:Uniswap commenter:<username> updated:>YYYY-MM-DD` (for comments)
     - `org:Uniswap reviewed-by:<username> updated:>YYYY-MM-DD` (for reviews)

6. **Organize by Status**:

   - **In Progress**: Currently working on
   - **Todo**: Up next
   - **Backlog**: High priority items on deck

7. **Generate Update**: Create a concise message covering:
   - What's currently being worked on (Linear issues)
   - GitHub activity in the last 24 hours (PRs, commits, reviews)
   - What's coming up next (Linear issues)
   - Any blockers or help needed
   - Format suitable for Slack/team chat

## Usage Examples

**Default** (your own tasks - will prompt for GitHub username):

```
/daily-standup
```

**With GitHub username specified**:

```
/daily-standup github:wkoutre
```

**Check another team member's tasks** (specify both Linear user and GitHub username):

```
/daily-standup user:john@example.com github:johndoe
/daily-standup user:Jane Doe github:janedoe
/daily-standup user:abc-123-user-id github:jsmith
```

**With additional instructions**:

```
/daily-standup focus on high priority items
/daily-standup user:john@example.com brief version
/daily-standup include estimates and blockers
```

## Parameter Format

The `user:` parameter (for Linear) should be provided as:

- `user:me` - Explicitly specify yourself (default)
- `user:<email>` - e.g., `user:john@company.com`
- `user:<name>` - e.g., `user:John Smith`
- `user:<id>` - e.g., `user:abc-123-def-456`

The `github:` parameter (for GitHub) should be provided as:

- `github:<username>` - e.g., `github:wkoutre` or `github:johndoe`
- If omitted, you will be prompted to enter your GitHub username

Any text after the parameters will be treated as additional instructions for formatting or focus.

## Output Format

The generated update will include:

**GitHub Activity (Last 24 Hours)**:

- PRs opened, updated, or merged
- Code reviews completed
- Commits pushed (with repo names)
- Comments on PRs/issues
- Links to relevant PRs and commits

**Currently Working On** (In Progress):

- Issue titles with priority indicators
- Links to issues
- Brief context

**Up Next** (Todo):

- Prioritized list of upcoming work
- Due dates if relevant

**On Deck** (Backlog - High Priority):

- Important items queued up

**Blockers/Help Needed**:

- Issues that may need team support
- Questions or dependencies

**Notes**:

- Recent activity or comments
- Additional context

The message will be conversational and ready to paste into Slack or share with your team.

## Implementation Details

The workflow will:

- Parse `$ARGUMENTS` to extract `user:` and `github:` parameters
  - Linear user: default to "me" if not specified
  - GitHub username: if not found in arguments, prompt user with: "What is your GitHub username for the Uniswap organization?"
- **IMPORTANT**: Always prompt for GitHub username FIRST before fetching any data if it's not provided in arguments
- Calculate the timestamp for 24 hours ago from current time (format: YYYY-MM-DD)
- **Fetch GitHub Activity**:
  - Use the provided or prompted GitHub username
  - Use `mcp__github__search_issues` with queries like:
    - `org:Uniswap author:<username> created:>YYYY-MM-DD` (PRs/issues created)
    - `org:Uniswap involves:<username> updated:>YYYY-MM-DD` (all activity including comments, reviews)
  - Get PR details for any PRs found using `mcp__github__get_pull_request`
  - Include PR status (open/merged/closed) and review status
- **Fetch Linear Issues**:
  - Call Linear MCP with the assignee parameter
  - Prioritize urgent/high priority items
  - Note any issues with recent activity or comments
- **Combine and Format**:
  - Start with GitHub activity section (most recent work)
  - Follow with Linear issues organized by status
  - Identify potential blockers based on status, priority, and age
  - Suggest what help might be needed from the team
- Keep the tone professional but conversational
- Handle cases where no incomplete tasks or GitHub activity exist gracefully

Arguments: $ARGUMENTS
