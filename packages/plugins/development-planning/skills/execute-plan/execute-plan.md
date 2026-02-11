---
description: Execute implementation plans step-by-step. Use when user says "execute the plan", "implement the plan we created", "start building based on the plan", "go ahead and implement it", "proceed with the implementation", "execute as a stack", "create a PR stack while implementing", "implement with one PR per step", or references a plan file and wants to begin coding.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(gt:*), Bash(npx:*), Task(subagent_type:test-writer), Task(subagent_type:documentation), Task(subagent_type:pr-creator), Task(subagent_type:commit-message-generator)
model: opus
---

# Plan Executor

Execute implementation plans by reading the plan file and implementing each step directly with progress tracking. Supports both **single PR** (default) and **Graphite PR stack** execution modes.

## When to Activate

- User says "execute the plan" or "implement the plan"
- User references a plan file and wants to start
- User says "go ahead" or "proceed" after planning
- User wants to implement what was planned
- Following approval of a reviewed plan

### Stack Mode Triggers

Activate **stack execution mode** when user says:

- "execute as a stack" or "implement as a PR stack"
- "create a PR stack while implementing"
- "one PR per step" or "one PR per section"
- "use Graphite stack" or "stack the PRs"

## Execution Modes

### Single PR Mode (Default)

Implements all steps, commits at logical points, creates one PR at the end.

### Stack Mode (Graphite)

Creates a **separate PR for each logical chunk** during execution. Use when:

- Plan has 3+ distinct logical sections
- Changes span multiple concerns (types → impl → tests)
- Total change set would be >500 lines
- Incremental review is desired

## Quick Process (Single PR Mode)

1. **Read Plan**: Load and parse the plan file
2. **Execute Steps**: Implement each step sequentially
   - Read relevant files
   - Make code changes (Edit/Write)
   - Run tests when appropriate
   - Report progress
3. **Commit Points**: Ask user about commits at logical points
4. **Follow-up**: Offer test generation and documentation

## Stack Execution Process (Graphite Mode)

When executing in stack mode, follow this workflow:

### Phase 1: Plan Analysis

1. **Read entire plan** to understand full scope
2. **Identify logical chunks** that can be reviewed independently
3. **Present stack plan** to user for approval:

```yaml
stack_plan:
  pr_count: N
  prs:
    - pr: 1
      branch: '<username>/<feature>-types'
      title: 'feat(<scope>): add types and interfaces'
      steps: [1, 2]
    - pr: 2
      branch: '<username>/<feature>-impl'
      title: 'feat(<scope>): implement core functionality'
      steps: [3, 4]
      depends_on: [1]
```

### Phase 2: Execute with Stack Creation

For each PR in the stack:

```bash
# 1. Create stack entry (timeout: 180000)
gt create -m "<type>(<scope>): <description>" --no-verify

# 2. Implement assigned steps
# ... make changes, stage files ...

# 3. Validate (use your project's linting/typecheck commands)

# 4. Finalize PR (timeout: 180000)
git add <specific-files>
CLAUDE_CODE=1 gt modify --no-verify
gt submit
```

### Phase 3: Submit Full Stack

```bash
# Submit entire stack when complete (timeout: 180000)
gt submit --stack
```

### Stack Boundaries

Good PR boundaries:

| PR  | Content             | Rationale                          |
| --- | ------------------- | ---------------------------------- |
| 1   | Types/Interfaces    | Foundation with no dependencies    |
| 2   | Core Implementation | Uses types, provides functionality |
| 3   | Integration/Glue    | Connects to app                    |
| 4   | Tests               | Validates implementation           |

For comprehensive stack execution guidance, see [graphite-stack-execution.md](../../shared/graphite-stack-execution.md).

## Execution Rules

### For Each Step

1. Read files listed in the step
2. Implement changes using Edit (existing) or Write (new)
3. Follow the plan's approach
4. Validate changes work
5. Report clear progress

### Error Handling

- Report errors clearly with context
- Attempt to understand and resolve
- Ask user for guidance if blocked
- Continue with other steps when possible

### Commits

**Always ask user before committing:**

- After completing cohesive changes
- When step or group finishes
- Before major new section
- Use clear messages referencing the plan

## Output Format

After execution, provide summary:

```yaml
plan_executed: [path]
steps_completed: [N]
steps_failed: [N]
files_modified: [list]
files_created: [list]
commits_created: [list]
status: completed | partial | failed
next_steps: [remaining work]
```

## Follow-up Actions

### Single PR Mode

After implementation, ask:

> "Implementation complete. Would you like me to:
>
> 1. Generate tests for the new code?
> 2. Update documentation?
> 3. Create a pull request?
> 4. All of the above?"

- **Tests**: Delegate to test-writer agent
- **Docs**: Delegate to documentation agent
- **PR**: Delegate to pr-creator agent (commits changes with conventional commit format, creates PR)

### Stack Mode

After stack execution, provide summary:

> "Stack execution complete. Created N PRs:
>
> 1. PR #1: `feat(scope): description` - [URL]
> 2. PR #2: `feat(scope): description` - [URL]
>    ...
>
> All PRs are linked in a Graphite stack. Reviewers can review bottom-up.
> Would you like me to generate tests or documentation for any of the PRs?"

## Workflow Integration

This is **Step 4** of the implementation workflow:

1. Explore → 2. Plan → 3. Review → 4. **Execute** (this) → 5. PR Creation

After execution completes, the pr-creator agent handles step 5 (PR creation) within this same plugin.

## Detailed Reference

- **Execution strategies and error recovery**: [execution-guide.md](execution-guide.md)
- **Graphite stack execution**: [graphite-stack-execution.md](../../shared/graphite-stack-execution.md)
