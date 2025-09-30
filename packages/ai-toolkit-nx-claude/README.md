# @uniswap/ai-toolkit-nx-claude

This package provides Nx generators for setting up and managing Claude Code configurations, commands, agents, and notification hooks.

## Installation

This package is published to a private npmjs package registry and requires authentication to access. See the [root README.md file](../../README.md) for instructions on how to install it via NPM, or run it locally

## Usage

### Run Default Generator

```bash
bun nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec
```

### Run Specific Generators

Each generator can be run directly desired generator's subcommand:

```bash
# One-shot installer for Claude Code configs
bun nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec init

# Install notification hooks
bun nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec hooks

# Setup shell proxy for GitHub registry routing
bun nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec setup-registry-proxy

# Install and configure Claude Code addons
bun nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec addons

# Add a new command to packages
bun nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec add-command

# Add a new agent to packages
bun nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec add-agent
```

### List Available Generators

```bash
bun nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec --list
```

## Available Generators

- **init** - One-shot installer for Claude Code configs
- **hooks** - Install Claude Code notification hooks
- **setup-registry-proxy** - Setup shell proxy for routing @uniswap/ai-toolkit\* packages to GitHub registry
- **addons** - Install and configure Claude Code addons including MCP servers
- **add-command** - Add a new Claude Code command to existing or new packages
- **add-agent** - Add a new Claude Code agent to existing or new packages

## Building

Run `bun nx build ai-toolkit-nx-claude` to build the library.

## Testing

Run `bunx nx test ai-toolkit-nx-claude` to test this library
