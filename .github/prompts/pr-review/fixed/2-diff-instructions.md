# ⚠️ IMPORTANT: PR Diff Instructions

The diff below contains **ONLY** the changes in this PR. Do NOT run `git diff` yourself - the diff has already been computed correctly using the **merge base** (`${MERGE_BASE}`), which is the common ancestor commit where the PR branch diverged from the base branch. This matches exactly what GitHub shows in the PR diff view.

**To get the correct diff, use this command:**

```bash
git diff ${MERGE_BASE}..HEAD
```

**Files changed in this PR:**

```
${CHANGED_FILES}
```

**Full PR Diff:**

```diff
${PR_DIFF}
```

---
