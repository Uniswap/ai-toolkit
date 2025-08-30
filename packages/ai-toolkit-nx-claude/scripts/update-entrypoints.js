#!/usr/bin/env node
/*
  Auto-discovers generator entry points and updates the Nx esbuild target's additionalEntryPoints
  so that the CLI's dynamic requires of dist/generators/<name>/generator.js continue to work.

  Usage: node packages/ai-toolkit-nx-claude/scripts/update-entrypoints.js
*/

const fs = require('fs');
const path = require('path');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function main() {
  const repoRoot = process.cwd();
  const pkgPath = path.join(
    repoRoot,
    'packages/ai-toolkit-nx-claude/package.json'
  );
  const srcGeneratorsDir = path.join(
    repoRoot,
    'packages/ai-toolkit-nx-claude/src/generators'
  );

  if (!fs.existsSync(pkgPath)) {
    console.error('Could not find package.json at', pkgPath);
    process.exit(1);
  }
  if (!fs.existsSync(srcGeneratorsDir)) {
    console.error('Could not find generators directory at', srcGeneratorsDir);
    process.exit(1);
  }

  const pkg = readJson(pkgPath);

  const fixedEntries = ['packages/ai-toolkit-nx-claude/src/index.ts'];

  const discovered = [];
  for (const dir of fs.readdirSync(srcGeneratorsDir)) {
    const genDir = path.join(srcGeneratorsDir, dir);
    if (!fs.statSync(genDir).isDirectory()) continue;
    const genTs = path.join(genDir, 'generator.ts');
    if (fs.existsSync(genTs)) {
      // Store as workspace-relative path for Nx
      const rel = path.join(
        'packages/ai-toolkit-nx-claude/src/generators',
        dir,
        'generator.ts'
      );
      discovered.push(rel);
    }
  }

  discovered.sort();

  const desired = [...fixedEntries, ...discovered];

  const current =
    pkg?.nx?.targets?.bundle?.options?.additionalEntryPoints || [];

  const arraysEqual = (a, b) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  if (
    !pkg.nx ||
    !pkg.nx.targets ||
    !pkg.nx.targets.bundle ||
    !pkg.nx.targets.bundle.options
  ) {
    console.error('package.json missing nx.targets.bundle.options structure.');
    process.exit(1);
  }

  if (!arraysEqual(current, desired)) {
    pkg.nx.targets.bundle.options.additionalEntryPoints = desired;
    writeJson(pkgPath, pkg);
    console.log(
      'Updated additionalEntryPoints to:\n - ' + desired.join('\n - ')
    );
  } else {
    console.log('additionalEntryPoints already up to date.');
  }
}

main();
