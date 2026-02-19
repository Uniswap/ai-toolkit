import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Required for drizzle-kit CLI; only runs with DATABASE_URL set
    url: process.env['DATABASE_URL']!,
  },
});
