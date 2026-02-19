import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1.5rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Review Bot Dashboard</h1>
      <p style={{ color: '#666', maxWidth: '400px', textAlign: 'center' }}>
        Monitor and configure automated code reviews for your repositories.
      </p>
      <a href="/api/auth/github" className="btn btn-primary" style={{ fontSize: '1rem' }}>
        Login with GitHub
      </a>
    </main>
  );
}
