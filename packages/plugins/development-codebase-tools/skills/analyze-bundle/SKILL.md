---
description: Analyze web application bundle size to find what's making it large and how to shrink it. Always use this skill whenever the user says "analyze the bundle", "what's making my bundle large", "bundle size analysis", "check my webpack output", "why is my app so big", "find heavy dependencies", "optimize the bundle", "check my Vite build size", "bundle is too large", "reduce my JS bundle", "find large modules", "tree-shaking opportunities", "what dependencies are bloating the bundle", "bundle report", "check build output size", "source map analysis", or asks to audit build artifacts for size. Also trigger when the user sees slow initial page load and suspects large JavaScript as the cause.
allowed-tools: Read, Glob, Grep, Bash(find:*), Bash(du:*), Bash(ls:*), Bash(cat:*), Bash(npx vite-bundle-visualizer:*), Bash(npx source-map-explorer:*), Bash(npx webpack-bundle-analyzer:*), Bash(npx bundlephobia:*), Bash(npm run:*), Bash(npx vite build:*), Bash(npx rollup:*), Bash(node:*), Bash(jq:*)
model: sonnet
---

# Bundle Analyzer

Identify what's inflating your web application's bundle, trace it to specific dependencies and import patterns, and produce a prioritized list of optimizations with estimated size savings.

## When to Activate

- User wants to understand what's making their bundle large
- Initial page load is slow and JavaScript bundle size may be a factor
- Before or after a dependency update to measure size impact
- CI is flagging a bundle size regression
- Preparing to ship a performance improvement and need a baseline
- Code-splitting, lazy loading, or tree-shaking improvements are being planned

## Step 1: Detect Bundler and Stack

Scan for config files to identify the bundler and framework:

| Signal file                              | Bundler             | Analysis approach                                                        |
| ---------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `vite.config.ts` / `vite.config.js`      | Vite                | Build with `--report` or `vite-bundle-visualizer`                        |
| `webpack.config.*`                       | Webpack             | `webpack-bundle-analyzer` via stats JSON                                 |
| `next.config.*`                          | Next.js (Webpack)   | `@next/bundle-analyzer` or source-map-explorer on `.next/static/chunks/` |
| `rollup.config.*`                        | Rollup              | Build with `rollup-plugin-visualizer`                                    |
| `esbuild.config.*` or esbuild in scripts | esbuild             | `--metafile` flag → analyze with `esbuild-bundle-analyzer`               |
| `parcel.config.*` / `.parcelrc`          | Parcel              | `parcel build --detailed-report`                                         |
| `turbo.json`                             | Turbopack/Turborepo | Check individual apps in the monorepo for their bundler                  |

Also check `package.json` scripts for build commands to understand the build pipeline:

```bash
cat package.json | grep -A5 '"scripts"'
```

If the project uses a monorepo (nx.json, turbo.json, pnpm workspaces), identify which packages have browser bundles before proceeding.

## Step 2: Check for Existing Build Artifacts

Before re-building, check whether a recent build already exists:

```bash
# Vite / generic
find dist -name "*.js" -newer package.json 2>/dev/null | head -20
ls -lhS dist/ 2>/dev/null | head -20

# Next.js
ls -lhS .next/static/chunks/ 2>/dev/null | head -20

# Create React App / webpack
ls -lhS build/static/js/ 2>/dev/null | head -20
```

If fresh artifacts are present (modified within the last day), skip rebuilding and use the existing output. Note this in your report.

If no build artifacts exist, run the build in Step 3.

## Step 3: Generate Bundle Report

Run the appropriate analysis tool based on the bundler detected in Step 1.

### Vite

Check for `vite-bundle-visualizer` or use the built-in rollup options:

```bash
# Using vite-bundle-visualizer (preferred if available)
npx vite-bundle-visualizer --output /tmp/bundle-report.json 2>/dev/null

# Fallback: build with rollup options to emit stats
npm run build -- --mode production 2>/dev/null
```

After building, read the manifest if present:

```bash
cat dist/.vite/manifest.json 2>/dev/null | head -100
```

### Webpack

