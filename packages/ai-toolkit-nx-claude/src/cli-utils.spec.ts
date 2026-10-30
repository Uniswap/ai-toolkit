import fs from 'fs';
import spawn from 'cross-spawn';
import { handleNxExecution } from './cli-utils';

jest.mock('cross-spawn', () => ({
  __esModule: true,
  default: { sync: jest.fn(() => ({ status: 0 })) },
}));

/**
 * Regression test for SECURE-444 (bug bounty #889): generator args must be
 * passed to nx as an argv array, never joined into a shell command string.
 */
describe('handleNxExecution', () => {
  const originalArgv1 = process.argv[1];
  const originalCwd = process.cwd;

  beforeEach(() => {
    // Make shouldRunStandalone() choose the nx path
    process.argv[1] = '/ws/ai-toolkit/packages/ai-toolkit-nx-claude/dist/cli-generator.cjs';
    process.cwd = () => '/ws/ai-toolkit';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    process.argv[1] = originalArgv1;
    process.cwd = originalCwd;
    jest.restoreAllMocks();
  });

  it('passes args to nx without a shell', async () => {
    const args = ['--name=$(id)', '`id`', 'a;b'];

    await handleNxExecution('addons', args);

    expect(spawn.sync).toHaveBeenCalledWith(
      'nx',
      ['generate', '@uniswap/ai-toolkit-nx-claude:addons', ...args],
      expect.not.objectContaining({ shell: expect.anything() })
    );
  });
});
