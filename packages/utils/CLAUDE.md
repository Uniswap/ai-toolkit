# Utils

## Overview

Shared utility functions library for the AI Toolkit monorepo. Provides common helpers, type definitions, and tools used across multiple packages.

## Key Commands

- `nx build @ai-toolkit/utils` - Compile TypeScript to JavaScript with type definitions

## Key Files

- `src/index.ts` - Main exports
- `src/lib/utils.ts` - Core utility functions
- `src/lib/generate-index.ts` - Index file generation utilities

## Dependencies

<!-- AUTO-GENERATED - Updated by /update-claude-md -->

- **tslib** (^2.3.0) - TypeScript helper library for compiled output

## Usage

Import utilities across the workspace:

```typescript
import { ... } from '@ai-toolkit/utils';
```

## Development

### Building

```bash
nx build @ai-toolkit/utils
```

Outputs to `packages/utils/dist/` with:

- Compiled JavaScript (`.js`)
- Type definitions (`.d.ts`)
- Source maps

### Local Development

Use TypeScript path mapping for immediate consumption:

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

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory or subdirectories, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
