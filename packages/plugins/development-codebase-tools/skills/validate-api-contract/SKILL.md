---
description: Detect breaking changes in API contracts across REST (OpenAPI/Swagger), GraphQL schemas, and gRPC proto files. Use when user says "check for breaking API changes", "validate the API contract", "did I break any APIs?", "review my OpenAPI diff", "check if this GraphQL schema change is safe", or "are there any backwards-incompatible changes in this PR?".
allowed-tools: Read, Glob, Grep, Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git stash:*), Bash(find:*), Bash(cat:*)
model: sonnet
---

# API Contract Validator

Detect and classify breaking versus non-breaking changes across REST (OpenAPI/Swagger), GraphQL, and gRPC API definitions.

## When to Activate

- User asks about breaking API changes
- User wants to validate an API contract before merging
- User asks if their changes are backwards-compatible
- Preparing for a major/minor version bump
- Pre-release API review

## Step 1: Discover API Definitions

Scan the repository for API contract files:

```bash
# OpenAPI / Swagger
find . -name "*.yaml" -o -name "*.yml" -o -name "*.json" | xargs grep -l "openapi:\|swagger:" 2>/dev/null
# GraphQL schemas
find . -name "*.graphql" -o -name "*.gql" 2>/dev/null
# gRPC proto files
find . -name "*.proto" 2>/dev/null
```

If no API definition files are found, look for:

- Inline route definitions in source code (Express, Fastify, Hono, NestJS decorators)
- TypeScript types exported from an API surface (`api/`, `routes/`, `controllers/`)

Report which API type(s) were detected and which files will be analyzed.

## Step 2: Establish Baseline

Determine the comparison baseline:

1. **Explicit**: If user specified a branch or commit (`main`, `HEAD~1`, a SHA), use it
2. **Default**: Use `git diff origin/main...HEAD` for the current branch against the integration branch
3. **Staged only**: If user says "staged changes", use `git diff --cached`

```bash
git diff <baseline>..HEAD -- <api-files>
```

If the diff is empty (no API file changes), report "No API contract files changed" and exit cleanly.

## Step 3: Parse Changes by API Type

### REST / OpenAPI

For each changed `.yaml`/`.yml`/`.json` OpenAPI file, classify hunks from the diff:

**Breaking changes** (require major version bump):

- Removed endpoint (path + method deleted)
- Removed required request field or query parameter
- Added new required request field (no default)
- Changed field type in request or response (e.g., `string` → `integer`)
- Narrowed enum: removed an accepted value from a request field
- Changed authentication scheme (e.g., Bearer → API key)
- Removed response field that consumers relied on
- Changed HTTP method for an existing path
- Removed API version prefix

**Non-breaking changes** (minor/patch):

- Added optional request field
- Added new endpoint
- Added new response field
- Broadened enum: added a new accepted value
- Relaxed validation constraint (e.g., increased `maxLength`)
- Added deprecation notice
- Documentation / description update

### GraphQL

For each changed `.graphql`/`.gql` file:

**Breaking changes**:

- Removed type, field, or enum value
- Changed field type to incompatible type (e.g., `String` → `Int`)
- Made optional field required (added `!`)
- Removed argument
- Changed argument type to incompatible type

**Non-breaking changes**:

- Added new type, field, or enum value
- Made required field optional (removed `!`)
- Added optional argument with default
- Added deprecation directive

### gRPC / Protobuf

For each changed `.proto` file:

**Breaking changes**:

- Removed a field number
- Changed field type to incompatible type
- Changed field name (if using JSON mapping)
- Removed a message, enum, or service
- Changed field from `optional` to `required`
- Removed an RPC method

**Non-breaking changes**:

- Added new field (new field number)
- Added new message, enum, or service
- Adding `optional` to required field

## Step 4: Report

Output a structured report:

```
## API Contract Validation Report

**Baseline**: <branch or commit>
**Files analyzed**: <count> (<list>)

### 🔴 Breaking Changes (<count>)

| File | Location | Change | Impact |
|------|----------|--------|--------|
| openapi.yaml | DELETE /users/{id} | Endpoint removed | Clients calling this endpoint will receive 404 |
| schema.graphql | User.email field | Type String → Int | All clients querying email field will fail |

### 🟡 Deprecations (<count>)

| File | Location | Note |
|------|----------|------|
| openapi.yaml | GET /v1/users | Marked deprecated; use /v2/users |

### 🟢 Non-Breaking Changes (<count>)

| File | Location | Change |
|------|----------|--------|
| openapi.yaml | POST /users | Added optional `timezone` field |

### Recommended Version Bump

- **Major** (breaking changes detected) / **Minor** (additions only) / **Patch** (docs/deprecations only)

### Suggested Next Steps

- [ ] Update API version if breaking changes are present
- [ ] Notify consumers of breaking changes before merging
- [ ] Add migration guide for removed/changed fields
```

## Handling Inline API Definitions

If no standalone definition files exist and APIs are defined inline in code:

1. Identify the framework (Express, NestJS, FastAPI, etc.) from `package.json` or imports
2. Use `git diff` on route/controller files
3. Extract route signatures, method handlers, and TypeScript types from the diff
4. Apply the same breaking/non-breaking classification heuristics

Note that inline analysis is less precise than schema-file analysis. Flag this in the report.

## Edge Cases

- **No API files changed**: Report cleanly and exit — do not hallucinate changes
- **Binary or generated files**: Skip minified/compiled files; analyze source schemas only
- **Multiple API versions**: Group findings by version prefix
- **Monorepo**: Analyze all packages, label each finding with its package path

## Examples

```
"Did I break any APIs in this branch?"
"Check for breaking changes before I open this PR"
"Validate the API contract against main"
"Is my GraphQL schema change backwards-compatible?"
"Review my OpenAPI diff for breaking changes"
```
