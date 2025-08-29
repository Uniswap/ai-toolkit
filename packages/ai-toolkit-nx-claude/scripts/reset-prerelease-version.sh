#!/bin/bash

# Script to reset version for prerelease on next branch
# This helps fix the issue where next branch has same version as latest

PACKAGE_NAME="@uniswap/ai-toolkit-nx-claude"
CURRENT_VERSION=$(jq -r '.version' packages/ai-toolkit-nx-claude/package.json)

echo "Current version: $CURRENT_VERSION"

# Check if we're on next branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "next" ]]; then
    echo "⚠️  Warning: You're not on the 'next' branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# If version is already a prerelease, extract base version
if [[ "$PATCH" == *"-"* ]]; then
    PATCH=${PATCH%%-*}
fi

echo "Base version components: $MAJOR.$MINOR.$PATCH"

# Determine the next version based on what's on main/latest
echo "Checking latest published version on npm..."
LATEST_VERSION=$(npm view $PACKAGE_NAME@latest version --registry=https://npm.pkg.github.com 2>/dev/null || echo "0.0.0")
echo "Latest published version: $LATEST_VERSION"

# Parse latest version
IFS='.' read -r LATEST_MAJOR LATEST_MINOR LATEST_PATCH <<< "$LATEST_VERSION"
if [[ "$LATEST_PATCH" == *"-"* ]]; then
    LATEST_PATCH=${LATEST_PATCH%%-*}
fi

# Determine target version for next branch
if [[ "$MAJOR.$MINOR.$PATCH" == "$LATEST_MAJOR.$LATEST_MINOR.$LATEST_PATCH" ]]; then
    # Same version, need to bump for next
    NEW_MINOR=$((MINOR + 1))
    TARGET_VERSION="$MAJOR.$NEW_MINOR.0"
else
    # Already ahead, keep current base
    TARGET_VERSION="$MAJOR.$MINOR.$PATCH"
fi

# Check existing prerelease versions
echo "Checking existing prerelease versions..."
EXISTING_PRERELEASES=$(npm view $PACKAGE_NAME@next version --registry=https://npm.pkg.github.com 2>/dev/null || echo "")

if [[ -n "$EXISTING_PRERELEASES" ]]; then
    echo "Found existing next version: $EXISTING_PRERELEASES"
    # Extract the prerelease number if it matches our target
    if [[ "$EXISTING_PRERELEASES" == "$TARGET_VERSION-next."* ]]; then
        PRERELEASE_NUM=${EXISTING_PRERELEASES##*-next.}
        NEXT_PRERELEASE=$((PRERELEASE_NUM + 1))
    else
        NEXT_PRERELEASE=0
    fi
else
    NEXT_PRERELEASE=0
fi

NEW_VERSION="$TARGET_VERSION-next.$NEXT_PRERELEASE"
echo "Setting version to: $NEW_VERSION"

# Update package.json
jq --arg version "$NEW_VERSION" '.version = $version' packages/ai-toolkit-nx-claude/package.json > tmp.json && mv tmp.json packages/ai-toolkit-nx-claude/package.json

echo "✅ Version updated to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "1. Review the change: git diff packages/ai-toolkit-nx-claude/package.json"
echo "2. Commit the change: git add packages/ai-toolkit-nx-claude/package.json && git commit -m 'chore: prepare prerelease version $NEW_VERSION'"
echo "3. Push to next branch to trigger publishing"