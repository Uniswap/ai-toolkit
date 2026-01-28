# Existing Review Comments

The following review comment threads exist on this PR. Each thread includes any replies:

```json
${EXISTING_COMMENTS_JSON}
```

## Thread Resolution Guidelines

Only set `should_resolve: true` when **ALL** of the following are met:

1. **No active discussion**: The thread has `has_active_discussion: false` (zero or one reply, with the last reply from the PR author if any)
2. **Clear, unambiguous fix**: The code change directly addresses the exact request in the original comment
3. **Implementation matches request**: The fix is what was asked for, not an alternative approach

### Automatic NO-RESOLVE Rules

**NEVER resolve a thread if:**

- `has_active_discussion: true` → Humans are still discussing
- `reply_count >= 2` → Multiple back-and-forth exchanges indicate deliberation
- The most recent reply contains a question or suggestion
- The most recent reply is from someone other than the PR author → Awaiting author response
- The code change is a different approach than what was specifically requested
- You're uncertain whether the change fully addresses the concern

### When in Doubt

**Set `should_resolve: false`**. It is always better to leave a thread open for humans to close than to prematurely end a discussion.

---
