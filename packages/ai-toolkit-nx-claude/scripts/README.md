# Scripts

This directory contains utility scripts for managing the ai-toolkit-nx-claude package.

## reset-prerelease-version.sh

This script helps fix version misalignment between the `next` and `latest` npm tags.

### When to use

Use this script when:

- The `next` branch has the same version number as `latest` (e.g., both at 0.4.0)
- You need to start a new prerelease series for the `next` branch
- The prerelease versioning gets out of sync

### Usage

```bash
./reset-prerelease-version.sh
```

The script will:

1. Check the current version in package.json
2. Query npm for the latest published versions
3. Determine the appropriate next prerelease version
4. Update package.json with the new version
5. Provide instructions for committing and pushing

### Example

If `latest` is at `0.3.1` and `next` is incorrectly at `0.4.0`, the script will:

- Set the version to `0.4.0-next.0` for the next prerelease
- Subsequent runs will increment to `0.4.0-next.1`, `0.4.0-next.2`, etc.
