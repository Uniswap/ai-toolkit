# GitHub Actions Scripts

## Purpose

TypeScript scripts used by GitHub Actions workflows for automated PR reviews and other CI/CD tasks. These scripts are designed to be testable and maintainable while being usable both locally (within ai-toolkit) and remotely (downloaded by external repositories).

## Scripts

### build-prompt.ts

Assembles the PR review prompt from modular section files. This script handles:

- **Template variable substitution** - Replaces `${VAR}` patterns with actual values
- **Section ordering** - Ensures sections appear in the correct order (1-16)
- **Override handling** - Allows consumers to replace specific overridable sections
- **Conditional sections** - Includes sections 13 (existing comments) and 14 (fast review) only when conditions are met

**Usage:**

```bash
npx tsx .github/scripts/build-prompt.ts \
  --prompt-dir ".github/prompts/pr-review" \
  --output "/tmp/final-prompt.txt" \
  --repo-owner "Uniswap" \
  --repo-name "ai-toolkit" \
  --pr-number "123" \
  --base-ref "main" \
  --patch-id "abc123" \
  --base-sha "abc789def012" \
  --lines-changed "50" \
  --existing-comment-count "0" \
  --is-trivial "false" \
  --changed-files-file "/tmp/changed-files.txt" \
  --pr-diff-file "/tmp/pr-diff.txt" \
  --existing-comments-file "/tmp/existing-comments.json"
```

**CLI Arguments:**

| Argument                   | Description                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `--prompt-dir`             | Directory containing prompt section files                                                          |
| `--output`                 | Path for the assembled prompt output                                                               |
| `--repo-owner`             | Repository owner (maps to `${REPO_OWNER}`)                                                         |
| `--repo-name`              | Repository name (maps to `${REPO_NAME}`)                                                           |
| `--pr-number`              | Pull request number (maps to `${PR_NUMBER}`)                                                       |
| `--base-ref`               | Base branch name, e.g., "main" (maps to `${BASE_REF}`)                                             |
| `--patch-id`               | Stable patch identifier for caching (maps to `${PATCH_ID}`)                                        |
| `--base-sha`               | **Merge base SHA** - the common ancestor commit where PR branch diverged (maps to `${MERGE_BASE}`) |
| `--lines-changed`          | Number of lines changed in PR (maps to `${LINES_CHANGED}`)                                         |
| `--existing-comment-count` | Count of existing review comments (controls conditional sections)                                  |
| `--is-trivial`             | Whether PR is trivial, i.e., < 20 lines (controls fast review mode section)                        |
| `--changed-files-file`     | Path to file containing list of changed files (maps to `${CHANGED_FILES}`)                         |
| `--pr-diff-file`           | Path to file containing PR diff (maps to `${PR_DIFF}`)                                             |
| `--existing-comments-file` | Path to JSON file with existing comments (maps to `${EXISTING_COMMENTS_JSON}`)                     |

> **Note:** The `--base-sha` argument should receive the **merge base SHA** (from `git merge-base` or GitHub's compare API), not the base branch HEAD. This ensures the diff matches what GitHub shows in the PR view.

**Environment Variables for Overrides:**

| Variable                       | Description                        |
| ------------------------------ | ---------------------------------- |
| `OVERRIDE_REVIEW_PRIORITIES`   | Path to custom review priorities   |
| `OVERRIDE_FILES_TO_SKIP`       | Path to custom files-to-skip       |
| `OVERRIDE_COMMUNICATION_STYLE` | Path to custom communication style |
| `OVERRIDE_PATTERN_RECOGNITION` | Path to custom pattern recognition |

**Exported Functions:**

| Function              | Description                                   |
| --------------------- | --------------------------------------------- |
| `substituteVariables` | Replace `${VAR}` patterns in content          |
| `readSectionFile`     | Read a section file from disk                 |
| `processSection`      | Read and substitute variables in a section    |
| `buildPrompt`         | Main function to assemble the complete prompt |

### post-review.ts

Posts Claude's structured review output to GitHub. Handles:

- Creating/updating review comments
- Submitting formal GitHub reviews (APPROVE/REQUEST_CHANGES/COMMENT)
- Inline comments on specific lines
- Status messages (in-progress, skipped, too-large)

See the script header for detailed usage documentation.

## Testing

### Running Tests

```bash
# Run all tests
npx nx test github-scripts

# Run tests in watch mode
npx nx test github-scripts --configuration=watch

# Run tests with coverage
npx nx test github-scripts --configuration=ci
```

### Test Structure

Tests are co-located with source files using the `.spec.ts` extension:

| File                   | Tests                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| `build-prompt.spec.ts` | Template substitution, section ordering, overrides, conditional sections |

### Test Patterns

- **Mocking**: Uses `memfs` to mock the filesystem
- **Test Organization**: Tests are grouped by function/feature using `describe` blocks
- **Coverage**: 29 tests covering all core functionality

## Project Configuration

### Nx Project (project.json)

The `.github/scripts` directory is configured as an Nx project named `github-scripts` with:

- **test** target - Runs Jest tests
- **lint** target - ESLint checking
- **typecheck** target - TypeScript type checking

### TypeScript Configuration

The `tsconfig.json` disables composite mode and declaration emit since these are internal scripts:

```json
{
  "compilerOptions": {
    "composite": false,
    "declaration": false,
    "declarationMap": false,
    "emitDeclarationOnly": false
  }
}
```

### Module Format

The `package.json` sets `"type": "commonjs"` to ensure compatibility with Jest and the Nx test executor.

### ESLint Configuration

The `eslint.config.mjs` provides a standalone ESLint configuration that:

- Uses `.mjs` extension to enable ES modules (required since `package.json` has `type: commonjs`)
- Configures `tsconfigRootDir` and absolute project path for type-aware linting
- Inherits base rules from `typescript-eslint` and `@nx/eslint-plugin`
- Applies TypeScript-specific rules for consistent imports, exports, and type safety

## Integration with Workflows

### \_claude-code-review.yml

The workflow uses these scripts in three steps:

1. **Setup Build Prompt Script** - Downloads `build-prompt.ts` for external repos or uses local copy
2. **Fetch Prompt Section Files** - Downloads/copies section files to temp directory
3. **Build Review Prompt** - Runs `build-prompt.ts` to assemble the final prompt

The script is downloaded from ai-toolkit when the workflow runs in an external repository, ensuring consumers always get the latest version.

## Development Guidelines

### Adding New Scripts

1. Create the script in `.github/scripts/`
2. Add corresponding `.spec.ts` test file
3. Export testable functions for unit testing
4. Document usage in this file
5. Update the workflow to download the script for external repos

### Writing Tests

- Use `memfs` for filesystem mocking
- Test both success and error cases
- Verify edge cases (empty inputs, missing files, etc.)
- Maintain test isolation with `beforeEach`/`afterEach`

### Script Requirements

- Must work with `npx tsx` (no build step required)
- Should handle both local and remote execution
- Must have clear error messages
- Should log progress to stderr, data to stdout

## Related Documentation

- **Workflow documentation**: `.github/workflows/CLAUDE.md`
- **Prompt section files**: `.github/prompts/CLAUDE.md`
- **Root CLAUDE.md**: Project-wide guidelines
