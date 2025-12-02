import minimist from 'minimist';
import { createLinearClient, queryIssues, parseQueryConfig } from './query-issues.js';
import { ensureLabel, parseEnsureLabelConfig } from './ensure-label.js';
import { updateIssue, parseUpdateIssueConfig } from './update-issue.js';
import { VERSION } from './version.js';

// Color codes for output
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const NC = '\x1b[0m'; // No Color

// Logging functions (output to stderr to keep stdout clean for JSON)
const logInfo = (message: string) => {
  console.error(`${GREEN}[INFO]${NC} ${message}`);
};

const logError = (message: string) => {
  console.error(`${RED}[ERROR]${NC} ${message}`);
};

// Parse CLI arguments
const args = minimist(process.argv.slice(2), {
  string: [
    'api-key',
    'team',
    'label',
    'statuses',
    'max',
    'issue-id',
    'status',
    'pr-url',
    'comment',
    'color',
  ],
  boolean: ['help', 'version'],
  alias: {
    'api-key': 'apiKey',
    'issue-id': 'issueId',
    'pr-url': 'prUrl',
    h: 'help',
    v: 'version',
  },
});

const command = args._[0];

// Help text
const HELP_TEXT = `
@uniswap/ai-toolkit-linear-task-utils - Query Linear issues for Claude Code automation

COMMANDS:
  query           Query Linear issues matching criteria (outputs JSON matrix)
  ensure-label    Ensure a label exists in the team (creates if missing)
  update-issue    Update an issue status and attach PR link

GLOBAL OPTIONS:
  --api-key       Linear API key (or use LINEAR_API_KEY env var)
  --help, -h      Show this help message
  --version, -v   Show version

QUERY OPTIONS:
  --team          Linear team name (default: "Developer AI")
  --label         Label to filter by (default: "claude")
  --statuses      Comma-separated status names (default: "Backlog,Todo")
  --max           Maximum issues to return (default: 3)

ENSURE-LABEL OPTIONS:
  --team          Linear team name (default: "Developer AI")
  --label         Label name to ensure exists (default: "claude")
  --color         Label color in hex (default: "#6366f1")

UPDATE-ISSUE OPTIONS:
  --issue-id      Linear issue ID (required)
  --status        New status name (required, e.g., "In Review")
  --pr-url        PR URL to attach to the issue
  --comment       Optional comment to add

EXAMPLES:
  # Query issues for Claude to work on
  npx @uniswap/ai-toolkit-linear-task-utils@latest query --team "Developer AI" --label "claude" --max 3

  # Ensure the claude label exists
  npx @uniswap/ai-toolkit-linear-task-utils@latest ensure-label --team "Developer AI" --label "claude"

  # Update issue after creating PR
  npx @uniswap/ai-toolkit-linear-task-utils@latest update-issue \\
    --issue-id "abc123" \\
    --status "In Review" \\
    --pr-url "https://github.com/org/repo/pull/123"

ENVIRONMENT VARIABLES:
  LINEAR_API_KEY  Linear API key (preferred over --api-key flag)
`;

async function main() {
  try {
    if (args.version) {
      console.log(VERSION);
      process.exit(0);
    }

    if (args.help || !command) {
      console.log(HELP_TEXT);
      process.exit(args.help ? 0 : 1);
    }

    // Create Linear client
    const client = createLinearClient(args.apiKey);

    switch (command) {
      case 'query': {
        logInfo('Querying Linear issues...');
        const config = parseQueryConfig({
          team: args.team as string | undefined,
          label: args.label as string | undefined,
          statuses: args.statuses as string | undefined,
          max: args.max as string | undefined,
        });
        logInfo(`Team: ${config.team}`);
        logInfo(`Label: ${config.label}`);
        logInfo(`Statuses: ${config.statuses.join(', ')}`);
        logInfo(`Max issues: ${config.max}`);

        const result = await queryIssues(client, config);

        logInfo(`Found ${result.count} issue(s)`);
        if (result.count > 0) {
          result.include.forEach((issue) => {
            logInfo(
              `  - ${issue.issue_identifier}: ${issue.issue_title} [${issue.priority_label}]`
            );
          });
        }

        // Output JSON to stdout for GitHub Actions to capture
        console.log(JSON.stringify(result));
        break;
      }

      case 'ensure-label': {
        logInfo('Ensuring label exists...');
        const config = parseEnsureLabelConfig({
          team: args.team as string | undefined,
          label: args.label as string | undefined,
          color: args.color as string | undefined,
        });
        logInfo(`Team: ${config.team}`);
        logInfo(`Label: ${config.label}`);

        const result = await ensureLabel(client, config);

        if (result.created) {
          logInfo(`Created new label "${config.label}" with ID: ${result.labelId}`);
        } else {
          logInfo(`Label "${config.label}" already exists with ID: ${result.labelId}`);
        }

        // Output result to stdout
        console.log(JSON.stringify(result));
        break;
      }

      case 'update-issue': {
        logInfo('Updating Linear issue...');
        const config = parseUpdateIssueConfig({
          issueId: args.issueId as string | undefined,
          'issue-id': args['issue-id'] as string | undefined,
          status: args.status as string | undefined,
          prUrl: args.prUrl as string | undefined,
          'pr-url': args['pr-url'] as string | undefined,
          comment: args.comment as string | undefined,
        });
        logInfo(`Issue ID: ${config.issueId}`);
        logInfo(`New status: ${config.status}`);
        if (config.prUrl) {
          logInfo(`PR URL: ${config.prUrl}`);
        }

        const result = await updateIssue(client, config);

        if (result.statusUpdated) {
          logInfo(`Status updated to "${config.status}"`);
        }
        if (result.attachmentAdded) {
          logInfo('PR attachment added');
        }

        // Output result to stdout
        console.log(JSON.stringify(result));
        break;
      }

      default:
        logError(`Unknown command: ${command}`);
        console.log(HELP_TEXT);
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    logError('Command failed');

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
main();
