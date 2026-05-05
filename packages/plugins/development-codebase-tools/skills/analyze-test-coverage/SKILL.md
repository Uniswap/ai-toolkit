---
description: Analyze test coverage gaps and prioritize what to test next. Use this skill whenever the user says "analyze test coverage", "what's our test coverage", "find gaps in test coverage", "which code isn't tested", "improve test coverage", "show me a coverage report", "coverage analysis", "where are we missing tests", "what's untested", "test coverage audit", or asks about coverage percentages or uncovered files. Also trigger when the user asks which areas to focus testing efforts on, or when they want to know what the test-writer agent should work on next.
allowed-tools: Read, Glob, Grep, Bash(npm test:*), Bash(npm run:*), Bash(npx vitest:*), Bash(npx jest:*), Bash(npx c8:*), Bash(python -m pytest:*), Bash(go test:*), Bash(mvn:*), Bash(gradle:*), Bash(./gradlew:*), Task(subagent_type:test-writer-agent)
model: sonnet
---

# Test Coverage Analyzer

Measure where tests are missing, identify high-impact coverage gaps, and produce a prioritized action list — so the next test-writing session targets the code that matters most.

## When to Activate

- User asks about test coverage or coverage percentages
- User wants to know which code isn't tested
- User wants to find the highest-priority testing gaps
- User is planning a testing sprint and needs direction
- User asks what to pass to the test-writer agent

## Step 1: Detect Project Setup

Scan the project to identify language, test framework, and coverage tooling:

**Language / framework detection (check in order):**

| Signal file                                           | Stack                  | Coverage command                                                               |
| ----------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `vitest.config.*` or `vite.config.*` with test key    | TypeScript/JS + Vitest | `npx vitest run --coverage`                                                    |
| `jest.config.*` or `"jest"` in package.json           | TypeScript/JS + Jest   | `npx jest --coverage --coverageReporters=json-summary,text`                    |
| `pyproject.toml` with `[tool.pytest]` or `pytest.ini` | Python + pytest        | `python -m pytest --cov --cov-report=term-missing --cov-report=json`           |
| `go.mod`                                              | Go                     | `go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out` |
| `pom.xml`                                             | Java + Maven/JaCoCo    | `mvn test jacoco:report -q`                                                    |
| `build.gradle`                                        | Java + Gradle          | `./gradlew test jacocoTestReport`                                              |

If multiple frameworks are detected (monorepo), scan for the subpackages and handle each separately.

Check for existing coverage reports before running tools — they may be fresh:

- `.coverage`, `coverage.json`, `coverage-summary.json`, `lcov.info`, `coverage.out` in common locations

## Step 2: Run Coverage

Run the coverage command detected in Step 1. If you can't determine the command, check `package.json` scripts for a `coverage`, `test:coverage`, or `test:cov` target and run that.

**Important:** Run from the directory that contains the test config, not necessarily the repo root.

If the coverage run fails (compilation error, missing deps, no tests), report the failure clearly with the exact error — don't silently skip. A project with zero passing tests is itself a critical finding.

## Step 3: Parse the Report

Extract file-level coverage data from whichever output format was produced:

- **JSON summary** (`coverage-summary.json`): Read `total` and per-file `statements`, `branches`, `functions`, `lines` percentages
- **LCOV** (`lcov.info`): Parse `DA:` (line hit/missed) and `BRH:` (branch hit/missed) records
- **Go text output**: Parse `func coverage: X%` per package
- **Terminal text** (pytest `--cov-report=term-missing`): Extract file paths and uncovered line ranges from the `MISS` column

Build a table of files with their line coverage %, branch coverage %, and uncovered line ranges.

## Step 4: Score and Rank Coverage Gaps

Don't sort by raw line count. Sort by **criticality of what's untested**:

**Criticality signals (check each uncovered file/function for these):**

1. **Public API surface** — exported functions, class methods, REST/GraphQL handlers, CLI entry points. These are contracts that callers depend on.
2. **Error-handling branches** — `catch` blocks, error returns, fallback paths. Untested error paths are where production incidents hide.
3. **Business logic density** — files in `src/`, `lib/`, `domain/`, or `core/` with conditionals and state transformations. High cyclomatic complexity + low coverage = high risk.
4. **Data boundaries** — input parsers, validators, serializers/deserializers. Untested boundary code produces silent corruption.
5. **Security-adjacent code** — auth, permissions, rate-limiting, token handling.

**Scoring heuristic (per file):**

- Start with `(100 - line_coverage) * 0.5 + (100 - branch_coverage) * 0.5` as a base gap score
- Multiply by 2× if the file exports public symbols
- Multiply by 1.5× if the file contains `catch`, `error`, or `fallback` handlers
- Multiply by 1.5× if the file path matches `auth`, `security`, `permission`, `token`, `payment`
- Sort descending by final score

## Step 5: Report

Output two sections:

### Coverage Summary

```
Overall: statements X%, branches X%, functions X%, lines X%
Files scanned: N  |  Files at 0% coverage: M
```

Include a small table of the 10 worst-covered files (by raw line coverage), as context.

### Prioritized Gap List

For the **top 10 files by criticality score**, output:

```
## 1. src/auth/token-validator.ts  (branch coverage: 34%)
   Uncovered: lines 45-67 (error path when token is expired), line 89 (refresh failure branch)
   Why it matters: exported validateToken() is called at every API boundary; untested expiry/refresh paths are a common incident vector
   Suggested test: unit test for expired token, forged token, and refresh-failure scenarios
```

Adjust the "why it matters" explanation based on the criticality signals found in Step 4.

If any file has **0% coverage** and is in the public API or business logic layer, call it out prominently at the top as a critical gap regardless of its ranked position.

## Step 6: Optional — Delegate to Test Writer

If the user asks to also generate tests (e.g., "and write the tests" or "fix the top 3"), invoke the test-writer agent for the top N files from the prioritized list:

Pass the agent:

- The file path
- The uncovered lines/branches identified above
- The "why it matters" context
- A note to focus on the error paths and branching scenarios, not just happy-path coverage

## Options

| Flag                 | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `--target <path>`    | Limit analysis to a subdirectory or file                        |
| `--min-coverage <N>` | Only report files below N% (default: 80)                        |
| `--top <N>`          | How many files to include in the prioritized list (default: 10) |
| `--fix`              | After reporting, invoke test-writer for the top 3 gaps          |
| `--skip-run`         | Skip running coverage tools; parse existing reports only        |
