import * as fs from 'fs';
import * as os from 'os';
import {
  getCurrentToolkitVersion,
  detectShell,
  getShellConfigPath,
  generateAutoUpdateSnippet,
  generateFishAutoUpdateSnippet,
  installUpdateChecker,
} from './auto-update-utils';

// Mock modules
jest.mock('fs');
jest.mock('os');
jest.mock('@nx/devkit', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('auto-update-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOs.homedir.mockReturnValue('/home/testuser');
  });

  describe('getCurrentToolkitVersion', () => {
    it('should extract version from package.json', () => {
      const mockPackageJson = JSON.stringify({ version: '1.2.3' });
      mockFs.readFileSync.mockReturnValue(mockPackageJson);

      const version = getCurrentToolkitVersion();

      expect(version).toBe('1.2.3');
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'utf-8'
      );
    });

    it('should return version matching semver pattern', () => {
      const mockPackageJson = JSON.stringify({ version: '0.5.7' });
      mockFs.readFileSync.mockReturnValue(mockPackageJson);

      const version = getCurrentToolkitVersion();

      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('detectShell', () => {
    it('should detect zsh shell from environment', () => {
      process.env.SHELL = '/bin/zsh';

      const shell = detectShell();

      expect(shell).toBe('zsh');
    });

    it('should detect bash shell from environment', () => {
      process.env.SHELL = '/bin/bash';

      const shell = detectShell();

      expect(shell).toBe('bash');
    });

    it('should detect fish shell from environment', () => {
      process.env.SHELL = '/usr/bin/fish';

      const shell = detectShell();

      expect(shell).toBe('fish');
    });

    it('should default to bash when SHELL is not set', () => {
      delete process.env.SHELL;

      const shell = detectShell();

      expect(shell).toBe('bash');
    });
  });

  describe('getShellConfigPath', () => {
    it('should return correct path for bash', () => {
      mockOs.homedir.mockReturnValue('/home/testuser');

      const configPath = getShellConfigPath('bash');

      expect(configPath).toBe('/home/testuser/.bashrc');
    });

    it('should return correct path for zsh', () => {
      mockOs.homedir.mockReturnValue('/home/testuser');

      const configPath = getShellConfigPath('zsh');

      expect(configPath).toBe('/home/testuser/.zshrc');
    });

    it('should return correct path for fish', () => {
      mockOs.homedir.mockReturnValue('/home/testuser');

      const configPath = getShellConfigPath('fish');

      expect(configPath).toBe('/home/testuser/.config/fish/config.fish');
    });
  });

  describe('generateAutoUpdateSnippet', () => {
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

    it('should include update command', () => {
      const snippet = generateAutoUpdateSnippet('1.2.3');

      expect(snippet).toContain(
        'npx @uniswap/ai-toolkit-nx-claude@latest init'
      );
    });

    it('should include end marker', () => {
      const snippet = generateAutoUpdateSnippet('1.2.3');

      expect(snippet).toContain('# END AI_TOOLKIT_UPDATE_CHECK');
    });

    it('should include 24-hour cache check (86400 seconds)', () => {
      const snippet = generateAutoUpdateSnippet('1.2.3');

      expect(snippet).toContain('86400');
    });
  });

  describe('generateFishAutoUpdateSnippet', () => {
    it('should include version in comment', () => {
      const snippet = generateFishAutoUpdateSnippet('1.2.3');

      expect(snippet).toContain(
        '# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v1.2.3'
      );
    });

    it('should use fish syntax for conditionals', () => {
      const snippet = generateFishAutoUpdateSnippet('1.2.3');

      expect(snippet).toContain('if set -q AI_TOOLKIT_SKIP_UPDATE_CHECK');
      expect(snippet).toContain('end');
    });

    it('should include fish-specific disable instructions', () => {
      const snippet = generateFishAutoUpdateSnippet('1.2.3');

      expect(snippet).toContain('set -x AI_TOOLKIT_SKIP_UPDATE_CHECK 1');
    });
  });

  describe('installUpdateChecker', () => {
    beforeEach(() => {
      mockOs.homedir.mockReturnValue('/home/testuser');
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('# Existing shell config\n');
      mockFs.copyFileSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);
      mockFs.mkdirSync.mockImplementation(() => undefined);
    });

    it('should create ~/.claude directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      installUpdateChecker('bash', '1.2.3');

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/home/testuser/.claude', {
        recursive: true,
      });
    });

    it('should backup existing config file', () => {
      const configPath = '/home/testuser/.bashrc';
      mockFs.existsSync.mockReturnValue(true);

      installUpdateChecker('bash', '1.2.3');

      expect(mockFs.copyFileSync).toHaveBeenCalledWith(
        configPath,
        expect.stringMatching(/\.bashrc\.backup-\d+/)
      );
    });

    it('should create config file if it does not exist', () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (path === '/home/testuser/.bashrc') return false;
        return true;
      });

      installUpdateChecker('bash', '1.2.3');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/home/testuser/.bashrc',
        ''
      );
    });

    it('should remove existing auto-update block', () => {
      const existingConfig = `# Some config
# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v1.0.0
_ai_toolkit_check_updates() {
  echo "old version"
}
# END AI_TOOLKIT_UPDATE_CHECK
# More config`;

      mockFs.readFileSync.mockReturnValue(existingConfig);

      installUpdateChecker('bash', '1.2.3');

      const writeCall = mockFs.writeFileSync.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('.bashrc') &&
          call[0].split('/').pop() === '.bashrc'
      );

      expect(writeCall).toBeDefined();
      const writtenContent = writeCall?.[1] as string;
      expect(writtenContent).not.toContain('echo "old version"');
    });

    it('should append new auto-update block', () => {
      mockFs.readFileSync.mockReturnValue('# Existing config\n');

      installUpdateChecker('bash', '1.2.3');

      const writeCall = mockFs.writeFileSync.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('.bashrc') &&
          call[0].split('/').pop() === '.bashrc'
      );

      expect(writeCall).toBeDefined();
      const writtenContent = writeCall?.[1] as string;
      expect(writtenContent).toContain(
        '# AUTOMATED BY AI_TOOLKIT_UPDATE_CHECK v1.2.3'
      );
      expect(writtenContent).toContain('# END AI_TOOLKIT_UPDATE_CHECK');
    });

    it('should use fish snippet for fish shell', () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (path === '/home/testuser/.config/fish/config.fish') return true;
        return true;
      });
      mockFs.readFileSync.mockReturnValue('# Existing fish config\n');

      installUpdateChecker('fish', '1.2.3');

      const writeCall = mockFs.writeFileSync.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('config.fish')
      );

      expect(writeCall).toBeDefined();
      const writtenContent = writeCall?.[1] as string;
      expect(writtenContent).toContain('function _ai_toolkit_check_updates');
    });
  });
});
