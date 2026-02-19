import { and, desc, eq } from 'drizzle-orm';

import type { Database } from './connection.js';
import { installations, promptOverrides, repositories, reviewComments, reviews } from './schema.js';

// ---------------------------------------------------------------------------
// Installations
// ---------------------------------------------------------------------------

export async function findOrCreateInstallation(
  db: Database,
  data: {
    githubInstallationId: number;
    accountLogin: string;
    accountType: string;
  }
) {
  const { githubInstallationId, accountLogin, accountType } = data;

  const [result] = await db
    .insert(installations)
    .values({ githubInstallationId, accountLogin, accountType })
    .onConflictDoUpdate({
      target: installations.githubInstallationId,
      set: { accountLogin, accountType, enabled: true, updatedAt: new Date() },
    })
    .returning();

  return result;
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

export async function findOrCreateRepository(
  db: Database,
  params: {
    installationId: number;
    githubRepoId: number;
    owner: string;
    name: string;
  }
) {
  const [result] = await db
    .insert(repositories)
    .values({
      installationId: params.installationId,
      githubRepoId: params.githubRepoId,
      owner: params.owner,
      name: params.name,
      fullName: `${params.owner}/${params.name}`,
    })
    .onConflictDoUpdate({
      target: repositories.githubRepoId,
      set: {
        owner: params.owner,
        name: params.name,
        fullName: `${params.owner}/${params.name}`,
        updatedAt: new Date(),
      },
    })
    .returning();

  return result;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function createReview(
  db: Database,
  data: {
    repositoryId: number;
    prNumber: number;
    headSha: string;
    baseRef: string;
    trigger: string;
  }
) {
  const [review] = await db
    .insert(reviews)
    .values({
      repositoryId: data.repositoryId,
      prNumber: data.prNumber,
      headSha: data.headSha,
      baseRef: data.baseRef,
      status: 'pending',
      trigger: data.trigger,
    })
    .returning();

  return review;
}

export async function updateReviewStatus(
  db: Database,
  reviewId: string,
  status: string,
  data?: Partial<{
    model: string;
    outcome: string;
    confidence: number;
    reviewBody: string;
    inlineCommentCount: number;
    responseJson: unknown;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    errorMessage: string;
    githubReviewId: bigint;
    githubCommentId: bigint;
    mergeBaseSha: string;
    patchId: string;
    completedAt: Date;
  }>
) {
  const [updated] = await db
    .update(reviews)
    .set({
      status,
      ...data,
    })
    .where(eq(reviews.id, reviewId))
    .returning();

  return updated;
}

export async function getLatestReview(db: Database, repositoryId: number, prNumber: number) {
  const result = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.repositoryId, repositoryId), eq(reviews.prNumber, prNumber)))
    .orderBy(desc(reviews.createdAt))
    .limit(1);

  return result[0] ?? null;
}

export async function getReviewsByRepo(
  db: Database,
  repositoryId: number,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;

  return db
    .select()
    .from(reviews)
    .where(eq(reviews.repositoryId, repositoryId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);
}

// ---------------------------------------------------------------------------
// Review Comments
// ---------------------------------------------------------------------------

export async function createReviewComments(
  db: Database,
  comments: Array<{
    reviewId: string;
    path: string;
    line: number;
    body: string;
    suggestion?: string;
    side?: string;
  }>
) {
  if (comments.length === 0) return [];

  return db.insert(reviewComments).values(comments).returning();
}

// ---------------------------------------------------------------------------
// Prompt Overrides
// ---------------------------------------------------------------------------

export async function getOverridesForRepo(db: Database, repositoryId: number) {
  return db.select().from(promptOverrides).where(eq(promptOverrides.repositoryId, repositoryId));
}

export async function upsertOverride(
  db: Database,
  params: {
    repositoryId: number;
    sectionKey: string;
    content: string;
  }
): Promise<void> {
  await db
    .insert(promptOverrides)
    .values({
      repositoryId: params.repositoryId,
      sectionKey: params.sectionKey,
      content: params.content,
    })
    .onConflictDoUpdate({
      target: [promptOverrides.repositoryId, promptOverrides.sectionKey],
      set: { content: params.content, updatedAt: new Date() },
    });
}
