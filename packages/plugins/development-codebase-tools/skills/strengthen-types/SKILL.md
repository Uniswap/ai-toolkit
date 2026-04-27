---
description: Audit and harden TypeScript type safety by finding and fixing weak typing patterns. Always use this skill whenever the user says "strengthen types", "improve TypeScript types", "fix any types", "type safety audit", "remove any from the codebase", "tighten TypeScript", "find unsafe casts", "harden types", "type hardening", "clean up TypeScript types", "get rid of type assertions", "fix non-null assertions", "improve type coverage", "find implicit any", "type-safe refactor", "add missing return types", "reduce ts-ignore", "eliminate type suppression", "TypeScript strict mode cleanup", "fix weak types", "find type holes", "our types are too loose", or any request to make the codebase more type-safe. Also trigger when the user is migrating to strict mode, preparing to enable `noImplicitAny` or `strictNullChecks`, or doing a type-quality pass before a major release.
allowed-tools: Read, Glob, Grep, Bash(npx tsc:*), Bash(npx eslint:*), Bash(npm run:*), Bash(find:*), Bash(git diff:*), Task
model: sonnet
---

# TypeScript Type Strengthener

Find weak typing patterns — `any`, unsafe casts, non-null assertions, missing return types — and produce a prioritized report with concrete fixes, so your TypeScript types actually protect you at runtime.

## When to Activate

- User wants to improve type safety across the codebase
- Preparing to enable `strict`, `noImplicitAny`, or `strictNullChecks` in tsconfig
- Type errors are appearing in places that "should" be typed
- Code review flagged `any`, `as`, or `!` usage
- Onboarding to a codebase and assessing type quality
- Pre-release type-quality pass

## Step 1: Confirm TypeScript and Read tsconfig

Check that the project uses TypeScript:

```bash
find . -name "tsconfig.json" -not -path "*/node_modules/*" -maxdepth 4
```

If no `tsconfig.json` is found, report that this skill requires a TypeScript project and stop.

Read the root `tsconfig.json` (and any `tsconfig.base.json` it extends) and note these flags:

| Flag                         | Current | Impact if enabled                                     |
| ---------------------------- | ------- | ----------------------------------------------------- |
| `strict`                     | ?       | Enables `noImplicitAny` + `strictNullChecks` + 5 more |
| `noImplicitAny`              | ?       | Errors on `any` inferred from missing annotations     |
| `strictNullChecks`           | ?       | Distinguishes `null`/`undefined` from other types     |
| `noImplicitReturns`          | ?       | Errors when not all code paths return a value         |
| `exactOptionalPropertyTypes` | ?       | Stricter optional property assignment                 |

Record which flags are already on and which are off — these are "free improvements" the project could unlock by adding a tsconfig line.

## Step 2: Run the TypeScript Compiler for Baseline Errors

Before scanning for weakness patterns, get the current baseline error count:

```bash
npx tsc --noEmit 2>&1 | tail -5
```

Note the error count. If errors > 0, mention this in the summary — type strengthening may surface additional errors or resolve existing ones.

If tsc is not available via npx, check for a build script:

```bash
npm run typecheck 2>&1 | tail -5   # common alias
npm run type-check 2>&1 | tail -5
npm run build 2>&1 | tail -5
```

## Step 3: Scan for Weak Typing Patterns

Run targeted grep searches to find each category. Search within the source directories (skip `node_modules/`, `dist/`, `.next/`, `build/`, `coverage/`).

Infer the source root from `tsconfig.json#include` / `tsconfig.json#rootDir`, or default to `src/`.

### Pattern inventory

**Explicit `any`** — the most common type escape hatch:

```bash
grep -rn ": any\b\|<any>\|Array<any>\|Promise<any>\|Record<string, any>" \
  src/ --include="*.ts" --include="*.tsx" -l | head -30
```

Count total occurrences separately from file count:

```bash
grep -rn ": any\b\|<any>\|Array<any>\|Promise<any>\|Record<string, any>" \
  src/ --include="*.ts" --include="*.tsx" | wc -l
```

**Type assertions (as-casts and angle-bracket casts)**:

```bash
grep -rn " as [A-Z]\| as unknown\| as any" \
  src/ --include="*.ts" --include="*.tsx" | grep -v "// " | head -30
```

Angle-bracket casts (not valid in `.tsx` but common in `.ts`):

```bash
grep -rn "<[A-Z][A-Za-z]*>" src/ --include="*.ts" | grep -v "import\|JSX\|React\|//\|describe\|test\|it(" | head -20
```

**Non-null assertions (`!`)**:

```bash
grep -rn "[a-zA-Z0-9_)]\![\.[(]" src/ --include="*.ts" --include="*.tsx" | head -30
```

**Type suppression comments**:

```bash
grep -rn "@ts-ignore\|@ts-expect-error\|@ts-nocheck" \
  src/ --include="*.ts" --include="*.tsx"
```

**Overly broad parameter types**:

```bash
grep -rn ": object\b\|: {}\|: Function\b\|: Object\b" \
  src/ --include="*.ts" --include="*.tsx" | head -20
```

**Missing return type on exported functions** (exported functions without an explicit return annotation are the highest-value targets because callers depend on their signature):

```bash
grep -rEn "^export (async )?function [a-zA-Z]" \
  src/ --include="*.ts" --include="*.tsx" | grep -v ": " | head -20
```

```bash
grep -rEn "^export const [a-zA-Z].*= (async )?\(" \
  src/ --include="*.ts" --include="*.tsx" | grep -v ": " | head -20
```

