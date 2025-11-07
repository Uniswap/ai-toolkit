import { getAllServerStatuses, hasMcpServers } from '../config/reader';
import { displayServerList, displayWarning } from '../utils/display';

/**
 * List all MCP servers with their enabled/disabled status
 */
export function listCommand(): void {
  if (!hasMcpServers()) {
    displayWarning('No MCP servers configured.');
    console.log('\nTo configure MCP servers, add them to ~/.claude.json:\n');
    console.log('{');
    console.log('  "mcpServers": {');
    console.log('    "server-name": {');
    console.log('      "command": "npx",');
    console.log('      "args": ["-y", "package@latest"]');
    console.log('    }');
    console.log('  }');
    console.log('}\n');
    return;
  }

  const statuses = getAllServerStatuses();
  displayServerList(statuses);
}
