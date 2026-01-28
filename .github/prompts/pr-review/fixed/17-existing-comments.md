# Existing Review Comments

The following review comment threads exist on this PR. Each thread includes any replies:

```json
${EXISTING_COMMENTS_JSON}
```

## Thread Resolution Guidelines

Only set `should_resolve: true` when **ALL** of the following are met:

1. **No active discussion**: The thread has `has_active_discussion: false`
2. **Clear, unambiguous fix**: The code change directly addresses the exact request in the original comment
3. **Implementation matches request**: The fix is what was asked for, not an alternative approach

### Understanding `has_active_discussion`

The `has_active_discussion` field is computed by analyzing thread replies:

- **Bot replies are filtered out** (codecov[bot], github-actions, etc.) - they don't count as discussion
- **Same-user follow-ups don't count** - one person adding multiple comments isn't a discussion
- **True multi-party discussion is detected** - when different humans are engaging back-and-forth
- **Awaiting response is detected** - when the last human reply is from someone other than the original commenter

### Automatic NO-RESOLVE Rules

**NEVER resolve a thread if:**

- `has_active_discussion: true` → Genuine human discussion is happening
- The most recent reply contains a question or suggestion
- The code change is a different approach than what was specifically requested
- You're uncertain whether the change fully addresses the concern

### When in Doubt

**Set `should_resolve: false`**. It is always better to leave a thread open for humans to close than to prematurely end a discussion.

---
