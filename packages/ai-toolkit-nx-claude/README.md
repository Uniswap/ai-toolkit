# @uniswap/ai-toolkit-nx-claude

This package provides Nx generators for installing Claude Code addon MCP servers. It also includes the `claude-plus` script for enhanced Claude Code startup.

> **Note**: The `init`, `add-command`, `add-agent`, and `hooks` generators have been removed. For Claude Code setup, use the marketplace-based plugin architecture instead. See the [root README.md](../../README.md) for details on installing plugins.

## Installation

This package is published to a private npmjs package registry and requires authentication to access. See the [root README.md file](../../README.md) for instructions on how to install it via NPM, or run it locally.

## Usage

### Interactive Menu

```bash
# Show interactive menu of available generators
npx @uniswap/ai-toolkit-nx-claude@latest
```

### Run Specific Generators

```bash
# Install and configure Claude Code addons (MCP servers)
npx @uniswap/ai-toolkit-nx-claude@latest addons
```

### List Available Generators

```bash
npx @uniswap/ai-toolkit-nx-claude@latest --list
```

## Available Generators

- **addons** - Install and configure Claude Code addons including MCP servers

## Standalone Script: claude-plus

Enhanced Claude Code launcher with MCP server selection and Slack token management:

```bash
# Run claude-plus
npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus

# Set up as shell alias
alias claude-plus="npx -y -p @uniswap/ai-toolkit-nx-claude@latest claude-plus"
```

## Building

```bash
npx nx build ai-toolkit-nx-claude
```

## Testing

```bash
npx nx test ai-toolkit-nx-claude
```
