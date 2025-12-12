/**
 * Display utilities for claude-plus CLI
 */

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export function displayHeader(): void {
  console.log(colorize('\n╔══════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║         claude-plus Launcher             ║', 'cyan'));
  console.log(colorize('╚══════════════════════════════════════════╝', 'cyan'));
}

export function displaySuccess(message: string): void {
  console.log(colorize(`✓ ${message}`, 'green'));
}

export function displayError(message: string): void {
  console.error(colorize(`✗ ${message}`, 'red'));
}

export function displayWarning(message: string): void {
  console.log(colorize(`⚠ ${message}`, 'yellow'));
}

export function displayInfo(message: string): void {
  console.log(colorize(message, 'blue'));
}

export function displayDebug(message: string, verbose?: boolean): void {
  if (verbose) {
    console.log(colorize(`  [DEBUG] ${message}`, 'gray'));
  }
}
