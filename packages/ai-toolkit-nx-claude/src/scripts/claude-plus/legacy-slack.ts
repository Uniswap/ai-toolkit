/**
 * Detection for the Slack credentials that older claude-plus versions left on
 * disk, in two places:
 *
 *   1. `mcpServers.slack.env.SLACK_BOT_TOKEN` in the Claude config, written by
 *      the token refresh step. This shadows the hosted OAuth server the
 *      uniswap-integrations plugin provides, so Slack tools stay broken.
 *   2. The shell env file written by the setup wizard, which holds a
 *      SLACK_REFRESH_TOKEN. Nothing reads it any more, but the refresh token
 *      stays valid and can still mint new bot tokens against the OAuth backend.
 *
 * Either one alone is enough to warn about: a user who only ever ran the setup
 * wizard has the env file and no config entry.
 *
 * Detection only, never removal. Editing a user's config or deleting their
 * files unasked is a destructive write, and the credentials may be in use
 * elsewhere. Revocation is the step that actually makes them safe, so the
 * warning leads with it rather than with deletion.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getAllClaudeConfigPaths } from './config-paths';
import { displayWarning, displayDebug } from './display';

const LEGACY_ENV_FILE = path.join(os.homedir(), '.config', 'claude-code', 'slack-env.sh');

export interface LegacySlackResidue {
  /** Claude config files carrying an `mcpServers.slack` entry with a bot token. */
  configPaths: string[];
  /** The wizard's env file, when it is still present. */
  envFile: string | null;
}

export function hasResidue(residue: LegacySlackResidue): boolean {
  return residue.configPaths.length > 0 || residue.envFile !== null;
}

/**
 * Unreadable or malformed files are skipped: this runs on every launch and must
 * never be the reason a launch fails.
 */
export function findLegacySlackResidue(verbose?: boolean): LegacySlackResidue {
  const configPaths = getAllClaudeConfigPaths().filter((configPath) => {
    try {
      if (!fs.existsSync(configPath)) {
        return false;
      }
      // Cheap reject before parsing: the Claude config accumulates per-project
      // history and can grow large, and the overwhelming majority of launches
      // have no legacy entry at all.
      const raw = fs.readFileSync(configPath, 'utf8');
      if (!raw.includes('SLACK_BOT_TOKEN')) {
        return false;
      }
      const config = JSON.parse(raw);
      return typeof config?.mcpServers?.slack?.env?.SLACK_BOT_TOKEN === 'string';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      displayDebug(`Skipped unreadable config ${configPath}: ${message}`, verbose);
      return false;
    }
  });

  let envFile: string | null = null;
  try {
    envFile = fs.existsSync(LEGACY_ENV_FILE) ? LEGACY_ENV_FILE : null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    displayDebug(`Could not check ${LEGACY_ENV_FILE}: ${message}`, verbose);
  }

  return { configPaths, envFile };
}

export function warnAboutLegacySlackResidue(residue: LegacySlackResidue): void {
  const found = [
    ...residue.configPaths.map((p) => `    ${p} (slack MCP entry)`),
    ...(residue.envFile ? [`    ${residue.envFile} (refresh token)`] : []),
  ].join('\n');

  const shadowNote =
    residue.configPaths.length > 0
      ? `  The "slack" entry shadows the hosted OAuth server, so Slack tools will\n` +
        `  not work until it is removed.\n\n`
      : '';

  // Only offer steps for residue that is actually present, so nobody is told to
  // delete a file they do not have.
  const steps = [
    `Revoke the old credentials in Slack (workspace admin: remove the\n` +
      `       app's grants). Deleting local files hides the tokens but leaves\n` +
      `       them valid, and the refresh token can still mint new ones.`,
    ...(residue.configPaths.length > 0
      ? [`Delete the "slack" entry under "mcpServers" in the config file(s) above`]
      : []),
    ...(residue.envFile ? [`Delete ${residue.envFile}, which is no longer read`] : []),
    `Run /mcp inside Claude Code and connect "slack" over OAuth`,
  ].map((step, i) => `${i + 1}. ${step}`);

  displayWarning(
    `Leftover Slack credentials from an older claude-plus:\n` +
      `${found}\n\n` +
      shadowNote +
      `  To clean up:\n\n` +
      steps.map((s) => `    ${s}`).join('\n') +
      `\n`
  );
}
