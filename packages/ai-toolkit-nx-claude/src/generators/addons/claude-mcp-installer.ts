import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type {
  AddonMetadata,
  McpCommandAddonMetadata,
  McpRemoteHostedAddonMetadata,
} from './addon-registry';
import { isCommandMcpServer, isRemoteHostedMcpServer } from './addon-registry';

/**
 * MCP installation options
 */
export interface MCPInstallOptions {
  /** The addon to install */
  addon: AddonMetadata;
  /** Additional arguments specific to the MCP server */
  additionalArgs?: string[];
  /** Whether to use dry-run mode */
  dryRun?: boolean;
}

/**
 * Install an MCP server using Claude CLI
 */
export async function installMcpServer(options: MCPInstallOptions): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  const { addon, additionalArgs = [], dryRun = false } = options;

  // Check if Claude CLI is available
  try {
    execSync('claude --version', { stdio: 'ignore' });
  } catch {
    return {
      success: false,
      message: 'Claude CLI not found',
      error:
        'Please install Claude CLI first. Visit https://claude.ai/download',
    };
  }

  // Build the Claude MCP add command
  // The server name should come from the addon ID or a specific field
  const serverName = addon.mcp?.serverName;
  let command = `claude mcp add ${serverName} --scope user`;

  // Add environment variables if specified
  if (addon.mcp?.env && Object.keys(addon.mcp.env).length > 0) {
    for (const [key, value] of Object.entries(addon.mcp.env)) {
      command += ` --env ${key}=${value}`;
    }
  }

  if (isCommandMcpServer(addon.mcp)) {
    const mcpMetadata = addon.mcp as McpCommandAddonMetadata;
    // Add the -- separator before the command
    command += ' --';

    // Add the MCP server command and args
    if (mcpMetadata.command) {
      command += ` ${mcpMetadata.command}`;

      // Add all args from the addon configuration
      if (mcpMetadata.args && mcpMetadata.args.length > 0) {
        command += ` ${mcpMetadata.args.join(' ')}`;
      } else {
        // Fallback: if no args provided, use package name with @latest
        command += ` ${addon.packageName}@latest`;
      }

      // Add registry for private packages (if specified separately)
      if (addon.registry) {
        command += ` ${addon.registry}`;
      }
    }
  } else if (isRemoteHostedMcpServer(addon.mcp)) {
    const mcpMetadata = addon.mcp as McpRemoteHostedAddonMetadata;
    command += ` --transport ${mcpMetadata.transport} ${mcpMetadata.url}`;
  } else {
    throw new Error(`Unsupported MCP addon with configuration: ${addon.mcp}`);
  }

  // Append any additional server-specific arguments
  if (additionalArgs.length > 0) {
    command += ` ${additionalArgs.join(' ')}`;
  }

  // Log command in dry-run mode
  if (dryRun) {
    console.log('\n📋 Would execute:');
    console.log(command);
    return {
      success: true,
      message: 'Dry-run completed',
    };
  }

  // Execute the command with retries
  let attempts = 0;
  const maxAttempts = 3;
  let lastError: Error | undefined;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(
        `\n🔧 Installing MCP server (attempt ${attempts}/${maxAttempts})...`
      );

      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Check if installation was successful
      if (output.includes('successfully') || output.includes('added')) {
        return {
          success: true,
          message: 'MCP server installed successfully',
        };
      }

      // If we get here, something might be wrong but no error was thrown
      console.log('Output:', output);
    } catch (error: any) {
      lastError = error;

      // Check for specific errors
      if (error.message?.includes('already exists')) {
        return {
          success: true,
          message: 'MCP server already installed',
          error: 'Use --force to overwrite existing installation',
        };
      }

      if (error.message?.includes('permission denied')) {
        return {
          success: false,
          message: 'Permission denied',
          error: 'Try running with administrator privileges',
        };
      }

      if (
        error.message?.includes('network') ||
        error.message?.includes('ENOTFOUND')
      ) {
        // Network error, retry
        if (attempts < maxAttempts) {
          console.log('Network error, retrying...');
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
          continue;
        }
      }

      // For other errors, fail immediately
      break;
    }
  }

  // All attempts failed
  return {
    success: false,
    message: 'Failed to install MCP server',
    error: lastError?.message || 'Unknown error occurred',
  };
}

/**
 * Verify that an MCP server was installed correctly
 */
export async function verifyMcpInstallation(serverName: string): Promise<{
  installed: boolean;
  configured: boolean;
  configPath?: string;
  serverConfig?: any;
}> {
  // Check both global and local Claude configs
  const configPaths = [
    join(homedir(), '.claude', 'config.json'),
    join(process.cwd(), '.claude', 'config.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));

        // Check if MCP servers section exists
        if (config.mcpServers && config.mcpServers[serverName]) {
          return {
            installed: true,
            configured: true,
            configPath,
            serverConfig: config.mcpServers[serverName],
          };
        }
      } catch {
        // Config parse error, continue checking
        continue;
      }
    }
  }

  return {
    installed: false,
    configured: false,
  };
}

/**
 * Update existing MCP server configuration
 */
export async function updateMcpServer(
  serverName: string,
  argUpdates: {
    remove?: string[]; // Patterns to remove from args
    add?: string[]; // New args to add
  }
): Promise<{ success: boolean; message: string }> {
  const verification = await verifyMcpInstallation(serverName);

  if (!verification.installed || !verification.configPath) {
    return {
      success: false,
      message: 'MCP server not found. Please install it first.',
    };
  }

  try {
    const config = JSON.parse(readFileSync(verification.configPath, 'utf-8'));
    const serverConfig = config.mcpServers[serverName];

    // Update args if needed
    if (serverConfig.args && Array.isArray(serverConfig.args)) {
      // Remove specified patterns
      if (argUpdates.remove && argUpdates.remove.length > 0) {
        serverConfig.args = serverConfig.args.filter((arg: string) => {
          // Check if this arg starts with any of the patterns to remove
          return !argUpdates.remove!.some((pattern) => arg.startsWith(pattern));
        });
      }

      // Add new args (before the last argument which is usually the package/path)
      if (argUpdates.add && argUpdates.add.length > 0) {
        // Insert new args before the last element (which is typically the package or project path)
        const lastArg = serverConfig.args[serverConfig.args.length - 1];
        serverConfig.args = [
          ...serverConfig.args.slice(0, -1),
          ...argUpdates.add,
          lastArg,
        ];
      }
    }

    // Write updated config
    const fs = require('fs');
    fs.writeFileSync(verification.configPath, JSON.stringify(config, null, 2));

    return {
      success: true,
      message: 'MCP server configuration updated successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to update configuration: ${error.message}`,
    };
  }
}

/**
 * Remove an MCP server installation
 */
export async function removeMcpServer(serverName: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Use Claude CLI to remove the server
    const output = execSync(`claude mcp remove ${serverName}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    if (output.includes('removed') || output.includes('successfully')) {
      return {
        success: true,
        message: 'MCP server removed successfully',
      };
    }

    return {
      success: false,
      message: 'Failed to remove MCP server',
    };
  } catch (error: any) {
    // Check if server doesn't exist
    if (error.message?.includes('not found')) {
      return {
        success: true,
        message: 'MCP server was not installed',
      };
    }

    return {
      success: false,
      message: `Failed to remove MCP server: ${error.message}`,
    };
  }
}
