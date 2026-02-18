import { vol } from 'memfs';
import { join } from 'path';
import * as os from 'os';
import {
  updateLocalConfig,
  enableServer,
  disableServer,
  updateGlobalConfigPluginServers,
} from './writer';

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
  let globalConfigPath: string;

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
    globalConfigPath = join(mockHomedir, '.claude.json');
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

      expect(config.deniedMcpServers).toEqual([{ serverName: 'github' }, { serverName: 'notion' }]);
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

      expect(config.deniedMcpServers).toEqual([{ serverName: 'github' }, { serverName: 'linear' }]);
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

  describe('updateGlobalConfigPluginServers', () => {
    it('should create global config with disabled plugin servers', () => {
      updateGlobalConfigPluginServers(['plugin:my-plugin:server1', 'plugin:my-plugin:server2']);

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.projects[mockCwd].disabledMcpServers).toEqual([
        'plugin:my-plugin:server1',
        'plugin:my-plugin:server2',
      ]);
    });

    it('should preserve existing global config properties', () => {
      // Create existing global config
      vol.writeFileSync(
        globalConfigPath,
        JSON.stringify({
          mcpServers: { github: { command: 'npx', args: ['github-mcp'] } },
          projects: {
            '/other/project': { mcpServers: { custom: { command: 'node' } } },
          },
        })
      );

      updateGlobalConfigPluginServers(['plugin:test:server']);

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      // Existing mcpServers preserved
      expect(config.mcpServers).toEqual({ github: { command: 'npx', args: ['github-mcp'] } });
      // Other project preserved
      expect(config.projects['/other/project']).toEqual({
        mcpServers: { custom: { command: 'node' } },
      });
      // Current project updated
      expect(config.projects[mockCwd].disabledMcpServers).toEqual(['plugin:test:server']);
    });

    it('should handle empty plugin servers array', () => {
      updateGlobalConfigPluginServers([]);

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.projects[mockCwd].disabledMcpServers).toEqual([]);
    });

    it('should overwrite existing disabledMcpServers for current project', () => {
      // Create existing global config with disabled servers
      vol.writeFileSync(
        globalConfigPath,
        JSON.stringify({
          projects: {
            [mockCwd]: {
              disabledMcpServers: ['plugin:old:server'],
            },
          },
        })
      );

      updateGlobalConfigPluginServers(['plugin:new:server1', 'plugin:new:server2']);

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.projects[mockCwd].disabledMcpServers).toEqual([
        'plugin:new:server1',
        'plugin:new:server2',
      ]);
    });
  });

  describe('updateLocalConfig with plugin servers', () => {
    it('should route plugin servers to global config and regular servers to local config', () => {
      updateLocalConfig([
        'github',
        'plugin:my-plugin:server1',
        'linear',
        'plugin:other-plugin:server2',
      ]);

      // Check local config - should only have regular servers
      const localContent = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const localConfig = JSON.parse(localContent);
      expect(localConfig.deniedMcpServers).toEqual([
        { serverName: 'github' },
        { serverName: 'linear' },
      ]);

      // Check global config - should only have plugin servers
      const globalContent = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const globalConfig = JSON.parse(globalContent);
      expect(globalConfig.projects[mockCwd].disabledMcpServers).toEqual([
        'plugin:my-plugin:server1',
        'plugin:other-plugin:server2',
      ]);
    });

    it('should handle only plugin servers (no regular servers)', () => {
      updateLocalConfig(['plugin:my-plugin:server']);

      // Local config should have empty deniedMcpServers
      const localContent = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const localConfig = JSON.parse(localContent);
      expect(localConfig.deniedMcpServers).toEqual([]);

      // Global config should have the plugin server
      const globalContent = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const globalConfig = JSON.parse(globalContent);
      expect(globalConfig.projects[mockCwd].disabledMcpServers).toEqual([
        'plugin:my-plugin:server',
      ]);
    });

    it('should handle only regular servers (no plugin servers)', () => {
      updateLocalConfig(['github', 'linear']);

      // Local config should have regular servers
      const localContent = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const localConfig = JSON.parse(localContent);
      expect(localConfig.deniedMcpServers).toEqual([
        { serverName: 'github' },
        { serverName: 'linear' },
      ]);

      // Global config should have empty disabledMcpServers
      const globalContent = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const globalConfig = JSON.parse(globalContent);
      expect(globalConfig.projects[mockCwd].disabledMcpServers).toEqual([]);
    });
  });

  describe('enableServer for plugin servers', () => {
    it('should remove plugin server from global config disabledMcpServers', () => {
      // Set up global config with disabled plugin servers
      vol.writeFileSync(
        globalConfigPath,
        JSON.stringify({
          projects: {
            [mockCwd]: {
              disabledMcpServers: [
                'plugin:my-plugin:server1',
                'plugin:my-plugin:server2',
                'plugin:other:server',
              ],
            },
          },
        })
      );

      enableServer('plugin:my-plugin:server1');

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.projects[mockCwd].disabledMcpServers).toEqual([
        'plugin:my-plugin:server2',
        'plugin:other:server',
      ]);
    });

    it('should not modify local config when enabling plugin server', () => {
      // Set up local config with regular denied servers
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(
        localConfigPath,
        JSON.stringify({
          deniedMcpServers: [{ serverName: 'github' }],
        })
      );

      // Set up global config with disabled plugin servers
      vol.writeFileSync(
        globalConfigPath,
        JSON.stringify({
          projects: {
            [mockCwd]: {
              disabledMcpServers: ['plugin:my-plugin:server'],
            },
          },
        })
      );

      enableServer('plugin:my-plugin:server');

      // Local config should remain unchanged
      const localContent = vol.readFileSync(localConfigPath, 'utf-8') as string;
      const localConfig = JSON.parse(localContent);
      expect(localConfig.deniedMcpServers).toEqual([{ serverName: 'github' }]);

      // Global config should have plugin server removed
      const globalContent = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const globalConfig = JSON.parse(globalContent);
      expect(globalConfig.projects[mockCwd].disabledMcpServers).toEqual([]);
    });

    it('should do nothing if global config does not exist', () => {
      // No global config, no local config
      expect(() => enableServer('plugin:my-plugin:server')).not.toThrow();

      // Global config should still not exist
      expect(vol.existsSync(globalConfigPath)).toBe(false);
    });

    it('should do nothing if project has no disabledMcpServers', () => {
      vol.writeFileSync(
        globalConfigPath,
        JSON.stringify({
          projects: {
            [mockCwd]: {},
          },
        })
      );

      enableServer('plugin:my-plugin:server');

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      // Should not add disabledMcpServers array
      expect(config.projects[mockCwd].disabledMcpServers).toBeUndefined();
    });

    it('should throw error if global config is corrupted', () => {
      vol.writeFileSync(globalConfigPath, 'invalid json{');

      expect(() => enableServer('plugin:my-plugin:server')).toThrow('Failed to read global config');
    });
  });

  describe('disableServer for plugin servers', () => {
    it('should add plugin server to global config disabledMcpServers', () => {
      disableServer('plugin:my-plugin:server');

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.projects[mockCwd].disabledMcpServers).toEqual(['plugin:my-plugin:server']);
    });

    it('should add plugin server to existing disabledMcpServers', () => {
      vol.writeFileSync(
        globalConfigPath,
        JSON.stringify({
          projects: {
            [mockCwd]: {
              disabledMcpServers: ['plugin:existing:server'],
            },
          },
        })
      );

      disableServer('plugin:new:server');

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.projects[mockCwd].disabledMcpServers).toEqual([
        'plugin:existing:server',
        'plugin:new:server',
      ]);
    });

    it('should not duplicate plugin server if already disabled', () => {
      vol.writeFileSync(
        globalConfigPath,
        JSON.stringify({
          projects: {
            [mockCwd]: {
              disabledMcpServers: ['plugin:my-plugin:server'],
            },
          },
        })
      );

      disableServer('plugin:my-plugin:server');

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.projects[mockCwd].disabledMcpServers).toEqual(['plugin:my-plugin:server']);
    });

    it('should not modify local config when disabling plugin server', () => {
      // No local config initially
      disableServer('plugin:my-plugin:server');

      // Global config should have the plugin server
      const globalContent = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const globalConfig = JSON.parse(globalContent);
      expect(globalConfig.projects[mockCwd].disabledMcpServers).toEqual([
        'plugin:my-plugin:server',
      ]);

      // Local config should NOT exist since we only disabled a plugin server
      expect(vol.existsSync(localConfigPath)).toBe(false);
    });

    it('should preserve existing global config when disabling plugin server', () => {
      vol.writeFileSync(
        globalConfigPath,
        JSON.stringify({
          mcpServers: { github: { command: 'npx' } },
          projects: {
            '/other/project': { mcpServers: {} },
          },
        })
      );

      disableServer('plugin:my-plugin:server');

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.mcpServers).toEqual({ github: { command: 'npx' } });
      expect(config.projects['/other/project']).toEqual({ mcpServers: {} });
      expect(config.projects[mockCwd].disabledMcpServers).toEqual(['plugin:my-plugin:server']);
    });

    it('should handle corrupted global config gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      vol.writeFileSync(globalConfigPath, 'invalid json{');

      disableServer('plugin:my-plugin:server');

      const content = vol.readFileSync(globalConfigPath, 'utf-8') as string;
      const config = JSON.parse(content);

      expect(config.projects[mockCwd].disabledMcpServers).toEqual(['plugin:my-plugin:server']);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
