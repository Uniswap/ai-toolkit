# Auto-Update Feature Design Document

## Overview

This document describes the design and implementation of the auto-update notification feature for AI Toolkit. This feature automatically notifies users when a new version of `@uniswap/ai-toolkit-nx-claude` is available, with minimal performance overhead and user control.

## Goals

1. **Proactive Notifications**: Inform users when updates are available without manual checks
2. **Minimal Overhead**: Shell startup time impact should be negligible (<5ms when cached)
3. **User Control**: Easy to disable via environment variable
4. **Self-Maintaining**: Auto-updates the check script itself when running new versions
5. **Simplicity**: No external dependencies beyond npm and standard shell utilities

## Non-Goals

- Automatic updates (user must manually run update command)
- Version compatibility checking
- Changelog display
- Rollback mechanism
- Support for shells other than bash/zsh/fish initially

## Design Decisions

### Why Shell Integration?

**Considered Alternatives:**

1. ❌ **Claude CLI pre-execution hook**: Not supported by Claude CLI
2. ❌ **Manual check command**: Low discoverability, relies on user memory
3. ❌ **Manifest.json tracking**: Complicated by local vs global install confusion
4. ✅ **Shell startup script**: Best balance of automation and user control

### Why Store Version in Shell Script Comment?

**Benefits:**

- No manifest.json changes needed
- Eliminates local vs global install confusion
- Self-contained version tracking
- No JSON parsing dependencies
- Simpler to implement and maintain

**Alternative Considered:**

- ❌ Storing in `manifest.json`: Redundant, requires choosing between local/global installs

### Why Once-Per-Day Caching?

**Rationale:**

- Balance between staying current and avoiding network overhead
- Shell startup happens frequently (multiple times per day)
- npm registry queries can be slow (100-500ms)
- Most updates don't happen daily

**Cache Location:** `~/.claude/.last-update-check`

- Centralizes AI Toolkit state
- Easy to find and delete for testing
- Persists across shell sessions

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────┐
│ init generator                                   │
│ - Detects shell type (bash/zsh/fish)           │
│ - Reads package.json version                    │
│ - Generates bash snippet with version           │
│ - Backs up shell config                         │
│ - Uses sed to replace existing snippet          │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│ Shell Config (~/.zshrc or ~/.bashrc)            │
│ # AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v0.5.7   │
│ _ai_toolkit_check_updates() {                   │
│   [bash script code]                            │
│ }                                               │
│ _ai_toolkit_check_updates                       │
│ # END AI_TOOLKIT_UPDATE_CHECK                   │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│ Shell Startup (every terminal session)          │
│ - Checks AI_TOOLKIT_SKIP_UPDATE_CHECK           │
│ - Reads cache timestamp                         │
│ - Skips if checked within 24 hours             │
│ - Spawns background process if needed           │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│ Background Check Process                         │
│ - Extracts current version from script comment  │
│ - Queries npm registry for latest version       │
│ - Displays message if update available          │
│ - Updates cache timestamp                       │
└─────────────────────────────────────────────────┘
```

### Bash Script

```bash
# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v{VERSION}
_ai_toolkit_check_updates() {
  [ -n "$AI_TOOLKIT_SKIP_UPDATE_CHECK" ] && return

  local cache="${HOME}/.claude/.last-update-check"

  # Check once per day
  if [ -f "$cache" ]; then
    local last_check=$(cat "$cache" 2>/dev/null || echo 0)
    local now=$(date +%s)
    [ $((now - last_check)) -lt 86400 ] && return
  fi

  # Run in background to avoid blocking shell startup
  (
    # Extract version from this script's comment
    local current=$(grep "# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK" "${BASH_SOURCE[0]:-$HOME/.zshrc}" 2>/dev/null | sed 's/.*v\([0-9][^ ]*\).*/\1/')

    # Get latest version from npm registry
    if command -v npm >/dev/null 2>&1; then
      local latest=$(npm view @uniswap/ai-toolkit-nx-claude version 2>/dev/null)

      if [ -n "$latest" ] && [ -n "$current" ] && [ "$current" != "$latest" ]; then
        echo "📦 AI Toolkit update available: $current → $latest"
        echo "   Run: npx @uniswap/ai-toolkit-nx-claude@latest init"
        echo "   Disable these checks: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1"
      fi
    fi

    date +%s > "$cache" 2>/dev/null
  ) &
}

_ai_toolkit_check_updates
# END AI_TOOLKIT_UPDATE_CHECK
```

### Integration Points

#### 1. Package Version Extraction

```typescript
// In init/generator.ts
import * as fs from 'fs';
import * as path from 'path';

function getCurrentToolkitVersion(): string {
  const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}
```

#### 2. Shell Detection

Reuse patterns from `setup-registry-proxy/generator.ts`:

```typescript
type ShellType = 'bash' | 'zsh' | 'fish';

function detectShell(): ShellType {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('fish')) return 'fish';
  return 'bash'; // default
}

