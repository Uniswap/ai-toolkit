# Output Field Guidance

Your structured output will be validated against a JSON schema. Here's how to use each field:

**Required fields:**

- `pr_review_body`: Your complete markdown-formatted review. Put ALL your analysis, findings, and reasoning here.
- `pr_review_outcome`: Your verdict (see Verdict Decision Rules above for how to choose)
- `inline_comments_new`: Array of inline comments on specific lines (can be empty `[]`)
  - Each needs: `path` (file), `line` (number), `body` (feedback)
  - Optional: `suggestion` (corrected code snippet)

**Optional fields:**

- `inline_comments_responses`: Responses to existing review comments (for re-reviews)
  - Each needs: `comment_id`, `body`, and optionally `should_resolve: true`
- `files_reviewed`: List of files you reviewed
- `confidence`: 0.0-1.0 confidence in your review

---
