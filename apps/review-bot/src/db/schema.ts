import { relations } from 'drizzle-orm';
import {
  boolean,
  bigint,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// installations
// ---------------------------------------------------------------------------
export const installations = pgTable('installations', {
  id: serial('id').primaryKey(),
  githubInstallationId: integer('github_installation_id').unique().notNull(),
  accountLogin: text('account_login').notNull(),
  accountType: text('account_type').notNull(), // 'Organization' | 'User'
  enabled: boolean('enabled').default(true),
  settingsJson: jsonb('settings_json'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------------------------------------------------------------------------
// repositories
// ---------------------------------------------------------------------------
export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(),
  installationId: integer('installation_id')
    .notNull()
    .references(() => installations.id),
  githubRepoId: integer('github_repo_id').unique().notNull(),
  owner: text('owner').notNull(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  enabled: boolean('enabled').default(true),
  configJson: jsonb('config_json'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------------------------------------------------------------------------
// reviews
// ---------------------------------------------------------------------------
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: integer('repository_id')
    .notNull()
    .references(() => repositories.id),
  prNumber: integer('pr_number').notNull(),
  headSha: text('head_sha').notNull(),
  baseRef: text('base_ref').notNull(),
  mergeBaseSha: text('merge_base_sha'),
  patchId: text('patch_id'),
  status: text('status').notNull(), // 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  trigger: text('trigger').notNull(), // 'push' | 'comment' | 'manual'
  model: text('model'),
  outcome: text('outcome'), // 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'
  confidence: real('confidence'),
  reviewBody: text('review_body'),
  inlineCommentCount: integer('inline_comment_count').default(0),
  responseJson: jsonb('response_json'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  durationMs: integer('duration_ms'),
  errorMessage: text('error_message'),
  githubReviewId: bigint('github_review_id', { mode: 'bigint' }),
  githubCommentId: bigint('github_comment_id', { mode: 'bigint' }),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// ---------------------------------------------------------------------------
// review_comments
// ---------------------------------------------------------------------------
export const reviewComments = pgTable('review_comments', {
  id: serial('id').primaryKey(),
  reviewId: uuid('review_id')
    .notNull()
    .references(() => reviews.id),
  path: text('path').notNull(),
  line: integer('line').notNull(),
  body: text('body').notNull(),
  suggestion: text('suggestion'),
  side: text('side').default('RIGHT'),
  wasPosted: boolean('was_posted').default(false),
  githubCommentId: bigint('github_comment_id', { mode: 'bigint' }),
});

// ---------------------------------------------------------------------------
// prompt_overrides
// ---------------------------------------------------------------------------
export const promptOverrides = pgTable(
  'prompt_overrides',
  {
    id: serial('id').primaryKey(),
    repositoryId: integer('repository_id')
      .notNull()
      .references(() => repositories.id),
    sectionKey: text('section_key').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [unique('prompt_overrides_repo_section_unique').on(t.repositoryId, t.sectionKey)]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const installationsRelations = relations(installations, ({ many }) => ({
  repositories: many(repositories),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  installation: one(installations, {
    fields: [repositories.installationId],
    references: [installations.id],
  }),
  reviews: many(reviews),
  promptOverrides: many(promptOverrides),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [reviews.repositoryId],
    references: [repositories.id],
  }),
  comments: many(reviewComments),
}));

export const reviewCommentsRelations = relations(reviewComments, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewComments.reviewId],
    references: [reviews.id],
  }),
}));

export const promptOverridesRelations = relations(promptOverrides, ({ one }) => ({
  repository: one(repositories, {
    fields: [promptOverrides.repositoryId],
    references: [repositories.id],
  }),
}));