function getShellConfigPath(shell: ShellType): string {
  const homeDir = os.homedir();
  const configs = {
    bash: path.join(homeDir, '.bashrc'),
    zsh: path.join(homeDir, '.zshrc'),
    fish: path.join(homeDir, '.config/fish/config.fish'),
  };
  return configs[shell];
}
```

#### 3. Shell Config Modification

```typescript
function installUpdateChecker(shell: ShellType, version: string): void {
  const configPath = getShellConfigPath(shell);

  // 1. Backup existing config
  const backupPath = `${configPath}.backup-${Date.now()}`;
  if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, backupPath);
    logger.info(`📋 Backed up ${configPath} to ${backupPath}`);
  }

  // 2. Remove existing auto-update block if present
  if (fs.existsSync(configPath)) {
    execSync(
      `sed -i.bak '/# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK/,/# END AI_TOOLKIT_UPDATE_CHECK/d' "${configPath}"`,
      { stdio: 'ignore' }
    );
  }

  // 3. Append new auto-update block
  const snippet = generateAutoUpdateSnippet(version);
  fs.appendFileSync(configPath, `\n${snippet}\n`);

  logger.info(`✅ Update checker installed to ${configPath}`);
  logger.info(
    `   Checks once per day, disable with: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1`
  );
}

function generateAutoUpdateSnippet(version: string): string {
  return `# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v${version}
_ai_toolkit_check_updates() {
  [ -n "$AI_TOOLKIT_SKIP_UPDATE_CHECK" ] && return

  local cache="\${HOME}/.claude/.last-update-check"

  # Check once per day
  if [ -f "$cache" ]; then
    local last_check=$(cat "$cache" 2>/dev/null || echo 0)
    local now=$(date +%s)
    [ $((now - last_check)) -lt 86400 ] && return
  fi

  # Run in background to avoid blocking shell startup
  (
    # Extract version from this script's comment
    local current=$(grep "# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK" "\${BASH_SOURCE[0]:-$HOME/.zshrc}" 2>/dev/null | sed 's/.*v\\([0-9][^ ]*\\).*/\\1/')

    # Get latest version from npm registry
    if command -v npm >/dev/null 2>&1; then
      local latest=$(npm view @uniswap/ai-toolkit-nx-claude version 2>/dev/null)

      if [ -n "$latest" ] && [ -n "$current" ] && [ "$current" != "$latest" ]; then
        echo "📦 AI Toolkit update available: $current → $latest"
        echo "   Run: npx @uniswap/ai-toolkit-nx-claude@latest init"
        echo "   Disable these checks: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1"
      fi
    fi

    date +%s > "$cache" 2>/dev/null
  ) &
}

_ai_toolkit_check_updates
# END AI_TOOLKIT_UPDATE_CHECK`;
}
```

#### 4. Add to init Generator Flow

```typescript
export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  // ... existing init logic ...

  if (!isDryRun) {
    logger.info('✅ Claude Code configuration installed successfully!');

    // Install update checker
    try {
      const shell = detectShell();
      const version = getCurrentToolkitVersion();
      installUpdateChecker(shell, version);
    } catch (error) {
      logger.warn(`⚠️  Failed to install update checker: ${error}`);
      logger.info('You can add it manually later if needed');
    }

    // ... rest of init logic ...
  }
}
```

## User Experience

### First Time Setup

```bash
$ npx @uniswap/ai-toolkit-nx-claude@latest init

# ... interactive prompts ...

✅ Claude Code configuration installed successfully!
📁 Location: ~/.claude
📝 Use these in Claude Code immediately
📋 Backed up ~/.zshrc to ~/.zshrc.backup-1234567890
✅ Update checker installed to ~/.zshrc
   Checks once per day, disable with: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1
```

### Update Available (Next Day)

```bash
$ # User opens new terminal
📦 AI Toolkit update available: 0.5.7 → 0.6.0
   Run: npx @uniswap/ai-toolkit-nx-claude@latest init
   Disable these checks: export AI_TOOLKIT_SKIP_UPDATE_CHECK=1

$ # Rest of terminal session continues normally
```

### Disabling Updates

```bash
# Temporary (one session)
$ export AI_TOOLKIT_SKIP_UPDATE_CHECK=1

# Permanent (add to shell config)
$ echo "export AI_TOOLKIT_SKIP_UPDATE_CHECK=1" >> ~/.zshrc
```

### Testing Without Waiting 24 Hours

```bash
# Delete cache to force immediate check
$ rm ~/.claude/.last-update-check

