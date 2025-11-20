# Commands TypeScript Library

## Purpose

TypeScript-specific command implementations and utilities for the AI Toolkit. Provides programmatic interfaces for slash commands that require TypeScript runtime features.

## Files

- `typescript.ts` - TypeScript command implementations and utilities

## typescript.ts

### Purpose

Implements TypeScript-specific command functionality that complements the language-agnostic command definitions in `@ai-toolkit/commands-agnostic`.

### Expected Content

TypeScript command implementations typically include:

1. **Type-safe command interfaces**

   ```typescript
   export interface CommandOptions {
     /* command-specific options */
   }

   export interface CommandResult {
     /* command execution result */
   }
   ```

2. **Runtime command execution**

   ```typescript
   export async function executeCommand(options: CommandOptions): Promise<CommandResult> {
     // TypeScript-specific implementation
   }
   ```

3. **TypeScript-specific utilities**
   - Type inference helpers
   - AST manipulation
   - Code generation
   - Type checking utilities

### Integration with Agnostic Commands

This package works alongside `@ai-toolkit/commands-agnostic`:

- **Agnostic**: Defines command behavior in markdown (language-agnostic)
- **TypeScript**: Provides TypeScript runtime implementation

Example:

```
@ai-toolkit/commands-agnostic/src/my-command.md
  ↓ defines behavior
@ai-toolkit/commands-typescript/src/lib/typescript.ts
  ↓ implements in TypeScript
```

### Usage

```typescript
import { executeCommand } from '@ai-toolkit/commands-typescript';

// Execute TypeScript-specific command
const result = await executeCommand({
  /* options */
});
```

## Development

### Adding TypeScript Command Implementations

1. **Determine if TypeScript-specific**:

   - Requires TypeScript compiler API?
   - Needs type system features?
   - Runtime TypeScript features?

2. **Implement in typescript.ts**:

   ```typescript
   export async function myTypeScriptCommand(options: MyCommandOptions): Promise<MyCommandResult> {
     // Implementation using TypeScript features
   }
   ```

3. **Export from index**:

   ```typescript
   // src/index.ts
   export * from './lib/typescript';
   ```

4. **Add tests**:

   ```typescript
   // src/lib/typescript.spec.ts
   describe('myTypeScriptCommand', () => {
     it('should execute command', async () => {});
     it('should handle TypeScript-specific features', async () => {});
   });
   ```

### TypeScript Compiler API Usage

If using TypeScript compiler API:

```typescript
import * as ts from 'typescript';

// Create program
const program = ts.createProgram(fileNames, compilerOptions);

// Get type checker
const checker = program.getTypeChecker();

// Analyze types
const sourceFile = program.getSourceFile(fileName);
ts.forEachChild(sourceFile, visit);
```

### Testing Patterns

```typescript
describe('TypeScript Commands', () => {
  describe('myCommand', () => {
    it('should handle TypeScript files', async () => {
      const result = await myCommand({
        file: 'test.ts',
      });
      expect(result.success).toBe(true);
    });

    it('should utilize type information', async () => {
      // Test type-aware functionality
    });
  });
});
```

## Usage in Commands

TypeScript implementations are invoked by slash commands:

```markdown
<!-- In @ai-toolkit/commands-agnostic/src/my-command.md -->

# My Command

When executing this command for TypeScript files, the system will use the
TypeScript-specific implementation from @ai-toolkit/commands-typescript.
```

## Relationship with Other Packages

```
@ai-toolkit/commands-agnostic (markdown definitions)
  ↓ defines
Claude Code slash commands
  ↓ invokes
@ai-toolkit/commands-typescript (runtime implementation)
  ↓ uses
@ai-toolkit/utils (shared utilities)
```

## Related Documentation

- Parent package: `../../CLAUDE.md`
- Agnostic commands: `../../../agnostic/src/CLAUDE.md`
- Package index: `../index.ts`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
