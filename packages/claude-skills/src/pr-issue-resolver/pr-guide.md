# PR Issue Resolution Guide

## GitHub MCP Setup

If GitHub MCP is not installed, direct users to:
<https://www.notion.so/uniswaplabs/Using-a-GitHub-MCP-with-Claude-Code-270c52b2548b8015b11ee5e905796cb5>

## Fetching PR Information

### Get PR Details

```
mcp__github__pull_request_read with method: "get"
```

### Get Changed Files

```
mcp__github__pull_request_read with method: "get_files"
```

### Get Review Comments

```
mcp__github__pull_request_read with method: "get_review_comments"
```

### Get CI Status

```
mcp__github__pull_request_read with method: "get_status"
```

### Get PR Diff

```
mcp__github__pull_request_read with method: "get_diff"
```

## Comment Types and Handling

### Code Suggestions

- Reviewer suggests specific code change
- **Action**: Apply suggestion if valid, explain if not

### Questions

- Reviewer asks for clarification
- **Action**: Respond with explanation

### Style/Formatting

- Lint, formatting, naming issues
- **Action**: Fix directly

### Architecture/Design

- Structural concerns, patterns
- **Action**: Create plan, discuss trade-offs

### Testing

- Missing tests, coverage concerns
- **Action**: Add tests, explain coverage strategy

### Security

- Security vulnerabilities, concerns
- **Action**: High priority fix, explain mitigation

## CI/CD Failure Resolution

### Common Failures

**Build Failures**

- Check compilation errors
- Verify dependencies
- Check import statements

**Test Failures**

- Read failing test output
- Identify root cause
- Fix code or update test

**Lint/Format Failures**

- Run formatter locally
- Fix lint violations
- Update configs if needed

**Type Check Failures**

- Check TypeScript errors
- Fix type definitions
- Update interfaces

### Debugging CI

1. Get CI logs from GitHub Actions
2. Identify specific failure point
3. Reproduce locally if possible
4. Apply fix
5. Verify with local run

## Response Templates

### For Code Suggestions

```markdown
Applied the suggested change. [Brief explanation of why it improves the code]
```

### For Questions

```markdown
Good question! [Explanation]

The reason for this approach is [rationale].

[Optional: alternative considered and why not chosen]
```

### For Complex Changes

```markdown
This is a good point. I've created a plan to address this:

1. [Step 1]
2. [Step 2]
3. [Step 3]

This approach [benefits]. Let me know if you'd prefer a different direction.
```

### For Disagreement

```markdown
I see your concern about [issue].

The current approach [rationale]. However, I understand the trade-off you're highlighting.

Would you like me to [alternative approach] instead?
```

## Output Format

```markdown
# PR #<number> Review and Fix Summary

## PR Status

- **Title**: <title>
- **Author**: <author>
- **CI Status**: ✅ Passing / ❌ Failing (fixed)
- **Review Status**: <n> comments addressed

## Comments Addressed

### Fixed Directly (n items)

- Comment: <summary> → Fix: <what_was_done>

### Requires Plan (n items)

- Comment: <summary>
  - Plan: <detailed_steps>

### Responded (n items)

- Question: <summary>
  - Response: <explanation>

## CI/CD Fixes Applied

- ❌ <failure> → ✅ <fix>

## Files Modified

- `path/to/file.ext`: <change_summary>

## Next Steps

1. <action>

## Verification

- [ ] All CI checks passing
- [ ] All comments addressed
- [ ] Tests added/updated
- [ ] Code style compliant
```

## Error Handling

| Error               | Resolution                                   |
| ------------------- | -------------------------------------------- |
| No PR access        | Request GitHub token/permissions             |
| PR not found        | Verify PR number and repo                    |
| CI logs unavailable | List known failures, suggest manual check    |
| Merge conflicts     | Identify conflicts, provide resolution steps |
| Complex changes     | Create plan for review before implementing   |

## Local Verification

Before reporting completion:

1. Run `nx affected -t lint typecheck` (or equivalent)
2. Run relevant tests
3. Verify no regressions
4. Check changes compile

## Commit Strategy

At logical completion points, **ask user**:

- "Ready to commit these changes?"
- "Should I create separate commits per issue or one combined commit?"

Never auto-commit without user confirmation.
