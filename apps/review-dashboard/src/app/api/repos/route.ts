import { desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { createDb, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createDb();

  const repos = await db
    .select({
      id: schema.repositories.id,
      owner: schema.repositories.owner,
      name: schema.repositories.name,
      fullName: schema.repositories.fullName,
      enabled: schema.repositories.enabled,
      reviewCount: sql<number>`count(${schema.reviews.id})::int`,
      lastReviewDate: sql<Date | null>`max(${schema.reviews.createdAt})`,
    })
    .from(schema.repositories)
    .leftJoin(schema.reviews, eq(schema.reviews.repositoryId, schema.repositories.id))
    .groupBy(schema.repositories.id)
    .orderBy(desc(sql`max(${schema.reviews.createdAt})`));

  return NextResponse.json({ repositories: repos });
}
