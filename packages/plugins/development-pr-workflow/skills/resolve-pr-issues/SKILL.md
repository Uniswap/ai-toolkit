---
description: Fix PR issues including review comments and CI failures. Use when user says "fix the failing CI on my PR", "address the review comments on PR #123", "my PR has failing checks", "help me resolve the feedback on my pull request", "the build is failing on my PR", or "make my PR merge-ready".
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebFetch, WebSearch, Task, mcp__plugin_github_github__pull_request_read, mcp__plugin_github_github__get_file_contents, mcp__plugin_github_github__pull_request_review_write, mcp__plugin_github_github__add_issue_comment, mcp__plugin_uniswap-integrations_github__pull_request_read, mcp__plugin_uniswap-integrations_github__get_file_contents, mcp__plugin_uniswap-integrations_github__pull_request_review_write, mcp__plugin_uniswap-integrations_github__add_issue_comment
model: opus
---

# PR Issue Resolver

Orchestrate resolution of all outstanding PR feedback — inline comments, review bodies, and CI failures — through a structured triage-then-dispatch pipeline.

## When to Activate

- User mentions PR review comments to address
- CI/CD checks are failing on a PR
- User wants to fix a pull request
- User needs to respond to reviewer feedback
- Build or tests failing on a PR
- User says "fix my PR" or "address the comments"

## Workflow Overview

```text
Phase 0: Input Parsing
    ↓
Phase 1: Gather (parallel fetch)
    ↓
Phase 2: Normalize (unified item list)
    ↓
Phase 3: Triage (act vs. explain-why-not)
    ↓
Phase 4: Dispatch (subagents for code changes, direct replies for explanations)
    ↓
Phase 5: Collect & Verify
    ↓
Phase 6: Commit & Report
```

---

## Phase 0: Input Parsing

Extract from the user's request:

- **`pr_number`** (required): Parse from user message, PR URL, or prompt for it
- **`owner`** (optional): Infer via `gh repo view --json owner --jq '.owner.login'`
- **`repo`** (optional): Infer via `gh repo view --json name --jq '.name'`

**Validate access and state** before proceeding:

```bash
gh pr view {pr_number} --json number,title,state --jq '{number, state}'
```

- If the command fails (access error, PR not found), surface the error to the user. Do not continue.
- If `state` is `MERGED` or `CLOSED`, warn the user: "PR #{number} is {state}. Do you still want to proceed?" Require explicit confirmation before continuing — resolving comments on a merged/closed PR is almost never what the user intended.

## Phase 1: Gather

Fetch all PR data in parallel:

| Data            | Primary Method                                       | Fallback                                              |
| --------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| PR details      | `pull_request_read(method: "get")`                   | `gh pr view {number} --json title,author,state,body`  |
| Inline comments | `pull_request_read(method: "get_review_comments")`   | `gh api repos/{owner}/{repo}/pulls/{number}/comments` |
| Review bodies   | `gh api repos/{owner}/{repo}/pulls/{number}/reviews` | None (primary method — MCP lacks reviews endpoint)    |
| CI status       | `pull_request_read(method: "get_status")`            | `gh pr checks {number}`                               |
| PR diff         | `pull_request_read(method: "get_diff")`              | `gh pr diff {number}`                                 |
| Changed files   | `pull_request_read(method: "get_files")`             | `gh pr view {number} --json files`                    |

> **Note**: The changed files list is used in Phase 4 to scope agent work — agents should only modify files in this list (plus cross-file references). It also helps validate that inline comment file paths actually exist in the PR diff.

### Error Handling

- **Inline comments**: If both `pull_request_read` MCP and `gh api` fallback fail for inline comments, **stop and surface the error immediately**. Inline comments are the primary input — do not proceed with an empty comment list. The user must resolve the access issue before the workflow can continue.
- **Review bodies**: If `gh api` for review bodies fails (auth, rate limit, network), **surface the error to the user** before proceeding. The workflow may continue with inline comments and CI items, but the user must know review bodies were not fetched. Do not silently skip them.
- **CI status / diff / changed files**: If these fail, surface the error but allow the workflow to continue with reduced functionality. Note the missing data in the triage summary.

## Phase 2: Normalize

Parse all feedback into a **unified item list**. Each item has:

| Field          | Type                                  | Description                                             |
| -------------- | ------------------------------------- | ------------------------------------------------------- |
| `id`           | string                                | Comment ID or generated identifier                      |
| `source`       | `"inline"` / `"review_body"` / `"ci"` | Where the feedback came from                            |
| `author`       | string                                | GitHub username                                         |
| `is_bot`       | boolean                               | True for CI bots, GitHub Actions, etc.                  |
| `is_resolved`  | boolean                               | True if thread is resolved or comment is outdated       |
| `location`     | `{file, line}` or `null`              | Code location (null for review body items, CI failures) |
| `content`      | string                                | Comment text or CI failure description                  |
| `review_state` | string                                | APPROVED, CHANGES_REQUESTED, COMMENTED                  |
| `blocking`     | boolean                               | Derived from review state + language analysis           |
| `context`      | string                                | Surrounding code or CI log excerpt                      |

