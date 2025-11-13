# @uniswap/notion-publisher

A CLI tool to publish release notes and other content to Notion databases with full markdown support. This tool fills a gap in the ecosystem by creating new database entries with custom properties—something existing GitHub Actions don't support.

## Features

- ✅ **Creates new pages in Notion databases** (not just updates)
- ✅ **Markdown to Notion blocks conversion** using @tryfabric/martian
- ✅ **Custom database properties** (Name, Date, Commit Range, Branch)
- ✅ **Git integration** (track commit ranges and branches)
- ✅ **CI/CD agnostic** (works with GitHub Actions, GitLab CI, CircleCI, Jenkins, etc.)
- ✅ **Type-safe** TypeScript implementation
- ✅ **Comprehensive error handling** with detailed logs

## Installation

### Global Installation

```bash
npm install -g @uniswap/notion-publisher
```

### Using npx (Recommended)

No installation required:

```bash
npx @uniswap/notion-publisher --title "My Release" --content "..."
```

### Local Installation

```bash
npm install --save-dev @uniswap/notion-publisher
```

## Prerequisites

### 1. Create a Notion Integration

1. Go to <https://www.notion.so/my-integrations>
2. Click "New integration"
3. Give it a name (e.g., "Release Notes Publisher")
4. Select the workspace
5. Copy the "Internal Integration Token" (starts with `secret_`)

### 2. Create a Notion Database

1. Create a new page in Notion
2. Add a database (inline or full-page)
3. Add these properties:
   - **Name** (Title) - Required
   - **Date** (Date) - Required
   - **Commit Range** (Text) - Optional
   - **Branch** (Text) - Optional
4. Share the database with your integration:
   - Click "..." in the top right
   - Click "Add connections"
   - Select your integration

### 3. Get the Database ID

From the database URL: `https://notion.so/workspace/DATABASE_ID?v=VIEW_ID`

The `DATABASE_ID` is the 32-character hex string.

## Usage

### Basic Usage

```bash
notion-publisher \
  --title "Release v1.2.0" \
  --content "# What's New\n\n- Feature A\n- Feature B"
```

Required environment variables:

- `NOTION_API_KEY` - Your Notion integration token
- `RELEASE_NOTES_NOTION_DATABASE_ID` - Target database ID

### With All Options

```bash
notion-publisher \
  --title "Release v1.2.0" \
  --content "$(cat CHANGELOG.md)" \
  --from-ref "v1.1.0" \
  --to-ref "v1.2.0" \
  --branch "main"
```

### Using CLI Flags for Secrets

```bash
notion-publisher \
  --api-key "secret_abc123" \
  --database-id "32-char-hex-id" \
  --title "Release v1.2.0" \
  --content "# Release Notes"
```

**⚠️ Security Warning**: Using `--api-key` flag exposes secrets in process listings. Always prefer environment variables in production.

## GitHub Actions Integration

### Basic Example

```yaml
name: Publish Release Notes

on:
  release:
    types: [published]

jobs:
  publish-to-notion:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
          scope: '@uniswap'

      - name: Publish to Notion
        run: |
          npx @uniswap/notion-publisher \
            --title "${{ github.event.release.name }}" \
            --content "${{ github.event.release.body }}" \
            --from-ref "${{ github.event.release.tag_name }}" \
            --branch "${{ github.ref_name }}"
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
```

### With Changelog File

```yaml
- name: Read Changelog
  id: changelog
  run: |
    echo "content<<EOF" >> $GITHUB_OUTPUT
    cat CHANGELOG.md >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

- name: Publish to Notion
  run: |
    npx @uniswap/notion-publisher \
      --title "Release ${{ github.event.release.tag_name }}" \
      --content "${{ steps.changelog.outputs.content }}" \
      --from-ref "${{ github.event.release.target_commitish }}" \
      --to-ref "${{ github.event.release.tag_name }}"
  env:
    NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
    RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
```

## GitLab CI Integration

```yaml
publish_to_notion:
  stage: deploy
  image: node:22
  script:
    - npx @uniswap/notion-publisher
      --title "Release $CI_COMMIT_TAG"
      --content "$(cat CHANGELOG.md)"
      --from-ref "$CI_COMMIT_BEFORE_SHA"
      --to-ref "$CI_COMMIT_SHA"
      --branch "$CI_COMMIT_BRANCH"
  variables:
    NOTION_API_KEY: $NOTION_API_KEY
    RELEASE_NOTES_NOTION_DATABASE_ID: $NOTION_DATABASE_ID
  only:
    - tags
```

## CircleCI Integration

```yaml
version: 2.1
jobs:
  publish-notion:
    docker:
      - image: cimg/node:22.0
    steps:
      - checkout
      - run:
          name: Publish to Notion
          command: |
            npx @uniswap/notion-publisher \
              --title "Release ${CIRCLE_TAG}" \
              --content "$(cat CHANGELOG.md)" \
              --from-ref "${CIRCLE_TAG}" \
              --branch "${CIRCLE_BRANCH}"
          environment:
            NOTION_API_KEY: ${NOTION_API_KEY}
            RELEASE_NOTES_NOTION_DATABASE_ID: ${NOTION_DATABASE_ID}

workflows:
  release:
    jobs:
      - publish-notion:
          filters:
            tags:
              only: /^v.*/
```

## Jenkins Integration

