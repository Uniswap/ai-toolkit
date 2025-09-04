/**
 * Vercel Serverless Function Handler
 *
 * This file wraps the Express app for deployment on Vercel's serverless platform.
 * Vercel automatically converts Express apps to serverless functions.
 */

// Import the compiled server from the dist directory
// Since outputDirectory is "dist", the built files will be at the root level after deployment
const { createServer } = require('../server');

// Create and export the Express app for Vercel
module.exports = createServer();
