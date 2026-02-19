/**
 * Application Entry Point
 *
 * Validates environment configuration, creates the server, starts listening,
 * and handles graceful shutdown on SIGTERM/SIGINT.
 */

import 'dotenv/config';
import { getEnv } from './config/env.js';
import { createServer } from './server.js';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.log(`[main] ${message}`);
}

function logError(message: string): void {
  console.error(`[main] ERROR: ${message}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Validate environment first - this will throw if required vars are missing
  log('Validating environment configuration...');
  const env = getEnv();
  log('Environment validated successfully');

  // Create the fully configured server
  log('Creating server...');
  const { server } = await createServer(env);

  // Register graceful shutdown handlers
  const shutdown = async (signal: string): Promise<void> => {
    log(`Received ${signal}, shutting down gracefully...`);
    try {
      await server.close();
      log('Server closed');
      process.exit(0);
    } catch (err) {
      logError(`Error during shutdown: ${String(err)}`);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  // Start the server
  try {
    const address = await server.listen({ port: env.PORT, host: env.HOST });
    log(`Review bot server listening at ${address}`);
  } catch (err) {
    logError(`Failed to start server: ${String(err)}`);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  logError(`Unhandled error in main: ${String(err)}`);
  process.exit(1);
});
