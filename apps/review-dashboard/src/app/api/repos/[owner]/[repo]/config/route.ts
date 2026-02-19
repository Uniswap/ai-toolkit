import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { upsertOverride } from '@review-bot/db/queries';
import { getSession } from '@/lib/auth';
import { createDb, schema } from '@/lib/db';
import { verifyRepoAccess } from '@/lib/github';

export const dynamic = 'force-dynamic';

const ALLOWED_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'claude-haiku-4-5-20251001',
] as const;

const VALID_SECTION_KEYS = [
  'system_prompt',
  'review_instructions',
  'file_analysis',
  'summary_format',
] as const;

const configPayloadSchema = z.object({
  config: z
    .object({
      model: z.enum(ALLOWED_MODELS).optional(),
      maxDiffLines: z.number().int().min(100).max(50000).optional(),
      fileExclusions: z.string().max(5000).optional(),
    })
    .optional(),
  overrides: z
    .array(
      z.object({
        sectionKey: z.enum(VALID_SECTION_KEYS),
        content: z.string().max(50000),
      })
    )
    .max(VALID_SECTION_KEYS.length)
    .optional(),
});

interface RouteParams {
  params: Promise<{ owner: string; repo: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { owner, repo } = await params;

  const hasAccess = await verifyRepoAccess(session.accessToken, owner, repo);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
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

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { owner, repo } = await params;

  // Config changes require write access
  const hasAccess = await verifyRepoAccess(session.accessToken, owner, repo, 'write');
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = createDb();

  const [repository] = await db
    .select()
    .from(schema.repositories)
    .where(and(eq(schema.repositories.owner, owner), eq(schema.repositories.name, repo)))
    .limit(1);

  if (!repository) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }

  const raw: unknown = await request.json();
  const parsed = configPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const body = parsed.data;

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
