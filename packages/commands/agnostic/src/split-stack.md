---
name: split-stack
description: Automatically split a monolithic branch with many changes into a logical, reviewable stack of PRs using semantic analysis and Graphite.
argument-hint: [base-branch]
allowed-tools: Bash(git rev-parse:*), Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git check-ref-format:*), Bash(git ls-files:*), Bash(git rev-list:*), Bash(git fetch:*), Bash(npx nx:*), Bash(which:*), Read(*), Grep(*), Glob(*), AskUserQuestion(*), Task(subagent_type:stack-splitter), mcp__graphite__run_gt_cmd(*), mcp__graphite__learn_gt(*), mcp__nx-mcp__nx_project_details(*)
---

# Split Stack

Automatically split a monolithic branch with many changes into a logical, reviewable stack of PRs using semantic analysis and Graphite (gt).

## Usage

```bash
/split-stack           # Split current branch from main
/split-stack develop   # Split current branch from develop
```

## Prerequisites

Before using this command, ensure you have:

- **Graphite CLI** installed: `npm install -g @withgraphite/graphite-cli@latest`
- **Repository initialized** with Graphite: `gt repo init`
- **Clean working directory**: No uncommitted changes (`git status` should be clean)
- **Feature branch** with 3+ commits to split
- **Git worktree support** (Git 2.5+)

To verify your setup:

```bash
gt --version  # Should show 1.0.0 or higher
git status    # Should show "nothing to commit, working tree clean"
```

## Overview

When you've built many features/changes in a single branch (common during experimentation), this command helps you break it into a logical, reviewable stack of PRs automatically.

**How it works:**

1. **Analyze Changes**: Examines all commits and file changes since the branch diverged
2. **Semantic Grouping**: Groups related changes by functionality, not just files
3. **Dependency Analysis**: Uses Nx project graph to understand dependencies
4. **Plan Generation**: Creates a logical split plan optimized for reviewability
5. **User Approval**: Presents the plan and waits for your approval/modifications
6. **Execute Splits**: Uses `gt split` to create the stack

## Workflow

### Step 1: Detect Current State

First, understand the current branch and its relationship to the base branch:

```bash
# Validate branch name format and security
validate_branch_name() {
  local branch="$1"

  # Check for valid git ref format
  if ! git check-ref-format "refs/heads/$branch" 2>/dev/null; then
    echo "❌ Invalid branch name format: $branch"
    exit 1
  fi

  # Additional check for shell metacharacters (security)
  if [[ "$branch" =~ [;\|\&\$\`\(\)\<\>] ]]; then
    echo "❌ Branch name contains invalid characters: $branch"
    exit 1
  fi

  # Verify branch actually exists
  if ! git rev-parse --verify "refs/heads/$branch" >/dev/null 2>&1; then
    echo "❌ Branch does not exist: $branch"
    exit 1
  fi
}

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Determine base branch (default: main)
BASE_BRANCH=${1:-main}

# Validate both branches
validate_branch_name "$CURRENT_BRANCH"
validate_branch_name "$BASE_BRANCH"

# Ensure we're on a feature branch
if [[ "$CURRENT_BRANCH" == "$BASE_BRANCH" ]] || [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]]; then
  echo "❌ Cannot split stack from main/master branch"
  echo "Please check out a feature branch first"
  exit 1
fi

echo "📊 Analyzing branch: $CURRENT_BRANCH"
echo "📍 Base branch: $BASE_BRANCH"
```

### Step 2: Analyze All Changes

Gather comprehensive information about the changes:

```bash
# Get all commits since divergence
git log --oneline "$BASE_BRANCH..$CURRENT_BRANCH"

# Get full diff since divergence
git diff "$BASE_BRANCH...$CURRENT_BRANCH" --stat

# Get list of all changed files with change types
git diff "$BASE_BRANCH...$CURRENT_BRANCH" --name-status

# Get detailed diff for semantic analysis
git diff "$BASE_BRANCH...$CURRENT_BRANCH"
```

**Key analysis points:**

