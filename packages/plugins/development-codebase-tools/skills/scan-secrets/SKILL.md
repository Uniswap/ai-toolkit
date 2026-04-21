---
description: Scan the codebase for hardcoded secrets, API keys, tokens, and credentials. Use when user says "scan for hardcoded secrets", "find hardcoded API keys", "check for leaked credentials", "detect hardcoded passwords", "are there any secrets in the code", "find exposed tokens", "check for credentials in the codebase", or "secrets audit".
allowed-tools: Bash, Read, Glob, Grep
model: sonnet
---

# Secrets Scanner

Scan the codebase for hardcoded secrets, API keys, passwords, and credentials — and recommend how to remediate each finding.

## When to Activate

- User wants to find hardcoded secrets or credentials in the code
- Security audit or pre-commit scan requested
- Preparing to open-source or share a repository
- Code review flags potential secrets
- Compliance check for credential exposure

## Options

| Option        | Values                    | Default | Description                                     |
| ------------- | ------------------------- | ------- | ----------------------------------------------- |
| `--history`   | flag                      | off     | Also scan git commit history for leaked secrets |
| `--scope`     | path or glob              | `.`     | Limit scan to a subdirectory or file pattern    |
| `--severity`  | `critical`, `high`, `all` | `all`   | Filter output by minimum severity level         |
| `--no-report` | flag                      | off     | Skip the summary report (findings only)         |

## Quick Process

1. **Enumerate** target files, excluding known safe paths
2. **Pattern match** against a library of secret signatures
3. **Filter** false positives (example files, placeholders, test fixtures)
4. **Classify** each finding by type and severity
5. **History scan** (if `--history`): check git log for secrets committed in the past
6. **Report** findings grouped by severity with remediation guidance

---

## Step 1: Identify Target Files

Walk the target scope and collect files to scan. Apply exclusions first to avoid noise.

### Default exclusions (always skip)

```bash
# Directories
node_modules/
.git/
dist/
build/
coverage/
.nx/
.turbo/
vendor/
__pycache__/

# File extensions (binary/generated)
*.png *.jpg *.jpeg *.gif *.ico *.svg
*.woff *.woff2 *.ttf *.eot
*.zip *.tar.gz *.tgz
*.min.js *.min.css *.map
*.lock (package-lock.json, yarn.lock, etc.)
```

### Reduced-sensitivity files (scan but downgrade severity by one level)

These files often contain placeholder or example values:

- `*.example` / `*.sample` / `*.template`
- `*.env.example` / `.env.sample`
- `*test*` / `*spec*` / `*mock*` / `*fixture*`
- `*__tests__*` / `*__mocks__*`
- `CHANGELOG.md` / `CONTRIBUTING.md`

```bash
# Find all non-excluded text files
find "${SCOPE:-.}" \
  -not \( -path "*/node_modules/*" -o -path "*/.git/*" -o -path "*/dist/*" \
          -o -path "*/build/*" -o -path "*/coverage/*" -o -path "*/.nx/*" \
          -o -path "*/.turbo/*" -o -path "*/vendor/*" -o -path "*/__pycache__/*" \) \
  -not \( -name "package-lock.json" -o -name "yarn.lock" -o -name "pnpm-lock.yaml" \
          -o -name "*.lock" -o -name "composer.lock" -o -name "Gemfile.lock" \
          -o -name "Cargo.lock" -o -name "poetry.lock" \) \
  -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
     -o -name "*.mts" -o -name "*.cts" -o -name "*.mjs" -o -name "*.cjs" \
     -o -name "*.py" -o -name "*.rb" -o -name "*.go" -o -name "*.java" \
     -o -name "*.rs" -o -name "*.php" -o -name "*.cs" -o -name "*.swift" \
     -o -name "*.env" -o -name "*.env.*" -o -name ".env" -o -name ".env.*" \
     -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" -o -name "*.ini" \
     -o -name "*.conf" -o -name "*.config" -o -name "*.json" \
     -o -name "*.sh" -o -name "*.bash" -o -name "Makefile" -o -name "Dockerfile" \) \
  2>/dev/null
```

---

## Step 2: Pattern Match for Secrets

Scan each file using these patterns. For each match, record: file path, line number, matched text (truncated to 60 chars), pattern category.

