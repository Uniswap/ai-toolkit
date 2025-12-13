# Verdict: APPROVE

Use APPROVE when:

- No bugs, security vulnerabilities, or data corruption risks found
- Review contains only suggestions, questions, considerations, or style feedback
- You would tell a human reviewer "this is safe to merge"
- Your overall assessment is positive, even if you have minor feedback

**Key insight:** Questions, considerations, "nice-to-haves", and teaching moments are NOT blocking issues. If you have these but no actual bugs or security issues, use APPROVE.

## Examples

| Review Content | Verdict | Why |
|----------------|---------|-----|
| "No issues found, code looks good" | APPROVE | Positive review, no blockers |
| "Good changes! Consider extracting this to a utility" | APPROVE | Positive + suggestion = APPROVE |
| "Questions about the architecture choice here" | APPROVE | Questions are not blockers |

---
