# CLAUDE.md - @uniswap/notion-publisher

## Package Overview

The `@uniswap/notion-publisher` package is a TypeScript CLI tool that publishes content (primarily release notes) to Notion databases with full markdown support. It's designed to be CI/CD agnostic and work in any environment where Node.js is available.

## Purpose

This package fills a critical gap in the Notion integration ecosystem. Existing GitHub Actions only **update existing pages**, but this tool **creates new database entries** with custom properties (Name, Date, Commit Range, Branch), which is essential for tracking releases and changelogs over time.

## Architecture

### Core Components

#### 1. **cli.ts** (Entry Point)

- Executable CLI script with shebang (`#!/usr/bin/env node`)
- Uses `minimist` for argument parsing (supports both flags and environment variables)
- Environment variables take precedence over CLI flags for security (prevents secrets in process listings)
- Implements comprehensive error handling and colored logging
- Outputs Notion page URL to stdout for capture in CI/CD pipelines

#### 2. **Notion API Integration**

- Uses `@notionhq/client` (official Notion SDK)
- Creates pages in databases (not standalone pages)
- Supports custom database properties

#### 3. **Markdown Conversion**

- Uses `@tryfabric/martian` library for markdown-to-Notion-blocks conversion
- Implements JSON serialization workaround for type incompatibility between martian and Notion SDK

### Key Design Decisions

#### Why @tryfabric/martian?

**Chosen over**:

- `markdown-to-notion` - Less maintained, fewer features
- Custom parser - Too much complexity, reinventing the wheel
- `notion-md-gen` - Doesn't support database creation

**Reasons**:

1. ✅ Well-maintained by Fabric team
2. ✅ Comprehensive markdown support (headers, lists, code blocks, tables, etc.)
3. ✅ Generates proper Notion block structures
4. ✅ Handles edge cases (nested lists, inline code, links)
5. ✅ Active development and bug fixes

#### Why minimist for CLI parsing?

**Chosen over**:

- `commander` - Too heavyweight for simple use case
- `yargs` - Excessive features not needed
- Built-in `process.argv` parsing - No alias support, manual validation

**Reasons**:

1. ✅ Lightweight (~1KB)
2. ✅ Simple API for our use case
3. ✅ Supports aliases (`--api-key` → `apiKey`)
4. ✅ Type definitions available
5. ✅ Well-established library

#### Type Compatibility Workaround

```typescript
// Serialize and deserialize to strip TypeScript type metadata
const notionBlocks = JSON.parse(JSON.stringify(blocks));
```

**Why this is necessary**:

- `@tryfabric/martian` generates block types that are structurally compatible with `@notionhq/client`
- However, TypeScript sees them as incompatible types at compile time
- Runtime behavior is correct—types are structurally identical
- JSON round-trip strips type metadata, satisfying TypeScript
- Alternative would be extensive type assertions, which are less safe

**Trade-offs**:

- ✅ Type-safe at compile time
- ✅ Works correctly at runtime
- ⚠️ Minor performance overhead (negligible for typical use)
- ⚠️ Loses intellisense for block structure (acceptable since blocks are opaque to us)

### Security Patterns

#### Environment Variables First

```typescript
const apiKey = process.env.NOTION_API_KEY || args.apiKey;
const databaseId = process.env.RELEASE_NOTES_NOTION_DATABASE_ID || args.databaseId;
```

**Reasoning**:

- CLI flags appear in `ps aux` output and process listings
- Environment variables are hidden from process listings
- Follows 12-factor app principles
- CI/CD systems naturally use environment variables for secrets

#### Logging to stderr

```typescript
const logInfo = (message: string) => {
  console.error(`${GREEN}[INFO]${NC} ${message}`);
};
```

**Why stderr for logs**:

- stdout is reserved for the Notion page URL (captures in CI/CD)
- stderr is the standard stream for diagnostic messages
- Allows clean piping: `PAGE_URL=$(notion-publisher ...)`