# Open new terminal to trigger check
$ exec $SHELL
```

## Edge Cases & Error Handling

### 1. npm Command Not Available

**Behavior:** Check silently fails, no error message shown
**Rationale:** Don't spam users with errors on every shell startup

### 2. Network Failure

**Behavior:** Check fails silently, cache timestamp still updated
**Rationale:** Avoid repeated failed attempts until next day

### 3. npm Registry Authentication Fails

**Behavior:** `npm view` returns empty/error, check fails silently
**Rationale:** User has bigger problems to solve first (npmrc config)

### 4. Multiple Shells

**Behavior:** Install to all detected shells
**Rationale:** User might switch between bash and zsh

### 5. Shell Config Doesn't Exist

**Behavior:** Create it with just the update checker
**Rationale:** Reasonable default for fresh systems

### 6. sed Compatibility (macOS vs Linux)

**Solution:** Use `-i.bak` which works on both platforms

```typescript
// Platform-agnostic sed command
const sedCmd =
  process.platform === 'darwin'
    ? `sed -i '' '/# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK/,/# END AI_TOOLKIT_UPDATE_CHECK/d' "${configPath}"`
    : `sed -i '/# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK/,/# END AI_TOOLKIT_UPDATE_CHECK/d' "${configPath}"`;
```

### 7. Concurrent Shell Startups

**Behavior:** Background process handles this gracefully
**Rationale:** Race condition is harmless (both write same timestamp)

### 8. Version Parsing Fails

**Behavior:** `current` or `latest` becomes empty, comparison fails, no message shown
**Rationale:** Better to be silent than show false positives

## Testing Strategy

### Unit Tests

```typescript
describe('Auto-Update Feature', () => {
  describe('version extraction', () => {
    it('should extract version from package.json', () => {
      const version = getCurrentToolkitVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('shell detection', () => {
    it('should detect zsh shell', () => {
      process.env.SHELL = '/bin/zsh';
      expect(detectShell()).toBe('zsh');
    });

    it('should default to bash', () => {
      process.env.SHELL = '';
      expect(detectShell()).toBe('bash');
    });
  });

  describe('snippet generation', () => {
    it('should include version in comment', () => {
      const snippet = generateAutoUpdateSnippet('1.2.3');
      expect(snippet).toContain(
        '# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v1.2.3'
      );
    });

    it('should include disable instructions', () => {
      const snippet = generateAutoUpdateSnippet('1.2.3');
      expect(snippet).toContain('AI_TOOLKIT_SKIP_UPDATE_CHECK');
    });
  });
});
```

### Integration Tests

```typescript
describe('installUpdateChecker', () => {
  it('should backup existing shell config', () => {
    // Test backup creation
  });

  it('should replace existing update checker', () => {
    // Test sed replacement logic
  });

  it('should handle missing shell config', () => {
    // Test creating new config
  });
});
```

### Manual Testing Checklist

- [ ] Install on fresh system (no shell config)
- [ ] Install on system with existing config
- [ ] Verify update message appears after 24 hours
- [ ] Verify update message shows correct versions
- [ ] Verify disable flag works
- [ ] Verify cache prevents duplicate checks
- [ ] Verify background process doesn't block shell startup
- [ ] Test on macOS (zsh default)
- [ ] Test on Linux (bash default)
- [ ] Test with npm registry auth working
- [ ] Test with npm registry auth broken
- [ ] Test cache deletion forces immediate check
- [ ] Verify re-running init updates the script version

## Performance Considerations

### Shell Startup Impact

**Without Cache (First Run Each Day):**

- Cache check: ~1ms
- Background spawn: ~2ms
- **Total blocking time: ~3ms**

**With Cache (Subsequent Runs):**

- Cache check: ~1ms
- Early return: ~0ms
- **Total blocking time: ~1ms**

**Background Process (Non-Blocking):**

- Version extraction: ~10ms
- npm view query: ~100-500ms (varies by network)
- Message display: ~1ms
- **Total async time: ~111-511ms** (user doesn't wait)

### Cache File Size

- Single timestamp: ~10 bytes
- No disk space concerns

### Network Usage

- One npm registry query per day
- Response size: ~100 bytes
- Negligible bandwidth impact

## Security Considerations

### 1. Shell Injection

**Risk:** Malicious version string could inject shell commands
**Mitigation:** Version comes from our own package.json (trusted source)

### 2. npm Registry Spoofing

**Risk:** Attacker could compromise npm registry response
**Mitigation:**

- Uses authenticated private npm registry
- Only shows notification (doesn't auto-update)
- User must manually review and run update

### 3. sed Backup Files

**Risk:** Sensitive data in shell configs backed up
**Mitigation:** Backups stored in same directory (same permissions)

### 4. Cache File Tampering

**Risk:** User or malicious process modifies cache timestamp
**Mitigation:** Harmless - worst case is showing update message early or late

## Rollout Plan

### Phase 1: Development

1. Implement bash snippet generation
2. Implement shell detection
3. Implement sed replacement logic
4. Add to init generator
5. Write unit tests

### Phase 2: Testing

1. Manual testing on developer machines
2. Test on fresh systems
3. Test edge cases (no npm, no auth, etc.)
4. Performance benchmarking

## References

- [setup-registry-proxy generator](./src/generators/setup-registry-proxy/generator.ts) - Shell detection patterns
- [init generator](./src/generators/init/generator.ts) - Integration point
- [npm CLI documentation](https://docs.npmjs.com/cli/v8/commands/npm-view) - npm view command
- Original inspiration: env_setup patterns from user's other codebase

## Changelog

- 2025-01-XX: Initial design document created
