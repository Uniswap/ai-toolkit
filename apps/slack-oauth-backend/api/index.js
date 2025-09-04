/**
 * Vercel Serverless Function Handler
 *
 * This file wraps the Express app for deployment on Vercel's serverless platform.
 * Vercel automatically converts Express apps to serverless functions.
 */

// Import the compiled server from the dist directory produced by the build
// We compile a dedicated server bundle at apps/slack-oauth-backend/dist/server.js
const { createServer } = require('../dist/server');

// Create and export the Express app for Vercel
module.exports = createServer();
