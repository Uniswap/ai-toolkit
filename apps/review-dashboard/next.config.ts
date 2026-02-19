import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  webpack: (config) => {
    // Resolve @review-bot/db/* path alias for cross-app schema imports
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@review-bot/db': path.join(import.meta.dirname, '../review-bot/src/db'),
    };
    return config;
  },
};

export default nextConfig;
