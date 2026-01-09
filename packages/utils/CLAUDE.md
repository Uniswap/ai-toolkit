# Utils

## Overview

Shared utility functions library for the AI Toolkit monorepo. Provides common helpers, type definitions, and tools used across multiple packages.

## Key Commands

- `nx build @ai-toolkit/utils` - Compile TypeScript to JavaScript with type definitions
- `nx test @ai-toolkit/utils` - Run unit tests

## Key Files

- `src/index.ts` - Main exports
- `src/lib/utils.ts` - Core utility functions
- `src/lib/generate-index.ts` - Index file generation utilities
- `src/lib/numerical-integration.ts` - Numerical integration utilities

## Dependencies

<!-- AUTO-GENERATED - Updated by /update-claude-md -->

- **tslib** (^2.3.0) - TypeScript helper library for compiled output

## Usage

Import utilities across the workspace:

```typescript
import { ... } from '@ai-toolkit/utils';
```

### Numerical Integration

The package provides numerical integration utilities for computing definite integrals of numerical data:

```typescript
import {
  integrate,
  trapezoidalIntegral,
  simpsonsIntegral,
  cumulativeIntegral,
} from '@ai-toolkit/utils';

// Basic usage with y-values (uniform spacing, dx = 1)
const result = integrate([0, 1, 4, 9, 16]); // Integral of y = x^2

// Custom spacing
trapezoidalIntegral([0, 1, 4], { dx: 0.5, x0: 0 });

// With explicit (x, y) points
simpsonsIntegral([
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 4 },
]);

// Cumulative integral at each point
const cumulative = cumulativeIntegral([0, 1, 4, 9]); // [0, 0.5, 3, 9.5]
```

**Available methods:**

- `integrate()` - Auto-selects best method based on data
- `trapezoidalIntegral()` - First-order accurate, works with any data
- `simpsonsIntegral()` - Fourth-order accurate for smooth, uniform data
- `cumulativeIntegral()` - Returns integral value at each point

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
