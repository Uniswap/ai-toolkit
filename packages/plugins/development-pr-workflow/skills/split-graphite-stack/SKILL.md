---
description: Split monolithic branches into logical PR stacks. Use when user says "split this branch into PRs", "break up my changes", "create a PR stack", "split stack", "make this reviewable", or has a large branch with many changes that needs to be broken into smaller, reviewable pieces.
allowed-tools: Bash(git rev-parse:*), Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git check-ref-format:*), Bash(git ls-files:*), Bash(git rev-list:*), Bash(git fetch:*), Bash(npx nx:*), Bash(which:*), Read(*), Grep(*), Glob(*), AskUserQuestion(*), Task(subagent_type:stack-splitter-agent), mcp__graphite__run_gt_cmd(*), mcp__graphite__learn_gt(*), mcp__nx-mcp__nx_project_details(*)
---

# Stack Splitter

Automatically split a monolithic branch with many changes into a logical, reviewable stack of PRs using semantic analysis and Graphite.

> **Note:** This skill requires Graphite CLI (`gt`) as PR stacking is a Graphite-specific concept. For standard Git workflows without stacking, consider creating separate branches and PRs manually or using the standard PR creator.

## When to Activate

- User has a large branch with many commits
- User wants to break changes into reviewable pieces
- User asks to "split" or "stack" their changes
- User needs help creating a PR stack
- User mentions Graphite stack management

## Prerequisites

- **Graphite CLI** installed: `npm install -g @withgraphite/graphite-cli@latest` (required - this is a Graphite-only feature)
- **Repository initialized** with Graphite: `gt repo init`
- **Clean working directory**: No uncommitted changes
- **Feature branch** with 3+ commits to split

> **Why Graphite-only?** PR stacking (having multiple dependent PRs that automatically rebase when lower PRs are merged) is a core Graphite feature. Standard Git doesn't support this workflow natively.

## Quick Process

1. **Analyze Changes**: Examine all commits and file changes since branch diverged
2. **Semantic Grouping**: Group related changes by functionality
3. **Dependency Analysis**: Use Nx project graph to understand dependencies
4. **Plan Generation**: Create logical split plan optimized for reviewability
5. **User Approval**: Present plan and wait for approval/modifications
6. **Execute Splits**: Use `gt split` to create the stack

## Semantic Analysis Principles

### Logical Boundaries

Group changes that:

- Implement the same feature or fix the same bug
- Share the same domain/context (auth, payments, UI)
- Have natural dependencies (types → implementation → tests)

### Dependency Awareness

- Use Nx project graph for package dependencies
- Foundational changes go at bottom of stack
- Integration/glue code goes at top
- Each PR reviewable independently

### Reviewability Optimization

Each PR should:

- Tell a coherent story with clear purpose
- Be small enough to review in 15-30 minutes
- Include relevant tests
- Have descriptive title and description

## Output Format

```markdown
## 📋 Proposed Stack Split Plan

**Current Branch:** `feature/big-changes`
**Base Branch:** `main`
**Total Commits:** 15

### Stack Structure (bottom to top)

#### PR #1: `feat: add authentication types`

**Commits:** 3 commits
**Files:** 5 files (+123 -12)
**Rationale:** Foundational types that other changes depend on
**Reviewability Score:** 9/10

#### PR #2: `feat: implement JWT service`

**Commits:** 5 commits
**Files:** 12 files (+456 -89)
**Dependencies:** PR #1
**Reviewability Score:** 7/10

[... continues for each PR ...]
```

## Examples

```
"Split this branch into PRs"
"Break up my changes into a reviewable stack"
"Create a PR stack from my feature branch"
"Help me split these 15 commits into logical PRs"
```

## Delegation

Invokes the **stack-splitter-agent** with:

- Current branch name and base branch
- All commits since divergence
- File changes with diff
- Nx project structure (if available)
