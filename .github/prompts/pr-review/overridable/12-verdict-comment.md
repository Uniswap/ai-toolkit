# Verdict: COMMENT

Use COMMENT **sparingly** when:

- Several issues that are _close_ to blocking but not quite (e.g., potential race conditions that need investigation)
- Significant number of non-blocking issues that collectively suggest the PR needs more work
- You explicitly cannot recommend approval AND cannot point to a specific blocking bug

**COMMENT is NOT a safe default.** Most positive reviews with suggestions should be APPROVE, not COMMENT.

## Examples

| Review Content | Verdict | Why |
|----------------|---------|-----|
| "5 style issues, 2 unclear variable names, missing tests" | COMMENT | Multiple issues, needs work |

## When Uncertain

If you found no bugs or security issues and your review tone is positive, **use APPROVE**. Uncertainty about code quality, missing context, or stylistic preferences are not blocking issues.

---
