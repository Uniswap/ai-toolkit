#!/usr/bin/env node

/**
 * Prepare script for the AI Toolkit monorepo.
 *
 * This script runs during npm install/ci and sets up git hooks
 * for local development. In CI environments, it skips hook installation
 * since hooks are not needed (and can cause errors with platform-specific binaries).
 */

const { execSync } = require('child_process');

if (process.env.CI) {
  console.log('Skipping Lefthook installation in CI environment');
  process.exit(0);
}

try {
  console.log('Installing Lefthook git hooks...');
  execSync('npx lefthook install', { stdio: 'inherit' });
  console.log('✅ Lefthook hooks installed successfully');
} catch (error) {
  console.error('❌ Failed to install Lefthook hooks:', error.message);
  process.exit(1);
}
