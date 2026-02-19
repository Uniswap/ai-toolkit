import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review Bot Dashboard',
  description: 'Claude Code Review Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
              Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #1a1a2e;
            background-color: #f5f5f7;
          }
          a {
            color: #0066cc;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
          }
          th {
            font-weight: 600;
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #f0f4ff;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1.5rem;
          }
          .btn {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: 1px solid transparent;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .btn-primary {
            background-color: #0066cc;
            color: white;
          }
          .btn-primary:hover {
            background-color: #0052a3;
            text-decoration: none;
          }
          .btn-secondary {
            background-color: white;
            color: #333;
            border-color: #d0d0d0;
          }
          .btn-secondary:hover {
            background-color: #f0f0f0;
            text-decoration: none;
          }
          .badge {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .badge-success { background-color: #d4edda; color: #155724; }
          .badge-warning { background-color: #fff3cd; color: #856404; }
          .badge-danger { background-color: #f8d7da; color: #721c24; }
          .badge-info { background-color: #d1ecf1; color: #0c5460; }
          .badge-secondary { background-color: #e2e3e5; color: #383d41; }
          input, textarea, select {
            padding: 0.5rem 0.75rem;
            border: 1px solid #d0d0d0;
            border-radius: 6px;
            font-size: 0.875rem;
            font-family: inherit;
            width: 100%;
          }
          input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #0066cc;
            box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
          }
          label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.25rem;
            font-size: 0.875rem;
          }
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
            margin-bottom: 1rem;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
