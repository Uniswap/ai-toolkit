# Graphite Stack Execution Guide

## Overview

This guide describes how to create a **Graphite PR stack incrementally** while executing an implementation plan. Instead of implementing everything in one branch and splitting afterward, this workflow creates a separate PR for each logical chunk as you implement.

## When to Use Stack Execution

Use this workflow when:

- The plan has **3+ distinct logical steps** that could be reviewed independently
- Changes span **multiple concerns** (types → implementation → tests → docs)
- You want **incremental review** as implementation progresses
- The total change set would be **too large for a single PR** (>500 lines)

Use **single PR execution** when:

- The plan is small and cohesive
- All changes are tightly coupled
- The implementation can be reviewed in one pass

## Prerequisites

- **Graphite CLI** installed: `npm install -g @withgraphite/graphite-cli@latest`
- **Repository initialized** with Graphite: `gt repo init`
- **Clean working directory**: No uncommitted changes
- **On a tracked branch**: Run `gt track` if needed

## Stack Architecture

### Stack Structure

```text
main
└── feat/feature-types        ← PR #1: Foundation (types, interfaces)
    └── feat/feature-impl     ← PR #2: Core implementation
        └── feat/feature-tests ← PR #3: Tests
            └── feat/feature-docs ← PR #4: Documentation (optional)
```

### Naming Convention

Branch names should follow the pattern:

```text
<username>/<feature>-<chunk>
```

Examples:

- `nickkoutrelakos/auth-types`
- `nickkoutrelakos/auth-impl`
- `nickkoutrelakos/auth-tests`

## Execution Workflow

### Phase 1: Plan Analysis

Before starting execution, analyze the plan to identify stack boundaries:

1. **Read the entire plan** to understand the full scope
2. **Identify logical chunks** that can be reviewed independently
3. **Determine dependencies** between chunks
4. **Create stack plan** mapping plan steps to PRs

#### Stack Planning Template

```yaml
stack_plan:
  total_steps: N
  pr_count: M

  prs:
    - pr_number: 1
      branch: '<username>/<feature>-<chunk>'
      title: '<type>(<scope>): <description>'
      steps: [1, 2] # Plan steps included
      rationale: 'Foundation types that other changes depend on'

    - pr_number: 2
      branch: '<username>/<feature>-<chunk>'
      title: '<type>(<scope>): <description>'
      steps: [3, 4, 5]
      depends_on: [1]
      rationale: 'Core implementation using the types'
```

### Phase 2: Execute with Stack Creation

For each PR in the stack plan:

#### Step 2.1: Create Stack Entry

```bash
# Create new branch stacked on current position
# IMPORTANT: Use timeout: 180000 for all gt commands
gt create -m "<type>(<scope>): <description>" --no-verify
```

> **Note**: Use `--no-verify` during `gt create` to skip hooks initially. Run validation before submitting.

#### Step 2.2: Implement Plan Steps

For each step assigned to this PR:

1. Read relevant files
2. Make code changes
3. Stage changes: `git add <specific-files>` (never `git add .`)
4. Verify changes compile/lint

#### Step 2.3: Finalize PR

After all steps for this PR are complete:

```bash
# Run validation (use your project's linting/typecheck/test commands)
# Examples: npm run lint, npm test, yarn typecheck, make check, etc.

# Amend with all changes (if you staged incrementally)
CLAUDE_CODE=1 gt modify --no-verify

# Submit the PR
gt submit
```

#### Step 2.4: Continue Stack

Move to the next PR:

```bash
# Create next stack entry (stacks on current branch)
gt create -m "<type>(<scope>): <description>" --no-verify
```

Repeat steps 2.1-2.4 for each PR in the stack.

### Phase 3: Submit Full Stack

After all PRs are implemented:

```bash
# Submit entire stack (updates all PRs)
gt submit --stack
```

## Graphite Commands Reference

### Creating Stack Entries

```bash
# Create new branch stacked on current position
gt create -m "feat(auth): add authentication types"

# Create with specific branch name
gt create -m "feat(auth): add authentication types" -b nickkoutrelakos/auth-types
```

### Modifying Commits

```bash
# Amend current commit with staged changes
CLAUDE_CODE=1 gt modify --no-verify

# Amend with new message
CLAUDE_CODE=1 gt modify -m "feat(auth): add JWT types" --no-verify
```

### Submitting PRs

```bash
# Submit current branch only
gt submit

# Submit entire stack (all branches from current to trunk)
gt submit --stack

# Update existing PRs only (don't create new ones)
gt submit --stack --update-only
```

### Navigating Stack

