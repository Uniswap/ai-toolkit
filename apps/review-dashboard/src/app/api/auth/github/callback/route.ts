import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { setSession } from '@/lib/auth';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3001';
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors from GitHub
  if (error) {
    const description = searchParams.get('error_description') ?? 'Unknown error';
    return NextResponse.redirect(`${appUrl}?error=${encodeURIComponent(description)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}?error=missing_params`);
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  cookieStore.delete('oauth_state');

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}?error=invalid_state`);
  }

  // Exchange code for access token
  const clientId = process.env['GITHUB_OAUTH_CLIENT_ID'];
  const clientSecret = process.env['GITHUB_OAUTH_CLIENT_SECRET'];

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}?error=oauth_not_configured`);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;

  if (tokenData.error) {
    return NextResponse.redirect(
      `${appUrl}?error=${encodeURIComponent(tokenData.error_description ?? tokenData.error)}`
    );
  }

  // Fetch user profile
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(`${appUrl}?error=user_fetch_failed`);
  }

  const userData = (await userResponse.json()) as GitHubUser;

  // Create session
  await setSession({
    userId: String(userData.id),
    login: userData.login,
    avatarUrl: userData.avatar_url,
    accessToken: tokenData.access_token,
  });

  return NextResponse.redirect(`${appUrl}/dashboard`);
}
