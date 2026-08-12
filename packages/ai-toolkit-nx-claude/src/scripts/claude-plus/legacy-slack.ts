/**
 * Detection for the Slack bot-token entries that older claude-plus versions
 * wrote into the Claude config.
 *
 * A user-scope `mcpServers.slack` entry shadows the hosted OAuth server the
 * uniswap-integrations plugin provides, so a user who ran the old setup wizard
 * keeps getting the dead token-based config until they remove it by hand.
 * Upgrading claude-plus cannot fix that on its own, so it is surfaced here.
 *
 * Detection only: the entry is reported, never rewritten. Editing a user's
 * config without consent is a destructive write, and the token may still be in
 * use elsewhere.
 */

import * as fs from 'fs';
import { getAllClaudeConfigPaths } from './config-paths';
import { displayWarning, displayDebug } from './display';

/**
 * Config files that carry a legacy `mcpServers.slack` entry with a bot token.
 * Unreadable or malformed files are skipped: this runs on every launch and must
 * never be the reason a launch fails.
 */
export function findLegacySlackTokenConfigs(verbose?: boolean): string[] {
  return getAllClaudeConfigPaths().filter((configPath) => {
    try {
      if (!fs.existsSync(configPath)) {
        return false;
      }
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return typeof config?.mcpServers?.slack?.env?.SLACK_BOT_TOKEN === 'string';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      displayDebug(`Skipped unreadable config ${configPath}: ${message}`, verbose);
      return false;
    }
  });
}

export function warnAboutLegacySlackToken(configPaths: string[]): void {
  displayWarning(
    `A legacy Slack bot token is still configured in:\n` +
      configPaths.map((p) => `    ${p}`).join('\n') +
      `\n\n  This "slack" entry shadows the hosted OAuth server, so Slack tools\n` +
      `  will not work until it is removed. To fix:\n\n` +
      `    1. Delete the "slack" entry under "mcpServers" in the file(s) above\n` +
      `    2. Revoke the old token in Slack (workspace admin: remove the app's\n` +
      `       grants) — deleting the config hides the token but leaves it valid\n` +
      `    3. Run /mcp inside Claude Code and connect "slack" over OAuth\n`
  );
}