- Total number of commits
- Total lines changed
- Files modified by directory/package
- Types of changes (A=added, M=modified, D=deleted, R=renamed)

### Step 3: Semantic Analysis with Stack Splitter Agent

Use the specialized `stack-splitter` agent to analyze changes semantically:

```typescript
const analysisResult = await Task({
  subagent_type: 'stack-splitter',
  description: 'Analyze branch changes semantically',
  prompt: `
Analyze the changes in branch "${CURRENT_BRANCH}" since it diverged from "${BASE_BRANCH}".

Current branch: ${CURRENT_BRANCH}
Base branch: ${BASE_BRANCH}

Commits:
${commits}

File changes:
${fileChanges}

Full diff:
${fullDiff}

Your task:
1. Semantically group changes into logical units (features, bug fixes, refactors, etc.)
2. Consider Nx project dependencies and structure
3. Identify clear boundaries between different functional areas
4. Optimize for reviewability - each PR should tell a coherent story
5. Ensure dependencies are ordered correctly (foundational changes first)

Provide a structured split plan with:
- PR title and description for each split
- List of commits/files to include in each PR
- Rationale for the grouping
- Dependencies between PRs in the stack
- Estimated reviewability score (1-10) for each PR
`,
});
```

### Step 4: Present the Split Plan

Display the proposed split plan to the user:

```markdown
## 📋 Proposed Stack Split Plan

**Current Branch:** `feature/big-changes`
**Base Branch:** `main`
**Total Commits:** 15
**Total Files Changed:** 42
**Total Lines:** +1,234 -567

---

### Stack Structure (bottom to top)

#### PR #1: `feat: add authentication types and interfaces`

**Commits:** 3 commits (abc123f, def456a, ghi789b)
**Files:** 5 files (+123 -12)

- `packages/auth/src/types.ts`
- `packages/auth/src/interfaces/auth.interface.ts`
- `packages/auth/src/interfaces/user.interface.ts`
- `packages/auth/src/constants.ts`
- `packages/auth/README.md`

**Rationale:** Foundational types and interfaces that other changes depend on. No implementation logic yet, making it easy to review.

**Dependencies:** None (base of stack)
**Reviewability Score:** 9/10

---

#### PR #2: `feat: implement JWT authentication service`

**Commits:** 5 commits (jkl012c, mno345d, pqr678e, stu901f, vwx234g)
**Files:** 12 files (+456 -89)

- `packages/auth/src/services/jwt.service.ts`
- `packages/auth/src/services/jwt.service.spec.ts`
- `packages/auth/src/guards/jwt.guard.ts`
- `packages/auth/src/guards/jwt.guard.spec.ts`
- ... (8 more files)

**Rationale:** Core authentication implementation. Builds on types from PR #1. Includes tests for easier review.

**Dependencies:** PR #1
**Reviewability Score:** 7/10

---

#### PR #3: `feat: add authentication UI components`

**Commits:** 4 commits (yza567h, bcd890i, efg123j, hij456k)
**Files:** 15 files (+456 -234)

- `packages/web/src/components/LoginForm.tsx`
- `packages/web/src/components/SignupForm.tsx`
- `packages/web/src/hooks/useAuth.ts`
- ... (12 more files)

**Rationale:** Frontend components that use the auth service. Can be reviewed independently once service is approved.

**Dependencies:** PR #2
**Reviewability Score:** 8/10

---

#### PR #4: `feat: integrate auth with API routes`

**Commits:** 3 commits (klm789l, nop012m, qrs345n)
**Files:** 10 files (+199 -12)

- `packages/api/src/routes/auth.routes.ts`
- `packages/api/src/middleware/auth.middleware.ts`
- ... (8 more files)

**Rationale:** Ties everything together. Smallest PR at the top of the stack.

**Dependencies:** PR #2, PR #3
**Reviewability Score:** 8/10

---

### Summary

- **Total PRs:** 4
- **Average PR size:** ~250 lines
- **Stack depth:** 4 (linear dependency chain)
- **Estimated review time per PR:** 15-30 minutes

Each PR is focused, testable, and tells a clear story. The stack builds logically from foundation (types) → implementation (service) → UI → integration.
```