```bash
# View stack structure
gt stack

# Move up the stack (toward trunk)
gt up

# Move down the stack (away from trunk)
gt down

# Checkout specific branch in stack
gt checkout <branch-name>
```

### Syncing Stack

```bash
# Sync with remote and restack
gt sync

# Restack after trunk changes
gt restack
```

## Example: Full Stack Execution

### Plan Example

```markdown
## Implementation Plan: Add User Authentication

### Step 1: Define Types

- Create `src/types/auth.ts` with User, Token, Session types

### Step 2: Implement Auth Service

- Create `src/services/auth-service.ts`
- Implement login, logout, validateToken methods

### Step 3: Add API Routes

- Create `src/routes/auth.ts` with POST /login, POST /logout

### Step 4: Add Tests

- Create `src/services/__tests__/auth-service.test.ts`
- Create `src/routes/__tests__/auth.test.ts`
```

### Stack Execution

```bash
# Start from main
git checkout main && git pull

# PR 1: Types (Step 1)
gt create -m "feat(auth): add authentication types" -b nickkoutrelakos/auth-types
# ... implement step 1 ...
git add src/types/auth.ts
CLAUDE_CODE=1 gt modify --no-verify
gt submit

# PR 2: Service (Step 2)
gt create -m "feat(auth): implement auth service" -b nickkoutrelakos/auth-service
# ... implement step 2 ...
git add src/services/auth-service.ts
CLAUDE_CODE=1 gt modify --no-verify
gt submit

# PR 3: Routes (Step 3)
gt create -m "feat(auth): add auth API routes" -b nickkoutrelakos/auth-routes
# ... implement step 3 ...
git add src/routes/auth.ts
CLAUDE_CODE=1 gt modify --no-verify
gt submit

# PR 4: Tests (Step 4)
gt create -m "test(auth): add auth service and route tests" -b nickkoutrelakos/auth-tests
# ... implement step 4 ...
git add src/services/__tests__/auth-service.test.ts src/routes/__tests__/auth.test.ts
CLAUDE_CODE=1 gt modify --no-verify
gt submit --stack  # Final submit updates entire stack
```

### Result

```text
main
└── nickkoutrelakos/auth-types    ← PR #1: Types
    └── nickkoutrelakos/auth-service  ← PR #2: Service
        └── nickkoutrelakos/auth-routes   ← PR #3: Routes
            └── nickkoutrelakos/auth-tests    ← PR #4: Tests
```

## Stack Boundary Guidelines

### Good Boundaries

| PR  | Content             | Rationale                          |
| --- | ------------------- | ---------------------------------- |
| 1   | Types/Interfaces    | Foundation with no dependencies    |
| 2   | Core Implementation | Uses types, provides functionality |
| 3   | Integration/Glue    | Connects implementation to app     |
| 4   | Tests               | Validates all above                |
| 5   | Documentation       | Describes the feature              |

### Bad Boundaries

- Splitting a single function across PRs
- Separating a type from its only consumer
- Tests in different PR than the code they test (unless test-only PR)
- Changes that can't compile independently

### Reviewability Criteria

Each PR should:

- **Compile independently** (with lower stack merged)
- **Tell a coherent story** (one logical change)
- **Be reviewable in 15-30 minutes** (<400 lines ideal)
- **Have passing CI** at each level

## Error Recovery

### If a Stack Entry Needs Changes

```bash
# Navigate to the branch
gt checkout <branch-name>

# Make changes
# ... edit files ...

# Amend and update
git add <files>
CLAUDE_CODE=1 gt modify --no-verify
gt submit --stack --update-only
```

### If Stack Gets Out of Sync

```bash
# Sync with remote
gt sync

# Restack if needed
gt restack
```

### If You Need to Insert a PR

```bash
# Checkout the branch that should be ABOVE the new PR
gt checkout <branch-above>

# Create new branch at this position
gt create -m "new pr" --insert

# This inserts a new branch and restacks everything above
```

## Integration with execute-plan Skill

When invoking the `execute-plan` skill with stack mode:

```text
"Execute the plan as a Graphite stack"
"Implement this plan with one PR per section"
"Create a PR stack while executing"
```

The skill will:

1. Analyze the plan for logical boundaries
2. Present the proposed stack structure for approval
3. Execute each chunk, creating stack entries
4. Submit the full stack when complete

## Timeouts

**CRITICAL**: Always use `timeout: 180000` (3 minutes) for Graphite commands in the Bash tool. Pre-commit hooks can take 60+ seconds, and interrupted operations corrupt the worktree.

```bash
# All of these need extended timeout
gt create -m "..."      # timeout: 180000
gt modify               # timeout: 180000
gt submit               # timeout: 180000
gt submit --stack       # timeout: 180000
```
