---
description: Set up GitHub MCP server authentication. Use when user says "setup github", "configure github token", "github mcp setup", or needs help configuring their GitHub Personal Access Token for the GitHub MCP server.
allowed-tools: Bash(*)
---

# GitHub MCP Setup

Guide users through configuring their GitHub Personal Access Token (PAT) for the GitHub MCP server integration.

## When to Activate

- User wants to set up GitHub MCP integration
- User mentions GitHub token configuration
- User asks about GitHub authentication for Claude Code
- GitHub MCP server fails due to missing token

## Overview

The GitHub MCP server provides repository management, file operations, issue tracking, and PR functionality directly within Claude Code. It requires a GitHub Personal Access Token (PAT) for authentication.

## Setup Process

### Step 1: Check Current Token Status

First, check if the token is already configured:

```bash
# Check if GITHUB_PERSONAL_ACCESS_TOKEN is set
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "GitHub token is configured (length: ${#GITHUB_PERSONAL_ACCESS_TOKEN} chars)"
else
  echo "GitHub token is NOT configured"
fi
```

### Step 2: Create a GitHub Personal Access Token

If no token exists, guide the user:

1. **Navigate to GitHub Token Settings**:

   - Go to: <https://github.com/settings/tokens?type=beta>
   - Or: GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens

2. **Create New Token**:

   - Click "Generate new token"
   - Give it a descriptive name (e.g., "Claude Code MCP")
   - Set expiration (recommend 90 days or custom)
   - Select repository access (recommend "All repositories" or specific repos)

3. **Required Permissions** (minimum for full functionality):

   - **Repository permissions**:
     - Contents: Read and write
     - Issues: Read and write
     - Pull requests: Read and write
     - Metadata: Read-only (automatically selected)
   - **Account permissions** (optional):
     - Email addresses: Read-only

4. **Generate and Copy Token**:
   - Click "Generate token"
   - Copy the token immediately (it won't be shown again)

### Step 3: Configure Environment Variable

Add the token to your shell profile for persistence:

**For Zsh (default on macOS):**

```bash
echo 'export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

**For Bash:**

```bash
echo 'export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

**For Fish:**

```fish
set -Ux GITHUB_PERSONAL_ACCESS_TOKEN "ghp_your_token_here"
```

### Step 4: Verify Configuration

After setting the token, restart Claude Code and verify:

```bash
# Verify token is set
echo "Token configured: $([ -n \"$GITHUB_PERSONAL_ACCESS_TOKEN\" ] && echo 'Yes' || echo 'No')"
```

Then run `/mcp` in Claude Code to see the GitHub MCP server listed.

## Troubleshooting

### Token Not Found

If the GitHub MCP server reports a missing token:

1. Verify the environment variable is set:

   ```bash
   echo $GITHUB_PERSONAL_ACCESS_TOKEN
   ```

2. If empty, check your shell profile contains the export

3. Source your profile or restart the terminal:

   ```bash
   source ~/.zshrc  # or ~/.bashrc
   ```

4. Restart Claude Code to pick up the new environment

### Token Invalid or Expired

If you get authentication errors:

1. Check token expiration at <https://github.com/settings/tokens>
2. Generate a new token if expired
3. Update your shell profile with the new token
4. Restart Claude Code

### Insufficient Permissions

If certain operations fail:

1. Review token permissions at <https://github.com/settings/tokens>
2. Edit the token to add required permissions
3. Note: Some actions require specific scopes (e.g., `workflow` for GitHub Actions)

## Security Best Practices

1. **Never commit tokens**: Add your shell profile to `.gitignore`
2. **Use fine-grained tokens**: Prefer fine-grained over classic tokens for better security
3. **Limit scope**: Only grant permissions you actually need
4. **Set expiration**: Use short-lived tokens when possible
5. **Rotate regularly**: Regenerate tokens periodically
6. **Use secrets managers**: Consider 1Password, Keychain, or similar for token storage

## Available GitHub MCP Tools

Once configured, you'll have access to:

- **Repository Management**: Create, fork, search repositories
- **File Operations**: Read, create, update files and directories
- **Issue Tracking**: Create, update, search, comment on issues
- **Pull Requests**: Create PRs, add reviewers, merge
- **Branch Management**: Create, list, delete branches
- **Search**: Search code, issues, PRs, users across GitHub

## Quick Reference

| Item                 | Value                                 |
| -------------------- | ------------------------------------- |
| Environment Variable | `GITHUB_PERSONAL_ACCESS_TOKEN`        |
| Token Settings URL   | <https://github.com/settings/tokens>  |
| Token Type           | Fine-grained (recommended) or Classic |
| MCP Server           | Hosted at `api.githubcopilot.com/mcp` |

## Next Steps

After successful setup:

1. Run `/mcp` to verify the GitHub server is connected
2. Try a simple command like "list my GitHub repositories"
3. Explore available tools with "what GitHub tools are available?"
