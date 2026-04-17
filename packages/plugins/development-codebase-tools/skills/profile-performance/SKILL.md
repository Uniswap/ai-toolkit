---
description: Profile and analyze application performance to identify bottlenecks. Use when user says "profile performance", "find performance bottlenecks", "why is this slow", "optimize runtime performance", "identify CPU hotspots", "analyze memory usage", "benchmark this code", or "performance profiling".
allowed-tools: Read, Glob, Grep, Bash(node:*), Bash(npx:*), Bash(python:*), Bash(python3:*), Bash(pip:*), Bash(go:*), Bash(cargo:*), Bash(hyperfine:*), Task(subagent_type:performance-analyzer)
model: sonnet
---

# Performance Profiler

Profile application performance through static analysis and tool-assisted measurement to identify bottlenecks with actionable optimization guidance.

## When to Activate

- User reports slowness or latency issues
- User asks to "profile", "benchmark", or "optimize" performance
- User wants to find CPU hotspots or memory leaks
- Before/after a performance-sensitive change
- User asks "why is this slow?" about code or a feature

## Quick Process

1. **Detect stack**: Identify language, framework, and runtime from project files
2. **Static scan**: Find performance anti-patterns without running the code
3. **Tool detection**: Check for available profilers and benchmarking tools
4. **Profile**: Run available tools on the target (with user confirmation for long-running operations)
5. **Report**: Output findings grouped by severity with specific fix guidance

## Step 1: Stack Detection

Glob for `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`, `pom.xml`, `build.gradle`.
Read the detected files to identify:

- **Language**: JavaScript/TypeScript, Python, Go, Rust, Ruby, Java/Kotlin
- **Framework**: React, Next.js, Express, FastAPI, Django, Gin, Actix, etc.
- **Runtime characteristics**: Node.js (event loop), Python (GIL), Go (goroutines), etc.

## Step 2: Static Analysis

Scan source files for language-specific performance anti-patterns.

### JavaScript / TypeScript

| Anti-Pattern                        | Detection                                                      | Severity |
| ----------------------------------- | -------------------------------------------------------------- | -------- |
| Nested loops over large arrays      | `for` inside `for` with array operands > O(n²) risk            | High     |
| Array operations in render loops    | `.map`, `.filter`, `.find` called inside JSX without memoize   | High     |
| Missing React.memo / useMemo        | Components/computations recreated on every parent render       | Medium   |
| `await` inside `for` loop           | Sequential async when parallelizable with `Promise.all`        | High     |
| Unindexed object lookups in loops   | `Array.includes` or `Array.find` in hot loops (prefer Set/Map) | Medium   |
| Synchronous `fs` calls in handlers  | `readFileSync`, `writeFileSync` in request handlers            | High     |
| Missing debounce on frequent events | `onInput`, `onScroll`, `onResize` without debounce/throttle    | Medium   |
| Large bundle imports                | `import _ from 'lodash'` vs `import pick from 'lodash/pick'`   | Medium   |
| Memory leaks in effects             | `useEffect` with subscriptions missing cleanup return          | High     |
| Excessive re-renders                | State updates inside render, missing dependency arrays         | Medium   |

```bash
# Example grep patterns for static detection
grep -rn "for.*of.*\n.*for\|\.map.*\.map" src/
grep -rn "readFileSync\|writeFileSync" src/
grep -rn "await.*for\b" src/ --include="*.ts" --include="*.js"
```

### Python

| Anti-Pattern                       | Detection                                               | Severity |
| ---------------------------------- | ------------------------------------------------------- | -------- |
| Nested loops over lists            | `for` inside `for` — prefer numpy/vectorized ops        | High     |
| String concatenation in loops      | `str +=` inside loop — use `''.join(list)`              | Medium   |
| `global` or `nonlocal` in hot path | Global variable lookups are slower than local           | Low      |
| Missing `__slots__`                | Classes with many instances benefit from `__slots__`    | Low      |
| Repeated attribute lookups         | `obj.method()` in loop — cache as local variable        | Medium   |
| Synchronous I/O in async context   | Blocking calls in `async def` without `run_in_executor` | High     |
| N+1 ORM queries                    | `.filter()` inside loop instead of select_related       | High     |

### Go

