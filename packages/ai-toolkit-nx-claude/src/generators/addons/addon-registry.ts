// import { Tree } from '@nx/devkit'; // Not used
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Metadata for a Claude Code addon
 */
export interface AddonMetadata {
  /** Unique identifier for the addon */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Type of addon */
  type: 'mcp-server' | 'extension' | 'tool' | 'project-setup';
  /** Package name for the addon */
  packageName: string;
  /** Registry URL (optional, defaults to npm) */
  registry?: string;
  /** Required authentication for installation */
  requiresAuth?: boolean;
  /** MCP-specific configuration */
  mcp?: {
    /** Server name for Claude MCP registration */
    serverName?: string;
    /** Command to run the MCP server */
    command: string;
    /** Arguments for the command */
    args?: string[];
    /** Environment variables */
    env?: Record<string, string>;
    /** Whether the server supports dashboard mode */
    supportsDashboard?: boolean;
    /** Default port for dashboard (if applicable) */
    defaultPort?: number;
  };
  /** Installation requirements */
  requirements?: {
    /** Required Node.js version */
    node?: string;
    /** Required system commands */
    commands?: string[];
  };
  /** Project setup configuration */
  projectSetup?: {
    /** Git repository to clone */
    repositoryUrl: string;
    /** Path within repo to copy from */
    configSourcePath: string;
    /** Directory name to create in project */
    targetDirectory: string;
    /** Whether repo needs authentication */
    requiresAuth: boolean;
  };
}

/**
 * Registry of available addons
 */
const ADDON_REGISTRY: AddonMetadata[] = [
  {
    id: 'spec-workflow-mcp',
    name: 'Spec Workflow MCP',
    description:
      'MCP server for spec-driven development workflow with dashboard support',
    type: 'mcp-server',
    packageName: '@uniswap/spec-workflow-mcp',
    registry: 'https://npm.pkg.github.com',
    requiresAuth: true,
    mcp: {
      serverName: 'spec-workflow',
      command: 'npx',
      args: ['@uniswap/spec-workflow-mcp@latest'],
      supportsDashboard: true,
      defaultPort: 50014,
    },
    projectSetup: {
      repositoryUrl: 'https://github.com/Uniswap/spec-workflow-mcp.git',
      configSourcePath: 'configs',
      targetDirectory: '.spec-workflow',
      requiresAuth: false,
    },
    requirements: {
      node: '>=18.0.0',
      commands: ['git', 'npm'],
    },
  },
  // Future addons can be added here
];

/**
 * Get all available addons
 */
export function getAvailableAddons(): AddonMetadata[] {
  return ADDON_REGISTRY;
}

/**
 * Get an addon by ID
 */
export function getAddonById(id: string): AddonMetadata | undefined {
  return ADDON_REGISTRY.find((addon) => addon.id === id);
}

/**
 * Check if an addon is installed in Claude configuration
 */
export async function isAddonInstalled(addonId: string): Promise<boolean> {
  const addon = getAddonById(addonId);
  if (!addon) {
    return false;
  }

  // Check both global and local Claude configs
  const configs = [
    join(homedir(), '.claude', 'config.json'),
    join(process.cwd(), '.claude', 'config.json'),
  ];

  for (const configPath of configs) {
    if (existsSync(configPath)) {
      try {
        const config = require(configPath);

        // Check if MCP server is configured
        if (addon.type === 'mcp-server' && config.mcpServers) {
          // Look for the server by package name or command
          for (const [, serverConfig] of Object.entries(config.mcpServers)) {
            if (
              serverConfig &&
              typeof serverConfig === 'object' &&
              'command' in serverConfig
            ) {
              const command = (serverConfig as any).command;
              const args = (serverConfig as any).args || [];

              // Check if this matches our addon
              if (
                command === addon.mcp?.command &&
                args.some((arg: string) => arg.includes(addon.packageName))
              ) {
                return true;
              }
            }
          }
        }
      } catch (error) {
        // Config parse error, continue checking
        continue;
      }
    }
  }

  return false;
}

/**
 * Get installed addon configuration from Claude config
 */
export async function getInstalledAddonConfig(
  addonId: string
): Promise<Record<string, any> | undefined> {
  const addon = getAddonById(addonId);
  if (!addon) {
    return undefined;
  }

  // Check both global and local Claude configs
  const configs = [
    join(homedir(), '.claude', 'config.json'),
    join(process.cwd(), '.claude', 'config.json'),
  ];

  for (const configPath of configs) {
    if (existsSync(configPath)) {
      try {
        const config = require(configPath);

        if (addon.type === 'mcp-server' && config.mcpServers) {
          for (const [, serverConfig] of Object.entries(config.mcpServers)) {
            if (
              serverConfig &&
              typeof serverConfig === 'object' &&
              'command' in serverConfig
            ) {
              const command = (serverConfig as any).command;
              const args = (serverConfig as any).args || [];

              if (
                command === addon.mcp?.command &&
                args.some((arg: string) => arg.includes(addon.packageName))
              ) {
                return serverConfig as Record<string, any>;
              }
            }
          }
        }
      } catch (error) {
        continue;
      }
    }
  }

  return undefined;
}

/**
 * Validate addon requirements
 */
export async function validateAddonRequirements(
  addonId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const addon = getAddonById(addonId);
  if (!addon) {
    return { valid: false, errors: [`Unknown addon: ${addonId}`] };
  }

  const errors: string[] = [];

  // Check Node.js version if required
  if (addon.requirements?.node) {
    const nodeVersion = process.version;
    // Simple version check - could be improved with semver
    if (
      !nodeVersion.match(/v1[89]\.\d+\.\d+/) &&
      !nodeVersion.match(/v2\d+\.\d+\.\d+/)
    ) {
      errors.push(
        `Node.js ${addon.requirements.node} required, found ${nodeVersion}`
      );
    }
  }

  // Check required commands
  if (addon.requirements?.commands) {
    const { execSync } = require('child_process');
    for (const cmd of addon.requirements.commands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
      } catch {
        errors.push(`Required command '${cmd}' not found`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
