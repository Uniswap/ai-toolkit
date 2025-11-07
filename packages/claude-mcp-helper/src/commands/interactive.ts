// @ts-expect-error - enquirer doesn't have proper TypeScript exports
import { MultiSelect } from 'enquirer';
import {
  getAllServerStatuses,
  getAvailableServers,
  hasMcpServers,
} from '../config/reader';
import { updateLocalConfig } from '../config/writer';
import {
  displaySuccess,
  displayError,
  displayWarning,
  colorize,
} from '../utils/display';

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

  const servers = getAvailableServers();
  const statuses = getAllServerStatuses();

  console.log(colorize('\nMCP Server Configuration', 'bold'));
  console.log(
    'Here is a list of all MCP servers available to you in this working directory.'
  );
  console.log(
    'Please select the servers you want enabled in this workspace, and unselect'
  );
  console.log('the ones you want to be disabled.\n');
  console.log(
    colorize(
      'Narrowing enabled MCP servers saves tokens in the context window',
      'gray'
    )
  );
  console.log(
    colorize(
      'of each Claude Code chat, potentially improving your experience.\n',
      'gray'
    )
  );
  console.log(
    colorize('Use ↑↓ to navigate, space to toggle, enter to save\n', 'gray')
  );

  try {
    const choices = servers.map((name) => {
      const status = statuses.find((s) => s.name === name);
      const isEnabled = status?.enabled ?? true;

      let hint = '';
      if (isEnabled) {
        hint = 'currently enabled';
      } else if (status?.source === 'local') {
        hint = 'disabled locally';
      } else if (status?.source === 'global') {
        hint = 'disabled globally';
      }

      return {
        name: name,
        hint: hint,
        enabled: isEnabled,
      };
    });

    // Get indices of enabled servers for initial selection
    const initialIndices = choices
      .map((choice, index) => (choice.enabled ? index : -1))
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

    console.log(
      colorize(`\n${enabledCount} enabled, ${disabledCount} disabled`, 'gray')
    );

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
