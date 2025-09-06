import baseConfig from '../../../eslint.config.js';

export default [
  ...baseConfig,
  {
    ignores: ['node_modules', 'dist'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {},
  },
];
