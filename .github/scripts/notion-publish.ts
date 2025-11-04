#!/usr/bin/env node
import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import minimist from 'minimist';

// Parse CLI arguments with flags using minimist
const args = minimist(process.argv.slice(2), {
  string: [
    'api-key',
    'database-id',
    'title',
    'content',
    'from-ref',
    'to-ref',
    'branch',
  ],
  alias: {
    'api-key': 'apiKey',
    'database-id': 'databaseId',
    'from-ref': 'fromRef',
    'to-ref': 'toRef',
  },
});

// Read from environment variables first, fall back to CLI arguments
// This prevents secrets from appearing in process listings
const apiKey = process.env.NOTION_API_KEY || args.apiKey;
const databaseId =
  process.env.RELEASE_NOTES_NOTION_DATABASE_ID || args.databaseId;
const { title, content, fromRef, toRef, branch } = args;

// Color codes for output
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const NC = '\x1b[0m'; // No Color

// Logging functions
const logInfo = (message: string) => {
  console.error(`${GREEN}[INFO]${NC} ${message}`);
};

const logError = (message: string) => {
  console.error(`${RED}[ERROR]${NC} ${message}`);
};

// Validate required arguments
if (!apiKey) {
  logError(
    'NOTION_API_KEY is required (via NOTION_API_KEY env var or --api-key flag)'
  );
  process.exit(1);
}

if (!databaseId) {
  logError(
    'RELEASE_NOTES_NOTION_DATABASE_ID is required (via RELEASE_NOTES_NOTION_DATABASE_ID env var or --database-id flag)'
  );
  process.exit(1);
}

if (!title) {
  logError('TITLE is required');
  process.exit(1);
}

if (!content) {
  logError('CONTENT is required');
  process.exit(1);
}

logInfo(`Preparing to publish to Notion database: ${databaseId}`);
logInfo(`Page title: ${title}`);

// Initialize Notion client
const notion = new Client({ auth: apiKey });

async function publishToNotion() {
  try {
    // Convert markdown content to Notion blocks using Martian
    logInfo('Converting markdown to Notion blocks...');
    const blocks = markdownToBlocks(content);

    // Serialize and deserialize to strip TypeScript type metadata
    // This is necessary because @tryfabric/martian and @notionhq/client have
    // incompatible type definitions despite being structurally compatible at runtime
    const notionBlocks = JSON.parse(JSON.stringify(blocks));

    // Build properties object for the Notion page
    const properties: any = {
      Name: {
        title: [{ text: { content: title } }],
      },
      Date: {
        date: { start: new Date().toISOString() },
      },
    };

    // Add optional properties if provided
    if (fromRef && toRef) {
      properties['Commit Range'] = {
        rich_text: [{ text: { content: `${fromRef} → ${toRef}` } }],
      };
    } else if (fromRef) {
      properties['Commit Range'] = {
        rich_text: [{ text: { content: `From: ${fromRef}` } }],
      };
    } else if (toRef) {
      properties['Commit Range'] = {
        rich_text: [{ text: { content: `To: ${toRef}` } }],
      };
    }

    if (branch) {
      properties.Branch = {
        rich_text: [{ text: { content: branch } }],
      };
    }

    // Create Notion page
    logInfo('Creating Notion page...');
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      children: notionBlocks,
    });

    logInfo('✅ Successfully created Notion page');

    // Check if response has url property (full page response vs partial)
    const pageUrl = 'url' in response ? response.url : 'https://notion.so';
    logInfo(`Page URL: ${pageUrl}`);

    // Output the page URL to stdout (for GitHub Actions to capture)
    console.log(pageUrl);
    process.exit(0);
  } catch (error) {
    logError('Failed to create Notion page');

    if (error instanceof Error) {
      logError(error.message);

      // Log additional details if available
      if ('body' in error) {
        logError(`Details: ${JSON.stringify(error.body, null, 2)}`);
      }
    } else {
      logError(String(error));
    }

    process.exit(1);
  }
}

// Run the main function
publishToNotion();
