---
name: claude-docs-updater
description: Update CLAUDE.md documentation files after code changes. Use when user says "update the CLAUDE.md", "sync the docs with my changes", "document what I changed", "update documentation for this package", or after making significant code modifications that should be reflected in project documentation.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash(git diff:*), Bash(git status:*), Glob
model: opus
---

# CLAUDE.md Updater

Quickly synchronize CLAUDE.md files based on staged git changes.

## When to Activate

- After significant code changes
- User mentions updating documentation
- Staged changes should be documented
- New files added that need documentation
- Dependencies or commands changed

## Quick Process

1. **Check Git**: Verify in git repository
2. **Get Staged Files**: `git diff --cached --name-status`
3. **Group by CLAUDE.md**: Find nearest CLAUDE.md for each file
4. **Analyze Changes**: Determine if updates needed
5. **Show Summary**: Preview what will be updated
6. **Apply Updates**: Write changes with user confirmation

## Update Triggers

Updates triggered when:

- New files added (status 'A')
- package.json modified
- project.json modified
- Significant changes (>50 lines)
- New exports added

## Update Strategies

### New Files

```markdown
- `path/to/file.ts` - [TODO: Add description]
```

### Dependencies (package.json)

```markdown
- **package-name** (version)
```

### Commands (project.json)

```markdown
- `nx command project` - [description]
```

### Significant Changes

```markdown
- Modified `path/to/file.ts` (N lines changed)
```

## Performance

- Single git command for detection
- No external tools required
- Simple file operations
- 1-3 seconds typical

## Safety

- Git provides rollback (`git restore CLAUDE.md`)
- Single confirmation prompt
- Non-destructive (adds, doesn't remove)
- Review with `git diff` before commit

## Usage Modes

**Auto-detect** (recommended):
Analyzes staged changes automatically

**Explicit**:
Update specific path's CLAUDE.md

## Best Practices

1. Stage changes first (`git add`)
2. Review updates (`git diff **/*CLAUDE.md`)
3. Commit together with related code
4. Run frequently after significant changes
