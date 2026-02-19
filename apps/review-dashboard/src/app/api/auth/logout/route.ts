import { NextResponse } from 'next/server';

import { clearSession, getSession } from '@/lib/auth';

/**
 * Revokes the user's GitHub OAuth token so it can't be reused
 * after logout. Uses the GitHub App's client credentials for auth.
 */
async function revokeGitHubToken(accessToken: string): Promise<void> {
  const clientId = process.env['GITHUB_OAUTH_CLIENT_ID'];
  const clientSecret = process.env['GITHUB_OAUTH_CLIENT_SECRET'];
  if (!clientId || !clientSecret) return;

  try {
    await fetch(`https://api.github.com/applications/${clientId}/token`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch {
    // Best-effort revocation — don't block logout on failure
  }
}

async function handleLogout(): Promise<NextResponse> {
  const session = await getSession();
  if (session) {
    await revokeGitHubToken(session.accessToken);
  }
  await clearSession();
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3001';
  return NextResponse.redirect(appUrl);
}

export const GET = handleLogout;
export const POST = handleLogout;
