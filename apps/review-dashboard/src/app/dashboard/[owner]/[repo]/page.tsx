import { and, desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { createDb, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ page?: string }>;
}

function outcomeBadgeClass(outcome: string | null): string {
  switch (outcome) {
    case 'APPROVE':
      return 'badge-success';
    case 'REQUEST_CHANGES':
      return 'badge-danger';
    case 'COMMENT':
      return 'badge-info';
    default:
      return 'badge-secondary';
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'badge-success';
    case 'in_progress':
    case 'pending':
      return 'badge-warning';
    case 'failed':
      return 'badge-danger';
    case 'skipped':
      return 'badge-secondary';
    default:
      return 'badge-secondary';
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function RepoReviewsPage({ params, searchParams }: PageProps) {
  const { owner, repo } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const db = createDb();

  // Find the repository
  const [repository] = await db
    .select()
    .from(schema.repositories)
    .where(and(eq(schema.repositories.owner, owner), eq(schema.repositories.name, repo)))
    .limit(1);

  if (!repository) {
    notFound();
  }

  // Query reviews with pagination
  const reviewRows = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.repositoryId, repository.id))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(pageSize + 1) // Fetch one extra to detect next page
    .offset(offset);

  const hasNextPage = reviewRows.length > pageSize;
  const reviews = hasNextPage ? reviewRows.slice(0, pageSize) : reviewRows;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
        >
          <a href="/dashboard" style={{ color: '#666', fontSize: '0.875rem' }}>
            Repositories
          </a>
          <span style={{ color: '#999' }}>/</span>
          <span style={{ fontSize: '0.875rem' }}>
            {owner}/{repo}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {owner}/{repo}
          </h1>
          <a href={`/dashboard/${owner}/${repo}/config`} className="btn btn-secondary">
            Configuration
          </a>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666' }}>No reviews yet for this repository.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>PR</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Confidence</th>
                  <th>Duration</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <a
                        href={`https://github.com/${owner}/${repo}/pull/${review.prNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        #{review.prNumber}
                      </a>
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(review.status)}`}>
                        {review.status}
                      </span>
                    </td>
                    <td>
                      {review.outcome ? (
                        <span className={`badge ${outcomeBadgeClass(review.outcome)}`}>
                          {review.outcome}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {review.confidence !== null
                        ? `${(review.confidence * 100).toFixed(0)}%`
                        : '-'}
                    </td>
                    <td>{formatDuration(review.durationMs)}</td>
                    <td>{review.createdAt ? new Date(review.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1.5rem',
            }}
          >
            {page > 1 && (
              <a
                href={`/dashboard/${owner}/${repo}?page=${page - 1}`}
                className="btn btn-secondary"
              >
                Previous
              </a>
            )}
            <span style={{ alignSelf: 'center', color: '#666', fontSize: '0.875rem' }}>
              Page {page}
            </span>
            {hasNextPage && (
              <a
                href={`/dashboard/${owner}/${repo}?page=${page + 1}`}
                className="btn btn-secondary"
              >
                Next
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
