#!/usr/bin/env bash
# init-firewall.sh - Initialize restrictive firewall for Claude Code sandbox
#
# This script configures iptables to create a restrictive network environment
# that only allows access to essential services:
# - GitHub (for git operations and API)
# - npm registry (for package installations)
# - Anthropic APIs (for Claude Code)
# - Sentry (for error reporting)
# - VS Code services (for devcontainer features)
#
# Based on Anthropic's official devcontainer:
# https://github.com/anthropics/claude-code/tree/main/.devcontainer
#
# Usage: sudo /usr/local/bin/init-firewall.sh
#
# Requirements:
# - Must be run as root (via sudo)
# - Container must have NET_ADMIN and NET_RAW capabilities

set -euo pipefail

echo "Initializing firewall for Claude Code sandbox..."

# Store Docker DNS rules before flushing
DOCKER_DNS_RULES=$(iptables-save | grep -E "DOCKER|docker" || true)

# Flush all existing rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# Restore Docker DNS rules if any existed
if [ -n "$DOCKER_DNS_RULES" ]; then
    echo "$DOCKER_DNS_RULES" | iptables-restore -n 2>/dev/null || true
fi

# Set default policies to DROP
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Allow loopback interface
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established and related connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow DNS (needed for domain resolution)
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# Create ipset for allowed domains
ipset destroy allowed-domains 2>/dev/null || true
ipset create allowed-domains hash:net

# Function to add IPs to allowlist
add_domain_ips() {
    local domain=$1
    echo "Resolving $domain..."
    local ips
    ips=$(dig +short "$domain" A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || true)
    for ip in $ips; do
        ipset add allowed-domains "$ip" 2>/dev/null || true
    done
}

# Function to validate and add CIDR
add_cidr() {
    local cidr=$1
    if [[ $cidr =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/[0-9]+$ ]]; then
        ipset add allowed-domains "$cidr" 2>/dev/null || true
    fi
}

# Fetch and add GitHub IP ranges
echo "Fetching GitHub IP ranges..."
GITHUB_META=$(curl -fsSL "https://api.github.com/meta" 2>/dev/null || echo '{}')
if [ "$GITHUB_META" != "{}" ]; then
    # Extract all IP ranges from GitHub meta
    for key in hooks web api git pages importer actions dependabot copilot; do
        echo "$GITHUB_META" | jq -r ".${key}[]? // empty" 2>/dev/null | while read -r cidr; do
            add_cidr "$cidr"
        done
    done
fi

# Add fallback GitHub domains
add_domain_ips "github.com"
add_domain_ips "api.github.com"
add_domain_ips "raw.githubusercontent.com"
add_domain_ips "objects.githubusercontent.com"
add_domain_ips "codeload.github.com"
add_domain_ips "github-releases.githubusercontent.com"
add_domain_ips "github.githubassets.com"

# npm registry
add_domain_ips "registry.npmjs.org"
add_domain_ips "registry.npmmirror.com"

# Anthropic APIs
add_domain_ips "api.anthropic.com"
add_domain_ips "claude.ai"
add_domain_ips "console.anthropic.com"
add_domain_ips "statsig.anthropic.com"
add_domain_ips "sentry.io"

# VS Code devcontainer services
add_domain_ips "update.code.visualstudio.com"
add_domain_ips "marketplace.visualstudio.com"
add_domain_ips "vscode.blob.core.windows.net"
add_domain_ips "az764295.vo.msecnd.net"

# Linear (for task management)
add_domain_ips "api.linear.app"
add_domain_ips "linear.app"

# Notion (for documentation)
add_domain_ips "api.notion.com"
add_domain_ips "notion.so"

# Detect host network and allow local communication
HOST_NETWORK=$(ip route | grep default | awk '{print $3}' | head -1)
if [ -n "$HOST_NETWORK" ]; then
    HOST_SUBNET=$(echo "$HOST_NETWORK" | sed 's/\.[0-9]*$/.0\/24/')
    iptables -A INPUT -s "$HOST_SUBNET" -j ACCEPT
    iptables -A OUTPUT -d "$HOST_SUBNET" -j ACCEPT
fi

# Allow traffic to IPs in the allowed-domains ipset
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT

# Log dropped packets (optional, useful for debugging)
# Uncomment the following lines to enable logging:
# iptables -A INPUT -j LOG --log-prefix "FIREWALL-INPUT-DROP: " --log-level 4
# iptables -A OUTPUT -j LOG --log-prefix "FIREWALL-OUTPUT-DROP: " --log-level 4

echo "Firewall initialized successfully!"
echo ""
echo "Allowed destinations:"
echo "  - GitHub (all services)"
echo "  - npm registry"
echo "  - Anthropic APIs"
echo "  - VS Code services"
echo "  - Linear API"
echo "  - Notion API"
echo "  - Local network: ${HOST_SUBNET:-N/A}"
echo ""

# Verify connectivity
echo "Verifying connectivity..."
if curl -fsSL --max-time 5 "https://api.github.com" >/dev/null 2>&1; then
    echo "  [OK] GitHub API accessible"
else
    echo "  [WARN] GitHub API not accessible"
fi

if curl -fsSL --max-time 5 "https://registry.npmjs.org" >/dev/null 2>&1; then
    echo "  [OK] npm registry accessible"
else
    echo "  [WARN] npm registry not accessible"
fi

# Verify blocked sites are actually blocked
if ! curl -fsSL --max-time 3 "https://example.com" >/dev/null 2>&1; then
    echo "  [OK] Unauthorized sites blocked (example.com unreachable)"
else
    echo "  [WARN] Firewall may not be working correctly"
fi

echo ""
echo "Claude Code sandbox is ready!"
echo "You can now safely use: claude --dangerously-skip-permissions"