### Pattern Library

#### Critical — Confirmed credential formats

```
# Generic API key assignments
(api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*["']([A-Za-z0-9\-_/+]{20,})["']

# AWS
(AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}
aws_secret_access_key\s*[:=]\s*["']?[A-Za-z0-9/+=]{40}["']?

# GitHub tokens
(ghp_|ghs_|gho_|ghu_|github_pat_)[A-Za-z0-9_]{36,}

# Google Cloud / GCP
AIza[0-9A-Za-z\-_]{35}
[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com

# Stripe
(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}
rk_(test|live)_[0-9a-zA-Z]{24,}

# Slack
xox[baprs]-[0-9A-Za-z]{10,48}
https://hooks\.slack\.com/services/[A-Z0-9/]+

# SendGrid
SG\.[A-Za-z0-9\-_]{22,}\.[A-Za-z0-9\-_]{43,}

# Twilio
AC[a-z0-9]{32}
SK[a-z0-9]{32}

# JWT with real payloads (not placeholder)
eyJ[A-Za-z0-9+/]+\.[A-Za-z0-9+/]+\.[A-Za-z0-9+/\-_]+

# Private keys
-----BEGIN (RSA |EC |OPENSSH |PRIVATE |PGP PRIVATE )KEY-----

# Heroku API key (requires credential variable name context to avoid matching plain UUIDs)
(heroku[_-]?api[_-]?key|heroku[_-]?token|HEROKU_API_KEY|HEROKU_TOKEN)\s*[:=]\s*["']?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}["']?

# NPM auth token
npm_[A-Za-z0-9]{36,}

# Vercel tokens
vercel_[A-Za-z0-9]{24,}

# Linear API key
lin_api_[A-Za-z0-9]{40,}
```

#### High — Generic patterns that commonly hold secrets

```
# Generic password / secret assignment
(password|passwd|secret|token|auth_token|access_token|refresh_token|private_key|private_secret)\s*[:=]\s*["'](?!.*(\$\{|\{\{|<|%|PLACEHOLDER|REPLACE|TODO|CHANGEME|YOUR_|EXAMPLE|REDACTED|xxx|secret>|password>))[A-Za-z0-9!@#$%^&*()_+\-=]{8,}["']

# Database connection strings
(postgresql|postgres|mysql|mongodb|redis|mongodb\+srv):\/\/[^:]+:[^@\s"']+@

# Basic auth in URLs
https?:\/\/[^:@\s]+:[^@\s"']+@

# Private RSA/PEM material inline (base64 blob ≥64 chars, require credential variable name context)
(private_key|secret|credential|pem|certificate|private)\s*[:=]\s*["'][A-Za-z0-9+/]{64,}={0,2}["']
```

#### Medium — Suspicious but frequently false-positive

```
# Environment variable assignments with non-placeholder values
(export\s+)?[A-Z_]{3,}_(KEY|SECRET|TOKEN|PASSWORD|AUTH|API)\s*=\s*(?!["']?\s*$|["']?(""|\$\{|CHANGE|REPLACE|TODO|your_|<|xxx|undefined|null|true|false))[^\s\n#]+

# Inline credentials comment (developers often do "# key: abc123")
#\s*(key|secret|password|token|auth)\s*[:=]\s*\S{8,}
```

---

## Step 3: Filter False Positives

After collecting raw matches, filter out known false positives before reporting:

### Automatic exclusion rules

1. **Placeholder values** — value contains: `TODO`, `CHANGEME`, `YOUR_`, `<YOUR`, `PLACEHOLDER`, `REPLACE_ME`, `example`, `xxxxxxxx`, `REDACTED`, `***`, `${`, `{{`, `%s`, `<KEY>`
2. **Short values** — value is fewer than 8 characters after trimming quotes (too short to be a real secret)
3. **All-same character** — value is a repeated character (e.g., `aaaaaaaaaa`, `00000000`)
4. **Well-known test values** — value is one of a known list: `test`, `testing`, `testtest`, `secret123`, `password`, `letmein`, `changeme`, `admin`, `localhost`, `127.0.0.1`
5. **Hash-looking strings in hash/id fields** — if the variable name contains `hash`, `digest`, `checksum`, `etag`, `sha`, `md5`, and the value looks like a hash (hex string 32-64 chars)
6. **Version strings** — value matches semver pattern `\d+\.\d+\.\d+`

