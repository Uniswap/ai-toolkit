#!/usr/bin/env node

import { generateIndex } from '@ai-toolkit/utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const srcPath = join(__dirname, '..', 'src');
  const outputPath = join(srcPath, 'index.ts');

  await generateIndex({
    srcPath,
    outputPath,
    typeName: 'Agent',
    exportName: 'agents',
    typeNamePlural: 'Agents',
    regenerateCommand: 'npx nx run @ai-toolkit/agents-agnostic:generate-index',
  });
}

main().catch((error) => {
  console.error('Failed to generate index:', error);
  process.exit(1);
});
