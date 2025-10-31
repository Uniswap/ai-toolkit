import { readFileSync } from 'fs';

// Reading the SWC compilation config for the spec files
const cwd = process.cwd();
const appRootDir = 'apps/slack-oauth-backend';

const currentWorkingDir = cwd.includes(appRootDir)
  ? cwd
  : `${cwd}/${appRootDir}`;

const swcJestConfig = JSON.parse(
  readFileSync(`${currentWorkingDir}/.spec.swcrc`, 'utf-8')
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

export default {
  displayName: '@ai-toolkit/slack-oauth-backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
  testMatch: ['**/src/**/*.spec.ts', '**/tests/**/*.spec.ts'],
};