### Resolved/Outdated Detection

- Inline comments with `position: null` → outdated (diff line no longer exists)
- Comment threads marked as resolved → already handled
- Set `is_resolved: true` — these are filtered out during triage

### Blocking Classification

- `CHANGES_REQUESTED` review state → default `blocking: true`
- `COMMENTED` or `APPROVED` review state → default `blocking: false`
- Language overrides: "must", "required", "blocking", "critical", "security", "vulnerability" → `blocking: true`
- Language overrides: "nit", "optional", "consider", "suggestion", "minor", "nice to have" → `blocking: false`
- CI failures → always `blocking: true`

### Review Body Parsing

The review body is free-form text. Parse it into discrete items:

- Each bullet point, numbered item, or paragraph with a distinct concern = one item
- Standalone questions = separate item (will become RESPOND_ONLY)
- General praise/acknowledgment = skip (no item created)

### CI Bot Deduplication

If an inline comment author is a known bot (e.g., `github-actions[bot]`, `codecov-commenter`, `renovate[bot]`) AND the content overlaps with a CI check failure on the same file/line, merge into one item. Use the inline comment as the canonical item (it has location context).

**Exception**: Do NOT deduplicate when the inline bot comment is stale or resolved (`is_resolved: true`). In that case, keep the CI failure as a separate item — a stale bot comment does not mean the underlying CI failure is resolved.

## Phase 3: Triage

For each normalized item, classify:

| Classification    | Criteria                                                                  | Action                      |
| ----------------- | ------------------------------------------------------------------------- | --------------------------- |
| `ACTION_REQUIRED` | Specific code change suggested, bug reported, CI failure, lint/type error | Dispatch to subagent        |
| `RESPOND_ONLY`    | Question asked, concern raised without specific fix, design discussion    | Post reply with explanation |
| `NO_ACTION`       | Praise, acknowledgment, already resolved, outdated, duplicate             | Log in report               |

### Decision Tree

Apply in order — first match wins:

1. Is the thread already resolved or outdated? → `NO_ACTION`
2. Is it a CI failure? → `ACTION_REQUIRED`
3. Is it a bot comment with specific errors? → `ACTION_REQUIRED`
4. Does it suggest a specific code change? → `ACTION_REQUIRED`
5. Does it report a bug or incorrect behavior? → `ACTION_REQUIRED`
6. Does it raise a potential bug concern without a specific fix (e.g., "this looks wrong", "this seems buggy")? → `RESPOND_ONLY`, but **flag for user review** in the triage summary — the user may want to promote it to `ACTION_REQUIRED`
7. Does it ask a question or raise a non-bug concern without a specific fix? → `RESPOND_ONLY`
8. Is it praise, acknowledgment, or informational? → `NO_ACTION`

See [pr-guide.md](pr-guide.md) § Triage Examples for classification examples and edge cases.

### Output

Three lists: `action_items`, `respond_items`, `no_action_items`.

**Log the triage decisions visibly** so the user can see what will be acted on vs. replied to before dispatch begins. Present a summary table:

| #   | Source | Author | Location | Classification | Reason |
| --- | ------ | ------ | -------- | -------------- | ------ |

## Phase 4: Dispatch

### ACTION_REQUIRED Items

**Group inline comments by file path.** For each file group, spawn a `comment-resolver-agent`:

```text
Task(
  subagent_type: "development-pr-workflow:comment-resolver-agent",
  description: "Resolve comments on {file_path}",
  prompt: "Resolve PR review comments on `{file_path}` in PR #{pr_number} ({owner}/{repo}).

## Comments to Address

{for each comment in group:}
### Comment {n} ({comment_id}, by @{author})
- Source: {inline | review_body | ci}
- Location: {file:line or general}
- Blocking: {yes/no}
- Content: {comment text}

## Context

PR Title: {title}
PR Description: {description}

<file-diff>
{relevant diff for this file}
</file-diff>

## Instructions

1. Read the file and apply each requested change
2. If ambiguous, make the most reasonable interpretation and note it
3. For CI failures, investigate and fix (may require running commands)
4. You MAY modify files outside the assigned group if a comment requires cross-file changes
5. Verify locally that the file still parses/compiles
6. Do NOT commit — leave changes uncommitted

Report per comment: ID, what changed, files modified, any issues.",
  run_in_background: true,
  model: "sonnet"
)
```

