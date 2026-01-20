# DEV-218: Remove Nx packages from packages/commands/

## Summary

Remove the legacy `packages/commands/` directory containing `@ai-toolkit/commands-agnostic` and `@ai-toolkit/commands-typescript` Nx packages. All commands are already available through the Claude Code plugin marketplace system.

## Background

The `packages/commands/` directory contains legacy Nx packages that were previously used to distribute slash commands. This approach is deprecated in favor of the plugin marketplace architecture. Analysis confirms:

1. **No active code dependencies**: The packages are only referenced in:

   - `tsconfig.base.json` (path mappings)
   - Documentation files (CLAUDE.md, README.md, ARCHITECTURE.md)
   - `package-lock.json` (auto-generated)

2. **All commands have plugin equivalents**: The 27 commands in `packages/commands/agnostic/` are covered by the 5 plugins:
   - `development-planning` - planning, spec execution
   - `development-pr-workflow` - PR management, Graphite, commits
   - `development-codebase-tools` - code analysis, exploration
   - `development-productivity` - docs, tests, research
   - `uniswap-integrations` - Linear, standup, deployments

## Implementation Steps

### Phase 1: Remove Command Packages

1. **Delete `packages/commands/agnostic/`**

   - 27 markdown command files
   - TypeScript index and generation scripts
   - Package configuration files

2. **Delete `packages/commands/typescript/`**

   - TypeScript utilities
   - Package configuration files

3. **Delete `packages/commands/` directory** (after subdirectories removed)

### Phase 2: Update Configuration

1. **Update `tsconfig.base.json`**
   - Remove path mapping for `@ai-toolkit/commands-agnostic`
   - Remove path mapping for `@ai-toolkit/commands-typescript`

### Phase 3: Update Documentation

1. **Update `packages/agents/agnostic/CLAUDE.md`**

   - Remove references to `@ai-toolkit/commands-agnostic`

2. **Update `packages/agents/agnostic/ARCHITECTURE.md`**

   - Remove installation instructions referencing `@ai-toolkit/commands-agnostic`

3. **Update root CLAUDE.md if needed**
   - Verify no references to removed packages

### Phase 4: Verification

1. Run `npx nx format:write --uncommitted`
2. Run `npx nx affected --target=lint --base=HEAD~1`
3. Run `npx nx affected --target=typecheck --base=HEAD~1`
4. Verify Nx workspace graph is healthy

## Files to Modify

### Deletions

- `packages/commands/agnostic/` (entire directory)
- `packages/commands/typescript/` (entire directory)
- `packages/commands/` (parent directory)

### Modifications

- `tsconfig.base.json` - Remove 2 path mappings
- `packages/agents/agnostic/CLAUDE.md` - Remove reference (line ~272)
- `packages/agents/agnostic/ARCHITECTURE.md` - Remove installation section (line ~791)

## Risk Assessment

**Low Risk** - No active code imports these packages. Only documentation and configuration references exist.

## Acceptance Criteria Validation

- [x] All Nx packages removed from `packages/commands/` directory
- [ ] Documentation updated to reflect new installation method via plugins
- [ ] README files updated to remove references to npx installation scripts
- [x] Commands previously in `packages/commands/` are available through plugins (verified)
- [ ] CLAUDE.md files updated to reflect the architectural change
