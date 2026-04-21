---
description: Audit project dependencies for security vulnerabilities and outdated packages, then apply safe updates. Use when user says "audit my dependencies", "check for vulnerable packages", "run npm audit", "find security issues in my packages", "what packages are outdated", "update my dependencies", "dependency health check", or "fix security vulnerabilities in dependencies".
allowed-tools: Bash, Read, Write, Glob
model: sonnet
---

# Dependency Auditor

Audit project dependencies for security vulnerabilities and outdated packages, then apply safe updates.

## When to Activate

- User wants to check for vulnerable or outdated packages
- Security audit requested
- Dependency maintenance needed
- Before a release or deployment
- User asks to update or fix dependency issues

## Options

| Option    | Values            | Default | Description                                |
| --------- | ----------------- | ------- | ------------------------------------------ |
| `--fix`   | flag              | off     | Auto-apply safe updates (patch only)       |
| `--minor` | flag              | off     | Also update minor versions (with `--fix`)  |
| `--scope` | `security`, `all` | `all`   | What to report: only CVEs or everything    |
| `--dry`   | flag              | off     | Show planned updates without applying them |

## Quick Process

1. **Detect**: Identify package manager and manifest
2. **Audit**: Run security audit to find CVEs
3. **Outdated**: Check for newer versions available
4. **Analyze**: Prioritize findings by severity
5. **Fix** (if requested): Apply safe updates
6. **Report**: Summarize findings and actions taken

## Step 1: Detect Package Manager

Check for lockfiles to identify the package manager:

```bash
# Check in order of specificity
ls package-lock.json yarn.lock pnpm-lock.yaml bun.lockb 2>/dev/null
```

| Lockfile                 | Package Manager | Audit Command           | Outdated Command              |
| ------------------------ | --------------- | ----------------------- | ----------------------------- |
| `package-lock.json`      | npm             | `npm audit --json`      | `npm outdated --json`         |
| `yarn.lock` (Classic v1) | yarn classic    | `yarn audit --json`     | `yarn outdated --json`        |
| `yarn.lock` (Berry v2+)  | yarn berry      | `yarn npm audit --json` | `yarn outdated --json`        |
| `pnpm-lock.yaml`         | pnpm            | `pnpm audit --json`     | `pnpm outdated --format json` |
| `bun.lockb`              | bun             | `bun audit`             | `bun outdated`                |

When `yarn.lock` is present, detect the Yarn version before choosing the audit command:

```bash
# Returns "1.x.x" for Classic, "2.x.x" or higher for Berry
yarn --version 2>/dev/null
```

- If the version starts with `1`, use `yarn audit --json` (Classic).
- If the version is `2` or higher, use `yarn npm audit --json` (Berry).

If no lockfile found, check `package.json` and default to npm.

## Step 2: Security Audit

Run the audit and capture JSON output:

```bash
# npm
npm audit --json 2>/dev/null

# yarn (classic)
yarn audit --json 2>/dev/null

# pnpm
pnpm audit --json 2>/dev/null
```

Parse vulnerabilities grouped by severity:

- **critical** — exploit available, immediate action required
- **high** — serious vulnerability, fix soon
- **moderate** — moderate risk, fix when possible
- **low** — minimal risk

## Step 3: Check Outdated Packages

```bash
# npm
npm outdated --json 2>/dev/null

# yarn
yarn outdated --json 2>/dev/null

# pnpm
pnpm outdated --format json 2>/dev/null
```

For each outdated package, note:

- `current`: installed version
- `wanted`: latest version within the semver range in package.json
- `latest`: latest published version

## Step 4: Analyze and Prioritize

Build a prioritized action list:

1. **CVE packages** — packages with known CVEs, sorted by severity
2. **Outdated patch** — packages behind on patches (e.g., `1.2.3` → `1.2.9`)
3. **Outdated minor** — packages behind on minor versions (e.g., `1.2.x` → `1.5.x`)
4. **Outdated major** — packages behind on major versions (e.g., `1.x` → `3.x`) — flag for manual review

## Step 5: Apply Updates (when `--fix` is requested)

**Safe updates** (patch only, unless `--minor` also specified):

```bash
# npm — fix only auto-fixable vulnerabilities (patch-safe)
npm audit fix 2>/dev/null

# npm — also update within semver range (only when --minor is set)
# WARNING: `npm update` installs the highest version satisfying the declared
# semver range, which can move caret ranges to newer minor releases.
# Only run this when --minor was explicitly requested.
npm update 2>/dev/null  # only if --minor flag is set

# For specific packages (use the `wanted` version for patch-only, `latest` only with --minor):
npm install <package>@<wanted-version> 2>/dev/null
```

When `--minor` is **not** set:

- Run `npm audit fix` only (which is restricted to patch-level fixes).
- Do **not** run `npm update` — it may apply minor version upgrades even within caret ranges.
- Pin specific installs to the `wanted` version (patch boundary), not `latest`.

When `--minor` **is** set:

- Run `npm audit fix` followed by `npm update` to also advance within semver ranges.
- Installing at `latest` is permitted for packages where a newer minor is available.

**Never** automatically update across major versions — flag these for manual review.

After applying updates, run audit again to confirm vulnerabilities are resolved.

## Step 6: Report Summary

Output a structured report:

```
## Dependency Audit — <project-name>
**Package manager**: <npm|yarn|pnpm|bun>
**Packages scanned**: <N>

### Security Vulnerabilities
- 🔴 Critical: <N> (e.g., package-name@1.2.3 — CVE-XXXX-XXXX)
- 🟠 High: <N>
- 🟡 Moderate: <N>
- ⚪ Low: <N>

### Outdated Packages
- Patch updates available: <N> packages
- Minor updates available: <N> packages
- Major updates available: <N> packages (manual review required)

### Actions Taken
<list of updates applied if --fix was used, or "None — run with --fix to apply safe updates">

### Manual Review Required
<list of major version bumps or breaking changes that need human decision>
```

## Examples

```
"Audit my dependencies"                          # full audit, report only
"Run npm audit and fix what's safe"              # audit + apply patches
"Check for vulnerable packages --fix --minor"   # audit + update to latest minor
"Dependency health check --scope security"      # only report CVEs
"Show me what would change --dry"               # audit + planned updates, no changes
```

## Notes

- Always check `CHANGELOG` or release notes for major version bumps before updating
- Some `npm audit` findings are in dev dependencies — assess risk based on usage context
- If running in CI, pass `--json` output to exit code check (`npm audit --audit-level=high`)
- Yarn 2+ (berry) has a different audit command: `yarn npm audit`
