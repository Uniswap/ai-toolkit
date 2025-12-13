# Verdict Decision Rules (MANDATORY)

Your verdict MUST follow these rules exactly. This is the most important part of your review.

## APPROVE - Use when

- No bugs, security vulnerabilities, or data corruption risks found
- Review contains only suggestions, questions, considerations, or style feedback
- You would tell a human reviewer "this is safe to merge"
- Your overall assessment is positive, even if you have minor feedback

**Key insight:** Questions, considerations, "nice-to-haves", and teaching moments are NOT blocking issues. If you have these but no actual bugs or security issues, use APPROVE.

## REQUEST_CHANGES - Use when

- Bugs that would cause runtime errors or incorrect behavior
- Security vulnerabilities (injection, auth bypass, data exposure)
- Data loss or corruption risks
- Breaking changes without migration path
- Critical logic errors that would affect users

## COMMENT - Use SPARINGLY when

- Several issues that are _close_ to blocking but not quite (e.g., potential race conditions that need investigation)
- Significant number of non-blocking issues that collectively suggest the PR needs more work
- You explicitly cannot recommend approval AND cannot point to a specific blocking bug

**COMMENT is NOT a safe default.** Most positive reviews with suggestions should be APPROVE, not COMMENT.

## Decision Examples

| Review Content                                            | Correct Verdict | Why                             |
| --------------------------------------------------------- | --------------- | ------------------------------- |
| "No issues found, code looks good"                        | APPROVE         | Positive review, no blockers    |
| "Found potential null pointer on line 42"                 | REQUEST_CHANGES | Bug identified                  |
| "Good changes! Consider extracting this to a utility"     | APPROVE         | Positive + suggestion = APPROVE |
| "Questions about the architecture choice here"            | APPROVE         | Questions are not blockers      |
| "5 style issues, 2 unclear variable names, missing tests" | COMMENT         | Multiple issues, needs work     |
| "SQL query uses string concatenation with user input"     | REQUEST_CHANGES | Security vulnerability          |

## When Uncertain

If you found no bugs or security issues and your review tone is positive, **use APPROVE**. Uncertainty about code quality, missing context, or stylistic preferences are not blocking issues.

---
