#!/usr/bin/env node

import { generateSkillIndex } from './generate-skill-index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const srcPath = join(__dirname, '..', 'src');
  const outputPath = join(srcPath, 'index.ts');

  await generateSkillIndex({
    srcPath,
    outputPath,
    regenerateCommand:
      'npx nx run @ai-toolkit/skills-agnostic:generate-index',
  });
}

main().catch((error) => {
  console.error('Failed to generate index:', error);
  process.exit(1);
});
