// @ts-expect-error - enquirer doesn't have proper TypeScript exports
import { MultiSelect } from 'enquirer';
import {
  getAllServerStatuses,
  getServersWithOrigins,
  hasMcpServers,
  type ServerInfo,
} from '../config/reader';
import type { ServerOrigin } from '../config/types';
import { updateLocalConfig } from '../config/writer';
import { colorize, displayError, displaySuccess, displayWarning } from '../utils/display';

/**
 * Format origin for display in the UI
 */
function formatOrigin(origin: ServerOrigin): string {
  switch (origin.type) {
    case 'global':
      return 'global';
    case 'project':
      return 'project';
    case 'local':
      return '.mcp.json';
    case 'plugin':
      return `plugin: ${origin.pluginName}`;
  }
}

/**
 * Group servers by their origin type for organized display
 */
interface GroupedServers {
  user: ServerInfo[]; // global + project
  local: ServerInfo[]; // .mcp.json
  plugin: ServerInfo[]; // plugins
}

function groupServersByOrigin(servers: ServerInfo[]): GroupedServers {
  const grouped: GroupedServers = {
    user: [],
    local: [],
    plugin: [],
  };

  for (const server of servers) {
    switch (server.origin.type) {
      case 'global':
      case 'project':
        grouped.user.push(server);
        break;
      case 'local':
        grouped.local.push(server);
        break;
      case 'plugin':
        grouped.plugin.push(server);
        break;
    }
  }

  return grouped;
}

/**
 * Interactive mode with multi-select to enable/disable servers
 */
export async function interactiveCommand(): Promise<void> {
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

  const serversWithOrigins = getServersWithOrigins();
  // Derive server names from serversWithOrigins instead of calling getAvailableServers()
  // to avoid reading configuration files twice
  const servers = serversWithOrigins.map((s) => s.name);
  const statuses = getAllServerStatuses();
  const groupedServers = groupServersByOrigin(serversWithOrigins);

  console.log(colorize('\nMCP Server Configuration', 'bold'));
  console.log('Here is a list of all MCP servers available to you in this working directory.');
  console.log('Please select the servers you want enabled in this workspace, and unselect');
  console.log('the ones you want to be disabled.\n');
  console.log(colorize('Narrowing enabled MCP servers saves tokens in the context window', 'gray'));
  console.log(
    colorize('of each Claude Code chat, potentially improving your experience.\n', 'gray')
  );
  console.log(colorize('Use ↑↓ to navigate, space to toggle, enter to save\n', 'gray'));

  // Build choices with visual grouping
  type Choice = { name: string; hint: string; enabled: boolean; role?: string; value?: string };
  const choices: Choice[] = [];

  // Add user servers (global + project)
  if (groupedServers.user.length > 0) {
    choices.push({
      name: colorize('── User Config ──', 'bold'),
      role: 'separator',
      hint: '',
      enabled: false,
    });
    for (const serverInfo of groupedServers.user) {
      const status = statuses.find((s) => s.name === serverInfo.name);
      const isEnabled = status?.enabled ?? true;

      let hint = formatOrigin(serverInfo.origin);
      if (!isEnabled) {
        hint += status?.source === 'local' ? ' • disabled locally' : ' • disabled globally';
      }

      choices.push({
        name: serverInfo.name,
        value: serverInfo.name,
        hint: hint,
        enabled: isEnabled,
      });
    }
  }

  // Add local .mcp.json servers
  if (groupedServers.local.length > 0) {
    choices.push({
      name: colorize('── Project (.mcp.json) ──', 'bold'),
      role: 'separator',
      hint: '',
      enabled: false,
    });
    for (const serverInfo of groupedServers.local) {
      const status = statuses.find((s) => s.name === serverInfo.name);
      const isEnabled = status?.enabled ?? true;

      let hint = '';
      if (!isEnabled) {
        hint = status?.source === 'local' ? 'disabled locally' : 'disabled globally';
      }

      choices.push({
        name: serverInfo.name,
        value: serverInfo.name,
        hint: hint,
        enabled: isEnabled,
      });
    }
  }

  // Add plugin servers
  if (groupedServers.plugin.length > 0) {
    choices.push({
      name: colorize('── Plugins ──', 'bold'),
      role: 'separator',
      hint: '',
      enabled: false,
    });
    for (const serverInfo of groupedServers.plugin) {
      const status = statuses.find((s) => s.name === serverInfo.name);
      const isEnabled = status?.enabled ?? true;

      let hint = formatOrigin(serverInfo.origin);
      if (!isEnabled) {
        hint += status?.source === 'local' ? ' • disabled locally' : ' • disabled globally';
      }

      choices.push({
        name: serverInfo.name,
        value: serverInfo.name,
        hint: hint,
        enabled: isEnabled,
      });
    }
  }

  try {
    // Get indices of enabled servers for initial selection (including separators in index)
    const initialIndices = choices
      .map((choice, index) => (choice.role !== 'separator' && choice.enabled ? index : -1))
      .filter((index) => index !== -1);

    const prompt = new MultiSelect({
      name: 'servers',
      message: 'Select MCP servers to enable. Deselect ones to disable.',
      choices: choices,
      initial: initialIndices,
      hint: 'Use <space> to select, <a> to toggle all, <return> to submit',
      result(names: string[]) {
        return names;
      },
    } as any);

    const selected = await prompt.run();

    // Calculate denied servers (those NOT selected)
    const deniedServers = servers.filter((s) => !selected.includes(s));

    // Update local config
    updateLocalConfig(deniedServers);

    console.log('');
    displaySuccess('Configuration saved!');

    // Show summary
    const enabledCount = selected.length;
    const disabledCount = deniedServers.length;

    console.log(colorize(`\n${enabledCount} enabled, ${disabledCount} disabled`, 'gray'));

    if (selected.length > 0) {
      console.log(colorize('\nEnabled servers:', 'gray'));
      selected.forEach((name: string) => {
        console.log(colorize(`  • ${name}`, 'gray'));
      });
    }

    if (deniedServers.length > 0) {
      console.log(colorize('\nDisabled servers:', 'gray'));
      deniedServers.forEach((name: string) => {
        console.log(colorize(`  • ${name}`, 'gray'));
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message === '') {
      // User cancelled (Ctrl+C)
      console.log(colorize('\n\nCancelled.', 'yellow'));
      return;
    }
    displayError(`Failed to save configuration: ${error}`);
  }
}
