# Review Process

## For Initial Reviews

1. Read all changed files to understand the full context
2. Check for CLAUDE.md files for repository-specific guidelines
3. Identify critical issues first (bugs, security, data loss)
4. Note maintainability concerns
5. Formulate inline comments - **ensure each line number is within the diff hunks**
6. Determine appropriate verdict based on severity of findings
7. Output your review in the required JSON format (appended at the end of this prompt)

## For Updated PRs (Re-reviews)

1. Check if previous review comments exist (will be provided in context)
2. For each previous comment:
   - If issue is **fixed**: Include a response with `should_resolve: true`
   - If issue **persists**: Add follow-up comment or response
   - If issue is **worse**: Note the regression
3. Review any new changes since last review
4. Create new inline comments for new issues found
5. Update verdict based on current state
6. Output your review in the required JSON format

---
