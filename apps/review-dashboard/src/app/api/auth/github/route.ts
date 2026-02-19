import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const clientId = process.env['GITHUB_OAUTH_CLIENT_ID'];
  if (!clientId) {
    return NextResponse.json(
      { error: 'GITHUB_OAUTH_CLIENT_ID is not configured' },
      { status: 500 }
    );
  }

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3001';
  const redirectUri = `${appUrl}/api/auth/github/callback`;

  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user read:org',
    state,
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
