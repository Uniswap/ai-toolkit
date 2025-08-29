#!/bin/bash

# Setup GitHub Package Registry Authentication
# This script automates the configuration of npm to use GitHub Packages

set -e

echo "🔧 Setting up GitHub Package Registry authentication..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh (macOS)"
    echo "   or visit: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated with gh
if ! gh auth status &> /dev/null; then
    echo "📝 You need to authenticate with GitHub CLI first."
    echo "Running: gh auth login"
    gh auth login
fi

# Check if the token has read:packages scope
TOKEN_SCOPES=$(gh auth status 2>&1 | grep "Token scopes" | cut -d: -f2-)
if [[ ! "$TOKEN_SCOPES" == *"read:packages"* ]]; then
    echo "⚠️  Your GitHub token doesn't have 'read:packages' scope."
    echo "📝 To add the required scope, please run:"
    echo "   gh auth refresh -h github.com -s read:packages"
    echo ""
    echo "After adding the scope, run this script again."
    exit 1
fi

# Get the GitHub token
NODE_AUTH_TOKEN=$(gh auth token)

if [ -z "$NODE_AUTH_TOKEN" ]; then
    echo "❌ Failed to retrieve GitHub token"
    exit 1
fi

# Get GitHub username
GITHUB_USER=$(gh api user -q .login)

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Failed to retrieve GitHub username"
    exit 1
fi

# Detect shell configuration file
# First check the SHELL environment variable (most reliable)
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_CONFIG="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_CONFIG="$HOME/.bashrc"
    SHELL_NAME="bash"
elif [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
    SHELL_NAME="bash"
else
    echo "⚠️  Could not detect shell type. Defaulting to .zshrc"
    SHELL_CONFIG="$HOME/.zshrc"
    SHELL_NAME="zsh"
fi

echo "🐚 Detected shell: $SHELL_NAME"
echo "📝 Shell config file: $SHELL_CONFIG"

# Add NODE_AUTH_TOKEN to shell configuration
echo "🔐 Setting NODE_AUTH_TOKEN in $SHELL_CONFIG..."

# Check if NODE_AUTH_TOKEN export already exists
if grep -q "export NODE_AUTH_TOKEN=" "$SHELL_CONFIG" 2>/dev/null; then
    echo "🔄 Updating existing NODE_AUTH_TOKEN..."
    # Update the existing token
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|export NODE_AUTH_TOKEN=.*|export NODE_AUTH_TOKEN=\"$NODE_AUTH_TOKEN\"|" "$SHELL_CONFIG"
    else
        # Linux
        sed -i "s|export NODE_AUTH_TOKEN=.*|export NODE_AUTH_TOKEN=\"$NODE_AUTH_TOKEN\"|" "$SHELL_CONFIG"
    fi
else
    echo "➕ Adding NODE_AUTH_TOKEN to $SHELL_CONFIG..."
    echo "" >> "$SHELL_CONFIG"
    echo "# GitHub Package Registry Authentication" >> "$SHELL_CONFIG"
    echo "export NODE_AUTH_TOKEN=\"$NODE_AUTH_TOKEN\"" >> "$SHELL_CONFIG"
fi

# Configure npm for GitHub Packages
echo "📦 Configuring npm for GitHub Packages..."

# Add GitHub Package Registry configuration to ~/.npmrc
NPMRC_FILE="$HOME/.npmrc"

# Check if the registry entry already exists
if grep -q "//npm.pkg.github.com/:_authToken=" "$NPMRC_FILE" 2>/dev/null; then
    echo "🔄 Updating existing GitHub Package Registry configuration..."
    # Update to use environment variable
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|//npm.pkg.github.com/:_authToken=.*|//npm.pkg.github.com/:_authToken=\${NODE_AUTH_TOKEN}|" "$NPMRC_FILE"
    else
        # Linux
        sed -i "s|//npm.pkg.github.com/:_authToken=.*|//npm.pkg.github.com/:_authToken=\${NODE_AUTH_TOKEN}|" "$NPMRC_FILE"
    fi
else
    echo "➕ Adding GitHub Package Registry configuration..."
    echo "//npm.pkg.github.com/:_authToken=\${NODE_AUTH_TOKEN}" >> "$NPMRC_FILE"
fi

echo "✅ GitHub Package Registry authentication configured successfully!"
echo ""
echo "📋 Configuration details:"
echo "   - User: $GITHUB_USER"
echo "   - Registry: npm.pkg.github.com"
echo "   - Shell config: $SHELL_CONFIG"
echo "   - NPM config: $NPMRC_FILE"
echo "   - Token variable: NODE_AUTH_TOKEN"
echo ""
echo "⚠️  IMPORTANT: To use the new configuration, either:"
echo "   1. Restart your terminal, or"
echo "   2. Run: source $SHELL_CONFIG"
echo ""
echo "🚀 You can now install packages from GitHub Package Registry!"
echo "   Example: npm install @your-org/package-name"
