import { getAllServerStatuses, hasMcpServers } from '../config/reader';
import { displayDetailedStatus, displayWarning } from '../utils/display';

/**
 * Show detailed status of all MCP servers
 */
export function statusCommand(): void {
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
  displayDetailedStatus(statuses);
}
