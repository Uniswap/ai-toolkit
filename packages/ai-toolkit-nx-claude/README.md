# @uniswap/ai-toolkit-nx-claude

This package provides Nx generators for setting up and managing Claude Code configurations, commands, agents, and notification hooks.

## Installation

This package is published to GitHub Packages and requires authentication:

```bash
npm login --@uniswap:registry=https://npm.pkg.github.com
```

## Usage

### Run Default Generator (init)

```bash
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude
```

### Run Specific Generators

Each generator can be run directly using colon syntax:

```bash
# One-shot installer for Claude Code configs
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:init

# Install notification hooks
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:hooks

# Setup shell proxy for GitHub registry routing
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:setup-registry-proxy

# Install and configure Claude Code addons
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:addons

# Add a new command to packages
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:add-command

# Add a new agent to packages
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:add-agent

# Create a new content package
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude:content-package
```

### List Available Generators

```bash
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude --list
```

## Available Generators

- **init** - One-shot installer for Claude Code configs
- **hooks** - Install Claude Code notification hooks
- **setup-registry-proxy** - Setup shell proxy for routing @uniswap/ai-toolkit\* packages to GitHub registry
- **addons** - Install and configure Claude Code addons including MCP servers
- **add-command** - Add a new Claude Code command to existing or new packages
- **add-agent** - Add a new Claude Code agent to existing or new packages
- **content-package** - Create a new content package for commands or agents

## Building

Run `nx build ai-toolkit-nx-claude` to build the library.