### Step 5: Get User Approval

Ask the user if they approve the plan or want modifications:

```typescript
const userDecision = await AskUserQuestion({
  questions: [
    {
      question: 'How would you like to proceed with this split plan?',
      header: 'Action',
      multiSelect: false,
      options: [
        {
          label: 'Approve and Execute',
          description: 'This plan looks good - execute the splits now',
        },
        {
          label: 'Modify Plan',
          description: 'I want to adjust the grouping or split differently',
        },
        {
          label: 'Review Manually',
          description: 'Show me how to use gt split manually with this plan',
        },
        {
          label: 'Cancel',
          description: 'Cancel the operation',
        },
      ],
    },
  ],
});
```

### Step 6: Execute Splits with Graphite

If approved, execute the splits using `gt split`:

```bash
# Graphite split workflow
# Note: gt split is interactive, so we'll guide the user through it

echo "🔄 Executing stack split..."
echo ""
echo "I'll now use 'gt split' to create the stack."
echo "This will involve:"
echo "1. Identifying commit boundaries for each PR"
echo "2. Creating intermediate branches"
echo "3. Submitting the stack to Graphite"
echo ""

# For each PR in the plan (starting from the bottom of the stack):

## PR #1: Foundational types
echo "📦 Creating PR #1: feat: add authentication types and interfaces"
echo "Commits: abc123f, def456a, ghi789b"

# Use gt split to create the first PR with secure commit message
# Create temporary file for commit message (prevents injection)
COMMIT_MSG_FILE=$(mktemp)
trap "rm -f $COMMIT_MSG_FILE" EXIT

cat > "$COMMIT_MSG_FILE" <<'EOF'
feat: add authentication types and interfaces

Add foundational types and interfaces for authentication system:
- User types and interfaces
- Auth token types
- Constants for auth configuration

This provides the type foundation that the auth service will build upon.
EOF

# Use file instead of -m flag for security
gt split -F "$COMMIT_MSG_FILE"

## PR #2: JWT service implementation
echo "📦 Creating PR #2: feat: implement JWT authentication service"
# Continue with remaining commits...
```

**Important Notes about `gt split`:**

- `gt split` is interactive - you'll be prompted to select commits
- It creates a new branch at the specified commit
- Automatically restacks dependent branches
- Each split becomes a separate PR in the stack

### Alternative: Manual Split Instructions

If the user chooses "Review Manually", provide step-by-step instructions:

````markdown
## 📖 Manual Split Instructions

You can manually split this branch using these `gt` commands:

### 1. Split into PR #1 (foundational types)

```bash
# Create commit message file (secure approach)
cat > /tmp/pr1-msg.txt <<'EOF'
feat: add authentication types and interfaces
EOF

# Rebase interactively to mark split point
gt split -F /tmp/pr1-msg.txt
# When prompted, select commits: abc123f, def456a, ghi789b
```
````

This creates a new branch at commit ghi789b and moves the remaining commits to a new branch stacked on top.

### 2. Split into PR #2 (JWT service)

```bash
# Create commit message file for PR #2
cat > /tmp/pr2-msg.txt <<'EOF'
feat: implement JWT authentication service
EOF

# Now you're on the second branch
gt split -F /tmp/pr2-msg.txt
# Select commits: jkl012c through vwx234g
```

### 3. Continue for remaining PRs

Repeat the process for each PR in the plan.

### 4. Submit the stack

```bash
# Submit all PRs in the stack
gt submit --stack --no-interactive
```

### Useful gt commands during splitting

```bash
gt state              # View current stack structure
gt up                 # Move up the stack
gt down               # Move down the stack
gt restack            # Rebase the entire stack if needed
gt checkout           # Interactively switch between branches in the stack
```

````

## Semantic Analysis Principles

The stack-splitter agent follows these principles when analyzing changes:

