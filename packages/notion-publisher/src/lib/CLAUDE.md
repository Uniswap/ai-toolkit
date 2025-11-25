# Notion Publisher Library

## Purpose

Core implementation of the Notion Publisher tool for publishing content to Notion workspaces via the Notion API. Provides programmatic access to Notion database and page creation.

## Files

- `notion-publisher.ts` - Main Notion API integration and publishing logic

## notion-publisher.ts

### Purpose

Implements Notion API client and publishing functionality for creating and updating Notion database entries and pages.

### Key Functionality

#### Publishing to Notion

The library provides functionality to:

1. **Authenticate with Notion API**

   - Use API keys for authentication
   - Handle OAuth token management
   - Validate credentials

2. **Create Database Entries**

   - Add entries to Notion databases
   - Set properties (title, status, dates, etc.)
   - Handle rich text content
   - Manage database schema

3. **Create/Update Pages**

   - Create new Notion pages
   - Update existing pages
   - Add blocks (paragraphs, headings, code, etc.)
   - Handle nested content structures

4. **Content Formatting**
   - Convert markdown to Notion blocks
   - Format rich text (bold, italic, code)
   - Handle links and mentions
   - Preserve content structure

### Expected API

```typescript
// Initialize publisher
const publisher = new NotionPublisher({
  auth: process.env.NOTION_API_KEY,
});

// Publish to database
await publisher.publishToDatabase({
  databaseId: 'database-id',
  properties: {
    Name: { title: [{ text: { content: 'Title' } }] },
    Status: { select: { name: 'Published' } },
  },
  content: markdownContent, // Optional page content
});

// Create page
await publisher.createPage({
  parent: { database_id: 'database-id' },
  properties: {...},
  children: blocks, // Notion blocks
});
```

### Integration Points

#### Environment Variables

```bash
NOTION_API_KEY=secret_xxx
RELEASE_NOTES_NOTION_DATABASE_ID=xxx
```

#### GitHub Actions

Used in workflows for:

- Publishing release notes
- Creating changelog entries
- Documenting releases

Example usage in workflow:

```yaml
- name: Publish to Notion
  run: |
    npx @uniswap/notion-publisher \
      --title "${{ inputs.title }}" \
      --content "${{ inputs.content }}"
  env:
    NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
    RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
```

### Error Handling

The library handles:

- **API errors**: Rate limits, authentication failures
- **Validation errors**: Invalid properties, malformed content
- **Network errors**: Timeouts, connection issues
- **Content errors**: Unsupported block types, formatting issues

### Content Transformation

#### Markdown to Notion Blocks

The library converts markdown elements to Notion blocks:

````markdown
# Heading → heading_1 block

## Subheading → heading_2 block

**bold** → rich text with bold annotation
`code` → rich text with code annotation

```python → code block
[link](url) → rich text with link annotation
- List item → bulleted_list_item block
```
````

#### Rich Text Formatting

Applies formatting via annotations:

- **bold**: `{ bold: true }`
- **italic**: `{ italic: true }`
- **code**: `{ code: true }`
- **link**: `{ link: { url: '...' } }`

## Development

### Testing

Tests should cover:

1. **Authentication**:

   - Valid API keys
   - Invalid/expired keys
   - Missing credentials

2. **Publishing**:

   - Create database entries
   - Update existing entries
   - Error handling

3. **Content Formatting**:
   - Markdown parsing
   - Block generation
   - Rich text formatting

### Testing Patterns

```typescript
describe('NotionPublisher', () => {
  describe('publishToDatabase', () => {
    it('should create database entry', async () => {});
    it('should handle API errors gracefully', async () => {});
    it('should format content correctly', async () => {});
  });

  describe('content transformation', () => {
    it('should convert markdown to blocks', () => {});
    it('should preserve formatting', () => {});
  });
});
```

### Adding Features

1. Implement in `notion-publisher.ts`
2. Add TypeScript types
3. Document in JSDoc comments
4. Add tests
5. Update this documentation
6. Update parent package CLAUDE.md

## Related Documentation

- Parent package: `../../CLAUDE.md`
- Notion API docs: <https://developers.notion.com/>
- Package CLI: `../cli.ts` (if exists)

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
