# Plan Execution Guide

## Pre-Execution Checklist

Before starting execution:

1. Read the entire plan to understand full scope
2. Verify all referenced files exist
3. Check for any blockers or prerequisites
4. Ensure clean git state (no uncommitted changes)
5. Confirm user is ready to proceed

## Step Execution Protocol

### Reading Context

For each step, read:

- Files explicitly listed in the step
- Related files that may be affected
- Test files if changes affect tested code
- Type definitions if modifying interfaces

### Making Changes

**For Existing Files (Edit tool)**

- Match existing code style
- Preserve surrounding context
- Update imports if needed
- Maintain type safety

**For New Files (Write tool)**

- Follow project conventions
- Include necessary imports
- Add appropriate comments
- Match file organization patterns

### Validation

After changes:

- Check TypeScript compiles: `npx tsc --noEmit`
- Run relevant tests: `nx test affected`
- Check lint: `nx lint affected`
- Manual review of changes

## Error Recovery

### Common Errors

**File Not Found**

- Check for typos in path
- Verify file hasn't moved
- Ask user for correct location

**Type Errors**

- Check import statements
- Verify interface compatibility
- Review type definitions

**Test Failures**

- Read test to understand expectation
- Check if test needs updating
- Fix implementation to match spec

**Merge Conflicts**

- Show conflict to user
- Ask for resolution preference
- Apply chosen resolution

### Recovery Strategies

1. **Retry with fix**: If cause is clear, fix and retry
2. **Skip and continue**: If step is non-blocking, proceed
3. **Ask for help**: If blocked, ask user for guidance
4. **Rollback**: If step corrupts state, revert changes

## Progress Reporting

### Per-Step Report

```
Step [N/Total]: [Step Title]
Status: [in_progress|completed|failed]
Files: [files touched]
Notes: [any important observations]
```

### Milestone Reports

At logical completion points:

```
Milestone: [Name]
Steps completed: [N]
Files modified: [list]
Ready for commit: [yes/no]
```

## Commit Strategy

### When to Commit

- After completing a logical unit of work
- Before starting unrelated changes
- When tests pass for a feature
- At user-requested points

### Commit Message Format

```
type(scope): brief description

Implements step [N] of [plan-name]:
- Change 1
- Change 2

Part of: [plan file reference]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `test`: Test additions
- `docs`: Documentation
- `chore`: Maintenance

## Follow-up Delegation

### Test Generation

When user requests tests:

```
Invoke test-writer agent with:
- Files modified/created
- Implementation details from plan
- Existing test patterns in codebase
```

### Documentation

When user requests docs:

```
Invoke doc-writer agent with:
- Changes made
- API modifications
- User-facing feature changes
```

## Integration Checklist

After all steps complete:

1. All tests pass
2. Lint checks pass
3. TypeScript compiles
4. Changes committed (if requested)
5. Documentation updated (if requested)
6. Summary provided to user