**Review body items without file location**: Batch up to 3 items per agent instance. Provide the full PR diff so the agent can identify relevant file(s). If there are more than 5 unlocated review body items, process in batches of 3 to avoid spawning excessive agents.

**CI failures without a specific file**: Each gets its own agent instance with CI logs and failure context. Cap at 3 concurrent CI failure agents — process additional failures sequentially after earlier agents complete.

### RESPOND_ONLY Items

The orchestrator handles these directly — no subagent needed.

**For inline comments** — reply to the comment thread:

```bash
# Write reply to unique temp file, then send as JSON field via -F
REPLY_FILE=$(mktemp /tmp/pr-reply-XXXXXX.md)
cat > "$REPLY_FILE" << 'REPLY_EOF'
{explanation}
REPLY_EOF
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -F body=@"$REPLY_FILE"
rm -f "$REPLY_FILE"
```

**For review body items** — post a general PR comment:

```bash
# Write reply to unique temp file to avoid shell injection
REPLY_FILE=$(mktemp /tmp/pr-reply-XXXXXX.md)
cat > "$REPLY_FILE" << 'REPLY_EOF'
{response}
REPLY_EOF
gh pr comment {pr_number} --body-file "$REPLY_FILE"
rm -f "$REPLY_FILE"
```

> **Security note**: Never interpolate reply text directly into shell command arguments. Reply content may echo untrusted PR comment text. Always write to a unique temp file (via `mktemp`), then pass via `-F body=@file` (for `gh api`) or `--body-file` (for `gh pr comment`). The `-F` flag sends the file content as a proper JSON field — do NOT use `--input`, which sends raw bytes and will cause a 422 from the GitHub API.

Reply content must:

- Acknowledge the reviewer's point
- Explain the rationale for the current approach
- Reference relevant code or docs if helpful
- Be respectful and substantive (not dismissive)

### NO_ACTION Items

No action. Log in final report.

## Phase 5: Collect & Verify

1. **Collect results** from each agent's Task completion output (agents return structured reports when their Task completes)
2. **Aggregate**: changes made per comment, unresolved issues, all files modified
3. **Detect cross-agent file conflicts**: Compare the "files modified" lists from each agent. If two or more agents modified the same file:
   - Run `git diff {file}` to see the combined changes
   - If agents modified **different line ranges** (non-overlapping functions/blocks), this is not a conflict — no action needed
   - If agents modified the **same logical code region** (overlapping lines or the same function), flag as a conflict. Re-run the affected changes sequentially: apply the higher-priority (blocking) agent's changes first, then layer the other agent's changes on top, verifying each step
4. **Detect project tooling** before running verification:
   - Check for `nx.json` → Nx commands
   - Check `package.json` scripts → npm scripts
   - Do NOT assume specific commands exist
5. **Run verification** using detected tooling. Resolve the PR's base branch dynamically to match CI behavior:

   ```bash
   PR_BASE=$(gh pr view {pr_number} --json baseRefName --jq '.baseRefName')
   ```

   Then run:

   - Format (e.g., `npx nx format:write --uncommitted`)
   - Lint (e.g., `npx nx affected --target=lint --base=origin/$PR_BASE`)
   - Typecheck (e.g., `npx nx affected --target=typecheck --base=origin/$PR_BASE`)
   - Tests if relevant (e.g., `npx nx affected --target=test --base=origin/$PR_BASE`)

6. **On failure**: Identify which changes caused the failure. Fix directly or re-dispatch. Re-verify.

## Phase 6: Commit & Report

### Commit Policy

**Always ask the user before committing.** If they agree, ask whether to create:

- A single commit with all changes, or
- Separate commits grouped by comment/file

Never auto-commit.

### Report

Provide a structured summary:

```markdown
## PR #{number} Issue Resolution Summary

### Triage Results

| Category        | Count | Items        |
| --------------- | ----- | ------------ |
| Action Required | {n}   | {brief list} |
| Responded       | {n}   | {brief list} |
| No Action       | {n}   | {brief list} |

### Changes Applied

#### Inline Comments ({n} resolved)

- **{file}:{line}** (@{author}): {summary} → {what was done}

#### Review Body Items ({n} addressed)

- **Blocking**: {item} → {what was done}
- **Non-blocking**: {item} → {what was done}

#### CI Fixes ({n} resolved)

- {failure} → {fix applied}

### Replies Posted ({n})

- @{author} on {file}:{line}: {reply summary}

### Files Modified

- `{path}`: {change summary}

### Verification

- Format: {pass/fail}
- Lint: {pass/fail}
- Typecheck: {pass/fail}
- Tests: {pass/fail}

### Unresolved Items

- {items that couldn't be addressed, with reasons}
```

## Detailed Reference

For GitHub MCP usage, triage examples, reply templates, and CI troubleshooting, see [pr-guide.md](pr-guide.md).
