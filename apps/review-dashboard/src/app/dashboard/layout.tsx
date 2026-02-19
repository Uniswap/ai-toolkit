import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  return (
    <div>
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '0.75rem 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="/dashboard" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e' }}>
              Review Bot
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#666' }}>{session.login}</span>
            <img
              src={session.avatarUrl}
              alt={session.login}
              width={32}
              height={32}
              style={{ borderRadius: '50%' }}
            />
            <a href="/api/auth/logout" className="btn btn-secondary">
              Logout
            </a>
          </div>
        </div>
      </header>
      <main className="container" style={{ padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  );
}
