# PR Issue Resolution Guide

Reference documentation for the `resolve-pr-issues` skill's orchestration workflow.

## GitHub MCP Setup

If GitHub MCP is not installed, direct users to:
<https://www.notion.so/uniswaplabs/Using-a-GitHub-MCP-with-Claude-Code-270c52b2548b8015b11ee5e905796cb5>

## Fetching PR Data

### MCP Tools (Primary)

| Data            | Tool                | Method                          |
| --------------- | ------------------- | ------------------------------- |
| PR details      | `pull_request_read` | `method: "get"`                 |
| Inline comments | `pull_request_read` | `method: "get_review_comments"` |
| CI status       | `pull_request_read` | `method: "get_status"`          |
| PR diff         | `pull_request_read` | `method: "get_diff"`            |
| Changed files   | `pull_request_read` | `method: "get_files"`           |

### Review Bodies (gh api — Required)

The `pull_request_read` MCP tool does **not** support fetching review bodies. Use `gh api`:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews \
  --jq '.[] | {id: .id, user: .user.login, state: .state, body: .body}'
```

**Response fields:**

- `id`: Review ID
- `user.login`: Reviewer's GitHub username
- `state`: `APPROVED`, `CHANGES_REQUESTED`, `COMMENTED`, `DISMISSED`, `PENDING`
- `body`: The review body text (free-form, may be empty for approval-only reviews)

**Error handling**: If this call fails, inform the user immediately. Do not silently proceed without review body data.

### gh CLI Fallbacks

If MCP tools are unavailable, all data can be fetched via `gh`:

```bash
# PR details
gh pr view {number} --json title,author,state,body

# Inline comments
gh api repos/{owner}/{repo}/pulls/{number}/comments

# CI status
gh pr checks {number}

# Diff
gh pr diff {number}

