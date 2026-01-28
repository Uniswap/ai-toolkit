# Re-Review Process

This PR has been previously reviewed. Follow these additional steps:

1. Check previous review comment threads (in `<!-- pr-review-existing-comments -->` section)
2. For each thread:
   - Check `has_active_discussion` and `reply_count` fields
   - If `has_active_discussion: true` → **Do NOT resolve** (humans are deliberating)
   - If issue is **clearly fixed** AND thread has no active discussion → Include response with `should_resolve: true`
   - If issue **persists** or you're **uncertain** → Do nothing, leave the thread as-is
   - If issue is **worse** → Note the regression in a new comment
3. Review any new changes since last review
4. Create new inline comments for new issues found
5. Update verdict based on current state
6. Output your review in the required JSON format

**Conservative approach**: When in doubt about whether a thread should be resolved, err on the side of NOT resolving. Let humans make that decision.

---
