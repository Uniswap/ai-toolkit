# ESLint Configuration Rules

## Instructions for Claude Code

When working with ESLint configurations in this Nx workspace, follow these strict rules:

## Critical Rules - ALWAYS FOLLOW

### 1. NEVER create or use `.eslintignore` files

- Always use `ignorePatterns` property in ESLint config files
- If you encounter a `.eslintignore` file, migrate its contents to `ignorePatterns` and delete it

### 2. ALWAYS run linting after code changes

- After modifying code: `nx affected -t lint typecheck`
- Before committing: `nx run-many -t lint typecheck --all --parallel`
- Fix all warnings and errors before proceeding

### 3. ALWAYS follow the configuration hierarchy

- Root config (`/eslint.config.js` or `/eslintrc.json`): Workspace-wide rules
- Project configs (`apps/*/eslintrc.json`, `libs/*/eslintrc.json`): Project-specific rules
- Package configs (`packages/*/eslint.config.js`): Package-specific rules

## Implementation Templates

### When creating a root ESLint config

```javascript
module.exports = {
  root: true,
  ignorePatterns: [
    '**/*', // Start by ignoring everything
    '!**/*.ts',
    '!**/*.tsx',
    '!**/*.js',
    '!**/*.jsx', // Include what to lint
    'node_modules',
    'dist',
    '.nx',
    'coverage', // Always ignore these
  ],
  plugins: ['@nx'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {
        '@nx/enforce-module-boundaries': 'error',
      },
    },
  ],
};
```

### When creating a project-level config

```json
{
  "extends": ["../../.eslintrc.json"],
  "ignorePatterns": ["!**/*", "dist", "node_modules"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "rules": {}
    }
  ]
}
```

## Ignore Patterns by Context

### For Next.js apps, add

```javascript
ignorePatterns: ['.next', 'out', 'public', 'next.config.js', 'next-env.d.ts'];
```

### Always ignore

```javascript
ignorePatterns: ['node_modules', 'dist', 'build', '.nx', 'coverage', '*.log', '__generated__'];
```

## Standard Rule Sets

### When adding TypeScript rules

```javascript
'@typescript-eslint/no-explicit-any': 'warn',
'@typescript-eslint/explicit-module-boundary-types': 'off'
```

### Always include

```javascript
'@nx/enforce-module-boundaries': 'error',
'no-console': ['warn', { allow: ['warn', 'error'] }],
'no-debugger': 'error'
```

## File-Specific Overrides

### For test files (`*.spec.ts`, `*.test.tsx`)

- Set `env: { jest: true }`
- Allow `no-console` and `@typescript-eslint/no-explicit-any`

### For config files (`*.config.js`, `*.config.ts`)

- Allow `no-console`

### For JSON files

- Use `parser: 'jsonc-eslint-parser'`

## Nx-Specific Requirements

### ALWAYS enforce module boundaries

```javascript
'@nx/enforce-module-boundaries': ['error', {
  enforceBuildableLibDependency: true,
  depConstraints: [
    { sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }
  ]
}]
```

## Migration Checklist

When you encounter `.eslintignore` files:

1. Copy patterns to `ignorePatterns` in the config
2. Delete the `.eslintignore` file
3. Run `nx lint` to verify
4. Commit both changes together

## Commands to Run

### After any code changes

```bash
nx affected -t lint typecheck
```

### Before committing

```bash
nx run-many -t lint typecheck --all --parallel
```

### To verify no `.eslintignore` files exist

```bash
find . -name ".eslintignore"
```

## Quick Reference Summary

1. **NO `.eslintignore` files** - Use `ignorePatterns` only
2. **ALWAYS lint after changes** - `nx affected -t lint typecheck`
3. **ALWAYS fix all warnings/errors** - No exceptions
4. **ALWAYS use module boundaries** - `@nx/enforce-module-boundaries: 'error'`
5. **ALWAYS follow hierarchy** - Root config -> Project config