### Apply reduced-sensitivity to test/example files

For matches in files matching `*test*`, `*spec*`, `*mock*`, `*fixture*`, `*.example`, `*.sample`:

- Downgrade `critical` → `high`
- Downgrade `high` → `medium`
- Downgrade `medium` → skip

---

## Step 4: Classify Findings

For each surviving finding, assign:

| Field      | Value                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| `severity` | `critical` / `high` / `medium`                                           |
| `type`     | AWS / GitHub / Stripe / Generic API Key / Password / JWT / DB URL / etc. |
| `file`     | Relative file path                                                       |
| `line`     | Line number                                                              |
| `preview`  | First 60 chars of matched line (redacted: replace secret with `***`)     |
| `action`   | Recommended remediation                                                  |

---

## Step 5: Git History Scan (when `--history`)

Scan git history for secrets committed in past commits, even if removed later:

```bash
# Find all commits that added lines matching secret patterns
git log -p --all --full-history -- '*.ts' '*.js' '*.env' '*.yml' '*.json' 2>/dev/null \
  | grep "^+" \
  | grep -E "(api_key|apikey|secret|password|token)\s*[:=]\s*[\"'][A-Za-z0-9]{20,}" \
  | head -50
```

For any matches found in history:

- Report: commit hash (short), file, pattern matched, and whether the file still exists in HEAD
- Note: Even if removed, secrets in history are compromised and must be rotated

---

## Step 6: Report

### Console Output Format

Group findings by severity:

```
## Secrets Scan Report — <project-name>
Scanned <N> files in <path>

### 🔴 Critical (<N> findings)

1. [AWS Access Key] src/config/aws.ts:42
   `AWS_ACCESS_KEY_ID = "AKIAXXX..."`
   → Rotate this key immediately. Move to environment variable or AWS Secrets Manager.

2. [GitHub PAT] scripts/deploy.sh:15
   `TOKEN="ghp_..."`
   → Revoke this token at github.com/settings/tokens. Use a CI secret instead.

### 🟠 High (<N> findings)
...

### 🟡 Medium (<N> findings)
...

---
### Remediation Guide

**Immediate actions:**
- Rotate all critical and high severity secrets now — treat them as compromised
- Remove secrets from code and replace with references to environment variables

**Environment variables** (for local development):
- Store in `.env` (gitignored) and read via `process.env.VAR_NAME`
- Use `.env.example` with placeholder values for documentation

**Secret managers** (for production):
- AWS Secrets Manager / Parameter Store
- HashiCorp Vault
- GCP Secret Manager
- Azure Key Vault
- GitHub Actions secrets / Vercel environment variables

**Git history cleanup** (if secrets were committed):
- Use `git filter-repo` or BFG Repo Cleaner to remove from history
- Force-push to remote after cleaning (coordinate with your team)
- Rotate all affected credentials regardless

---
Total: <N> critical, <N> high, <N> medium findings
```

### Clean Result

If no findings after filtering:

```
## Secrets Scan Report — <project-name>
✅ No hardcoded secrets detected in <N> scanned files.
```

---

## Examples

```
"Scan for hardcoded secrets"                        # full scan of current directory
"Find hardcoded API keys in src/"                   # scoped scan
"Are there any credentials in this code?"           # full scan
"Check for leaked secrets --history"                # scan code + git history
"Secrets audit --severity critical"                 # only report critical findings
"Detect hardcoded passwords in config/"             # scan config directory
"Scan for exposed tokens before open-sourcing"      # pre-OSS audit
```

---

## Notes

- **Always redact** the actual secret values in output — show truncated/masked versions only
- **This scan is heuristic** — false positives are possible, especially in test files
- A clean scan result is not a guarantee — obfuscated or encoded secrets may not be detected
- Secrets found in `.env` files that are gitignored are **still a finding** if they contain real credentials (even if not committed, developers may share `.env` files inadvertently)
- For high-confidence findings in production code, treat the secret as compromised and rotate immediately, regardless of whether it was ever deployed