| Anti-Pattern                  | Detection                                          | Severity |
| ----------------------------- | -------------------------------------------------- | -------- |
| Lock contention in hot paths  | `sync.Mutex.Lock()` in high-throughput loops       | High     |
| Goroutine leaks               | Goroutines started without done channel or context | High     |
| Excessive allocations         | `append` without pre-allocated slice capacity      | Medium   |
| String/[]byte conversions     | Repeated `string(bytes)` in loops                  | Medium   |
| Interface boxing in hot paths | Passing concrete types as `interface{}` repeatedly | Low      |

### Cross-Language: Database / API Patterns

| Anti-Pattern                | Detection                                                        | Severity |
| --------------------------- | ---------------------------------------------------------------- | -------- |
| N+1 queries                 | DB query inside a loop; ORM `.load()` in iteration               | Critical |
| Missing pagination          | Unbounded `SELECT *` / list API calls without `LIMIT`            | High     |
| Unindexed query filters     | `WHERE` on columns not in schema indexes (check migration files) | High     |
| Waterfall API requests      | Sequential `fetch`/`axios` calls that could be parallelized      | Medium   |
| Large payload serialization | Serializing full objects when only a few fields are needed       | Medium   |

## Step 3: Tool Detection

Check for available profiling and benchmarking tools:

```bash
# Node.js / JavaScript
npx clinic --version 2>/dev/null && echo "clinic.js available"
npx 0x --version 2>/dev/null && echo "0x available"
node --prof --version 2>/dev/null && echo "node --prof available"

# Python
python3 -c "import cProfile" 2>/dev/null && echo "cProfile available"
python3 -m py_spy --version 2>/dev/null && echo "py-spy available"

# Go
which pprof 2>/dev/null && echo "pprof available"
go test -bench . -benchtime=1x . 2>/dev/null && echo "go bench available"

# Universal benchmarking
hyperfine --version 2>/dev/null && echo "hyperfine available"
```

## Step 4: Profile (Optional)

> Only run profiling tools after confirming with the user — they may have side effects or require a running server.

### Node.js — clinic.js (preferred)

```bash
npx clinic doctor -- node server.js
# or for flame graphs:
npx clinic flame -- node server.js
```

Parse the generated report directory and summarize:

- Top CPU consumers (functions and file paths)
- Event loop delay spikes
- Memory growth patterns

### Node.js — V8 built-in profiler

```bash
node --prof app.js
node --prof-process isolate-*.log > profile.txt
```

Read `profile.txt` and extract the top 10 functions by tick count.

### Python — cProfile

```bash
python3 -m cProfile -o profile.out -s cumulative script.py
python3 -c "import pstats; p = pstats.Stats('profile.out'); p.sort_stats('cumulative'); p.print_stats(20)"
```

Report top 20 functions by cumulative time.

### Go — pprof

```bash
go test -bench . -cpuprofile=cpu.prof ./...
go tool pprof -top cpu.prof
```

Extract top 10 CPU-consuming functions.

### Universal — hyperfine

```bash
hyperfine --warmup 3 'command-under-test'
```

Use for before/after benchmarking of CLI commands or scripts.

## Step 5: Report

Output findings grouped by severity.

### Critical (fix immediately)

N+1 query patterns, unbounded queries, blocking I/O in async handlers.

### High (fix this sprint)

Sequential async that should be parallel, nested loops over large data, goroutine leaks, memory leaks.

### Medium (schedule for cleanup)

Missing memoization, unoptimized imports, string concatenation in loops.

### Low (low-hanging fruit when touching the code)

Local variable caching, `__slots__`, minor allocation improvements.

---

For each finding output:

```
[SEVERITY] <Anti-Pattern Name>
File: <path>:<line>
Issue: <one-line description>
Fix:
  <concrete code change or command>
Expected impact: <e.g., "reduces render time by ~30%", "eliminates N+1 query">
```

### Summary Table

```
Performance Profile Summary
───────────────────────────
Critical: N  High: N  Medium: N  Low: N

Top 3 recommendations:
1. [Critical] Fix N+1 query in UserService.getAll() → add .include('posts')
2. [High] Parallelize 4 sequential API calls in checkout flow → Promise.all(...)
3. [Medium] Memoize ProductList component → React.memo() wrapper
```

## Guidelines

- Always prefer static analysis findings over running profilers — safer and faster
- If no profiler is available, note what to install and how to interpret results
- For React apps, check if React DevTools Profiler has existing recordings before running tools
- Quantify impact where possible: "this loop runs O(n²) on the users array (currently 50k rows)"
- When a profiler requires a running server, provide the exact command and what to do next
- Never run load tests (k6, Artillery) automatically — only suggest them with the exact command
