# Utils Library

## Purpose

Core utility functions and helpers used across the AI Toolkit monorepo. Provides shared functionality for file operations, index generation, and common transformations.

## Files

- `utils.ts` - General utility functions
- `generate-index.ts` - Index file generation utilities

## utils.ts

### Purpose

General-purpose utility functions for common operations.

### Exported Functions

[TODO: Document specific utility functions - read utils.ts to identify exports]

### Common Patterns

- File system operations
- String transformations
- Path manipulation
- Type guards and validators
- Error handling utilities

## generate-index.ts

### Purpose

Automatically generate index files (index.ts, index.js) for directories to simplify imports and exports.

### Usage

```typescript
import { generateIndex } from '@ai-toolkit/utils';

// Generate index for a directory
await generateIndex('/path/to/directory');

// Generate with options
await generateIndex('/path/to/directory', {
  filePattern: '*.ts',
  excludePatterns: ['*.spec.ts', '*.test.ts'],
  exportStyle: 'named', // 'named' | 'default' | 'all'
});
```

### Features

- Scans directory for exportable files
- Excludes test files and specifications
- Generates named or wildcard exports
- Preserves existing custom exports
- Updates index files automatically

### Generated Output

Example generated index.ts:

```typescript
// Auto-generated index file
// Do not modify manually

export * from './file1';
export * from './file2';
export * from './file3';
```

## Development

### Adding New Utilities

1. **Determine scope**:

   - General utilities → Add to `utils.ts`
   - Specialized utilities → Create new file (e.g., `string-utils.ts`)

2. **Implementation**:

   ```typescript
   /**
    * Clear description of what this utility does
    * @param param1 - Description of parameter
    * @returns Description of return value
    */
   export function myUtility(param1: string): string {
     // Implementation
   }
   ```

3. **Export from index**:

   ```typescript
   // src/index.ts
   export * from './lib/utils';
   export * from './lib/my-new-util';
   ```

4. **Add tests**:

   ```typescript
   // src/lib/utils.spec.ts
   describe('myUtility', () => {
     it('should handle basic case', () => {});
     it('should handle edge cases', () => {});
   });
   ```

5. **Update documentation**:
   - Document function in code comments
   - Add to this CLAUDE.md file
   - Update parent package CLAUDE.md if significant

### Testing Patterns

```typescript
import { myUtility } from './utils';

describe('Utils', () => {
  describe('myUtility', () => {
    it('should transform input correctly', () => {
      expect(myUtility('input')).toBe('expected');
    });

    it('should handle null/undefined', () => {
      expect(myUtility(null)).toBe(null);
    });

    it('should throw on invalid input', () => {
      expect(() => myUtility('invalid')).toThrow();
    });
  });
});
```

## Usage Across Workspace

### Importing

```typescript
// In other packages
import { generateIndex, myUtility } from '@ai-toolkit/utils';
```

### TypeScript Configuration

Workspace uses path mapping for development:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@ai-toolkit/utils": ["packages/utils/src/index.ts"]
    }
  }
}
```

### Build Output

After building:

```
packages/utils/dist/
├── src/
│   ├── index.js
│   ├── index.d.ts
│   └── lib/
│       ├── utils.js
│       ├── utils.d.ts
│       ├── generate-index.js
│       └── generate-index.d.ts
└── package.json
```

## Best Practices

### Function Design

- **Single responsibility**: Each function does one thing well
- **Pure functions**: Avoid side effects when possible
- **Type safety**: Use TypeScript types strictly
- **Documentation**: Clear JSDoc comments
- **Error handling**: Consistent error patterns

### Naming Conventions

- **Functions**: Verb-based names (`generateIndex`, `parseFile`)
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase
- **Interfaces**: PascalCase with descriptive names

### Performance

- Avoid unnecessary computations
- Use efficient algorithms
- Consider lazy evaluation
- Cache expensive operations
- Profile before optimizing

## Related Documentation

- Parent package: `../../CLAUDE.md`
- Package exports: `../index.ts`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
