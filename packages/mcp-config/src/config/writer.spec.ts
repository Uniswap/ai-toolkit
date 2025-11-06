import { vol } from 'memfs';
import { join } from 'path';
import * as os from 'os';
import { updateLocalConfig, enableServer, disableServer } from './writer';

// Mock fs module with memfs
jest.mock('fs', () => {
  const memfs = jest.requireActual('memfs');
  return memfs.fs;
});

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn(),
}));

describe('Configuration Writer', () => {
  let mockHomedir: string;
  let mockCwd: string;
  let localConfigPath: string;

  beforeEach(() => {
    // Set up mock directories
    mockHomedir = '/home/testuser';
    mockCwd = '/home/testuser/projects/test-project';

    // Mock os.homedir and process.cwd
    (os.homedir as jest.Mock).mockReturnValue(mockHomedir);
    jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);

    // Reset virtual filesystem
    vol.reset();

    // Create mock directory structure
    vol.mkdirSync(mockHomedir, { recursive: true });
    vol.mkdirSync(mockCwd, { recursive: true });

    localConfigPath = join(mockCwd, '.claude', 'settings.local.json');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    vol.reset();
  });

  describe('updateLocalConfig', () => {
    it('should create .claude directory if it does not exist', () => {
      updateLocalConfig(['github']);

      const dirExists = vol.existsSync(join(mockCwd, '.claude'));
      expect(dirExists).toBe(true);
    });

    it('should create new config file with denied servers', () => {
      updateLocalConfig(['github', 'linear']);

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        deniedMcpServers: [{ serverName: 'github' }, { serverName: 'linear' }],
      });
    });

    it('should update existing config file', () => {
      // Create initial config
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          permissions: { allow: ['read', 'write'] },
          deniedMcpServers: [{ serverName: 'old-server' }],
        })
      );

      // Update config
      updateLocalConfig(['github', 'linear']);

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        permissions: { allow: ['read', 'write'] },
        deniedMcpServers: [{ serverName: 'github' }, { serverName: 'linear' }],
      });
    });

    it('should handle empty denied servers array', () => {
      updateLocalConfig([]);

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        deniedMcpServers: [],
      });
    });

    it('should preserve other config properties', () => {
      // Create config with other properties
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          permissions: {
            allow: ['read', 'write'],
            deny: ['delete'],
            ask: ['execute'],
          },
        })
      );

      updateLocalConfig(['github']);

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        permissions: {
          allow: ['read', 'write'],
          deny: ['delete'],
          ask: ['execute'],
        },
        deniedMcpServers: [{ serverName: 'github' }],
      });
    });

    it('should format JSON with 2-space indentation', () => {
      updateLocalConfig(['github']);

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;

      // Check formatting
      expect(content).toContain('{\n  "deniedMcpServers"');
      expect(content).toContain('    {\n      "serverName": "github"\n    }');
    });

    it('should add newline at end of file', () => {
      updateLocalConfig(['github']);

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;

      expect(content.endsWith('\n')).toBe(true);
    });

    it('should handle corrupted existing config gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(localConfigPath, 'invalid json{');

      updateLocalConfig(['github']);

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        deniedMcpServers: [{ serverName: 'github' }],
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('enableServer', () => {
    it('should do nothing if config file does not exist', () => {
      // Should not throw error
      expect(() => enableServer('github')).not.toThrow();

      // Config file should still not exist
      const exists = vol.existsSync(localConfigPath);
      expect(exists).toBe(false);
    });

    it('should do nothing if deniedMcpServers is empty', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          permissions: { allow: ['read'] },
        })
      );

      enableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        permissions: { allow: ['read'] },
      });
    });

    it('should remove server from deniedMcpServers', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          deniedMcpServers: [
            { serverName: 'github' },
            { serverName: 'linear' },
            { serverName: 'notion' },
          ],
        })
      );

      enableServer('linear');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.deniedMcpServers).toEqual([
        { serverName: 'github' },
        { serverName: 'notion' },
      ]);
    });

    it('should preserve other config properties', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          permissions: { allow: ['read', 'write'] },
          deniedMcpServers: [{ serverName: 'github' }, { serverName: 'linear' }],
        })
      );

      enableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        permissions: { allow: ['read', 'write'] },
        deniedMcpServers: [{ serverName: 'linear' }],
      });
    });

    it('should handle removing non-existent server gracefully', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          deniedMcpServers: [{ serverName: 'github' }],
        })
      );

      // Should not throw error
      expect(() => enableServer('nonexistent')).not.toThrow();

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      // Should remain unchanged
      expect(config.deniedMcpServers).toEqual([{ serverName: 'github' }]);
    });

    it('should throw error if config file is corrupted', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(localConfigPath, 'invalid json{');

      expect(() => enableServer('github')).toThrow('Failed to read config');
    });
  });

  describe('disableServer', () => {
    it('should create .claude directory if it does not exist', () => {
      disableServer('github');

      const dirExists = vol.existsSync(join(mockCwd, '.claude'));
      expect(dirExists).toBe(true);
    });

    it('should create new config file with denied server', () => {
      disableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        deniedMcpServers: [{ serverName: 'github' }],
      });
    });

    it('should add server to existing deniedMcpServers', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          deniedMcpServers: [{ serverName: 'github' }],
        })
      );

      disableServer('linear');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.deniedMcpServers).toEqual([
        { serverName: 'github' },
        { serverName: 'linear' },
      ]);
    });

    it('should not duplicate server if already denied', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          deniedMcpServers: [{ serverName: 'github' }],
        })
      );

      disableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.deniedMcpServers).toEqual([{ serverName: 'github' }]);
    });

    it('should preserve other config properties', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          permissions: { allow: ['read', 'write'] },
        })
      );

      disableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        permissions: { allow: ['read', 'write'] },
        deniedMcpServers: [{ serverName: 'github' }],
      });
    });

    it('should initialize deniedMcpServers if it does not exist', () => {
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          permissions: { allow: ['read'] },
        })
      );

      disableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.deniedMcpServers).toEqual([{ serverName: 'github' }]);
    });

    it('should handle corrupted existing config gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(localConfigPath, 'invalid json{');

      disableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config).toEqual({
        deniedMcpServers: [{ serverName: 'github' }],
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should format JSON with 2-space indentation', () => {
      disableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;

      expect(content).toContain('{\n  "deniedMcpServers"');
      expect(content).toContain('    {\n      "serverName": "github"\n    }');
    });

    it('should add newline at end of file', () => {
      disableServer('github');

      const content = vol.readFileSync(localConfigPath, 'utf-8') as string;

      expect(content.endsWith('\n')).toBe(true);
    });
  });
});
