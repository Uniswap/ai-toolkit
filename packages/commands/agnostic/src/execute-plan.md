---
description: Execute implementation plans step-by-step
argument-hint: <plan-file>
allowed-tools: Read(*), Write(*), Edit(*), Glob(*), Grep(*), Bash(*), Task(subagent_type:test-writer), Task(subagent_type:doc-writer)
---

# Execute Plan Command

Execute an implementation plan by reading the plan file and implementing each step directly.

## Workflow Integration

This command is **Step 4** of the implementation workflow:

1. Explore → 2. Plan → 3. Review → 4. **Execute**

### Complete Workflow Example

```bash
# Step 1: Explore and understand the area
/explore authentication system

# Step 2: Plan the implementation (uses exploration context automatically)
/plan add OAuth2 with Google and GitHub

# Step 3: Review the generated plan
/review-plan oauth-plan.md

# Step 4: Execute the approved plan
/execute-plan oauth-plan.md
```

## Inputs

Parse arguments from `$ARGUMENTS`:

- **plan_file_path**: Path to the markdown plan file (required)

Examples:

- `/execute-plan ./implementation-plan.md`
- `/execute-plan /tmp/plans/feature-plan.md`
- `/execute-plan oauth-plan.md`

## Task

Execute the implementation plan step-by-step:

1. **Read Plan**: Load the plan file and parse the implementation steps
2. **Execute Steps**: For each step in the plan:
   - Read relevant files mentioned in the step
   - Make the necessary code changes using Edit/Write tools
   - Run tests when appropriate using Bash
   - Handle errors and report progress
3. **Commit Changes**: At logical completion points, ASK THE USER if they would like you to create git commit(s). DO NOT commit changes without User confirmation
4. **Follow-up Options**: After implementation, ask the user if they'd like to:
   - Generate tests (delegate to test-writer agent)
   - Update documentation (delegate to doc-writer agent)

## Plan File Format

The plan file format from `/plan` command contains:

- **Overview**: High-level summary
- **Scope**: What will and won't be implemented
- **Current State**: Relevant architecture and files
- **API Design** (optional): Function signatures and data structures
- **Implementation Steps**: Sequential steps (typically 5-7 for medium tasks)
- **Files Summary**: Files to modify or create
- **Critical Challenges** (optional): Known issues and mitigations

## Execution Process

### Step-by-Step Implementation

For each implementation step:

1. **Read Context**: Read files listed in the step
2. **Implement Changes**:
   - Use Edit tool for modifying existing files
   - Use Write tool for creating new files
   - Follow the approach outlined in the plan
3. **Validate**: Run relevant tests or checks
4. **Report**: Provide clear progress updates

### Error Handling

If a step fails:

- Report the error clearly
- Attempt to understand and resolve the issue
- Ask the user for guidance if needed
- Continue with remaining steps when possible

### Committing Changes

At logical points, ASK THE USER if they're like you to create git commits:

- After completing a cohesive set of changes
- When a step or group of steps is finished
- Before moving to a new major section
- Use clear commit messages that reference the plan

## Follow-up Actions

After completing the implementation, ask the user:

**"Implementation complete. Would you like me to:**

**1. Generate tests for the new code?**
**2. Update documentation?**
**3. Both?"**

If the user agrees:

- **For tests**: Invoke test-writer agent with the relevant files and implementation details
- **For docs**: Invoke doc-writer agent with the changes made and context

## Output

Provide a summary after execution:

```yaml
plan_executed: [path to plan file]
steps_completed: [number of steps completed]
steps_failed: [number of steps that failed]
files_modified: [list of files changed]
files_created: [list of files created]
commits_created: [list of commit messages]
status: completed | partial | failed
next_steps: [any remaining work or issues to address]
```

## Integration with Workflow Commands

This command completes the implementation workflow:

1. **Explore**: `/explore <area>`

   - Builds understanding of the codebase area
   - Context flows to planning

2. **Plan**: `/plan <task>`

   - Uses exploration context automatically
   - Creates clear plan in markdown file

3. **Review**: `/review-plan <plan-file>`

   - Validates plan quality and feasibility
   - Checks alignment with codebase patterns

4. **Execute**: `/execute-plan <plan-file>`
   - Reads the plan and implements it
   - Makes code changes directly
   - Prompts the user to create commits at logical points
   - Offers optional test/doc generation

## Best Practices

1. **Read the entire plan first** to understand the full scope
2. **Follow the plan's order** unless there's a good reason not to
3. **Commit incrementally** at logical completion points
4. **Test as you go** when appropriate
5. **Report progress clearly** so the user understands what's happening
6. **Ask for help** when encountering blocking issues
7. **Offer follow-ups** (tests, docs) after core implementation is done
