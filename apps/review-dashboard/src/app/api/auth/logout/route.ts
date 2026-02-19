import { NextResponse } from 'next/server';

import { clearSession } from '@/lib/auth';

async function handleLogout(): Promise<NextResponse> {
  await clearSession();
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3001';
  return NextResponse.redirect(appUrl);
}

export const GET = handleLogout;
export const POST = handleLogout;