```bash
# Generate stats.json
npx webpack --config webpack.config.js --profile --json > /tmp/webpack-stats.json 2>/dev/null

# If that fails, check if webpack is configured in package.json scripts
npm run build -- --stats 2>/dev/null
```

Then use `webpack-bundle-analyzer` in stats mode:

```bash
npx webpack-bundle-analyzer /tmp/webpack-stats.json --mode static --report /tmp/bundle-report.html --no-open 2>/dev/null
```

### Next.js

```bash
# Check if @next/bundle-analyzer is configured
grep -r "bundle-analyzer\|withBundleAnalyzer" next.config.* 2>/dev/null

# Run with ANALYZE flag if configured
ANALYZE=true npm run build 2>/dev/null

# Fallback: analyze .next/static/chunks directly
ls -lhS .next/static/chunks/*.js 2>/dev/null | head -30
```

### source-map-explorer (Universal Fallback)

When bundler-specific tools aren't available, `source-map-explorer` works on any build output that includes source maps:

```bash
# Ensure source maps exist
ls dist/*.js.map build/static/js/*.js.map .next/static/chunks/*.js.map 2>/dev/null | head -5

# Run source-map-explorer on the main bundle(s)
npx source-map-explorer 'dist/*.js' --json > /tmp/sme-report.json 2>/dev/null
npx source-map-explorer 'build/static/js/*.js' --json > /tmp/sme-report.json 2>/dev/null
```

Parse the JSON output to extract module sizes.

### Raw File Sizes (Minimal Fallback)

If no analysis tool is available and source maps are absent:

```bash
# Raw sizes sorted by size
find dist build .next/static/chunks -name "*.js" -not -name "*.map" 2>/dev/null \
  | xargs du -h | sort -rh | head -20

# Gzip estimate (multiply raw size by ~0.3 for a rough gzip estimate)
find dist -name "*.js" -not -name "*.map" 2>/dev/null \
  | xargs gzip -c | wc -c
```

Note: raw fallback provides size totals only — no per-module breakdown. Recommend the user install `vite-bundle-visualizer` or enable source maps for a full analysis.

## Step 4: Identify Heaviest Modules and Dependencies

From the report data, extract:

### Top Modules by Size

List the 15 largest modules (by parsed/compressed size). For each entry note:

- Module path or package name
- Size (raw bytes and gzip estimate if available)
- Whether it's a production dependency, dev dependency, or application code
- Whether a lighter alternative exists

### Duplicate Packages

Check if the same package appears at multiple versions (common with monorepos and conflicting peer dependencies):

```bash
# Check for duplicate packages in node_modules
find node_modules -name "package.json" -not -path "*/node_modules/*/node_modules/*" \
  | xargs grep -l '"name"' 2>/dev/null \
  | xargs node -e "
const fs=require('fs');
const map={};
process.argv.slice(1).forEach(f=>{
  try{
    const p=JSON.parse(fs.readFileSync(f,'utf8'));
    if(!map[p.name]) map[p.name]=[];
    map[p.name].push({v:p.version,path:f});
  }catch(e){}
});
Object.entries(map).filter(([,vs])=>vs.length>1).forEach(([n,vs])=>{
  const total=vs.reduce((a,v)=>a+Number(v.v.split('.')[0]||0),0);
  console.log(n+': '+vs.map(v=>v.v).join(', '));
});
" 2>/dev/null | head -20
```

Duplicates that appear in multiple versions often land in the bundle multiple times. Flag any duplicate that is both large (>50 KB raw) and frequently used (React, lodash, date-fns, etc.).

### Tree-Shaking Issues

Scan for import patterns that defeat tree-shaking:

```bash
# Namespace imports (import * as X) — barrel imports that pull in everything
grep -r "import \* as" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -20

# Default imports from packages known to have named exports (lodash, date-fns, ramda)
grep -r "import _ from 'lodash'" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5
grep -r "import moment from 'moment'" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5

# Check if problematic packages have tree-shakeable alternatives
grep -r "\"moment\":\|\"lodash\":\|\"rxjs\":" package.json 2>/dev/null
```

## Step 5: Check for Code-Splitting Opportunities

