---
description: Find and remove dead code — unused exports, unreachable modules, and stale files. Always use this skill whenever the user says "find dead code", "remove unused code", "clean up unused exports", "what code can we delete", "detect unreachable code", "what files are no longer used", "prune dead code", "unused exports cleanup", "find unused variables or functions", "what's safe to delete", "trim the codebase", "find unused imports", "identify unused dependencies", "dead code audit", or asks which symbols, files, or packages can be safely removed. Also trigger when the user is preparing a major refactor or cleanup sprint and wants to reduce surface area first.
allowed-tools: Read, Glob, Grep, Bash(npx knip:*), Bash(npx ts-prune:*), Bash(npx depcheck:*), Bash(python -m vulture:*), Bash(go build:*), Bash(deadcode:*), Bash(npm run:*), Bash(find:*), Bash(git log:*)
model: sonnet
---

# Dead Code Analyzer

Find unused exports, unreachable modules, and dead files across your codebase — so cleanup is targeted and confident, not a guessing game.

## When to Activate

- User wants to know what code can be safely deleted
- Pre-refactoring cleanup to reduce surface area before making changes
- Post-feature-removal to find leftover artifacts
- Bundle size or maintenance burden is growing and unused code may be responsible
- Preparing a cleanup sprint and need to prioritize what to remove

## Step 1: Detect Stack and Choose Scanner

Scan the project to determine language and which dead code tool to use:

| Signal file                                   | Stack      | Preferred scanner                         |
| --------------------------------------------- | ---------- | ----------------------------------------- |
| `tsconfig.json` or `*.ts` files               | TypeScript | `knip` (preferred), `ts-prune` (fallback) |
| `package.json` without TypeScript             | JavaScript | `knip`                                    |
| `pyproject.toml`, `setup.py`, or `*.py` files | Python     | `vulture`                                 |
| `go.mod`                                      | Go         | `deadcode` or `go vet`                    |

Check for existing scanner config files (`knip.json`, `knip.config.ts`, `.knip.json`) — if found, use them as-is so project customizations are respected.

Verify the preferred tool is available before running:

```
npx knip --version   # TypeScript/JavaScript
python -m vulture --version  # Python
deadcode -version    # Go
```

If no scanner is available and installing isn't appropriate, fall back to static grep analysis (Step 2b below).

## Step 2: Run the Scanner

### 2a: With a Scanner

**knip** (preferred for TypeScript/JavaScript):

```bash
npx knip --reporter json 2>/dev/null
```

If JSON output fails or produces errors, run without `--reporter json` and parse text output.

**ts-prune** (TypeScript fallback):

```bash
npx ts-prune 2>/dev/null
```

Ignore lines containing `(used in module)` — those are internal usages. Only report symbols not referenced outside their declaring file.

**vulture** (Python):

```bash
python -m vulture . --min-confidence 80 2>/dev/null
```

**deadcode / go vet** (Go):

```bash
deadcode -test ./... 2>/dev/null || go build ./... 2>&1 | grep "declared and not used"
```

### 2b: Static Grep Fallback

When no scanner is available, use grep to find exported symbols that are never imported:

- For TypeScript/JavaScript: search for `export (const|function|class|type|interface)` declarations in `src/`, `lib/`, `packages/` directories, then grep for each name across the rest of the codebase to check if it's imported anywhere.
- Limit the search to files in main source directories to reduce noise from test fixtures and generated files.

This approach has higher false positive rates than dedicated tools — annotate findings with `[review before removing]` accordingly.

## Step 3: Classify Findings

Group scanner output into three categories. Understanding the category helps developers decide how aggressively to act.

**Unused exports** — Symbols declared with `export` that are never imported anywhere in the project. These are the highest-confidence removals: the symbol was intended for reuse but nothing consumes it.

**Unused files** — Entire source files not reachable from any entry point. Before flagging as dead, verify the entry points the scanner used (check `package.json#main`, `package.json#exports`, `tsconfig.json#include`, and framework conventions like Next.js pages or Vite entry points). Entry-point misconfiguration is a common source of false positives here.

