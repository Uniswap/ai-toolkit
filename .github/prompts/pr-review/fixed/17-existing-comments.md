# Existing Review Comments

The following review comment threads exist on this PR. Each thread includes any replies:

```json
${EXISTING_COMMENTS_JSON}
```

## Thread Resolution Guidelines

Only set `should_resolve: true` when **ALL** of the following are met:

1. **No active human discussion**: The thread has `has_active_discussion: false`, OR you can verify from the reply content that there's no genuine deliberation (e.g., only bot replies, only the same person adding follow-ups)
2. **Clear, unambiguous fix**: The code change directly addresses the exact request in the original comment
3. **Implementation matches request**: The fix is what was asked for, not an alternative approach

### Understanding `has_active_discussion`

The `has_active_discussion` field is a computed heuristic that filters out bot replies and checks for genuine multi-party discussion. However, **you have access to the full reply content** in the `replies` array - use your judgment:

- **`has_active_discussion: true`** is a strong signal to NOT resolve, but examine the actual replies to confirm humans are genuinely deliberating
- **`has_active_discussion: false`** means the heuristic found no active discussion, but still verify the fix is correct before resolving

### Strong Signals to NOT Resolve

**Be very cautious about resolving if:**

- `has_active_discussion: true` → Likely genuine human discussion
- The most recent reply contains a question, disagreement, or alternative suggestion
- The most recent reply is from someone other than the PR author → Awaiting author response
- Multiple different humans are participating in the thread
- The code change is a different approach than what was specifically requested
- You're uncertain whether the change fully addresses the concern

### When You MAY Override the Heuristic

You may resolve a thread even if `has_active_discussion: true` when the replies clearly show:

- Only bot responses (automated CI feedback, linter messages)
- The PR author acknowledging and fixing the issue with no follow-up questions
- A clear "LGTM" or approval from the original reviewer with no outstanding concerns

### When in Doubt

**Set `should_resolve: false`**. It is always better to leave a thread open for humans to close than to prematurely end a discussion.

---
