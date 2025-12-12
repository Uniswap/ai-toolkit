import { getAvailableServers, getServerStatus } from '../config/reader';
import { disableServer } from '../config/writer';
import { displaySuccess, displayError, displayWarning } from '../utils/display';

/**
 * Disable one or more MCP servers
 */
export function disableCommand(serverNames: string[]): void {
  if (serverNames.length === 0) {
    displayError('Please specify at least one server name to disable.');
    console.log(
      '\nUsage: claude-mcp-helper disable <server-name> [<server-name>...]'
    );
    console.log('Example: claude-mcp-helper disable github supabase\n');
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

    if (!status.enabled) {
      displayWarning(`Server "${serverName}" is already disabled.`);
      continue;
    }

    try {
      disableServer(serverName);
      displaySuccess(`Disabled server "${serverName}".`);
    } catch (error) {
      displayError(`Failed to disable "${serverName}": ${error}`);
    }
  }
}
