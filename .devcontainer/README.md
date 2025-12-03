# Claude Code Development Container

This devcontainer provides a secure, sandboxed environment for running Claude Code with the `--dangerously-skip-permissions` flag safely.

## Overview

When developing with Claude Code, you may want to use the `--dangerously-skip-permissions` flag for autonomous code execution. However, running this on your host machine poses security risks. This devcontainer solves that by:

1. **Network Isolation**: A restrictive firewall allows only essential connections
2. **Container Isolation**: Code runs in a Docker container, isolated from your host
3. **Minimal Permissions**: Limited system access within the container

## Quick Start

### Prerequisites

- Docker Desktop or Docker Engine
- VS Code with the "Dev Containers" extension (or Cursor/other compatible IDE)
- Claude Code CLI authentication (your `~/.claude` directory is mounted)

### Usage

1. Open this repository in VS Code/Cursor
2. When prompted, click "Reopen in Container" (or use Command Palette: "Dev Containers: Reopen in Container")
3. Wait for the container to build (first time takes a few minutes)
4. Once inside, run Claude Code with autonomous mode:

```bash
claude --dangerously-skip-permissions
```

## What's Allowed

The firewall permits outbound connections only to:

| Service | Purpose |
|---------|---------|
| GitHub | Git operations, raw file downloads |
| npm/yarn | Package installation |
| Anthropic API | Claude Code functionality |
| VS Code services | Extensions, marketplace |
| Sentry | Error reporting |
| StatsigAPI | Feature flags |

All other outbound connections are blocked.

## What's Blocked

- Arbitrary HTTP/HTTPS connections
- Direct IP connections to unknown hosts
- Data exfiltration to external services

## Customization

### Timezone

Edit `devcontainer.json` and change the `TIMEZONE` build arg:

```json
"args": {
  "TIMEZONE": "Europe/London"
}
```

### Additional Allowed Domains

Edit `init-firewall.sh` and add domains to the allowed list:

```bash
add_domain "your-internal-service.example.com"
```

### Claude Code Version

Pin to a specific version in `devcontainer.json`:

```json
"args": {
  "CLAUDE_CODE_VERSION": "1.0.0"
}
```

## Files

| File | Purpose |
|------|---------|
| `devcontainer.json` | VS Code devcontainer configuration |
| `Dockerfile` | Container image definition |
| `init-firewall.sh` | Firewall setup for network isolation |
| `README.md` | This documentation |

## Copying to Other Projects

To use this devcontainer in another project:

1. Copy the entire `.devcontainer` directory to your project root
2. Ensure your `~/.claude` directory exists with valid authentication
3. Open the project in VS Code and reopen in container

Or use the AI Toolkit CLI:

```bash
npx @uniswap/ai-toolkit-nx-claude addons --addon docker-sandbox
```

## Security Notes

- The `--dangerously-skip-permissions` flag should ONLY be used inside this container
- Never use this flag on your host machine
- The firewall provides defense-in-depth, not absolute security
- Review generated code before committing to your repository

## Troubleshooting

### Container won't start

Check Docker is running:

```bash
docker ps
```

### Network issues inside container

Verify firewall rules:

```bash
sudo iptables -L -v
sudo ipset list allowed-domains
```

### Claude Code not authenticated

Ensure your `~/.claude` directory contains valid credentials:

```bash
ls -la ~/.claude
```

## References

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Anthropic's devcontainer reference](https://github.com/anthropics/claude-code/tree/main/.devcontainer)
- [When to use --dangerously-skip-permissions](https://www.ksred.com/claude-code-dangerously-skip-permissions-when-to-use-it-and-when-you-absolutely-shouldnt/)
