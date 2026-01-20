# Exploration Guide

## Exploration Strategies by Context

### Understanding a Feature

1. Search for entry points (routes, handlers, components)
2. Trace data flow from input to output
3. Identify state management patterns
4. Map external dependencies
5. Find related tests for behavior documentation

### Understanding Architecture

1. Start with project structure (CLAUDE.md, README)
2. Identify architectural layers
3. Map dependency graph
4. Find configuration files
5. Trace cross-cutting concerns

### Finding Implementation

1. Search by function/class name
2. Search by error messages or strings
3. Trace imports and exports
4. Follow the type definitions
5. Check git history for context

### Pre-Implementation Research

1. Find similar existing implementations
2. Identify patterns to follow
3. Map files that will need changes
4. Understand testing approach
5. Note integration requirements

## Search Patterns

### Glob Patterns

```bash
# Find all TypeScript files in a feature
src/features/auth/**/*.ts

# Find all test files
**/*.test.ts
**/*.spec.ts

# Find configuration files
**/config*.ts
**/*.config.js
```

### Grep Patterns

```bash
# Find function definitions
"function functionName"
"const functionName ="

# Find class definitions
"class ClassName"

# Find imports
"from 'module'"
"import.*module"

# Find usage
"functionName("
"ClassName."
```

## Output Templates

### Feature Exploration

```yaml
feature: [name]
entry_points:
  - file: [path]
    type: [route|component|handler]

core_files:
  - path: [file path]
    responsibility: [what it does]

patterns_used:
  - [pattern name]: [how it's applied]

dependencies:
  internal: [list]
  external: [list]

data_flow:
  input: [where data comes from]
  processing: [transformation steps]
  output: [where results go]

testing:
  approach: [how tests are structured]
  coverage: [areas covered]
```

### Architecture Exploration

```yaml
layers:
  - name: [layer name]
    purpose: [what it does]
    key_files: [list]

boundaries:
  - [what can't cross what]

patterns:
  - name: [pattern]
    usage: [where/how]

conventions:
  - [convention description]
```

## Integration with Planning

After exploration, the following context should be preserved for planning:

- Key files to modify
- Patterns to follow
- Dependencies to consider
- Testing approach to use
- Gotchas to avoid

This context automatically flows to the `plan-implementation` skill when invoked in the same session.
