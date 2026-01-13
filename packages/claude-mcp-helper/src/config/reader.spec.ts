import { vol } from 'memfs';
import { join } from 'path';
import * as os from 'os';
import {
  getGlobalConfigPath,
  getLocalConfigPath,
  getMcpJsonConfigPath,
  getInstalledPluginsPath,
  readGlobalConfig,
  readLocalConfig,
  readMcpJsonConfig,
  readInstalledPlugins,
  getPluginMcpServers,
  getServersWithOrigins,
  getAvailableServers,
  getServerStatus,
  getAllServerStatuses,
  hasMcpServers,
} from './reader';

// Mock fs module with memfs
jest.mock('fs', () => {
  const memfs = jest.requireActual('memfs');
  return memfs.fs;
});

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn(),
}));

describe('Configuration Reader', () => {
  let mockHomedir: string;
  let mockCwd: string;

  beforeEach(() => {
    // Set up mock directories
    mockHomedir = '/home/testuser';
    mockCwd = '/home/testuser/projects/test-project';

    // Mock os.homedir
    (os.homedir as jest.Mock).mockReturnValue(mockHomedir);

    // Mock process.cwd
    jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);

    // Reset virtual filesystem
    vol.reset();

    // Create mock directory structure
    vol.mkdirSync(mockHomedir, { recursive: true });
    vol.mkdirSync(mockCwd, { recursive: true });
  });

  afterEach(() => {
    // Restore mocks
    jest.restoreAllMocks();
    vol.reset();
  });

  describe('Path Functions', () => {
    it('should return correct global config path', () => {
      const path = getGlobalConfigPath();
      expect(path).toBe(join(mockHomedir, '.claude.json'));
    });

    it('should return correct local config path', () => {
      const path = getLocalConfigPath();
      expect(path).toBe(join(mockCwd, '.claude', 'settings.local.json'));
    });

    it('should return correct MCP JSON config path', () => {
      const path = getMcpJsonConfigPath();
      expect(path).toBe(join(mockCwd, '.mcp.json'));
    });

    it('should return correct installed plugins path', () => {
      const path = getInstalledPluginsPath();
      expect(path).toBe(join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json'));
    });
  });

  describe('readGlobalConfig', () => {
    it('should return empty config when file does not exist', () => {
      const config = readGlobalConfig();
      expect(config).toEqual({});
    });

    it('should read global config successfully', () => {
      const mockConfig = {
        mcpServers: {
          github: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
          },
          linear: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-linear'],
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(mockConfig));

      const config = readGlobalConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      vol.writeFileSync(join(mockHomedir, '.claude.json'), 'invalid json{');

      const config = readGlobalConfig();
      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should read config with projects section', () => {
      const mockConfig = {
        mcpServers: {
          global1: { command: 'npx', args: ['global1'] },
        },
        projects: {
          [mockCwd]: {
            mcpServers: {
              project1: { command: 'npx', args: ['project1'] },
            },
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(mockConfig));

      const config = readGlobalConfig();
      expect(config).toEqual(mockConfig);
    });
  });

  describe('readLocalConfig', () => {
    it('should return empty config when file does not exist', () => {
      const config = readLocalConfig();
      expect(config).toEqual({});
    });

    it('should read local config successfully', () => {
      const mockConfig = {
        deniedMcpServers: [{ serverName: 'github' }, { serverName: 'linear' }],
      };

      const localPath = join(mockCwd, '.claude', 'settings.local.json');
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(localPath, JSON.stringify(mockConfig));

      const config = readLocalConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const localPath = join(mockCwd, '.claude', 'settings.local.json');
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(localPath, 'invalid json{');

      const config = readLocalConfig();
      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('readMcpJsonConfig', () => {
    it('should return empty config when file does not exist', () => {
      const config = readMcpJsonConfig();
      expect(config).toEqual({});
    });

    it('should read .mcp.json config successfully', () => {
      const mockConfig = {
        mcpServers: {
          'team-tool': {
            command: 'node',
            args: ['./scripts/team-tool.js'],
          },
        },
      };

      vol.writeFileSync(join(mockCwd, '.mcp.json'), JSON.stringify(mockConfig));

      const config = readMcpJsonConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      vol.writeFileSync(join(mockCwd, '.mcp.json'), 'invalid json{');

      const config = readMcpJsonConfig();
      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('readInstalledPlugins', () => {
    it('should return default config when file does not exist', () => {
      const config = readInstalledPlugins();
      expect(config).toEqual({ version: 2, plugins: {} });
    });

    it('should read installed plugins config successfully', () => {
      const mockConfig = {
        version: 2,
        plugins: {
          'test-plugin@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(mockConfig));

      const config = readInstalledPlugins();
      expect(config).toEqual(mockConfig);
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, 'invalid json{');

      const config = readInstalledPlugins();
      expect(config).toEqual({ version: 2, plugins: {} });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should read config with multiple plugins', () => {
      const mockConfig = {
        version: 2,
        plugins: {
          'plugin-a@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-a',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
          'plugin-b@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-b',
              version: '2.0.0',
              installedAt: '2024-01-02T00:00:00.000Z',
              lastUpdated: '2024-01-02T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(mockConfig));

      const config = readInstalledPlugins();
      expect(config).toEqual(mockConfig);
      expect(Object.keys(config.plugins)).toHaveLength(2);
    });
  });

  describe('getPluginMcpServers', () => {
    it('should return empty map when no plugins installed', () => {
      const servers = getPluginMcpServers();
      expect(servers.size).toBe(0);
    });

    it('should return servers from single plugin with MCP config', () => {
      // Setup installed plugins
      const installedPlugins = {
        version: 2,
        plugins: {
          'my-plugin@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/my-plugin',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      // Setup plugin MCP config
      const pluginMcpConfig = {
        mcpServers: {
          'plugin-server-1': { command: 'npx', args: ['server1'] },
          'plugin-server-2': { command: 'npx', args: ['server2'] },
        },
      };

      vol.mkdirSync('/path/to/my-plugin', { recursive: true });
      vol.writeFileSync(join('/path/to/my-plugin', '.mcp.json'), JSON.stringify(pluginMcpConfig));

      const servers = getPluginMcpServers();
      expect(servers.size).toBe(2);
      expect(servers.get('plugin-server-1')).toBe('my-plugin');
      expect(servers.get('plugin-server-2')).toBe('my-plugin');
    });

    it('should return servers from multiple plugins', () => {
      // Setup installed plugins
      const installedPlugins = {
        version: 2,
        plugins: {
          'plugin-a@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-a',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
          'plugin-b@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-b',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      // Setup plugin-a MCP config
      vol.mkdirSync('/path/to/plugin-a', { recursive: true });
      vol.writeFileSync(
        join('/path/to/plugin-a', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'server-from-a': { command: 'npx', args: ['a'] },
          },
        })
      );

      // Setup plugin-b MCP config
      vol.mkdirSync('/path/to/plugin-b', { recursive: true });
      vol.writeFileSync(
        join('/path/to/plugin-b', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'server-from-b': { command: 'npx', args: ['b'] },
          },
        })
      );

      const servers = getPluginMcpServers();
      expect(servers.size).toBe(2);
      expect(servers.get('server-from-a')).toBe('plugin-a');
      expect(servers.get('server-from-b')).toBe('plugin-b');
    });

    it('should skip plugins without .mcp.json file', () => {
      // Setup installed plugins
      const installedPlugins = {
        version: 2,
        plugins: {
          'plugin-with-mcp@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-with-mcp',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
          'plugin-without-mcp@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-without-mcp',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      // Only setup MCP config for one plugin
      vol.mkdirSync('/path/to/plugin-with-mcp', { recursive: true });
      vol.writeFileSync(
        join('/path/to/plugin-with-mcp', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'mcp-server': { command: 'npx', args: ['server'] },
          },
        })
      );

      // Create directory but no .mcp.json for the other plugin
      vol.mkdirSync('/path/to/plugin-without-mcp', { recursive: true });

      const servers = getPluginMcpServers();
      expect(servers.size).toBe(1);
      expect(servers.get('mcp-server')).toBe('plugin-with-mcp');
    });

    it('should handle invalid .mcp.json in plugins gracefully', () => {
      // Setup installed plugins
      const installedPlugins = {
        version: 2,
        plugins: {
          'plugin-invalid@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-invalid',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      // Setup invalid MCP config
      vol.mkdirSync('/path/to/plugin-invalid', { recursive: true });
      vol.writeFileSync(join('/path/to/plugin-invalid', '.mcp.json'), 'invalid json{');

      const servers = getPluginMcpServers();
      // Should return empty map - invalid JSON is silently ignored
      expect(servers.size).toBe(0);
    });

    it('should not overwrite existing server if registered by another plugin', () => {
      // Setup installed plugins
      const installedPlugins = {
        version: 2,
        plugins: {
          'plugin-first@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-first',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
          'plugin-second@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin-second',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      // Both plugins define same server name
      vol.mkdirSync('/path/to/plugin-first', { recursive: true });
      vol.writeFileSync(
        join('/path/to/plugin-first', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'shared-server': { command: 'npx', args: ['first'] },
          },
        })
      );

      vol.mkdirSync('/path/to/plugin-second', { recursive: true });
      vol.writeFileSync(
        join('/path/to/plugin-second', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'shared-server': { command: 'npx', args: ['second'] },
          },
        })
      );

      const servers = getPluginMcpServers();
      expect(servers.size).toBe(1);
      // First one should win
      expect(servers.get('shared-server')).toBe('plugin-first');
    });

    it('should extract plugin name from key format "pluginName@marketplace"', () => {
      const installedPlugins = {
        version: 2,
        plugins: {
          'my-awesome-plugin@some-marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/plugin',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      vol.mkdirSync('/path/to/plugin', { recursive: true });
      vol.writeFileSync(
        join('/path/to/plugin', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'test-server': { command: 'npx', args: ['test'] },
          },
        })
      );

      const servers = getPluginMcpServers();
      // Plugin name should be extracted (without @marketplace suffix)
      expect(servers.get('test-server')).toBe('my-awesome-plugin');
    });

    it('should skip plugins with empty installations array', () => {
      const installedPlugins = {
        version: 2,
        plugins: {
          'empty-plugin@marketplace': [],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      const servers = getPluginMcpServers();
      expect(servers.size).toBe(0);
    });
  });

  describe('getServersWithOrigins', () => {
    it('should return empty array when no servers configured', () => {
      const servers = getServersWithOrigins();
      expect(servers).toEqual([]);
    });

    it('should return servers with global origin', () => {
      const globalConfig = {
        mcpServers: {
          github: { command: 'npx', args: ['github'] },
          linear: { command: 'npx', args: ['linear'] },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      const servers = getServersWithOrigins();
      expect(servers).toHaveLength(2);
      expect(servers).toContainEqual({ name: 'github', origin: { type: 'global' } });
      expect(servers).toContainEqual({ name: 'linear', origin: { type: 'global' } });
    });

    it('should return servers with project origin', () => {
      const globalConfig = {
        projects: {
          [mockCwd]: {
            mcpServers: {
              'project-server': { command: 'npx', args: ['project'] },
            },
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      const servers = getServersWithOrigins();
      expect(servers).toHaveLength(1);
      expect(servers[0]).toEqual({ name: 'project-server', origin: { type: 'project' } });
    });

    it('should return servers with local origin from .mcp.json', () => {
      const localConfig = {
        mcpServers: {
          'local-server': { command: 'node', args: ['local'] },
        },
      };

      vol.writeFileSync(join(mockCwd, '.mcp.json'), JSON.stringify(localConfig));

      const servers = getServersWithOrigins();
      expect(servers).toHaveLength(1);
      expect(servers[0]).toEqual({ name: 'local-server', origin: { type: 'local' } });
    });

    it('should return servers with plugin origin', () => {
      // Setup installed plugins
      const installedPlugins = {
        version: 2,
        plugins: {
          'test-plugin@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/test-plugin',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      // Setup plugin MCP config
      vol.mkdirSync('/path/to/test-plugin', { recursive: true });
      vol.writeFileSync(
        join('/path/to/test-plugin', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'plugin-server': { command: 'npx', args: ['plugin'] },
          },
        })
      );

      const servers = getServersWithOrigins();
      expect(servers).toHaveLength(1);
      expect(servers[0]).toEqual({
        name: 'plugin-server',
        origin: { type: 'plugin', pluginName: 'test-plugin' },
      });
    });

    it('should combine servers from all sources and deduplicate by first-seen origin', () => {
      // Global config
      const globalConfig = {
        mcpServers: {
          'global-server': { command: 'npx', args: ['global'] },
          'shared-server': { command: 'npx', args: ['shared-global'] },
        },
        projects: {
          [mockCwd]: {
            mcpServers: {
              'project-server': { command: 'npx', args: ['project'] },
              'shared-server': { command: 'npx', args: ['shared-project'] }, // duplicate - should use global
            },
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      // Local .mcp.json
      vol.writeFileSync(
        join(mockCwd, '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'local-server': { command: 'node', args: ['local'] },
            'shared-server': { command: 'node', args: ['shared-local'] }, // duplicate - should use global
          },
        })
      );

      const servers = getServersWithOrigins();

      // Should have 4 unique servers
      expect(servers).toHaveLength(4);

      // Check that shared-server has global origin (first-seen)
      const sharedServer = servers.find((s) => s.name === 'shared-server');
      expect(sharedServer).toEqual({ name: 'shared-server', origin: { type: 'global' } });

      // Check other servers have correct origins
      expect(servers).toContainEqual({ name: 'global-server', origin: { type: 'global' } });
      expect(servers).toContainEqual({ name: 'project-server', origin: { type: 'project' } });
      expect(servers).toContainEqual({ name: 'local-server', origin: { type: 'local' } });
    });

    it('should return servers sorted alphabetically by name', () => {
      const globalConfig = {
        mcpServers: {
          zebra: { command: 'npx', args: ['zebra'] },
          apple: { command: 'npx', args: ['apple'] },
          monkey: { command: 'npx', args: ['monkey'] },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      const servers = getServersWithOrigins();
      expect(servers.map((s) => s.name)).toEqual(['apple', 'monkey', 'zebra']);
    });

    it('should include plugin servers with other sources', () => {
      // Global config
      const globalConfig = {
        mcpServers: {
          'global-server': { command: 'npx', args: ['global'] },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      // Local .mcp.json
      vol.writeFileSync(
        join(mockCwd, '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'local-server': { command: 'node', args: ['local'] },
          },
        })
      );

      // Plugin setup
      const installedPlugins = {
        version: 2,
        plugins: {
          'my-plugin@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/my-plugin',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      vol.mkdirSync('/path/to/my-plugin', { recursive: true });
      vol.writeFileSync(
        join('/path/to/my-plugin', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'plugin-server': { command: 'npx', args: ['plugin'] },
          },
        })
      );

      const servers = getServersWithOrigins();

      expect(servers).toHaveLength(3);
      expect(servers).toContainEqual({ name: 'global-server', origin: { type: 'global' } });
      expect(servers).toContainEqual({ name: 'local-server', origin: { type: 'local' } });
      expect(servers).toContainEqual({
        name: 'plugin-server',
        origin: { type: 'plugin', pluginName: 'my-plugin' },
      });
    });

    it('should prefer non-plugin origins when server exists in both user config and plugin', () => {
      // Global config with server that also exists in plugin
      const globalConfig = {
        mcpServers: {
          'overlapping-server': { command: 'npx', args: ['global-version'] },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      // Plugin with same server name
      const installedPlugins = {
        version: 2,
        plugins: {
          'my-plugin@marketplace': [
            {
              scope: 'user',
              installPath: '/path/to/my-plugin',
              version: '1.0.0',
              installedAt: '2024-01-01T00:00:00.000Z',
              lastUpdated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      };

      const pluginsPath = join(mockHomedir, '.claude', 'plugins', 'installed_plugins.json');
      vol.mkdirSync(join(mockHomedir, '.claude', 'plugins'), { recursive: true });
      vol.writeFileSync(pluginsPath, JSON.stringify(installedPlugins));

      vol.mkdirSync('/path/to/my-plugin', { recursive: true });
      vol.writeFileSync(
        join('/path/to/my-plugin', '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            'overlapping-server': { command: 'npx', args: ['plugin-version'] },
          },
        })
      );

      const servers = getServersWithOrigins();

      // Should only have one entry for 'overlapping-server' with global origin
      expect(servers).toHaveLength(1);
      expect(servers[0]).toEqual({ name: 'overlapping-server', origin: { type: 'global' } });
    });
  });

  describe('getAvailableServers', () => {
    it('should return empty array when no servers configured', () => {
      const servers = getAvailableServers();
      expect(servers).toEqual([]);
    });

    it('should return servers from global config', () => {
      const mockConfig = {
        mcpServers: {
          github: { command: 'npx', args: ['github'] },
          linear: { command: 'npx', args: ['linear'] },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(mockConfig));

      const servers = getAvailableServers();
      expect(servers).toEqual(['github', 'linear']);
    });

    it('should return servers from project-specific config', () => {
      const mockConfig = {
        projects: {
          [mockCwd]: {
            mcpServers: {
              project1: { command: 'npx', args: ['project1'] },
              project2: { command: 'npx', args: ['project2'] },
            },
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(mockConfig));

      const servers = getAvailableServers();
      expect(servers).toEqual(['project1', 'project2']);
    });

    it('should return servers from .mcp.json', () => {
      const mockConfig = {
        mcpServers: {
          local1: { command: 'node', args: ['local1'] },
          local2: { command: 'node', args: ['local2'] },
        },
      };

      vol.writeFileSync(join(mockCwd, '.mcp.json'), JSON.stringify(mockConfig));

      const servers = getAvailableServers();
      expect(servers).toEqual(['local1', 'local2']);
    });

    it('should combine and deduplicate servers from all sources', () => {
      // Global config
      const globalConfig = {
        mcpServers: {
          github: { command: 'npx', args: ['github'] },
          linear: { command: 'npx', args: ['linear'] },
        },
        projects: {
          [mockCwd]: {
            mcpServers: {
              github: { command: 'npx', args: ['github-override'] },
              notion: { command: 'npx', args: ['notion'] },
            },
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      // Local .mcp.json
      const localConfig = {
        mcpServers: {
          notion: { command: 'node', args: ['notion-local'] },
          custom: { command: 'node', args: ['custom'] },
        },
      };

      vol.writeFileSync(join(mockCwd, '.mcp.json'), JSON.stringify(localConfig));

      const servers = getAvailableServers();
      // Should deduplicate and sort
      expect(servers).toEqual(['custom', 'github', 'linear', 'notion']);
    });

    it('should return sorted server names', () => {
      const mockConfig = {
        mcpServers: {
          zebra: { command: 'npx', args: ['zebra'] },
          apple: { command: 'npx', args: ['apple'] },
          monkey: { command: 'npx', args: ['monkey'] },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(mockConfig));

      const servers = getAvailableServers();
      expect(servers).toEqual(['apple', 'monkey', 'zebra']);
    });
  });

  describe('getServerStatus', () => {
    it('should return enabled status when no config exists', () => {
      const status = getServerStatus('github');
      expect(status).toEqual({
        name: 'github',
        enabled: true,
        source: 'none',
      });
    });

    it('should return disabled status when server is in local deniedMcpServers', () => {
      const localConfig = {
        deniedMcpServers: [{ serverName: 'github' }],
      };

      const localPath = join(mockCwd, '.claude', 'settings.local.json');
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(localPath, JSON.stringify(localConfig));

      const status = getServerStatus('github');
      expect(status).toEqual({
        name: 'github',
        enabled: false,
        source: 'local',
      });
    });

    it('should return disabled status when server is in global disabledMcpServers', () => {
      const globalConfig = {
        projects: {
          [mockCwd]: {
            disabledMcpServers: ['github'],
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      const status = getServerStatus('github');
      expect(status).toEqual({
        name: 'github',
        enabled: false,
        source: 'global',
      });
    });

    it('should prioritize local config over global config', () => {
      // Global config says disabled
      const globalConfig = {
        projects: {
          [mockCwd]: {
            disabledMcpServers: ['github'],
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      // Local config also says disabled (but local should be checked first)
      const localConfig = {
        deniedMcpServers: [{ serverName: 'github' }],
      };

      const localPath = join(mockCwd, '.claude', 'settings.local.json');
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(localPath, JSON.stringify(localConfig));

      const status = getServerStatus('github');
      // Should return 'local' as source since it's checked first
      expect(status).toEqual({
        name: 'github',
        enabled: false,
        source: 'local',
      });
    });
  });

  describe('getAllServerStatuses', () => {
    it('should return empty array when no servers configured', () => {
      const statuses = getAllServerStatuses();
      expect(statuses).toEqual([]);
    });

    it('should return status for all servers', () => {
      const globalConfig = {
        mcpServers: {
          github: { command: 'npx', args: ['github'] },
          linear: { command: 'npx', args: ['linear'] },
          notion: { command: 'npx', args: ['notion'] },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(globalConfig));

      const localConfig = {
        deniedMcpServers: [{ serverName: 'linear' }],
      };

      const localPath = join(mockCwd, '.claude', 'settings.local.json');
      vol.mkdirSync(join(mockCwd, '.claude'), { recursive: true });
      vol.writeFileSync(localPath, JSON.stringify(localConfig));

      const statuses = getAllServerStatuses();
      expect(statuses).toHaveLength(3);
      expect(statuses).toContainEqual({
        name: 'github',
        enabled: true,
        source: 'none',
        origin: { type: 'global' },
      });
      expect(statuses).toContainEqual({
        name: 'linear',
        enabled: false,
        source: 'local',
        origin: { type: 'global' },
      });
      expect(statuses).toContainEqual({
        name: 'notion',
        enabled: true,
        source: 'none',
        origin: { type: 'global' },
      });
    });
  });

  describe('hasMcpServers', () => {
    it('should return false when no servers configured', () => {
      const result = hasMcpServers();
      expect(result).toBe(false);
    });

    it('should return true when servers are configured in global config', () => {
      const mockConfig = {
        mcpServers: {
          github: { command: 'npx', args: ['github'] },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(mockConfig));

      const result = hasMcpServers();
      expect(result).toBe(true);
    });

    it('should return true when servers are configured in project config', () => {
      const mockConfig = {
        projects: {
          [mockCwd]: {
            mcpServers: {
              project1: { command: 'npx', args: ['project1'] },
            },
          },
        },
      };

      vol.writeFileSync(join(mockHomedir, '.claude.json'), JSON.stringify(mockConfig));

      const result = hasMcpServers();
      expect(result).toBe(true);
    });

    it('should return true when servers are configured in .mcp.json', () => {
      const mockConfig = {
        mcpServers: {
          local1: { command: 'node', args: ['local1'] },
        },
      };

      vol.writeFileSync(join(mockCwd, '.mcp.json'), JSON.stringify(mockConfig));

      const result = hasMcpServers();
      expect(result).toBe(true);
    });
  });
});
