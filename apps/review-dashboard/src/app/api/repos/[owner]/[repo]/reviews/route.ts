import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getSession } from '@/lib/auth';
import { createDb, schema } from '@/lib/db';
import { verifyRepoAccess } from '@/lib/github';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ owner: string; repo: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { owner, repo } = await params;

  const hasAccess = await verifyRepoAccess(session.accessToken, owner, repo);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 25));
  const offset = (page - 1) * pageSize;

  const db = createDb();

  // Find the repository
  const [repository] = await db
    .select()
    .from(schema.repositories)
    .where(and(eq(schema.repositories.owner, owner), eq(schema.repositories.name, repo)))
    .limit(1);

  if (!repository) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }

  // Query reviews with pagination
  const reviews = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.repositoryId, repository.id))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(pageSize + 1)
    .offset(offset);

  const hasMore = reviews.length > pageSize;
  const results = hasMore ? reviews.slice(0, pageSize) : reviews;

  return NextResponse.json({
    reviews: results,
    pagination: {
      page,
      pageSize,
      hasMore,
    },
  });
}
