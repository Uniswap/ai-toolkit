# CLAUDE.md - @uniswap/ai-toolkit-linear-task-utils

## Package Overview

CLI tool for querying Linear issues to enable autonomous Claude Code task processing. Designed to work with GitHub Actions matrix strategies for parallel task execution.

## Purpose

This package enables the autonomous Claude Code workflow by:

1. **Querying Issues** - Fetches Linear issues with specific labels and statuses
2. **Managing Labels** - Auto-creates the "claude" label if it doesn't exist
3. **Updating Issues** - Updates issue status and attaches PR links after task completion

## Architecture

### Core Components

| File              | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `cli.ts`          | CLI entry point with command routing       |
| `query-issues.ts` | Linear SDK integration for issue queries   |
| `ensure-label.ts` | Label existence check and creation         |
| `update-issue.ts` | Issue status updates and PR attachment     |
| `types.ts`        | Shared TypeScript interfaces and constants |

### Design Decisions

#### Why @linear/sdk?

- Official Linear SDK with TypeScript types
- Handles pagination automatically
- Built-in retry logic for rate limits
- Simpler than raw GraphQL

#### Why CLI + JSON Output?

- Works seamlessly with GitHub Actions `fromJson()`
- Logs to stderr, data to stdout (clean piping)
- Environment variables for secrets (security)

## Key Patterns

### Priority Sorting

Linear uses numeric priorities where:

- 1 = Urgent
- 2 = High
- 3 = Normal
- 4 = Low
- 0 = No Priority

Sort order places Urgent first, No Priority last.

### Branch Name Generation

Format: `claude/{identifier}-{slug}`

- Identifier is lowercased (e.g., "dai-123")
- Title is slugified (lowercase, hyphens, 40 char max)
- Example: `claude/dai-123-fix-auth-bug`

### Error Handling

- All errors exit with code 1
- Errors logged to stderr with color
- JSON output only on success

## Build Configuration

### Output Format

- **Format**: CommonJS (CJS) - required for @linear/sdk compatibility
- **Platform**: Node.js 18+
- **Output Files**:
  - `dist/cli.cjs` - CLI executable with shebang
  - `dist/index.cjs` - Library exports

### Shebang Handling

The shebang (`#!/usr/bin/env node`) is added by esbuild via the `banner` option in `project.json`, NOT in the source file. This prevents duplicate shebangs in the bundled output.

## Development

### Build

```bash
npx nx build @uniswap/ai-toolkit-linear-task-utils
npx nx postbuild @uniswap/ai-toolkit-linear-task-utils  # Makes CLI executable
```

### Test Locally

```bash
# Query issues (requires LINEAR_API_KEY)
npx tsx packages/linear-task-utils/src/cli.ts query --team "Developer AI" --max 1

# Ensure label exists
npx tsx packages/linear-task-utils/src/cli.ts ensure-label --team "Developer AI"

# Test built CLI
./packages/linear-task-utils/dist/cli.cjs --help
```

### Type Check

```bash
npx nx typecheck @uniswap/ai-toolkit-linear-task-utils
```

### Run Unit Tests

```bash
# Run all tests
npx nx test @uniswap/ai-toolkit-linear-task-utils

# Run tests in watch mode
npx nx test @uniswap/ai-toolkit-linear-task-utils --configuration=watch

# Run tests with coverage
npx nx test @uniswap/ai-toolkit-linear-task-utils --configuration=ci
```

## Testing

### Test Files

| File                   | Tests                                              |
| ---------------------- | -------------------------------------------------- |
| `types.spec.ts`        | Constants and default values                       |
| `query-issues.spec.ts` | Query config parsing, client creation, issue query |
| `ensure-label.spec.ts` | Label config parsing, label creation/lookup        |
| `update-issue.spec.ts` | Update config parsing, status/attachment updates   |

### Test Patterns

- **Mocking**: Linear SDK is mocked using Jest mocks
- **Module Resolution**: Uses `moduleNameMapper` to handle ESM `.js` imports
- **Coverage**: CLI entry point excluded from coverage (integration tested)

## Dependencies

| Package       | Purpose                    |
| ------------- | -------------------------- |
| `@linear/sdk` | Linear API client          |
| `minimist`    | CLI argument parsing       |
| `tslib`       | TypeScript runtime helpers |

## Environment Variables

| Variable         | Required | Description                       |
| ---------------- | -------- | --------------------------------- |
| `LINEAR_API_KEY` | Yes      | Linear API key for authentication |

## Output Formats

### Query Command

```json
{
  "include": [{ "issue_id": "...", "issue_identifier": "DAI-123", ... }],
  "count": 1
}
```

### Ensure-Label Command

```json
{
  "labelId": "abc123",
  "created": false
}
```

### Update-Issue Command

```json
{
  "success": true,
  "statusUpdated": true,
  "attachmentAdded": true
}
```

## Related Files

- `.github/workflows/claude-auto-tasks.yml` - Consumer workflow using this package
- `.github/workflows/_claude-task-worker.yml` - Reusable worker that calls update-issue
