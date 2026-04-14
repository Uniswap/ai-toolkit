---
description: Coordinate a full software release. Use when user says "release version 1.2.0", "cut a release", "bump the version and release", "prepare a release for this milestone", "tag and release the latest changes", "what version should we release next?", or "create a release PR".
allowed-tools: Bash(git log:*), Bash(git tag:*), Bash(git describe:*), Bash(git diff:*), Bash(git commit:*), Bash(git push:*), Bash(git checkout:*), Bash(git branch:*), Bash(grep:*), Bash(sed:*), Bash(cat:*), Bash(gh pr:*), Bash(gh release:*), Read, Write, Edit, Glob
model: sonnet
---

# Release Manager

Coordinate a complete software release: determine the next version, update package files, generate a changelog, commit, tag, and open a release PR.

## When to Activate

- User wants to cut a new release
- User asks "what version should we release?"
- User wants to bump the version and create a release PR
- User is preparing a release for a milestone or sprint
- User wants to tag and publish the latest changes
- User says "release", "cut a release", "bump version", or "ship this"

## Inputs

Parse from the user's request:

- **version**: Explicit version to release (e.g. `1.2.0`). If not provided, auto-determine from commits.
- **type**: Force a release type (`major` | `minor` | `patch`). Overrides auto-detection.
- **tag-prefix**: Prefix for git tags (e.g. `v`). Default: `v` if existing tags use it, else none.
- **base**: Branch to open the release PR against. Default: `main`.
- **dry-run**: Print what would happen without making changes. Default: false.

## Process

### Step 1: Understand the current state

```bash
# Find the most recent tag
git describe --tags --abbrev=0 2>/dev/null || echo "no tags"

# List recent tags
git tag --sort=-version:refname | head -10

# Count commits since last tag
git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --oneline 2>/dev/null | wc -l

# Show the commits since last tag
git log $(git describe --tags --abbrev=0 2>/dev/null)..HEAD --oneline 2>/dev/null
```

If there are no commits since the last tag, tell the user there is nothing to release and stop.

### Step 2: Determine the next version

If the user specified an explicit version, use it. Otherwise, analyze commits since the last tag using conventional commit format:

| Commit type                                        | Version bump |
| -------------------------------------------------- | ------------ |
| `feat!`, `fix!`, `BREAKING CHANGE` in footer       | **major**    |
| `feat`                                             | **minor**    |
| `fix`, `perf`, `refactor`, `docs`, `test`, `chore` | **patch**    |

Rules:

- If no recognizable conventional commits found, default to **patch**
- If current version is `0.x.y`, a `feat` bumps **minor**, a breaking change bumps **minor** too (per semver pre-1.0 conventions — tell the user this is happening)
- Show the proposed version and ask for confirmation before proceeding (unless `--dry-run` is false and user already provided the version)

### Step 3: Detect package files to update

Look for files that contain the version string and need updating:

```bash
# package.json at root or in packages/
# plugin.json in .claude-plugin/ directories
# Any VERSION or version files
git ls-files | grep -E "(package\.json|plugin\.json|VERSION)$" | head -20
```

For each file:

1. Check if it contains `"version":` (JSON) or a bare version string
2. Confirm it's a file that should be bumped (not `node_modules`, not lock files)
3. For monorepos — only update packages whose contents changed since the last tag

Show the user the list of files that will be updated.

### Step 4: Checkout a release branch

```bash
git checkout -b release/v<VERSION>
```

### Step 5: Update version in package files

For each identified package file, update the version field:

```bash
# For package.json — use a targeted sed (not npm version, to avoid side effects)
sed -i '' "s/\"version\": \"<CURRENT>\"/\"version\": \"<NEXT>\"/" path/to/package.json

# For plugin.json — same pattern
sed -i '' "s/\"version\": \"<CURRENT>\"/\"version\": \"<NEXT>\"/" path/to/.claude-plugin/plugin.json
```

After each edit, re-read the file to verify the replacement was correct.

### Step 6: Generate the changelog

If a `CHANGELOG.md` exists or the user wants one:

1. Generate the changelog entry for the new version by running `git log` with the same range used for version detection
2. Format as a conventional changelog entry (see `generate-changelog` skill for format)
3. Prepend the new entry to `CHANGELOG.md`, preserving any existing content

If `CHANGELOG.md` does not exist, create it with the new entry.

### Step 7: Commit the release changes

```bash
git add <all updated package files> CHANGELOG.md
git commit -m "chore(release): bump version to <VERSION>"
```

### Step 8: Create and push the release branch

```bash
git push -u origin release/v<VERSION>
```

### Step 9: Create the release PR

```bash
gh pr create \
  --base <BASE_BRANCH> \
  --title "chore(release): v<VERSION>" \
  --body "..."
```

PR body should include:

- Version being released (`## Release v<VERSION>`)
- The changelog entry for this version (from Step 6)
- List of files updated with version bumps
- Checklist:
  - [ ] Version bumped in all package files
  - [ ] CHANGELOG.md updated
  - [ ] No unintended files staged

### Step 10: Summarize

Report back to the user:

- New version: `v<VERSION>`
- Release branch: `release/v<VERSION>`
- PR link
- Files updated
- Next steps (merge PR, then tag + publish if not automated)

## Dry Run Mode

If `--dry-run` is set:

- Show what version would be bumped to and why
- Show which files would be updated
- Show the changelog that would be generated
- Do NOT create any branches, commits, or PRs

## Safety Rules

- Never commit directly to `main` or `main`-equivalent branches — always use a release branch
- Never force-push
- Never delete or modify existing release tags
- If any file update fails to verify correctly, stop and report the failure before proceeding
- If the user says "just tag it" without a PR, offer both options but default to the PR workflow for traceability

## Examples

```text
"Release the next version"
"Cut a patch release"
"Bump to version 2.1.0 and create a release PR"
"What version should we ship next?"
"Prepare a minor release for this sprint"
"manage-release --version 1.5.0 --base main"
"manage-release --type minor --dry-run"
"Tag and release latest changes"
```
