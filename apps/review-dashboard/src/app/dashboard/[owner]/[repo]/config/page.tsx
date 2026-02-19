import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { createDb, schema } from '@/lib/db';
import { verifyRepoAccess } from '@/lib/github';

import { ConfigForm } from './config-form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

/**
 * Known overridable prompt sections. These correspond to the section_key
 * values in the prompt_overrides table.
 */
const OVERRIDABLE_SECTIONS = [
  { key: 'system_prompt', label: 'System Prompt' },
  { key: 'review_instructions', label: 'Review Instructions' },
  { key: 'file_analysis', label: 'File Analysis Prompt' },
  { key: 'summary_format', label: 'Summary Format' },
];

export interface RepoConfig {
  model: string;
  maxDiffLines: number;
  fileExclusions: string;
}

export interface PromptOverride {
  sectionKey: string;
  content: string;
}

export default async function ConfigPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const { owner, repo } = await params;

  // Config page requires write access
  const hasAccess = await verifyRepoAccess(session.accessToken, owner, repo, 'write');
  if (!hasAccess) {
    notFound();
  }

  const db = createDb();

  const [repository] = await db
    .select()
    .from(schema.repositories)
    .where(and(eq(schema.repositories.owner, owner), eq(schema.repositories.name, repo)))
    .limit(1);

  if (!repository) {
    notFound();
  }

  // Parse existing config
  const configJson = (repository.configJson ?? {}) as Record<string, unknown>;
  const config: RepoConfig = {
    model: (configJson['model'] as string) ?? 'claude-sonnet-4-20250514',
    maxDiffLines: (configJson['maxDiffLines'] as number) ?? 5000,
    fileExclusions: (configJson['fileExclusions'] as string) ?? '',
  };

  // Fetch existing prompt overrides
  const overrideRows = await db
    .select()
    .from(schema.promptOverrides)
    .where(eq(schema.promptOverrides.repositoryId, repository.id));

  const overrides = Object.fromEntries(overrideRows.map((row) => [row.sectionKey, row.content]));

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <a href="/dashboard" style={{ color: '#666', fontSize: '0.875rem' }}>
            Repositories
          </a>
          <span style={{ color: '#999' }}>/</span>
          <a href={`/dashboard/${owner}/${repo}`} style={{ color: '#666', fontSize: '0.875rem' }}>
            {owner}/{repo}
          </a>
          <span style={{ color: '#999' }}>/</span>
          <span style={{ fontSize: '0.875rem' }}>Configuration</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Configuration for {owner}/{repo}
        </h1>
      </div>

      <ConfigForm
        owner={owner}
        repo={repo}
        config={config}
        overrides={overrides}
        overridableSections={OVERRIDABLE_SECTIONS}
      />
    </div>
  );
}
