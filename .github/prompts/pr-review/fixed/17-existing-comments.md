# Existing Review Comments

The following review comment threads exist on this PR. Each thread includes any replies:

```json
${EXISTING_COMMENTS_JSON}
```

## Response Expectations

**You MUST respond to each thread** via `inline_comments_responses` where you have meaningful feedback about the resolution status. Your response provides valuable context even when you're not auto-resolving.

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

### When NOT to Auto-Resolve

**Set `should_resolve: false`** (or omit the field) but **still include the response**. Your feedback is valuable even when not auto-resolving:

- Acknowledge that the issue appears fixed (helps humans decide to close)
- Note any concerns about the implementation approach
- Provide context for why you're not auto-resolving (active discussion, uncertainty, etc.)

It is always better to leave a thread open for humans to close than to prematurely end a discussion. But always respond with your assessment.

---