### 1. Logical Boundaries

Group changes that:

- Implement the same feature or fix the same bug
- Share the same domain/context (auth, payments, UI, etc.)
- Have natural dependencies (types → implementation → tests → integration)

### 2. Dependency Awareness

- Use Nx project graph to understand package dependencies
- Foundational changes go at the bottom of the stack
- Integration/glue code goes at the top
- Ensure each PR can be reviewed independently of PRs above it

### 3. Reviewability Optimization

Each PR should:

- Tell a coherent story with a clear purpose
- Be small enough to review in 15-30 minutes
- Include tests relevant to its changes
- Have a descriptive title and description
- Not mix unrelated concerns

### 4. Stack Depth Consideration

- Prefer shallow stacks (2-4 PRs) over deep ones (5+ PRs)
- Each additional level adds review coordination overhead
- Balance granularity with practical reviewability

### 5. File Grouping Patterns

Common patterns for grouping files:

- **Feature pattern**: types → implementation → tests → docs
- **Vertical slice**: backend API → frontend UI → integration
- **Refactor pattern**: extract → replace → cleanup
- **Package pattern**: all changes to one package in one PR (if logical)

## Best Practices

### Before Running

1. **Commit all changes**: Ensure all work is committed (not necessarily pushed)
2. **Clean working directory**: No uncommitted changes
3. **Up-to-date base**: Fetch latest from base branch (`git fetch origin`)

### During Execution

1. **Review the plan carefully**: Does the grouping make sense?
2. **Consider your reviewers**: What size PRs work best for your team?
3. **Think about dependencies**: Can PR #2 be reviewed if PR #1 isn't merged yet?

### After Splitting

1. **Review each PR individually**: `gh pr view <number>` or open in browser
2. **Check CI status**: Ensure all PRs pass tests
3. **Add context to PR descriptions**: Reference the stack structure
4. **Use Graphite dashboard**: View and manage your stack at graphite.dev

## Error Handling

### No Changes to Split

```bash
if [[ -z "$(git log --oneline "$BASE_BRANCH..$CURRENT_BRANCH")" ]]; then
  echo "❌ No commits found between $BASE_BRANCH and $CURRENT_BRANCH"
  echo "Either:"
  echo "  - You're already on the base branch"
  echo "  - This branch is up-to-date with base"
  echo "  - The base branch name is incorrect"
  exit 1
fi
````

### Too Few Changes

```bash
COMMIT_COUNT=$(git log --oneline "$BASE_BRANCH..$CURRENT_BRANCH" | wc -l)

if [[ $COMMIT_COUNT -lt 2 ]]; then
  echo "⚠️  This branch only has $COMMIT_COUNT commit(s)"
  echo "Stack splitting works best with 3+ commits"
  echo "Consider using a regular PR instead"
  exit 0
fi
```

### Uncommitted Changes

```bash
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ You have uncommitted changes"
  echo "Please commit or stash them before splitting"
  git status --short
  exit 1
fi
```

### Graphite Not Initialized

```bash
if ! gt status &>/dev/null; then
  echo "❌ Graphite (gt) is not initialized in this repository"
  echo "Run: gt init"
  exit 1
fi
```

## Integration with Nx

For Nx monorepos, the agent can use project structure for better grouping:

```typescript
// Get Nx project details for affected projects
const affectedProjects = await Bash('npx nx show projects --affected --base="$BASE_BRANCH"');

// Get project graph to understand dependencies
const projectGraph = await Task({
  subagent_type: 'general-purpose',
  prompt: 'Use mcp__nx-mcp__nx_project_details to get details about affected Nx projects',
});
```

This helps create splits that respect package boundaries and dependencies.

## Example Session

```bash
$ /split-stack

📊 Analyzing branch: feature/auth-system
📍 Base branch: main

📈 Branch Statistics:
- Total commits: 15
- Files changed: 42
- Lines added: +1,234
- Lines removed: -567
- Affected packages: 4 (auth, web, api, shared)

🔍 Analyzing changes semantically...

