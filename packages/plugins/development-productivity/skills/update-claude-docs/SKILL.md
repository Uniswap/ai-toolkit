---
description: Update CLAUDE.md documentation files after code changes. Use when user says "update the CLAUDE.md", "sync the docs with my changes", "document what I changed", "update documentation for this package", or after making significant code modifications that should be reflected in project documentation.
allowed-tools: Read, Write, Edit, Bash(git diff:*), Bash(git status:*), Glob
model: opus
---

# CLAUDE.md Updater

Synchronize CLAUDE.md files based on staged git changes, capturing conventions and gotchas
that Claude cannot infer by reading code.

## When to Activate

- After significant code changes that reveal non-obvious patterns or constraints
- User requests a documentation sync or CLAUDE.md update
- Staged changes include new commands, env vars, or architectural decisions
- A new gotcha or non-obvious behavior has been introduced

## Content Model

CLAUDE.md files should contain **conventions, gotchas, and team preferences** — not
structural inventory. The guiding question for each potential entry is: **"Would removing
this cause Claude to make a mistake?"** If not, omit it.

**Include:**

- Non-obvious bash commands (env vars required, non-standard behavior, ordering constraints)
- Code style rules that differ from language defaults
- Testing instructions and non-standard runner configuration
- Repository etiquette (branch naming, PR conventions)
- Architectural decisions specific to this project
- Developer environment quirks (required env vars, local service dependencies)
- Common gotchas — behaviors that regularly surprise contributors

**Exclude:**

- File-by-file directory listings (Claude can use `git ls-files`)
- Dependency version tables (Claude can read package.json)
- Standard language or framework conventions Claude already knows
- `[TODO]` placeholder entries
- Structural overviews Claude can derive from code

## Quick Process

1. **Check Git**: Verify in git repository; determine interactive vs. automated mode
2. **Get Staged Files**: `git diff --cached --name-status`
3. **Group by CLAUDE.md**: Find nearest CLAUDE.md ancestor for each staged file
4. **Analyze Changes**: Ask "what does this change reveal that is non-obvious?"
5. **Deduplication Check**: Verify proposed content is not already in ancestor CLAUDE.md files
6. **Propose `.claude/rules/` Factoring**: Suggest a rules file if topic warrants it
7. **Show Summary**: Preview proposed additions (interactive mode only)
8. **Apply Updates**: Write changes after confirmation (or conservatively in automated mode)

## Update Triggers

An update is warranted when:

- A new non-obvious convention or pattern is introduced
- A new command, env var, or setup step is added that is not self-evident
- An existing documented behavior changes in a surprising way
- A new package with cross-cutting concerns is added
- Significant architectural changes (>50 lines) that introduce non-obvious constraints

Skip updates for: formatting changes, typos, renames with no behavior change, or anything
that is standard language/framework convention.

## Output Targets

- **CLAUDE.md files**: Primary output — update nearest ancestor CLAUDE.md for each change
- **`.claude/rules/<topic>.md` files**: Secondary output — when a topic-specific rule is
  identified that would push CLAUDE.md over 200 lines or only applies to a file subset,
  propose factoring it into a rules file with optional `paths` frontmatter

## Length Constraint

Target: **under 200 lines per CLAUDE.md**. If an update would push a file over 200 lines,
propose factoring detailed content into a `.claude/rules/<topic>.md` file instead.

## Automated Mode (Non-Interactive)

When running without a human present (e.g., via a pre-commit hook):

- Only append content that is clearly missing and high-value
- Prefer a no-op over a low-quality update
- Do not ask questions or prompt for confirmation
- Log what was added (or that no update was made)

## Safety

- Git provides rollback (`git restore CLAUDE.md`)
- Single confirmation prompt in interactive mode
- Review with `git diff **/*CLAUDE.md` before committing
- Outdated entries may be pruned when a significant update is made

## Best Practices

1. Stage changes first (`git add`)
2. Review updates (`git diff **/*CLAUDE.md`)
3. Commit CLAUDE.md changes together with related code
4. Treat CLAUDE.md as a living document — prune outdated entries over time
