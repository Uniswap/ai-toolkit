export { createDb } from './connection.js';
export type { Database } from './connection.js';

export {
  installations,
  repositories,
  reviews,
  reviewComments,
  promptOverrides,
  installationsRelations,
  repositoriesRelations,
  reviewsRelations,
  reviewCommentsRelations,
  promptOverridesRelations,
} from './schema.js';

export {
  findOrCreateInstallation,
  findOrCreateRepository,
  createReview,
  updateReviewStatus,
  getLatestReview,
  getReviewsByRepo,
  createReviewComments,
  getOverridesForRepo,
  upsertOverride,
} from './queries.js';
