import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { createDb, schema } from '@/lib/db';
import { filterAccessibleRepos } from '@/lib/github';

export const dynamic = 'force-dynamic';

interface RepoRow {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  enabled: boolean | null;
  reviewCount: number;
  lastReviewDate: Date | null;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const db = createDb();

  // Query repositories with review stats
  const allRepos = await db
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

  const repos = await filterAccessibleRepos(session.accessToken, allRepos);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Repositories</h1>
        <span style={{ color: '#666', fontSize: '0.875rem' }}>
          {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}
        </span>
      </div>

      {repos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666' }}>
            No repositories found. Install the Review Bot GitHub App on your repositories to get
            started.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Repository</th>
                <th>Reviews</th>
                <th>Last Review</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((repo: RepoRow) => (
                <tr key={repo.id}>
                  <td>
                    <a href={`/dashboard/${repo.owner}/${repo.name}`}>
                      <strong>{repo.fullName}</strong>
                    </a>
                  </td>
                  <td>{repo.reviewCount}</td>
                  <td>
                    {repo.lastReviewDate
                      ? new Date(repo.lastReviewDate).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <span className={`badge ${repo.enabled ? 'badge-success' : 'badge-secondary'}`}>
                      {repo.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
