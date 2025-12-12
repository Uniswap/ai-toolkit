---
name: create-pr
description: Create or update a Graphite PR with auto-generated conventional commit messages and comprehensive descriptions based on code diffs.
---

## Workflow Process

This workflow uses the pr-creator agent to:

1. Analyze diffs between current branch and target branch (default: main)
2. Generate conventional commit messages if needed
3. Create informative PR titles following conventional commits format
4. Write comprehensive PR descriptions
5. Create new PR or update existing PR using Graphite

## Execution Steps

1. **pr-creator**: Main orchestrator that will:
   - Analyze `git diff` between current and target branch
   - Detect the type of changes (feat, fix, refactor, etc.)
   - If uncommitted changes exist, ASK THE USER if they would like to create a conventional commit. DO NOT commit changes without User confirmation
   - Create PR title in format: `<type>(<scope>): <description>`
   - Generate detailed PR description with:
     - Summary of changes
     - List of modified files and why
     - Testing information
     - Related issues
   - Use `gt submit` or `gh pr create` to create/update PR
   - Provide PR URL for review

## Usage Examples

Basic usage (create/update PR against main):

```
/create-pr
```

With custom target branch:

```
/create-pr target: develop
/create-pr target: staging
```

With specific instructions:

```
/create-pr emphasize performance improvements
/create-pr mark as breaking change due to API updates
/create-pr link to issue #123
```

## Conventional Commit Types

The agent will automatically detect and use appropriate types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Maintenance tasks

## Options

The workflow supports:

- Custom target branch (default: main)
- Breaking change detection and marking
- Issue linking
- Stack-aware PR creation with Graphite
- Updating existing PRs vs creating new ones

Target: $ARGUMENTS
