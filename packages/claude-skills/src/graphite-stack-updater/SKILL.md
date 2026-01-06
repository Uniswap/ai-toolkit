---
name: graphite-stack-updater
description: Automate Graphite PR stack updates by resolving review comments and syncing all affected PRs. Use when user has a Graphite stack with comments to address, needs to update multiple PRs, or wants to sync stack after changes. Triggers: "update the stack", "address stack comments", "sync graphite", "gt stack update", "update upstack", "resolve PR comments", "graphite sync".
allowed-tools: Bash(gt:*), Bash(gh:*), Bash(git:*), Read, Write, Edit, Task(subagent_type:graphite-stack-updater), Task(subagent_type:code-reviewer)
---

# Graphite Stack Updater

Automate Graphite PR stack updates by resolving comments and syncing PRs.

## When to Activate

- User has a Graphite stack with comments
- Multiple PRs need updating
- Stack sync needed after changes
- Review comments to address
- User mentions "gt stack" or "update stack"

## What It Does

1. **Analyze Stack**: Check structure with `gt stack`
2. **Find Comments**: Identify PRs with unresolved feedback
3. **Address Feedback**: Help resolve comments
4. **Update Stack**: Use Graphite commands to sync
5. **Verify**: Ensure all upstack PRs remain in sync

## Execution Flow

For each PR with comments (bottom to top):

1. Review the feedback
2. Make necessary changes
3. Run `gt modify --no-verify` to amend
4. Execute `gt submit --stack --update-only` to sync upstack
5. Continue until all PRs updated

## Key Graphite Commands Used

```bash
gt stack           # View current stack
gt modify          # Amend current commit
gt submit --stack  # Update all PRs in stack
```

## Options

- Process entire stack or specific PR range
- Filter by comment type (style, logic, performance)
- Dry-run mode to preview changes
- Auto-commit vs manual review mode

## Output

Progress summary with:

- Number of PRs updated
- Comments resolved per PR
- Remaining unresolved items
- Stack synchronization status

## Optional Follow-up

After updates, can invoke **code-reviewer** to verify changes maintain quality.

## Examples

```
"Update my graphite stack"
"Address the review comments on my stack"
"Sync the stack starting from PR #123"
```