Identify code that could be lazily loaded to reduce the initial bundle:

```bash
# Route components loaded eagerly in React Router / Next.js
grep -r "import.*from.*pages\|import.*Router\|createBrowserRouter" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "lazy\|dynamic" | head -15

# Heavy components not yet lazy-loaded
grep -r "^import " src/ --include="*.tsx" 2>/dev/null \
  | grep -v "from 'react'\|from '@types'\|\.module\." \
  | awk '{print $NF}' | sort | uniq -c | sort -rn | head -20

# Check if React.lazy / dynamic() is already used
grep -r "React\.lazy\|import()\|next/dynamic" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l
```

Flag routes and large feature components that are imported synchronously but only needed for specific user flows. These are prime candidates for `React.lazy()` or Next.js `dynamic()`.

## Step 6: Report

Output a structured report in three sections.

### Bundle Size Summary

```
Bundler:              [detected bundler]
Total raw size:       X KB / X MB
Total gzip estimate:  X KB / X MB  (×0.28 compression ratio)
Largest chunk:        [filename] — X KB
Number of chunks:     N
Analysis method:      [tool used or "raw file sizes"]
Build artifacts:      [fresh / regenerated / not found]
```

### Top 10 Heaviest Modules

List each module with size, category (dep / app code), and a one-line note:

```
1. react-dom              — 130 KB (gzip: 42 KB)  production dep, required
2. @mui/material          — 98 KB  (gzip: 31 KB)  production dep — consider tree-shaking named imports only
3. lodash                 — 71 KB  (gzip: 25 KB)  production dep — NAMESPACE IMPORT detected; switch to named imports or lodash-es
4. moment                 — 67 KB  (gzip: 22 KB)  production dep — replace with date-fns (~6 KB gzip) or day.js (~2 KB gzip)
5. [application code]...
```

### Actionable Recommendations

List only findings with a concrete fix. Sort by estimated size saving (largest first):

```
## Critical (>20 KB gzip saving each)

### Replace `moment` with `day.js`
  Current: 67 KB raw / 22 KB gzip
  Target:  ~7 KB raw / 2.5 KB gzip
  Saving:  ~20 KB gzip
  Effort:  Medium — API is compatible; use codemod or search/replace
  Fix:     npm uninstall moment && npm install dayjs
           Replace: import moment from 'moment' → import dayjs from 'dayjs'

### Fix lodash namespace import
  Current: 71 KB raw (full lodash bundle)
  Target:  ~15 KB raw (only used functions)
  Saving:  ~15 KB gzip
  Effort:  Low — change import style
  Fix:     Replace `import _ from 'lodash'` with named imports: `import { debounce, cloneDeep } from 'lodash-es'`

## High (5–20 KB gzip saving each)

### Lazy-load SettingsPage and AdminDashboard routes
  These components are only needed for authenticated admin users but are in the main bundle.
  Saving:  ~8 KB gzip estimated
  Effort:  Low
  Fix:     const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))

## Low (<5 KB gzip saving each)

### [smaller items]
```

If no actionable findings are found, state that explicitly: "The bundle is well-optimized. No significant savings identified."

## Options

| Flag               | Description                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `--target <path>`  | Analyze a specific output directory instead of auto-detecting                 |
| `--bundler <name>` | Force a specific bundler (`webpack`, `vite`, `rollup`, `next`, `esbuild`)     |
| `--skip-build`     | Use existing build artifacts without rebuilding                               |
| `--include-deps`   | Check bundlephobia size estimates for each detected heavy dependency          |
| `--fix`            | After reporting, generate a step-by-step optimization plan with code snippets |

## Usage Examples

Quick size check on a Vite project:

```
"How big is the bundle?"
```

Full analysis with optimization plan:

```
"Analyze the bundle and tell me how to get it under 200 KB gzip"
```

Pre-shipping check:

```
"We're about to ship — check the bundle for any obvious size problems"
```

Debugging a regression:

```
"The bundle grew 80 KB after merging the auth PR — find out why"
```

Targeting a specific package:

```
"Is moment.js really worth the 22 KB gzip it costs? Analyze alternatives"
```