## Dependencies

### Production Dependencies

| Package              | Version | Purpose                             |
| -------------------- | ------- | ----------------------------------- |
| `@notionhq/client`   | ^2.2.15 | Official Notion API SDK             |
| `@tryfabric/martian` | ^1.2.4  | Markdown to Notion blocks converter |
| `minimist`           | ^1.2.8  | CLI argument parser                 |
| `tslib`              | ^2.3.0  | TypeScript runtime helpers          |

### Development Dependencies

| Package           | Version | Purpose                       |
| ----------------- | ------- | ----------------------------- |
| `@types/minimist` | ^1.2.5  | Type definitions for minimist |

## Database Schema Requirements

The target Notion database MUST have these properties:

| Property Name    | Type      | Required | Description                                   |
| ---------------- | --------- | -------- | --------------------------------------------- |
| **Name**         | Title     | Yes      | Page title (automatically created)            |
| **Date**         | Date      | Yes      | Timestamp of page creation                    |
| **Commit Range** | Rich Text | No       | Git reference range (e.g., "v1.0.0 → v1.1.0") |
| **Branch**       | Rich Text | No       | Git branch name                               |

**Note**: The property names are hardcoded in cli.ts:90-116. If users need different property names, they must create database views or modify the code.

## Usage Patterns

### In GitHub Actions

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v6
  with:
    node-version: '22'

- name: Publish to Notion
  run: npx @uniswap/notion-publisher \
    --title "${{ github.event.release.name }}" \
    --content "${{ github.event.release.body }}"
  env:
    NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
    RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
```

### Locally

```bash
export NOTION_API_KEY="secret_abc123"
export RELEASE_NOTES_NOTION_DATABASE_ID="32-char-hex-id"

notion-publisher \
  --title "Release v1.2.0" \
  --content "$(cat CHANGELOG.md)" \
  --from-ref "v1.1.0" \
  --to-ref "v1.2.0" \
  --branch "main"
```

## Testing Strategies

### Manual Testing

```bash
# Build the package
npx nx build @uniswap/notion-publisher

# Test with tsx (no build required)
npx tsx packages/notion-publisher/src/cli.ts \
  --title "Test Release" \
  --content "# Test\nThis is a test"

# Test built version
node dist/packages/notion-publisher/cli.js \
  --title "Test Release" \
  --content "# Test\nThis is a test"
