import { readFileSync } from 'fs';

// Reading the SWC compilation config for the spec files
const cwd = process.cwd();
const appRootDir = 'apps/review-bot';

const currentWorkingDir = cwd.includes(appRootDir) ? cwd : `${cwd}/${appRootDir}`;

const swcJestConfig = JSON.parse(readFileSync(`${currentWorkingDir}/.spec.swcrc`, 'utf-8'));

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

export default {
  displayName: 'review-bot',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
