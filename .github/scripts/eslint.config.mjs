import js from '@eslint/js';
import nxEslintPlugin from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: ['**/dist', '**/test-output', '**/eslint.config.mjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { plugins: { '@nx': nxEslintPlugin } },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: join(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
];
