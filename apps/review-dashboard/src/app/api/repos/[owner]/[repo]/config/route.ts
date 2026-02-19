import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { upsertOverride } from '@review-bot/db/queries';
import { getSession } from '@/lib/auth';
import { createDb, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ owner: string; repo: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { owner, repo } = await params;
  const db = createDb();

  const [repository] = await db
    .select()
    .from(schema.repositories)
    .where(and(eq(schema.repositories.owner, owner), eq(schema.repositories.name, repo)))
    .limit(1);

  if (!repository) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }

  // Fetch prompt overrides
  const overrides = await db
    .select()
    .from(schema.promptOverrides)
    .where(eq(schema.promptOverrides.repositoryId, repository.id));

  return NextResponse.json({
    config: repository.configJson ?? {},
    overrides: overrides.map((o) => ({
      sectionKey: o.sectionKey,
      content: o.content,
    })),
  });
}

interface ConfigPayload {
  config: {
    model?: string;
    maxDiffLines?: number;
    fileExclusions?: string;
  };
  overrides: Array<{
    sectionKey: string;
    content: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { owner, repo } = await params;
  const db = createDb();

  const [repository] = await db
    .select()
    .from(schema.repositories)
    .where(and(eq(schema.repositories.owner, owner), eq(schema.repositories.name, repo)))
    .limit(1);

  if (!repository) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }

  const body = (await request.json()) as ConfigPayload;

  // Update repository config
  if (body.config) {
    await db
      .update(schema.repositories)
      .set({
        configJson: body.config,
        updatedAt: new Date(),
      })
      .where(eq(schema.repositories.id, repository.id));
  }

  // Upsert prompt overrides
  if (body.overrides) {
    for (const override of body.overrides) {
      await upsertOverride(db, {
        repositoryId: repository.id,
        sectionKey: override.sectionKey,
        content: override.content,
      });
    }
  }

  return NextResponse.json({ success: true });
}