# Changed files
gh pr view {number} --json files
```

## Triage Decision Framework

### Classifications

| Classification    | Description                                  | Orchestrator Action                  |
| ----------------- | -------------------------------------------- | ------------------------------------ |
| `ACTION_REQUIRED` | Needs a code change                          | Dispatch to `comment-resolver-agent` |
| `RESPOND_ONLY`    | Needs an explanation, no code change         | Post reply directly                  |
| `NO_ACTION`       | Already resolved, outdated, or informational | Log in report                        |

### Decision Tree (Apply in Order)

1. **Is the thread resolved or outdated?** → `NO_ACTION`
   - Outdated: inline comment `position` is `null` (diff line changed)
   - Resolved: thread has resolved status
2. **Is it a CI failure?** → `ACTION_REQUIRED`
3. **Is it a bot comment with specific errors?** → `ACTION_REQUIRED`
4. **Does it suggest a specific code change?** → `ACTION_REQUIRED`
5. **Does it report a bug or incorrect behavior?** → `ACTION_REQUIRED`
6. **Does it ask a question or raise a concern without a fix?** → `RESPOND_ONLY`
7. **Is it praise, acknowledgment, or informational?** → `NO_ACTION`

### Triage Examples

**ACTION_REQUIRED examples:**

- "This should use `const` instead of `let`" → specific code change
- "This will throw if `user` is null" → bug report
- "Missing null check on line 42" → specific fix
- CI lint failure: "Expected indentation of 2 spaces" → specific error

**RESPOND_ONLY examples:**

- "Why did you choose this approach over X?" → design question
- "Have you considered the performance implications?" → concern without fix
- "This might cause issues with concurrent access" → architectural concern

**NO_ACTION examples:**

- "LGTM" → praise
- "Nice refactor!" → acknowledgment
- A thread already marked as resolved → outdated

## Blocking vs. Non-Blocking Classification

### Rules

| Condition                              | Default                 |
| -------------------------------------- | ----------------------- |
| Review state `CHANGES_REQUESTED`       | `blocking: true`        |
| Review state `COMMENTED` or `APPROVED` | `blocking: false`       |
| CI failures                            | Always `blocking: true` |

### Language Overrides

These keywords in the comment text override the default:

**Force blocking**: "must", "required", "blocking", "critical", "security", "vulnerability"

**Force non-blocking**: "nit", "optional", "consider", "suggestion", "minor", "nice to have"

### Why This Matters

Blocking items are prioritized in dispatch:

- Blocking comments are processed first
- If two comments conflict, the blocking one takes precedence
- The final report separates blocking from non-blocking resolutions

## Resolved/Outdated Thread Handling

### Detection

Outdated comments occur when the diff line a comment was placed on no longer exists (e.g., the code was already modified in a subsequent push). GitHub marks the comment's `position` as `null`.

Resolved threads are marked by a team member clicking "Resolve conversation" in the GitHub UI.

### Behavior

Both are classified as `NO_ACTION`:

- Do not dispatch agents for resolved/outdated comments
- Do not post replies
- Log them in the final report under "No Action" with reason "resolved" or "outdated"

## Review Body Parsing

Review bodies are free-form text. The orchestrator (opus) parses them into discrete items:

### Parsing Rules

- Each bullet point = one item
- Each numbered list entry = one item
- Each paragraph with a distinct concern = one item
- Standalone questions = one item (becomes RESPOND_ONLY)
- General praise/acknowledgment (e.g., "Overall looks good!") = skip, no item
- Empty review bodies (approval-only) = skip

### Example

**Review body:**

> Overall the approach looks solid. A few things:
>
> 1. The error handling in `processData()` swallows exceptions silently - this needs a fix
> 2. Consider adding a timeout for the API call in `fetchUser()`
> 3. Why did you choose polling over WebSockets here?

**Parsed items:**

| #   | Content                            | Classification                 | Blocking                |
| --- | ---------------------------------- | ------------------------------ | ----------------------- |
| 1   | Error handling swallows exceptions | ACTION_REQUIRED                | Depends on review state |
| 2   | Consider adding timeout            | RESPOND_ONLY (no specific fix) | false ("consider")      |
| 3   | Why polling over WebSockets?       | RESPOND_ONLY (question)        | false                   |

## CI Bot Deduplication

### Problem

CI bots often post inline comments AND trigger check failures for the same issue. Without deduplication, the orchestrator would dispatch two agents for one problem.

### Detection Rule

Merge into one item when ALL of:

1. Inline comment author is a known bot: `github-actions[bot]`, `codecov-commenter`, `renovate[bot]`, `dependabot[bot]`, `sonarcloud[bot]`
2. Comment content overlaps with a CI check failure (same file/line or same error message)

### Resolution

Use the inline comment as the canonical item (it has file/line context). Discard the duplicate CI failure entry.

**Exception**: Do NOT deduplicate when the inline bot comment is stale or resolved. A stale bot comment does not mean the underlying CI failure is resolved. Keep both items — the stale bot comment will be filtered as `NO_ACTION` in triage, and the CI failure will proceed as `ACTION_REQUIRED`.

## Subagent Dispatch Reference

### Agent Selection

| Item Type                              | Agent                                            | Notes                                     |
| -------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Inline comments (grouped by file)      | `development-pr-workflow:comment-resolver-agent` | One agent per file group                  |
| Review body items (with file location) | `development-pr-workflow:comment-resolver-agent` | Grouped with that file's inline comments  |
| Review body items (no file location)   | `development-pr-workflow:comment-resolver-agent` | One agent per item, receives full PR diff |
| CI failures (specific file)            | `development-pr-workflow:comment-resolver-agent` | Include CI logs in prompt                 |
| CI failures (no specific file)         | `development-pr-workflow:comment-resolver-agent` | One agent per failure, include full logs  |

### Prompt Construction

Every agent prompt must include:

1. **File path(s)** to modify (or "general" for unlocated items)
2. **Comment list** with: ID, author, content, location, blocking status
3. **Diff context** in `<file-diff>` XML tags (not markdown code fences — avoids nesting issues)
4. **PR metadata**: title, description
5. **Instructions**: what to do, what NOT to do (no commits, no replies)

### Agent Execution

- Agents run with `run_in_background: true` for parallelism
- Agents return results via Task completion output (not disk files)
- Agents may modify files outside their assigned group for cross-file changes
- Agents do NOT commit, push, or post replies

## Reply Protocol

### When to Reply

Post replies for `RESPOND_ONLY` items. The orchestrator handles this directly — no subagent.

### Reply Mechanisms

**For inline comments** (thread reply):

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -f body="{reply text}"
```

