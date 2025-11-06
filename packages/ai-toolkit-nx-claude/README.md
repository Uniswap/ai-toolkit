# @uniswap/ai-toolkit-nx-claude

This package provides Nx generators for setting up and managing Claude Code configurations, commands, agents, and notification hooks.

## Installation

This package is published to a private npmjs package registry and requires authentication to access. See the [root README.md file](../../README.md) for instructions on how to install it via NPM, or run it locally

## Usage

### Run Default Generator

```bash
npx nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec
```

### Run Specific Generators

Each generator can be run directly via the desired generator's subcommand:

```bash
# One-shot installer for Claude Code configs
npx nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec init

# Install notification hooks
npx nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec hooks

# Install and configure Claude Code addons
npx nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec addons

# Add a new command to packages
npx nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec add-command

# Add a new agent to packages
npx nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec add-agent
```

### List Available Generators

```bash
npx nx run @uniswap/ai-toolkit-nx-claude:nx-claude:exec --list
```

## Available Generators

- **init** - One-shot installer for Claude Code configs
- **hooks** - Install Claude Code notification hooks
- **addons** - Install and configure Claude Code addons including MCP servers
- **add-command** - Add a new Claude Code command to existing or new packages
- **add-agent** - Add a new Claude Code agent to existing or new packages

## Building

Run `npm nx build ai-toolkit-nx-claude` to build the library.

## Testing

Run `npx nx test ai-toolkit-nx-claude` to test this library
