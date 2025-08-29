#!/usr/bin/env node

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const outdir = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

async function bundle() {
  try {
    // Bundle all generator files
    const generatorDirs = fs
      .readdirSync(path.join(__dirname, '..', 'src', 'generators'))
      .filter((dir) =>
        fs
          .statSync(path.join(__dirname, '..', 'src', 'generators', dir))
          .isDirectory()
      );

    for (const dir of generatorDirs) {
      const generatorPath = path.join(
        __dirname,
        '..',
        'src',
        'generators',
        dir,
        'generator.ts'
      );
      if (fs.existsSync(generatorPath)) {
        await esbuild.build({
          entryPoints: [generatorPath],
          bundle: true,
          platform: 'node',
          target: 'node18',
          format: 'cjs',
          outfile: path.join(outdir, 'generators', dir, 'generator.js'),
          external: [
            '@nx/devkit',
            'enquirer',
            'fs',
            'path',
            'os',
            'child_process',
            'nx',
            'tslib',
            'eslint',
            'typescript',
            '@swc/core',
            '@swc/wasm',
            'ts-node',
            'jiti',
          ],
          // Bundle workspace dependencies - use built versions
          alias: {
            '@ai-toolkit/commands-agnostic': path.join(
              __dirname,
              '../../commands/agnostic/dist/src/index.js'
            ),
            '@ai-toolkit/agents-agnostic': path.join(
              __dirname,
              '../../agents/agnostic/dist/src/index.js'
            ),
          },
        });
      }
    }

    // Bundle main index
    await esbuild.build({
      entryPoints: [path.join(__dirname, '..', 'src', 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: path.join(outdir, 'index.js'),
      external: [
        '@nx/devkit',
        'enquirer',
        'fs',
        'path',
        'os',
        'child_process',
        'nx',
        'tslib',
      ],
    });

    // Bundle CLI generator
    await esbuild.build({
      entryPoints: [path.join(__dirname, '..', 'src', 'cli-generator.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: path.join(outdir, 'cli-generator.js'),
      external: [
        '@nx/devkit',
        'enquirer',
        'fs',
        'path',
        'os',
        'child_process',
        'nx',
        'tslib',
      ],
    });

    console.log('✅ Bundle complete');
  } catch (error) {
    console.error('❌ Bundle failed:', error);
    process.exit(1);
  }
}

bundle();
