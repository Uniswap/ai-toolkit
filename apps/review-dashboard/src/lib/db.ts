import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Cross-app import: reuse the review-bot schema definition.
// Both apps are private and share the same database.
import * as schema from '@review-bot/db/schema';

export function createDb() {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

// Re-export schema for convenience
export { schema };