```groovy
pipeline {
    agent any
    environment {
        NOTION_API_KEY = credentials('notion-api-key')
        RELEASE_NOTES_NOTION_DATABASE_ID = credentials('notion-database-id')
    }
    stages {
        stage('Publish to Notion') {
            steps {
                sh '''
                    npx @uniswap/notion-publisher \
                      --title "Release ${GIT_TAG_NAME}" \
                      --content "$(cat CHANGELOG.md)" \
                      --from-ref "${GIT_PREVIOUS_COMMIT}" \
                      --to-ref "${GIT_COMMIT}" \
                      --branch "${GIT_BRANCH}"
                '''
            }
        }
    }
}
```

## CLI Arguments

| Argument        | Environment Variable               | Required | Description                                         |
| --------------- | ---------------------------------- | -------- | --------------------------------------------------- |
| `--api-key`     | `NOTION_API_KEY`                   | Yes      | Notion integration token                            |
| `--database-id` | `RELEASE_NOTES_NOTION_DATABASE_ID` | Yes      | Target Notion database ID (32-char hex)             |
| `--title`       | -                                  | Yes      | Page title for the release notes                    |
| `--content`     | -                                  | Yes      | Page content in markdown format                     |
| `--from-ref`    | -                                  | No       | Starting git reference (e.g., previous version tag) |
| `--to-ref`      | -                                  | No       | Ending git reference (e.g., current version tag)    |
| `--branch`      | -                                  | No       | Branch name where the release was made              |

**Note**: Environment variables take precedence over CLI flags for API key and database ID.

## Markdown Support

The tool uses [@tryfabric/martian](https://github.com/tryfabric/martian) to convert markdown to Notion blocks. Supported markdown features include:

- Headers (H1, H2, H3)
- **Bold**, _italic_, ~~strikethrough~~ text
- Lists (ordered and unordered)
- Code blocks with syntax highlighting
- Links
- Images (as external URLs)
- Blockquotes
- Tables
- And more!

### Example Markdown

```markdown
# Release v1.2.0

## 🚀 New Features

- Added dark mode support
- Improved performance by 50%
- New API endpoints for user management

## 🐛 Bug Fixes

- Fixed memory leak in data processing
- Resolved authentication issues

## 📝 Documentation

Updated the [Getting Started Guide](https://example.com/docs)

## Contributors

Thanks to @user1 and @user2 for their contributions!
```

## Troubleshooting

### Error: "NOTION_API_KEY is required"

**Cause**: Missing API key

**Solution**: Set the `NOTION_API_KEY` environment variable or use `--api-key` flag

```bash
export NOTION_API_KEY="secret_abc123"
notion-publisher --title "..." --content "..."
```

### Error: "RELEASE_NOTES_NOTION_DATABASE_ID is required"

**Cause**: Missing database ID

**Solution**: Set the environment variable or use `--database-id` flag

```bash
export RELEASE_NOTES_NOTION_DATABASE_ID="32-char-hex-id"
```

### Error: "Could not find database"

**Cause**: Database doesn't exist or integration doesn't have access

**Solution**:

1. Verify the database ID is correct
2. Share the database with your integration:
   - Open the database in Notion
   - Click "..." → "Add connections"
   - Select your integration

### Error: "Validation failed"

**Cause**: Database schema doesn't match expected properties

**Solution**: Ensure your database has these properties:

- **Name** (Title type)
- **Date** (Date type)
- **Commit Range** (Text type) - if using `--from-ref` or `--to-ref`
- **Branch** (Text type) - if using `--branch`

### Rate Limiting

Notion API has rate limits (3 requests per second). If you're publishing multiple pages:

```bash
# Add delays between calls
notion-publisher --title "Release 1" --content "..." && \
  sleep 1 && \
  notion-publisher --title "Release 2" --content "..."
```

## Output

The tool outputs the created Notion page URL to stdout:

```bash
PAGE_URL=$(notion-publisher --title "..." --content "...")
echo "Published to: $PAGE_URL"
```

In GitHub Actions, capture it as an output:

```yaml
- name: Publish to Notion
  id: publish
  run: |
    PAGE_URL=$(npx @uniswap/notion-publisher \
      --title "..." \
      --content "...")
    echo "page_url=$PAGE_URL" >> $GITHUB_OUTPUT

- name: Comment on PR
  run: |
    echo "Published to Notion: ${{ steps.publish.outputs.page_url }}"
```

## Development

### Build

```bash
npx nx build @uniswap/notion-publisher
```

### Test Locally

```bash
# Build the package
npx nx build @uniswap/notion-publisher

# Test with tsx (no build required)
npx tsx packages/notion-publisher/src/cli.ts \
  --title "Test" \
  --content "# Test content"

# Test built version
node dist/packages/notion-publisher/cli.js \
  --title "Test" \
  --content "# Test content"
```

### Publishing

This package is automatically published via the repository's CI/CD workflow using Nx release.

## Why This Tool?

Existing GitHub Actions for Notion have limitations:

| Feature                | @uniswap/notion-publisher | tryfabric/markdown-to-notion | push-markdown-to-notion |
| ---------------------- | ------------------------- | ---------------------------- | ----------------------- |
| **Create new pages**   | ✅ Yes                    | ❌ No (updates only)         | ❌ No (updates only)    |
| **Write to databases** | ✅ Yes                    | ❌ No                        | ❌ No                   |
| **Custom properties**  | ✅ Yes                    | ❌ No                        | ❌ No                   |
| **Maintenance**        | 🆕 Active (2024)          | ⚠️ Stale (2022)              | ⚠️ Low activity         |
| **CI agnostic**        | ✅ Yes (CLI tool)         | ❌ GitHub only               | ❌ GitHub only          |

This tool was created to fill the gap: **creating new Notion database entries with structured metadata**, which is essential for release notes and changelog tracking.

## License

See repository LICENSE file.

## Support

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/Uniswap/ai-toolkit).
