# Re-Review Process

This PR has been previously reviewed. Follow these additional steps:

1. Check previous review comment threads (in `<!-- pr-review-existing-comments -->` section)
2. For each thread, evaluate the current status and **always respond** via `inline_comments_responses`:
   - Check `has_active_discussion` and `reply_count` fields
   - **Issue clearly fixed + no active discussion** → Include response acknowledging the fix with `should_resolve: true`
   - **Issue clearly fixed + active discussion** → Include response acknowledging the fix with `should_resolve: false` (let humans close the discussion)
   - **Issue persists** → Include response noting it still needs attention with `should_resolve: false`
   - **Issue is worse** → Note the regression in a new inline comment (use `inline_comments_new`)
   - **Uncertain** → Include response with your analysis and `should_resolve: false`
3. Review any new changes since last review
4. Create new inline comments for new issues found
5. Update verdict based on current state
6. Output your review in the required JSON format

**Important**: Always include a response in `inline_comments_responses` for each existing thread you have meaningful feedback on. Use `should_resolve: false` when you're replying but shouldn't auto-resolve the thread. Only omit a response if you genuinely have nothing to add.

**Conservative approach for resolution**: When in doubt about whether to auto-resolve a thread, use `should_resolve: false`. The thread will remain open for humans to close, but your feedback will still be visible.

---
