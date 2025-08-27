# Setup Registry Proxy Generator

This generator configures a shell proxy that automatically routes `@uniswap/ai-toolkit*` packages to GitHub Packages registry while leaving all other packages to use the default npm registry.

## Why This Is Needed

When Uniswap packages are published to GitHub Packages with organization-restricted access, you normally need to:

1. Configure npm to use GitHub registry for the `@uniswap` scope
2. But this breaks access to public `@uniswap` packages on npm

This proxy solves the problem by intercepting npm/npx/yarn/bun commands and adding `--registry=https://npm.pkg.github.com` only for packages that match `@uniswap/ai-toolkit*`.

## What It Does

1. **Detects your shell** (bash, zsh, or fish)
2. **Creates a proxy file** (e.g., `~/.uniswap-ai-toolkit.zshrc`)
3. **Adds proxy functions** for npm, npx, yarn, bun, bunx, pnpm, pnpx
4. **Sources the proxy** from your shell configuration file
5. **Routes matching packages** to GitHub registry automatically

## Usage

```bash
# Run the generator
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:setup-registry-proxy

# Or with options
bunx nx generate @ai-toolkit/ai-toolkit-nx-claude:setup-registry-proxy --force --test
```

## Options

- `--force`: Overwrite existing proxy configuration
- `--backup`: Backup existing proxy file before overwriting (default: true)
- `--test`: Test the proxy after installation (default: true)

## How It Works

After installation, commands like:

```bash
npx -y @uniswap/spec-workflow-mcp@latest --help
```

Are automatically transformed to:

```bash
npx --registry=https://npm.pkg.github.com -y @uniswap/spec-workflow-mcp@latest --help
```

But regular commands remain unchanged:

```bash
npm install @uniswap/sdk-core  # Uses default npm registry
npm install express             # Uses default npm registry
```

## Authentication

You still need GitHub authentication configured:

```bash
# Option 1: Environment variable
export NODE_AUTH_TOKEN=your_github_token

# Option 2: In ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=your_github_token" >> ~/.npmrc
```

## Supported Commands

The proxy intercepts and modifies these commands:

- `npm install/add/remove/etc.`
- `npx`
- `yarn add/remove/etc.`
- `bun add/remove/etc.`
- `bunx`
- `pnpm add/remove/etc.`
- `pnpx`

## Manual Installation

If you prefer to set this up manually:

1. Copy the generated proxy file to your home directory
2. Add `source ~/.uniswap-ai-toolkit.[shell]rc` to your shell config
3. Restart your shell or source the file

## Troubleshooting

**Proxy not working?**

- Ensure you've sourced the file: `source ~/.uniswap-ai-toolkit.zshrc`
- Check that functions are defined: `type npm` should show the proxy function

**Authentication errors?**

- Verify your GitHub token has `read:packages` scope
- Check token is set: `echo $NODE_AUTH_TOKEN`

**Want to disable temporarily?**

```bash
# Disable proxy messages
export UNISWAP_AI_TOOLKIT_QUIET=1

# Or completely bypass the proxy
command npm install @uniswap/ai-toolkit-nx-claude
```