**Unused dependencies** — Packages listed in `package.json#dependencies` or `devDependencies` with no references in source. Run `npx depcheck` to surface these if not already included in the main scanner's output.

For each finding, check git recency to inform confidence. A file last touched 18 months ago with zero recent activity is a stronger removal candidate than one touched last week:

```bash
git log --oneline -3 -- <file-path>
```

## Step 4: Filter False Positives

Dead code detectors flag things that are legitimately "unused by static analysis" but are used at runtime. Before reporting, screen each finding for these patterns and downgrade confidence when found:

- **Dynamic imports**: `require(variable)`, `import(expression)` — the scanner can't trace the runtime path
- **Barrel re-exports**: `index.ts` files that re-export symbols for external package consumers
- **Test helpers and fixtures**: modules used by test runners but not imported as code
- **Type-only exports**: TypeScript `interface` / `type` used by downstream packages via `.d.ts` files
- **Framework conventions**: Next.js page components, Vite plugins, Express middleware — consumed by name convention rather than import
- **CLI binaries**: scripts registered in `package.json#bin`

Mark findings that match any of these with `[review before removing]` in the report. Mark findings with none of these signals as `[safe to remove]`.

## Step 5: Report

Output a structured report in two sections.

### Dead Code Summary

```
Unused exports:     N symbols across M files
Unused files:       P files
Unused packages:    R packages
Estimated removable lines: ~S lines
```

### Findings by Confidence

List findings sorted by confidence level (high first), then by cleanup value (largest files and most symbols first within each level):

```
## High confidence (safe to remove)

### src/utils/legacyFormatter.ts — entire file unused
   Last commit: 2024-03-15 (14 months ago)
   Exported symbols: formatLegacyDate, parseLegacyTimestamp, LEGACY_FORMATS
   Action: Delete file; remove any imports in src/index.ts

### src/api/v1Routes.ts — 4 of 6 exports unused
   Unused: handleV1Swap, buildV1Quote, V1_ROUTE_MAP, routeV1Request
   Used:   formatV1Error, V1_ERROR_CODES (keep these)
   Action: Remove the 4 unused exports; keep the file

## Review before removing (potential false positives)

### src/types/externalContract.ts — all exports unused internally
   Reason: re-export barrel; may be consumed by external packages via package.json#exports
   Action: Confirm with package maintainer before removing
```

If any file has been fully unused for 6+ months and sits in a core source directory, call it out prominently — it's the highest-value cleanup target regardless of its ranked position.

### Unused Dependencies

```
Remove from dependencies:    lodash, uuid, moment
Remove from devDependencies: @types/moment, ts-jest
Command: npm uninstall lodash uuid moment @types/moment ts-jest
```

## Step 6: Optional — Generate Removal Plan

If the user asks to also generate a cleanup plan ("and remove them", "give me a plan", "how do I clean this up"), produce an ordered removal sequence that minimizes the chance of introducing breakage:

1. Remove unused `devDependencies` first — no runtime impact
2. Uninstall unused `dependencies` after confirming no dynamic `require()` calls reference them
3. Delete fully-unused files starting with leaf modules (files that no other file imports)
4. Remove unused exports from files that have a mix of used and unused symbols

Output the sequence as a numbered checklist the developer can execute one step at a time. Each step should take less than 5 minutes — don't bundle too much into one step.

## Options

| Flag              | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `--target <path>` | Limit scan to a subdirectory or package                              |
| `--tool <name>`   | Force a specific scanner (`knip`, `ts-prune`, `vulture`, `deadcode`) |
| `--include-deps`  | Also scan `package.json` dependencies (runs `depcheck`)              |
| `--skip-git`      | Skip git-log recency checks                                          |
| `--fix`           | After reporting, generate a prioritized removal plan                 |

## Usage Examples

Full codebase scan:

```
"Find all dead code in this project"
```

Scoped to a subdirectory:

```
"What unused exports are in the packages/core directory?"
```

With cleanup plan:

```
"Audit dead code and give me a removal plan I can follow"
```

Pre-refactor sweep:

```
"I'm about to refactor the auth module — what unused code should I remove first?"
```
