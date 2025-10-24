/**
 * Vercel Serverless Function for Slack OAuth Backend
 *
 * This function wraps the Express app for deployment on Vercel's serverless platform.
 * When deployed from the monorepo root, Vercel automatically detects files in the /api
 * directory as serverless functions.
 */

// Import the compiled server from the built output
const { createServer } = require('../apps/slack-oauth-backend/dist/server');

// Create and export the Express app for Vercel
module.exports = createServer();
