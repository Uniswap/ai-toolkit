---
name: update-claude-md
description: Fast CLAUDE.md synchronization based on staged git changes
argument-hint: [path] (optional - auto-detects from git if omitted)
allowed-tools: Bash(git:*), Read(*), Write(*), Edit(*), Glob(*), Grep(*)
---

# `/update-claude-md` - Fast CLAUDE.md Synchronization

## Purpose

Update CLAUDE.md files based on staged git changes. The goal is to capture **conventions,
gotchas, and team preferences** that Claude cannot infer by reading code — not to inventory
files or list dependencies. Run this **before committing** whenever staged changes reveal a non-obvious
pattern, constraint, or workflow decision.
constraint, or workflow decision.

## Usage

**Auto-detect mode (recommended):**

```bash
/update-claude-md
```

Analyzes staged changes and updates affected CLAUDE.md files.

**Explicit mode:**

```bash
/update-claude-md apps/slack-oauth-backend
/update-claude-md packages/plugins/development-planning
```

Updates CLAUDE.md for a specific path.

## Content Model

### What belongs in CLAUDE.md

Include only information Claude cannot reliably infer from reading the code:

- Non-obvious **bash commands** (env vars required, non-standard scripts, order-dependent steps)
- **Code style rules** that differ from language defaults or tool configuration
- **Testing instructions** — preferred runner, patterns, known flaky suites
- **Repository etiquette** — branch naming, PR conventions, required reviewers
- **Architectural decisions** specific to this project (why, not just what)
- **Developer environment quirks** — required env vars, local service dependencies
- **Common gotchas** — behaviors that regularly surprise contributors
- **Non-obvious relationships** between modules that aren't visible from imports

### What does NOT belong in CLAUDE.md

Omit anything Claude can figure out by reading code or standard docs:

- File-by-file directory listings
- Dependency version tables (Claude can read package.json)
- Standard language or framework conventions Claude already knows
- Long tutorials or explanations
- Structural overviews Claude can derive from `git ls-files`
- `[TODO]` placeholder entries
- Information that changes frequently (version numbers, deploy states)

**Per-line test**: Would removing this line cause Claude to make a mistake? If not, cut it.

## Length Constraint

**Target: under 200 lines per CLAUDE.md file.**

Files over 200 lines consume disproportionate context and reduce adherence to the instructions
they contain. If a topic requires extended explanation, factor it into a `.claude/rules/<topic>.md`
file (see below) and reference it from CLAUDE.md.

## Implementation

### Step 1: Check Mode (Interactive vs Automated)

Determine whether a human is present:

- **Interactive mode** (human in the loop): Full analysis, propose additions, ask for confirmation
- **Automated mode** (e.g. running via lefthook pre-commit hook): Conservative — only append
  if there is clearly missing, high-value information that cannot wait. Prefer a no-op over
  a low-quality update. Do not ask questions.

### Step 2: Check Git Availability

Verify we are in a git repository. If not and no explicit path was given, report the error
and exit. If an explicit path was given, fall back to analyzing that directory's files directly.

### Step 3: Get Staged Files

```bash
# Get all staged files with their status
git diff --cached --name-status
```

If no staged files are found, check whether an explicit path was provided. If so, analyze
that path's files without requiring staged changes.

### Step 4: Group Files by Nearest CLAUDE.md

For each staged file, walk up the directory tree to find the nearest ancestor `CLAUDE.md`.
Group files by their nearest CLAUDE.md. Files with no CLAUDE.md ancestor are noted but
not processed (suggest running `/claude-init-plus` to create one).

### Step 5: Read and Analyze Each Affected CLAUDE.md

For each CLAUDE.md with associated staged changes:

1. Read the current CLAUDE.md content
2. Read the git diff for each associated file: `git diff --cached -- "<file>"`
3. Scan any ancestor CLAUDE.md files to understand what is already documented at higher
   levels (root → subdirectory chain)
4. Ask: **What does this change reveal that a new contributor would not be able to infer
   from reading the code?**

Focus your analysis on:

- New non-obvious patterns or conventions introduced
- Gotchas or constraints made visible by the change (e.g. "this module must not import from X")
- New commands, env vars, or setup steps that are not self-evident
- Architectural decisions encoded in the change (and the reasoning behind them)
- Breaking or surprising behavior changes

**Triggers for an update** (any one is sufficient):

