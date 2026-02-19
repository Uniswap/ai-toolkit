/**
 * GitHub App initialization and installation Octokit retrieval.
 *
 * Provides a singleton App instance and a helper to obtain
 * installation-scoped Octokit clients for making API calls
 * on behalf of specific GitHub App installations.
 */

import { App } from '@octokit/app';
import type { Octokit } from '@octokit/rest';

let _app: App | undefined;

/**
 * Returns a singleton GitHub App instance.
 *
 * The private key is expected to be a base64-encoded PEM string,
 * which is decoded before being passed to the App constructor.
 * This encoding is used to safely store multi-line PEM keys in
 * environment variables.
 *
 * @param appId - The GitHub App ID
 * @param privateKey - Base64-encoded PEM private key
 */
export function getGitHubApp(appId: string, privateKey: string): App {
  if (!_app) {
    const decodedKey = Buffer.from(privateKey, 'base64').toString('utf-8');
    _app = new App({
      appId,
      privateKey: decodedKey,
    });
  }
  return _app;
}

/**
 * Retrieves an Octokit client scoped to a specific installation.
 *
 * The returned Octokit instance automatically handles token
 * generation and renewal for the given installation.
 *
 * @param app - The GitHub App instance
 * @param installationId - The numeric installation ID
 * @returns An Octokit instance authenticated as the installation
 */
export async function getInstallationOctokit(app: App, installationId: number): Promise<Octokit> {
  // The App's getInstallationOctokit returns an OctokitCore instance.
  // We cast through unknown to the REST-enriched Octokit type since
  // the App uses OctokitCore by default, which has the same request
  // capabilities but lacks the `.rest` namespace type declarations.
  return app.getInstallationOctokit(installationId) as unknown as Octokit;
}

/**
 * Resets the singleton App instance. Primarily used for testing.
 */
export function resetGitHubApp(): void {
  _app = undefined;
}
