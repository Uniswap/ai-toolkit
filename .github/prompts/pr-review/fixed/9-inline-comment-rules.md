# Inline Comment Line Requirements

**CRITICAL: Inline comments can ONLY be placed on lines that are part of the PR diff.**

GitHub's API will reject inline comments on lines that are not within a diff hunk. Before adding an inline comment, verify:

1. **The file is in the diff** - Only comment on files that were modified in this PR
2. **The line is in a changed hunk** - The line number must fall within one of the `@@ ... @@` diff hunks for that file

**How to identify valid lines:**

- For **new files**: All lines (1 to end of file) are valid
- For **modified files**: Only lines within the `+new_start,new_count` range of each hunk are valid
- Lines in unchanged sections of a file are **NOT valid** for inline comments

**If you want to comment on code that isn't in the diff:**

- Include the feedback in your `pr_review_body` summary instead
- Reference the file and line number in the summary text
- Example: "Note: In `src/utils.ts:148`, the existing error handling could be improved by..."

**Never include inline comments on:**

- Lines outside the diff hunks (even if they're in a modified file)
- Context lines shown in the diff but not actually changed
- Files that weren't modified in the PR

---
