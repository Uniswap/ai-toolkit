---
description: Analyze database migration files for safety issues before applying them to production. Use when the user says "check my migrations for safety issues", "review my database migrations", "are these migrations safe to run in production", "analyze my schema changes for locks or data loss", "scan my migration files for dangerous patterns", or "will this migration cause downtime".
allowed-tools: Read, Glob, Grep, Bash(find:*), Bash(git:*), Bash(ls:*), Bash(wc:*)
model: sonnet
---

# Migration Safety Analyzer

Statically analyze database migration files to detect patterns that cause table locks, data loss, or production outages before they reach production.

## Step 1: Detect migration framework and locate files

Scan the repository for migration file patterns:

| Framework          | Path pattern                                             | File pattern               |
| ------------------ | -------------------------------------------------------- | -------------------------- |
| Prisma             | `prisma/migrations/`                                     | `migration.sql`            |
| Rails/ActiveRecord | `db/migrate/`                                            | `*.rb`                     |
| Django             | `*/migrations/`                                          | `[0-9]*.py`                |
| Flyway             | `src/main/resources/db/migration/`, `migrations/`, `db/` | `V*.sql`, `R*.sql`         |
| Alembic            | `alembic/versions/`, `migrations/versions/`              | `*.py`                     |
| Drizzle            | `drizzle/`, `src/db/migrations/`                         | `*.sql`                    |
| TypeORM            | `src/migrations/`, `migrations/`                         | `*.ts`, `*.js`             |
| Liquibase          | `src/main/resources/db/changelog/`                       | `*.xml`, `*.yaml`, `*.sql` |

If the user specifies a path or framework, use that. Otherwise auto-detect by searching for these patterns with Glob and Grep.

Report which framework was detected and how many migration files were found. If no migrations are found, report that clearly and stop.

Scope: analyze the 20 most-recent migrations by filename sort order (timestamp prefix is standard for all frameworks). If the user requests a specific migration or range, use that instead.

## Step 2: Build migration inventory

For each migration file in scope:

- Record the filename, detected framework, and direction (up/forward/apply vs. down/rollback/revert)
- Note whether a corresponding rollback migration exists (critical gap if missing for destructive operations)
- Extract the raw SQL or ORM operation list

For ORM-based migrations (Rails, Django, Alembic, TypeORM), translate operations to their SQL equivalents before analysis:

- `add_column` → `ALTER TABLE ... ADD COLUMN`
- `remove_column` → `ALTER TABLE ... DROP COLUMN`
- `change_column` / `alter_column` → `ALTER TABLE ... ALTER COLUMN`
- `add_index` → `CREATE INDEX`
- `create_table` → `CREATE TABLE`

## Step 3: Static safety analysis

Analyze each migration for the following patterns. Evaluate against both PostgreSQL and MySQL semantics unless the stack is known.

### CRITICAL — causes table locks or data loss

| Pattern                                     | Risk                                                   | Detection                                                                                               |
| ------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `ADD COLUMN ... NOT NULL` without `DEFAULT` | Full table rewrite lock (PostgreSQL < 11, MySQL < 8.0) | SQL: `ADD COLUMN` + `NOT NULL` + no `DEFAULT`; Rails: `add_column` with `null: false` and no `default:` |
| `DROP COLUMN`                               | Irreversible data loss                                 | SQL: `DROP COLUMN`; Rails: `remove_column`; Django: `RemoveField`                                       |
| `DROP TABLE`                                | Irreversible data loss                                 | Any framework                                                                                           |
| `TRUNCATE`                                  | Irreversible data loss                                 | SQL keyword scan                                                                                        |
| `ALTER COLUMN` type change                  | Data corruption or lock                                | Type mismatch (e.g., `varchar` → `int`, `text` → `varchar(255)` shrink)                                 |
| `RENAME TABLE` without deploy coordination  | App breakage during deploy                             | SQL: `RENAME TABLE`, `ALTER TABLE ... RENAME TO`                                                        |

### WARNING — potential downtime or deployment risk

