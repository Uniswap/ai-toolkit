import { vol } from 'memfs';
import { join } from 'path';
import * as os from 'os';
import {
  getGlobalConfigPath,
  getLocalConfigPath,
  getMcpJsonConfigPath,
  readGlobalConfig,
  readLocalConfig,
  readMcpJsonConfig,
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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(mockConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(mockConfig)
      );

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

      vol.writeFileSync(
        join(mockCwd, '.mcp.json'),
        JSON.stringify(mockConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(mockConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(mockConfig)
      );

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

      vol.writeFileSync(
        join(mockCwd, '.mcp.json'),
        JSON.stringify(mockConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(globalConfig)
      );

      // Local .mcp.json
      const localConfig = {
        mcpServers: {
          notion: { command: 'node', args: ['notion-local'] },
          custom: { command: 'node', args: ['custom'] },
        },
      };

      vol.writeFileSync(
        join(mockCwd, '.mcp.json'),
        JSON.stringify(localConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(mockConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(globalConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(globalConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(globalConfig)
      );

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
      });
      expect(statuses).toContainEqual({
        name: 'linear',
        enabled: false,
        source: 'local',
      });
      expect(statuses).toContainEqual({
        name: 'notion',
        enabled: true,
        source: 'none',
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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(mockConfig)
      );

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

      vol.writeFileSync(
        join(mockHomedir, '.claude.json'),
        JSON.stringify(mockConfig)
      );

      const result = hasMcpServers();
      expect(result).toBe(true);
    });

    it('should return true when servers are configured in .mcp.json', () => {
      const mockConfig = {
        mcpServers: {
          local1: { command: 'node', args: ['local1'] },
        },
      };

      vol.writeFileSync(
        join(mockCwd, '.mcp.json'),
        JSON.stringify(mockConfig)
      );

      const result = hasMcpServers();
      expect(result).toBe(true);
    });
  });
});
