import type { ServerStatus } from '../config/types';

/**
 * ANSI color codes
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

/**
 * Format text with color
 */
export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Display a list of servers with their status
 */
export function displayServerList(statuses: ServerStatus[]): void {
  if (statuses.length === 0) {
    console.log(colorize('No MCP servers configured.', 'yellow'));
    console.log(
      colorize(
        '\nConfigure MCP servers in ~/.claude.json to get started.',
        'gray'
      )
    );
    return;
  }

  const enabled = statuses.filter((s) => s.enabled);
  const disabled = statuses.filter((s) => !s.enabled);

  if (enabled.length > 0) {
    console.log(colorize('\n✓ Enabled Servers:', 'bold'));
    enabled.forEach((server) => {
      console.log(`  ${colorize('✓', 'green')} ${server.name}`);
    });
  }

  if (disabled.length > 0) {
    console.log(colorize('\n✗ Disabled Servers:', 'bold'));
    disabled.forEach((server) => {
      const source =
        server.source === 'local'
          ? colorize('(local)', 'gray')
          : colorize('(global)', 'gray');
      console.log(`  ${colorize('✗', 'red')} ${server.name} ${source}`);
    });
  }

  console.log(
    colorize(`\n${enabled.length} enabled, ${disabled.length} disabled`, 'gray')
  );
}

/**
 * Display detailed status for servers
 */
export function displayDetailedStatus(statuses: ServerStatus[]): void {
  if (statuses.length === 0) {
    console.log(colorize('No MCP servers configured.', 'yellow'));
    return;
  }

  console.log(colorize('\nMCP Server Status:', 'bold'));
  console.log(colorize('─'.repeat(60), 'gray'));

  statuses.forEach((server) => {
    const statusIcon = server.enabled
      ? colorize('✓', 'green')
      : colorize('✗', 'red');
    const statusText = server.enabled
      ? colorize('Enabled', 'green')
      : colorize('Disabled', 'red');

    let sourceText = '';
    if (!server.enabled) {
      sourceText =
        server.source === 'local'
          ? colorize(' (local config)', 'gray')
          : colorize(' (global config)', 'gray');
    }

    console.log(`${statusIcon} ${server.name}`);
    console.log(`   Status: ${statusText}${sourceText}`);
    console.log('');
  });

  const enabled = statuses.filter((s) => s.enabled).length;
  const disabled = statuses.filter((s) => !s.enabled).length;

  console.log(colorize('─'.repeat(60), 'gray'));
  console.log(
    colorize(
      `Total: ${statuses.length} servers (${enabled} enabled, ${disabled} disabled)`,
      'gray'
    )
  );
}

/**
 * Display success message
 */
export function displaySuccess(message: string): void {
  console.log(colorize(`✓ ${message}`, 'green'));
}

/**
 * Display error message
 */
export function displayError(message: string): void {
  console.error(colorize(`✗ ${message}`, 'red'));
}

/**
 * Display warning message
 */
export function displayWarning(message: string): void {
  console.log(colorize(`⚠ ${message}`, 'yellow'));
}

/**
 * Display info message
 */
export function displayInfo(message: string): void {
  console.log(colorize(message, 'blue'));
}