## Step 4: Classify Findings by Severity

Assign each finding a severity based on where it appears and what it silences:

### CRITICAL — type holes at trust boundaries

These are the most dangerous because incorrect types here propagate into the rest of the codebase and can produce runtime errors in data that was assumed safe.

- `any` in a function exported from `src/index.ts` or a public API surface file
- `as SomeType` cast applied directly to external/API/network data (fetch responses, JSON.parse results, contract call returns, event handler payloads)
- `any` as the declared type of a module-level variable used across multiple files
- `@ts-ignore` or `@ts-nocheck` in a file touched in the last 30 days (recently active, not legacy)

### HIGH — suppressions that hide real errors

These patterns silence a real TypeScript complaint rather than expressing a known-correct invariant.

- Non-null assertion (`!`) on values that realistically can be `null`/`undefined` (query results, DOM elements, optional object properties, map lookups)
- `as any` used as an intermediate step to cast between unrelated types (`foo as any as Bar`)
- Missing return type annotation on an exported function or class method (callers can't see contract changes)
- `@ts-expect-error` without a comment explaining why

### MEDIUM — internal type looseness

These weaken internal type safety but don't directly expose callers to incorrect types.

- `any` in a private function or internal utility
- `object` or `{}` as a parameter type (accepts anything — usually means the developer didn't know the shape yet)
- Non-null assertion on a value that is only null in edge cases that are tested
- Inferred `any` from an untyped third-party import (add `@types/*` or write a declaration file)

### LOW — refinement opportunities

These are technically correct but could be made more precise.

- Generic type parameters with no constraints (`<T>` on a function that only needs `<T extends string>`)
- `@ts-expect-error` on well-understood compatibility gaps (document with a comment and leave)
- `Record<string, any>` where a more specific value type is knowable
- Optional property used without a default that could be modeled as a required property + `| undefined`

## Step 5: Report

Output a severity-grouped report in this structure.

### TypeScript Type Safety Report

Start with a summary table:

```
Severity  │ Findings │ Files affected
──────────┼──────────┼───────────────
CRITICAL  │        N │             M
HIGH      │        N │             M
MEDIUM    │        N │             M
LOW       │        N │             M
──────────┼──────────┼───────────────
Total     │        N │             M

tsconfig strictness: [strict: off] [noImplicitAny: off] [strictNullChecks: on]
Baseline tsc errors: N
```

Then list findings grouped by severity, highest first. For each finding:

```
### [severity] src/api/parseResponse.ts:47

Current:
  const data = response.json() as UserData;

Problem: Type assertion on a network response — the actual shape is not verified. If the API changes, this silently accepts wrong data.

Suggested fix:
  import { z } from 'zod';
  const schema = z.object({ id: z.string(), name: z.string() });
  const data = schema.parse(await response.json()); // throws on mismatch

Rationale: Validate at the trust boundary; downstream code can rely on the type.
```

When a fix requires significant refactoring (e.g., replacing `any[]` in 15 files), give a summary fix strategy rather than a per-file patch — the user needs a plan, not a wall of diffs.

### Tsconfig Quick Wins

After the findings, list any disabled strict flags with a one-line description of what enabling them would catch:

```
## Tsconfig quick wins (zero code changes needed)

• noImplicitAny: true  — catches 12 inferred-any spots tsc found silently
• noImplicitReturns: true — ensures all function branches return explicitly
```

### ESLint Type-Aware Rules (if applicable)

If `@typescript-eslint/eslint-plugin` is installed, mention which rules would catch these patterns automatically:

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-non-null-assertion`
- `@typescript-eslint/explicit-module-boundary-types`

If none are configured, suggest adding `plugin:@typescript-eslint/recommended-requiring-type-checking` to the ESLint config.

## Step 6: Optional — Apply Safe Fixes (`--fix`)

If the user passes `--fix` or asks to apply the fixes, apply only the low-risk, mechanical improvements:

1. **Add missing return types** to exported functions where the return type is unambiguous (tsc can infer it — just make it explicit). Use `npx tsc --noEmit` before and after to confirm no regression.

2. **Replace `object` / `{}` parameter types** with `Record<string, unknown>` as an interim improvement when the shape is not yet known — this is safer and more honest than `object`.

3. **Convert `@ts-ignore` to `@ts-expect-error`** — `@ts-expect-error` fails if the suppressed error no longer exists, which catches suppressions that were fixed without removing the comment.

Do NOT automatically replace `as SomeType` casts or non-null assertions — these require understanding the runtime invariants and are unsafe to change mechanically.

After applying fixes, run `npx tsc --noEmit` and the project's test script to confirm nothing broke. Report the before/after error count.

## Options

| Flag               | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| `--target <path>`  | Limit scan to a subdirectory or package                                   |
| `--severity <lvl>` | Only report findings at this level and above (`critical`, `high`, etc.)   |
| `--fix`            | Apply safe mechanical fixes (return types, @ts-ignore → @ts-expect-error) |
| `--skip-tsc`       | Skip the baseline tsc check (faster, but loses error count context)       |
| `--exports-only`   | Only scan exported members (useful for library authors)                   |

## Usage Examples

Full type audit:

```
"Run a type safety audit on this codebase"
```

Scoped to a package:

```
"Strengthen the types in packages/sdk"
```

Before enabling strict mode:

```
"We want to turn on TypeScript strict mode — what do we need to fix first?"
```

With fixes:

```
"Find all the any types and fix what's safe to fix automatically"
```

Library API hardening:

```
"Our SDK's public API has too many any types — audit and fix just the exported members"
```