**For review body items** (general PR comment):

```bash
gh pr comment {pr_number} --body "{reply text}"
```

### Reply Templates

#### Acknowledging a Code Change (ACTION_REQUIRED, posted after agent applies fix)

```markdown
Applied this change — [brief explanation of what was done and why it improves the code].
```

#### Explaining Current Approach (RESPOND_ONLY)

```markdown
[Acknowledge the reviewer's point]. The current approach [rationale for the design choice].

[If applicable: alternative considered and why it was not chosen].

[If applicable: reference to relevant code, docs, or prior discussion].
```

#### Answering a Question (RESPOND_ONLY)

```markdown
[Direct answer to the question].

[Context: why this decision was made, what constraints influenced it].

[If applicable: trade-offs considered].
```

#### Respectful Disagreement (RESPOND_ONLY)

```markdown
I see the concern about [issue]. The current approach [rationale].

[Explanation of the trade-off and why the current approach was chosen].

Happy to discuss further or adjust if you feel strongly about this.
```

### Reply Quality Standards

All replies must:

- Acknowledge the reviewer's point (do not be dismissive)
- Be substantive (no "will fix" without context)
- Reference specific code or docs when relevant
- Be concise but complete

## Unified CI Handling

CI failures are normalized into the same item list as human comments and processed through the same triage pipeline.

### CI as Normalized Items

| CI Failure Type    | Source | Blocking | Notes                                  |
| ------------------ | ------ | -------- | -------------------------------------- |
| Build failure      | `ci`   | true     | Compilation errors, missing imports    |
| Test failure       | `ci`   | true     | Failing assertions, test timeouts      |
| Lint failure       | `ci`   | true     | Style violations, lint rule violations |
| Type check failure | `ci`   | true     | TypeScript errors                      |
| Security scan      | `ci`   | true     | Vulnerability findings                 |
| Coverage drop      | `ci`   | false    | Unless configured as blocking          |

### CI-Specific Agent Guidance

When dispatching agents for CI failures:

- Include CI log excerpts in the prompt (relevant section, not the entire log)
- Note the failure type (build, test, lint, typecheck)
- The agent may need to run commands (not just edit files) — e.g., `npm install`, fix lock files, run the failing test to reproduce

## Local Verification

Before reporting completion:

1. **Detect project tooling** by checking for `nx.json` (Nx workspace) or `package.json` scripts
2. **Run available validation** — check what lint/typecheck/test targets or scripts exist, then run them
3. Verify no regressions
4. Check changes compile

> **Note**: Do not assume specific commands exist. First discover what's available (e.g., `nx show project <name> --json` for Nx, or inspect `package.json` scripts), then run appropriate validation.

## Commit Strategy

At logical completion points, **ask user**:

- "Ready to commit these changes?"
- "Should I create separate commits per issue or one combined commit?"

Never auto-commit without user confirmation.

## Error Handling

| Phase   | Error                            | Resolution                                                      |
| ------- | -------------------------------- | --------------------------------------------------------------- |
| Phase 0 | PR not found                     | Verify PR number and repo, check access                         |
| Phase 1 | Review body fetch fails          | Inform user, continue with inline + CI only                     |
| Phase 1 | MCP tools unavailable            | Fall back to `gh` CLI for all data                              |
| Phase 3 | Ambiguous comment classification | Default to RESPOND_ONLY (safer than unnecessary code change)    |
| Phase 4 | Agent fails to modify file       | Report error, flag for manual follow-up                         |
| Phase 5 | Verification fails               | Identify failing change, fix or revert, re-verify               |
| Phase 5 | Tests fail                       | Determine if test or implementation is wrong, fix appropriately |
