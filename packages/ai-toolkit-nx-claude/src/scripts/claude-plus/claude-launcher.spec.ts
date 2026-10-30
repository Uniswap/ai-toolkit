import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { launchClaude } from './claude-launcher';

// Jest's sandboxed process.env doesn't reach child_process, so hand it over
// explicitly; everything else goes through the real cross-spawn unchanged.
jest.mock('cross-spawn', () => {
  const actual = jest.requireActual('cross-spawn');
  return {
    __esModule: true,
    default: (cmd: string, args: string[], opts: object) =>
      actual(cmd, args, { ...opts, env: process.env }),
  };
});

/**
 * Regression test for SECURE-444 (bug bounty #889): prompt arguments must reach
 * claude verbatim and never be interpreted by a shell.
 */
describe('launchClaude', () => {
  const originalPath = process.env.PATH;
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'claude-launcher-'));
    // Stub `claude` that records each argument it receives on its own line
    const stub = join(dir, 'claude');
    writeFileSync(stub, `#!/bin/sh\nfor a in "$@"; do printf '%s\\n' "$a"; done > "${dir}/args"\n`);
    chmodSync(stub, 0o755);
    process.env.PATH = `${dir}:${originalPath}`;
  });

  afterEach(() => {
    process.env.PATH = originalPath;
    rmSync(dir, { recursive: true, force: true });
  });

  (process.platform === 'win32' ? it.skip : it)(
    'passes shell metacharacters through as literal text',
    async () => {
      const marker = join(dir, 'pwned');
      const args = [
        `explain $(touch ${marker})`,
        `\`touch ${marker}\``,
        `a; touch ${marker}`,
        `b && touch ${marker} | cat > /dev/null`,
      ];

      await launchClaude(args);

      expect(existsSync(marker)).toBe(false);
      expect(readFileSync(join(dir, 'args'), 'utf8').split('\n').slice(0, -1)).toEqual(args);
    }
  );
});
