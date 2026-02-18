#!/usr/bin/env bash
#
# check-github-token.sh
# Validates GitHub Personal Access Token configuration for the GitHub MCP server.
#
# This script runs as a SessionStart hook to notify users if their
# GITHUB_PERSONAL_ACCESS_TOKEN is not configured.
#
# Exit codes:
#   0 - Success (token is configured or warning shown)
#   2 - Block session (not used - we prefer non-blocking warnings)
#
# Output:
#   JSON with additionalContext if token is missing (provides setup guidance)
#

# Check if GITHUB_PERSONAL_ACCESS_TOKEN is set
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  # Output JSON with additionalContext to provide setup guidance
  # This adds context to Claude's conversation without blocking the session
  cat <<'EOF'
{
  "additionalContext": "Note: GITHUB_PERSONAL_ACCESS_TOKEN is not configured. The GitHub MCP server will not be available until you set this environment variable. Run /uniswap-integrations:github-setup for setup instructions, or add 'export GITHUB_PERSONAL_ACCESS_TOKEN=\"your-token\"' to your shell profile (~/.zshrc or ~/.bashrc)."
}
EOF
  exit 0
fi

# Token is configured - validate format (optional warning)
# Fine-grained tokens start with 'github_pat_' and classic tokens start with 'ghp_'
if [[ ! "$GITHUB_PERSONAL_ACCESS_TOKEN" =~ ^(ghp_|github_pat_) ]]; then
  cat <<'EOF'
{
  "additionalContext": "Warning: GITHUB_PERSONAL_ACCESS_TOKEN format looks unusual. GitHub tokens typically start with 'ghp_' (classic) or 'github_pat_' (fine-grained). The GitHub MCP server may not work correctly."
}
EOF
  exit 0
fi

# Token is configured and looks valid
exit 0