| Pattern                                                        | Risk                                    | Detection                                                                                                  |
| -------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Missing rollback migration                                     | Cannot undo if deploy fails             | No corresponding down/revert file for migration with destructive ops                                       |
| FK column without index                                        | Slow queries and lock escalation        | `REFERENCES` keyword or `ForeignKeyConstraint` without subsequent `CREATE INDEX` on the referencing column |
| `RENAME COLUMN` without multi-phase deploy                     | App reads old name during deploy window | SQL: `ALTER TABLE ... RENAME COLUMN`; Rails: `rename_column`                                               |
| Enum type changes                                              | Breaks existing values or requires lock | `ALTER TYPE ... ADD VALUE`, `ENUM(...)` redefinition, `choices=` changes in Django without migration       |
| `ALTER TABLE` adding index without `CONCURRENTLY` (PostgreSQL) | Table lock during index build           | `CREATE INDEX` without `CONCURRENTLY`; `add_index` without `algorithm: :concurrently`                      |
| `ALTER TABLE` without `ALGORITHM=INPLACE, LOCK=NONE` (MySQL)   | May fall back to full copy              | MySQL-targeted migrations using `ALTER TABLE` on large tables                                              |
| Bulk `UPDATE` / `DELETE` without batch limit                   | Lock escalation and long transaction    | SQL: `UPDATE ... WHERE` or `DELETE ... WHERE` without `LIMIT`; row estimate > 10k                          |
| `NOT NULL` constraint added to existing column                 | Requires full table scan                | Changing existing nullable column to NOT NULL without prior data cleanup                                   |

### INFO — worth reviewing

| Pattern                                              | Risk                       | Detection                                                    |
| ---------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| New unique constraint                                | Lock during validation     | `ADD CONSTRAINT ... UNIQUE`, `add_index unique: true`        |
| `ADD COLUMN` with `DEFAULT` expression (non-literal) | May evaluate per-row       | `DEFAULT now()`, `DEFAULT gen_random_uuid()` on large tables |
| Migration with no rollback and no destructive ops    | Low risk but note          | Standard informational                                       |
| Multiple DDL statements in one migration             | Harder to retry on failure | Count `ALTER TABLE`, `CREATE`, `DROP` statements             |

## Step 4: Generate safety report

Structure the output as a migration safety report grouped by severity.

**Header**: framework detected, files analyzed, analysis date.

**CRITICAL findings** (if any): formatted as:

```
[CRITICAL] <migration-filename>:<line>
Pattern: <what was found>
Risk: <what can go wrong in production>
Safe alternative:
  <concrete rewrite or multi-step approach>
```

**WARNING findings**: same format with severity label.

**INFO findings**: condensed list, one line per finding.

**Summary table**:

```
| Severity | Count | Migration Files Affected |
|----------|-------|--------------------------|
| CRITICAL |   N   | file1.sql, file2.rb      |
| WARNING  |   N   | ...                      |
| INFO     |   N   | ...                      |
```

**Verdict**:

- No CRITICAL and no WARNING → `SAFE TO DEPLOY`
- No CRITICAL but WARNING(s) present → `DEPLOY WITH CAUTION — review WARNING findings`
- Any CRITICAL unresolved → `BLOCKED — resolve CRITICAL findings before deploying`

For each CRITICAL and WARNING finding, provide a concrete safe alternative. Examples:

- `ADD COLUMN NOT NULL` without default → add nullable first, backfill data, then add NOT NULL constraint in a separate migration
- `DROP COLUMN` → use a multi-phase approach: deprecate in app code, verify no reads/writes, then drop in a later migration
- Missing `CONCURRENTLY` on index → use `CREATE INDEX CONCURRENTLY` with `disable_ddl_transaction!` (Rails) or `op.execute("CREATE INDEX CONCURRENTLY ...")` (Alembic)
- `RENAME COLUMN` → use expand/contract: add new column, dual-write in app, backfill, switch reads, remove old column

## Success criteria

- Detected the correct migration framework
- Analyzed all in-scope migration files
- Identified all CRITICAL patterns with specific file and line references
- Provided concrete safe alternatives for every CRITICAL and WARNING finding
- Delivered a clear SAFE / BLOCKED / CAUTION verdict
