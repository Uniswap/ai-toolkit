---
name: plan-executor
description: Execute implementation plans step-by-step with progress tracking and optional test/doc generation. Use AUTOMATICALLY when user wants to execute a plan, implement a planned feature, or has an approved plan ready. Triggers: "execute", "implement the plan", "run the plan", "start implementing", "let's build", "go ahead", "proceed with", "start the implementation", "follow the plan".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task(subagent_type:test-writer), Task(subagent_type:doc-writer)
---

# Plan Executor

Execute implementation plans by reading the plan file and implementing each step directly with progress tracking.

## When to Activate

- User says "execute the plan" or "implement the plan"
- User references a plan file and wants to start
- User says "go ahead" or "proceed" after planning
- User wants to implement what was planned
- Following approval of a reviewed plan

## Quick Process

1. **Read Plan**: Load and parse the plan file
2. **Execute Steps**: Implement each step sequentially
   - Read relevant files
   - Make code changes (Edit/Write)
   - Run tests when appropriate
   - Report progress
3. **Commit Points**: Ask user about commits at logical points
4. **Follow-up**: Offer test generation and documentation

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

After implementation, ask:

> "Implementation complete. Would you like me to:
>
> 1. Generate tests for the new code?
> 2. Update documentation?
> 3. Both?"

- **Tests**: Delegate to test-writer agent
- **Docs**: Delegate to doc-writer agent

## Workflow Integration

This is **Step 4** of the implementation workflow:

1. Explore → 2. Plan → 3. Review → 4. **Execute** (this)

## Detailed Reference

For execution strategies and error recovery, see [execution-guide.md](execution-guide.md).