[Agent analyzes commits, diffs, and Nx structure]

## 📋 Proposed Stack Split Plan

[... plan shown above ...]

How would you like to proceed with this split plan?
○ Approve and Execute
○ Modify Plan
○ Review Manually
○ Cancel

> Approve and Execute

🔄 Executing stack split...

📦 Creating PR #1: feat: add authentication types and interfaces
✅ Branch created: feature/auth-types
✅ Commits: abc123f, def456a, ghi789b

📦 Creating PR #2: feat: implement JWT authentication service
✅ Branch created: feature/jwt-service
✅ Commits: jkl012c, mno345d, pqr678e, stu901f, vwx234g

[... continues for all PRs ...]

🚀 Submitting stack to Graphite...

✅ Stack created successfully!

📊 Stack Summary:
- PR #1: https://github.com/owner/repo/pull/101 (ready for review)
- PR #2: https://github.com/owner/repo/pull/102 (depends on #101)
- PR #3: https://github.com/owner/repo/pull/103 (depends on #102)
- PR #4: https://github.com/owner/repo/pull/104 (depends on #103)

🎯 Next Steps:
1. Review each PR on Graphite: https://app.graphite.dev
2. PRs will auto-merge down the stack as each is approved
3. Use 'gt up' and 'gt down' to navigate the stack locally
```

## Advanced Features

### Custom Split Boundaries

If you want to manually specify split points:

```bash
/split-stack main --splits="3,7,12"
```

This would create splits after commits 3, 7, and 12, resulting in 4 PRs.

### Dry Run Mode

Preview the split plan without executing:

```bash
/split-stack --dry-run
```

### Interactive Refinement

After seeing the initial plan, refine it interactively:

- Merge two PRs
- Split one PR into two
- Reorder PRs in the stack
- Adjust PR titles and descriptions

## Tips

1. **Commit granularity matters**: More granular commits make splitting easier
2. **Use descriptive commit messages**: They help the semantic analysis
3. **Group tests with features**: Include test changes in the same PR as the feature
4. **Document dependencies**: Add PR descriptions explaining stack dependencies
5. **Review from bottom up**: Start reviewing the foundational PRs first

## Limitations

- Works best with 3-15 commits (too few = not worth splitting, too many = hard to analyze)
- Requires clean git history (avoid merge commits, prefer rebase workflow)
- `gt split` is interactive - fully automated splitting is limited
- Semantic analysis is best-effort - review the plan carefully

## Troubleshooting

### "Graphite (gt) is not initialized"

**Solution:** Run `gt repo init` in your repository root.

### "You have uncommitted changes"

**Solution:** Commit or stash your changes:

```bash
git stash                    # Temporarily stash changes
# OR
git commit -am "WIP"        # Commit work in progress
```

### "Invalid branch name"

**Solution:** Branch names must contain only letters, numbers, hyphens, underscores, slashes, and dots. Avoid special characters and shell metacharacters.

### "No commits found between branches"

**Solutions:**

- Verify you're on a feature branch (not main): `git branch --show-current`
- Check the base branch name is correct: `git branch -a`
- Ensure your branch has commits: `git log main..HEAD`

### "Branch does not exist"

**Solution:** Verify branch names with `git branch -a` and ensure you're using the correct branch name.

### "Split failed mid-operation"

**Recovery steps:**

1. Check current git state: `git status`
2. List active worktrees: `git worktree list`
3. Remove failed worktree: `git worktree remove <path>`
4. Reset to starting point: `git reset --hard origin/your-branch`

### Graphite CLI not found

**Solution:** Install Graphite CLI globally:

```bash
npm install -g @withgraphite/graphite-cli@latest
```

### Permission denied errors

**Solution:** Ensure you have write permissions to the repository and can push to the remote.

## Related Commands

- `/plan`: Create implementation plans for features
- `/create-pr`: Create individual PRs
- `/review-pr`: Review PRs in a stack

## Notes

This command is designed to work with your existing Graphite (gt) workflow and respects your preference for manual approval before making changes.
