import { listCommand } from './commands/list';
import { enableCommand } from './commands/enable';
import { disableCommand } from './commands/disable';
import { statusCommand } from './commands/status';
import { interactiveCommand } from './commands/interactive';
import { displayError, colorize } from './utils/display';

/**
 * Display help message
 */
function displayHelp(): void {
  console.log(
    colorize('\nMCP Config - Manage MCP servers for Claude Code', 'bold')
  );
  console.log(colorize('\nUsage:', 'bold'));
  console.log('  claude-mcp-helper [command] [options]');
  console.log(colorize('\nCommands:', 'bold'));
  console.log('  list                       List all MCP servers with status');
  console.log('  enable <server...>         Enable one or more servers');
  console.log('  disable <server...>        Disable one or more servers');
  console.log('  status                     Show detailed status');
  console.log('  interactive                Interactive multi-select mode');
  console.log('  help                       Show this help message');
  console.log(colorize('\nExamples:', 'bold'));
  console.log(
    '  claude-mcp-helper                 # Interactive mode (default)'
  );
  console.log('  claude-mcp-helper list            # List all servers');
  console.log('  claude-mcp-helper enable github   # Enable the github server');
  console.log(
    '  claude-mcp-helper disable supabase nx   # Disable multiple servers'
  );
  console.log(colorize('\nConfiguration:', 'bold'));
  console.log('  Global:  ~/.claude.json');
  console.log('  Local:   ./.claude/settings.local.json\n');
}

/**
 * Parse CLI arguments and route to appropriate command
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case undefined:
      case 'interactive':
        await interactiveCommand();
        break;

      case 'list':
        listCommand();
        break;

      case 'enable':
        enableCommand(args.slice(1));
        break;

      case 'disable':
        disableCommand(args.slice(1));
        break;

      case 'status':
        statusCommand();
        break;

      case 'help':
      case '--help':
      case '-h':
        displayHelp();
        break;

      default:
        displayError(`Unknown command: ${command}`);
        displayHelp();
        process.exit(1);
    }
  } catch (error) {
    displayError(`Error: ${error}`);
    process.exit(1);
  }
}

// Run the CLI
main();
