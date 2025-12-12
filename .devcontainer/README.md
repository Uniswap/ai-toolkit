# Claude Code Docker Sandbox

This directory contains a VS Code devcontainer configuration for safely running Claude Code with `--dangerously-skip-permissions` in a secure, network-restricted environment.

## Overview

The `--dangerously-skip-permissions` flag allows Claude Code to operate autonomously without requiring manual approval for file operations and command execution. While this dramatically improves productivity for autonomous workflows, it should only be used within a contained environment to prevent unintended system modifications.

This sandbox provides:

- **Network restrictions**: Firewall rules limit outbound access to essential services only
- **Non-root execution**: Claude Code runs as the `node` user (not root)
- **Isolated filesystem**: Your project is mounted via bind mount, isolating host system files
- **Pre-configured tooling**: Claude Code CLI, git, zsh, and development tools pre-installed
- **Persistent configuration**: Claude settings and bash history survive container rebuilds

## Quick Start

### Using VS Code / Cursor

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open this repository in VS Code or Cursor
3. Click "Reopen in Container" when prompted
4. Wait for the container to build (~2-5 minutes first time)
5. Open a terminal and run:

   ```bash
   claude --dangerously-skip-permissions
   ```

### Manual Docker Usage

```bash
# Build the container
docker build -t claude-sandbox .devcontainer/

# Run with your project mounted
docker run -it \
  --cap-add=NET_ADMIN \
  --cap-add=NET_RAW \
  -v "$(pwd):/workspace" \
  -w /workspace \
  claude-sandbox

# Inside the container, initialize the firewall
sudo /usr/local/bin/init-firewall.sh

# Now run Claude Code safely
claude --dangerously-skip-permissions
```

## Files

| File | Description |
|------|-------------|
| `devcontainer.json` | VS Code devcontainer configuration with extensions, settings, and mounts |
| `Dockerfile` | Container image definition with Node.js 22, Claude Code CLI, and dev tools |
| `init-firewall.sh` | Firewall script that restricts network access to allowlisted services |

## Network Allowlist

The firewall restricts outbound network access to only these services:

| Service | Purpose |
|---------|---------|
| GitHub | Git operations, API, releases, raw content |
| npm registry | Package installation |
| Anthropic APIs | Claude Code backend |
| Sentry | Error reporting |
| VS Code services | Extensions, marketplace, updates |
| Linear API | Task management integration |
| Notion API | Documentation integration |
| Local network | Communication with Docker host |

All other external network access is blocked via iptables DROP policy.

## Security Considerations

### What This Sandbox Protects Against

- **Accidental data exfiltration**: Network restrictions prevent uploading data to unauthorized services
- **Unintended package installations**: Only npm registry is accessible
- **System file modifications**: Container isolation protects host filesystem
- **Privilege escalation**: Non-root user with limited sudo access

### What This Sandbox Does NOT Protect Against

- **Malicious code execution within the container**: Claude can still modify files in `/workspace`
- **Resource exhaustion**: No CPU/memory limits configured by default
- **Container escape vulnerabilities**: If Docker itself has vulnerabilities, the sandbox may not provide complete isolation

### Recommendations

1. **Never mount sensitive directories** (like `~/.ssh`, `~/.aws`) into the container
2. **Review generated code** before committing to source control
3. **Use separate API keys** for development vs production
4. **Regularly update** the base image and Claude Code CLI

## Customization

### Adding Additional Allowed Domains

Edit `init-firewall.sh` and add domains to the allowlist:

```bash
# Add your custom domains
add_domain_ips "your-internal-api.example.com"
```

### Modifying VS Code Extensions

Edit `devcontainer.json` and add extensions to the `customizations.vscode.extensions` array:

```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "your.extension-id"
      ]
    }
  }
}
```

### Changing the Claude Code Version

Update the `CLAUDE_CODE_VERSION` build argument in `devcontainer.json`:

```json
{
  "build": {
    "args": {
      "CLAUDE_CODE_VERSION": "1.0.0"
    }
  }
}
```

## Troubleshooting

### Firewall Verification Failed

If you see warnings during firewall initialization:

```bash
# Check iptables rules
sudo iptables -L -n

# Check ipset contents
sudo ipset list allowed-domains

# Manually test connectivity
curl -I https://api.github.com
```

### Container Build Fails

Common causes:

1. **Network issues**: Ensure you can access GitHub and npm registry
2. **Docker resources**: Increase Docker memory allocation
3. **Cache issues**: Try `docker build --no-cache`

### Claude Code Authentication

If Claude Code prompts for authentication:

1. The `~/.claude` directory is mounted as a persistent volume
2. Authenticate once, and credentials persist across container rebuilds
3. If issues persist, delete the volume: `docker volume rm claude-code-config-*`

## References

- [Anthropic's Official Devcontainer](https://github.com/anthropics/claude-code/tree/main/.devcontainer)
- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