- A new pattern, convention, or gotcha is introduced that is not currently documented
- A new non-obvious command, env var, or setup step is added
- An existing documented behavior changes in a way that would surprise a developer
- A new package with cross-cutting concerns is added
- Significant architectural changes (>50 lines) that introduce non-obvious constraints

**Skip the update if:**

- Changes are purely mechanical (formatting, typos, renaming with no behavior change)
- Everything introduced is standard language/framework convention
- All relevant information already exists in an ancestor CLAUDE.md

### Step 6: Deduplication Check

Before writing any new content to a subdirectory CLAUDE.md, check whether the same
information already exists in any ancestor CLAUDE.md in the hierarchy. If it does,
skip that item or add a cross-reference instead of duplicating. Each CLAUDE.md in
the hierarchy should **complement**, not repeat, its ancestors.

### Step 7: Propose `.claude/rules/` Factoring (Interactive Mode Only)

When a topic-specific rule is identified that:

- Applies to a subset of files (e.g., only `src/api/**/*.ts`)
- Is detailed enough to warrant its own reference file
- Would push the CLAUDE.md over 200 lines if inlined

Propose creating `.claude/rules/<topic>.md` instead of inlining. Rules files support
optional `paths` frontmatter to activate only when Claude works with matching files:

```markdown
---
paths:
  - src/api/**/*.ts
---

# API Design Rules

[Topic-specific conventions here]
```

Rules without `paths` frontmatter are loaded at every session (same priority as CLAUDE.md).
Rules with `paths` frontmatter are scoped and only loaded when relevant — use these for
language-specific or domain-specific conventions that don't apply everywhere.

### Step 8: Propose `@path` Imports for External Docs (Interactive Mode Only)

When the change references or introduces external documentation (README, architecture ADR,
design doc), prefer referencing it via `@path` import syntax rather than inlining the content:

```markdown
@docs/architecture/auth-flow.md
```

This keeps CLAUDE.md concise and ensures referenced docs stay in sync with their source.

### Step 9: Show Summary and Confirm (Interactive Mode)

Show what will be added or changed for each CLAUDE.md, including:

- Proposed new content (conventions, gotchas, commands)
- Whether new `.claude/rules/` files will be created
- Whether any `@path` imports will be added
- Current line count and projected line count after update

Ask for confirmation once before applying any changes.

In **automated mode**, skip confirmation and apply only if the proposed update passes the
"high-value, clearly missing" bar. Log what was added (or that no update was made).

### Step 10: Apply Updates

Write the updated CLAUDE.md content. For new `.claude/rules/` files, create them at the
nearest `.claude/` directory in the ancestry tree (or at the repository root if none exists).

After writing, verify:

- Line count is under 200 for each modified CLAUDE.md
- No content duplicated from ancestor CLAUDE.md files
- No `[TODO]` placeholder entries

### Step 11: Show Completion

Report which files were updated and their final line counts. Remind the user to review
with `git diff **/*CLAUDE.md` before committing.

## Nx Workspace Support

If `nx.json` exists at the repository root, this command recognizes `project.json` changes
as a trigger for documenting new Nx targets. Document targets only when they are non-standard
or have non-obvious behavior — standard `build`, `test`, `lint` targets do not need entries.

```bash
# Only if nx.json exists at repo root
if [ -f "nx.json" ]; then
  # Process project.json changes for non-obvious targets
fi
```

## Error Handling

- **Not a git repository**: Report error; fall back to explicit mode if a path was given
- **No staged changes**: Exit cleanly; suggest staging changes first
- **No CLAUDE.md found**: Suggest running `/claude-init-plus` to create one
- **Write failed**: Report the error and the file path; do not silently continue
- **CLAUDE.md over 200 lines after update**: Warn and suggest factoring content into
  `.claude/rules/` files

## Best Practices

1. Stage changes first (`git add`) before running in auto-detect mode
2. Review updates with `git diff **/*CLAUDE.md` before committing
3. Commit CLAUDE.md changes in the same commit as the code they document
4. Treat each CLAUDE.md as a living document — prune outdated entries when reviewing
5. Prefer one accurate, specific entry over multiple vague ones

## Relationship to `/claude-init-plus`

`/claude-init-plus` runs **once** to initialize CLAUDE.md files across the workspace.
`/update-claude-md` runs **on each significant change** to keep them current. They are
complementary: init creates the foundation, update maintains it. If a CLAUDE.md does not
exist for the relevant path, run `/claude-init-plus` first.