```

### Integration Testing

1. Create a test Notion database
2. Get a test integration token
3. Run the CLI with test data
4. Verify the page was created with correct properties
5. Check markdown rendering in Notion

### Unit Testing (Future Enhancement)

Potential test structure:

```typescript
describe('notion-publisher', () => {
  describe('argument parsing', () => {
    it('should prefer environment variables over flags');
    it('should validate required arguments');
    it('should support aliases');
  });

  describe('notion API', () => {
    it('should create page with correct properties');
    it('should handle API errors gracefully');
    it('should convert markdown to blocks');
  });
});
```

**Mock Strategy**:

- Mock `@notionhq/client` for API tests
- Mock `@tryfabric/martian` for markdown conversion tests
- Use real implementations for integration tests

## Known Limitations

### 1. Fixed Database Schema

The tool expects specific property names:

- "Name" (Title)
- "Date" (Date)
- "Commit Range" (Rich Text)
- "Branch" (Rich Text)

**Workaround**: Create a database view in Notion to map/rename properties.

**Future Enhancement**: Make property names configurable via CLI flags or config file.

### 2. No Page Update Support

The tool only creates new pages, doesn't update existing ones.

**Rationale**: Release notes are typically append-only (each release is a new entry).

**Future Enhancement**: Add `--page-id` flag to update existing pages.

### 3. Rate Limiting

Notion API has rate limits (3 requests per second).

**Current Behavior**: No built-in retry logic or rate limiting.

**Workaround**: Add delays between calls in CI/CD scripts.

**Future Enhancement**: Implement exponential backoff retry logic.

### 4. Large Content Handling

Notion has block limits per page (~2000 blocks).

**Current Behavior**: API will error if content exceeds limits.

**Workaround**: Split large changelogs into multiple pages.

**Future Enhancement**: Detect content size and automatically split/paginate.

## Performance Considerations

### Markdown Conversion

The `markdownToBlocks()` call is synchronous and CPU-bound. For very large markdown files (100KB+), this could be slow.

**Optimization**: Currently not needed as typical release notes are small (<50KB).

**Future**: Consider streaming conversion for large files.

### JSON Serialization

The JSON round-trip (`JSON.parse(JSON.stringify(blocks))`) is fast but has memory overhead.

**Current Impact**: Negligible for typical payloads.

**Alternative**: Use structured cloning (requires Node.js 17+).

## Error Handling

### Validation Errors

```typescript
if (!apiKey) {
  logError('NOTION_API_KEY is required');
  process.exit(1);
}
```

**Exit Codes**:

- `0` - Success
- `1` - Validation error or API failure

### API Errors

```typescript
catch (error) {
  logError('Failed to create Notion page');
  if (error instanceof Error) {
    logError(error.message);
    if ('body' in error) {
      logError(`Details: ${JSON.stringify(error.body, null, 2)}`);
    }
  }
  process.exit(1);
}
```

**Common API Errors**:

- `404` - Database not found or no access
- `400` - Invalid request (missing/invalid properties)
- `401` - Invalid API key
- `429` - Rate limit exceeded

## Future Enhancements

### Short-term (v0.2.0)

1. **Add unit tests** - Increase confidence in refactoring
2. **Configurable property names** - Support custom database schemas
3. **Better error messages** - Include troubleshooting hints
4. **Support update mode** - Allow updating existing pages

### Medium-term (v0.3.0)

1. **Rate limiting** - Automatic retry with exponential backoff
2. **Bulk publishing** - Create multiple pages from array of entries
3. **Template support** - Use Notion templates for page creation
4. **Rich metadata** - Support more property types (Select, Multi-select, People, etc.)

### Long-term (v1.0.0)

1. **Config file support** - `.notionpublisher.json` for project defaults
2. **Interactive mode** - Prompt for missing values
3. **Dry-run mode** - Preview what would be created
4. **Content validation** - Check markdown compatibility before API call
5. **Webhooks** - Trigger actions after page creation

## Maintenance Guidelines

### Dependency Updates

- **@notionhq/client**: Check quarterly for API updates
- **@tryfabric/martian**: Monitor for bug fixes and new markdown features
- **minimist**: Low-risk, rarely updated
- **TypeScript**: Update with workspace (controlled by root package.json)

### Breaking Changes to Avoid

1. Changing CLI argument names (users have scripts)
2. Changing environment variable names (breaks CI/CD)
3. Changing database property names (breaks existing databases)
4. Changing stdout output format (breaks capture logic)

### Deprecation Strategy

If changes are needed:

1. Add new option with new name
2. Mark old option as deprecated (add warning)
3. Support both for 2-3 versions
4. Remove old option in next major version

## Troubleshooting

### Build Failures

```bash
# Clean build artifacts
rm -rf dist/packages/notion-publisher

# Rebuild
npx nx build @uniswap/notion-publisher
```

### TypeScript Errors

The type incompatibility between martian and Notion client is intentional. Don't remove the JSON serialization workaround—it's required for type safety.

### CLI Not Executable

After building, the dist/cli.js should be executable. If not:

```bash
chmod +x dist/packages/notion-publisher/cli.js
```

The shebang (`#!/usr/bin/env node`) in cli.ts is preserved during build.

## Related Documentation

- [Notion API Docs](https://developers.notion.com/)
- [@notionhq/client SDK](https://github.com/makenotion/notion-sdk-js)
- [@tryfabric/martian](https://github.com/tryfabric/martian)
- [Package README](./README.md) - User-facing documentation
