import { getAvailableServers, getServerStatus } from '../config/reader';
import { enableServer } from '../config/writer';
import { displaySuccess, displayError, displayWarning } from '../utils/display';

/**
 * Enable one or more MCP servers
 */
export function enableCommand(serverNames: string[]): void {
  if (serverNames.length === 0) {
    displayError('Please specify at least one server name to enable.');
    console.log(
      '\nUsage: claude-mcp-helper enable <server-name> [<server-name>...]'
    );
    console.log('Example: claude-mcp-helper enable github supabase\n');
    return;
  }

  const availableServers = getAvailableServers();

  for (const serverName of serverNames) {
    if (!availableServers.includes(serverName)) {
      displayError(`Server "${serverName}" is not configured.`);
      console.log(
        `\nAvailable servers: ${availableServers.join(', ') || 'none'}\n`
      );
      continue;
    }

    const status = getServerStatus(serverName);

    if (status.enabled) {
      displayWarning(`Server "${serverName}" is already enabled.`);
      continue;
    }

    try {
      enableServer(serverName);
      displaySuccess(`Enabled server "${serverName}".`);
    } catch (error) {
      displayError(`Failed to enable "${serverName}": ${error}`);
    }
  }
}
