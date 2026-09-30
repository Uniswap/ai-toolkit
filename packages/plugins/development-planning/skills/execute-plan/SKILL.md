---
description: Execute implementation plans step-by-step. Use when user says "execute the plan", "implement the plan we created", "start building based on the plan", "go ahead and implement it", "proceed with the implementation", or references a plan file and wants to begin coding.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(npx:*), Task(subagent_type:test-writer-agent), Task(subagent_type:documentation-agent), Task(subagent_type:pr-creator-agent), Task(subagent_type:commit-message-generator-agent)
model: claude-opus-5-5
---

# Plan Executor

Execute implementation plans by reading the plan file and implementing each step directly with progress tracking, then offering to generate tests, update docs, or create a pull request.

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

- Report errors clearly with the full error output and context
- Read the full error output, identify the root cause, and attempt a targeted fix
- Ask user for guidance if two fix attempts fail
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
> 3. Create a pull request?
> 4. All of the above?"

- **Tests**: Delegate to test-writer-agent
- **Docs**: Delegate to documentation-agent
- **PR**: Delegate to pr-creator-agent (commits changes with conventional commit format, creates PR)

## Workflow Integration

This is **Step 4** of the implementation workflow:

1. Explore → 2. Plan → 3. Review → 4. **Execute** (this) → 5. PR Creation

After execution completes, the pr-creator-agent handles step 5 (PR creation) within this same plugin.

## Detailed Reference

- **Execution strategies and error recovery**: [execution-guide.md](execution-guide.md)
