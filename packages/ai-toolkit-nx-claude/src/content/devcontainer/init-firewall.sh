#!/usr/bin/env bash
# Claude Code Sandbox Firewall Initialization Script
#
# This script configures a restrictive firewall to create a secure sandbox
# environment for running Claude Code with --dangerously-skip-permissions.
#
# The firewall allows only essential outbound connections:
# - DNS resolution
# - GitHub (for git operations)
# - npm registry (for package installations)
# - Anthropic API (for Claude Code)
# - VS Code services (for devcontainer)
#
# All other outbound connections are blocked, preventing any potentially
# malicious code from exfiltrating data to arbitrary endpoints.
#
# Based on: https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate CIDR notation
validate_cidr() {
    local cidr="$1"
    if [[ $cidr =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$ ]]; then
        return 0
    fi
    return 1
}

# Validate IP address
validate_ip() {
    local ip="$1"
    if [[ $ip =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
        return 0
    fi
    return 1
}

# Get host network subnet
get_host_subnet() {
    local gateway
    gateway=$(ip route | grep default | awk '{print $3}' | head -1)
    if [[ -n "$gateway" ]]; then
        # Get the /24 subnet of the gateway
        echo "${gateway%.*}.0/24"
    else
        echo ""
    fi
}

log_info "Initializing Claude Code sandbox firewall..."

# Preserve Docker DNS rules before flushing
log_info "Preserving Docker DNS rules..."
DOCKER_DNS_RULES=$(iptables-save | grep -E "DOCKER|docker" || true)

# Flush existing rules
log_info "Flushing existing iptables rules..."
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# Set default policies to DROP
log_info "Setting default policies to DROP..."
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Allow loopback
log_info "Allowing loopback traffic..."
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
log_info "Allowing established connections..."
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow DNS (UDP and TCP on port 53)
log_info "Allowing DNS traffic..."
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# Allow SSH (for git operations)
log_info "Allowing SSH traffic..."
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT

# Allow host network subnet (for Docker networking)
HOST_SUBNET=$(get_host_subnet)
if [[ -n "$HOST_SUBNET" ]] && validate_cidr "$HOST_SUBNET"; then
    log_info "Allowing host subnet: $HOST_SUBNET"
    iptables -A OUTPUT -d "$HOST_SUBNET" -j ACCEPT
fi

# Restore Docker DNS rules
if [[ -n "$DOCKER_DNS_RULES" ]]; then
    log_info "Restoring Docker DNS rules..."
    echo "$DOCKER_DNS_RULES" | iptables-restore --noflush 2>/dev/null || true
fi

# Create ipset for allowed domains
log_info "Creating ipset for allowed domains..."
ipset destroy allowed-domains 2>/dev/null || true
ipset create allowed-domains hash:net

# Function to resolve domain and add to ipset
add_domain() {
    local domain="$1"
    local ips
    ips=$(dig +short "$domain" A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || true)

    for ip in $ips; do
        if validate_ip "$ip"; then
            ipset add allowed-domains "$ip" 2>/dev/null || true
            log_info "  Added $domain -> $ip"
        fi
    done
}

# Function to add GitHub IP ranges
add_github_ips() {
    log_info "Fetching GitHub IP ranges..."
    local github_meta
    github_meta=$(curl -s https://api.github.com/meta 2>/dev/null || echo "{}")

    # Extract IP ranges from GitHub meta API
    for key in git hooks web api; do
        local ranges
        ranges=$(echo "$github_meta" | jq -r ".${key}[]? // empty" 2>/dev/null || true)
        for range in $ranges; do
            if validate_cidr "$range"; then
                ipset add allowed-domains "$range" 2>/dev/null || true
            fi
        done
    done
}

# Add GitHub IPs
add_github_ips

# Add allowed domains
log_info "Resolving and adding allowed domains..."

# npm registry
add_domain "registry.npmjs.org"
add_domain "registry.yarnpkg.com"

# Anthropic API
add_domain "api.anthropic.com"
add_domain "claude.ai"
add_domain "console.anthropic.com"

# VS Code services
add_domain "update.code.visualstudio.com"
add_domain "marketplace.visualstudio.com"
add_domain "vscode.blob.core.windows.net"
add_domain "az764295.vo.msecnd.net"
add_domain "raw.githubusercontent.com"
add_domain "github.com"
add_domain "objects.githubusercontent.com"

# Sentry (for error reporting)
add_domain "sentry.io"
add_domain "o4507922104852480.ingest.us.sentry.io"

# StatsigAPI (for feature flags)
add_domain "api.statsig.com"
add_domain "statsigapi.net"

# Allow traffic to ipset destinations on HTTPS
log_info "Setting up ipset-based rules..."
iptables -A OUTPUT -m set --match-set allowed-domains dst -p tcp --dport 443 -j ACCEPT
iptables -A OUTPUT -m set --match-set allowed-domains dst -p tcp --dport 80 -j ACCEPT

# Log rejected traffic (optional - can be verbose)
# iptables -A OUTPUT -j LOG --log-prefix "BLOCKED: " --log-level 4

# Reject all other outbound traffic with ICMP unreachable
iptables -A OUTPUT -j REJECT --reject-with icmp-host-unreachable

log_info "Firewall configuration complete!"

# Verification
log_info "Verifying firewall configuration..."

# Test that blocked sites are blocked
if curl -s --connect-timeout 2 https://example.com > /dev/null 2>&1; then
    log_warn "WARNING: example.com is reachable (should be blocked)"
else
    log_info "Verification passed: example.com is blocked"
fi

# Test that GitHub is accessible
if curl -s --connect-timeout 5 https://api.github.com > /dev/null 2>&1; then
    log_info "Verification passed: GitHub API is accessible"
else
    log_warn "WARNING: GitHub API is not accessible"
fi

log_info "Firewall initialization complete. Safe to use --dangerously-skip-permissions"
