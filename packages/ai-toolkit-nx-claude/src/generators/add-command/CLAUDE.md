# Add Command Generator

## Purpose

Nx generator for adding individual slash command definitions to the AI Toolkit. Allows adding commands to existing packages or creating new command packages.

## Usage

```bash
# Interactive mode (recommended)
npx nx generate @uniswap/ai-toolkit-nx-claude:add-command

# With options
npx nx generate @uniswap/ai-toolkit-nx-claude:add-command \
  --package=typescript \
  --command-name=my-command \
  --description="My custom command"

# Create new package
npx nx generate @uniswap/ai-toolkit-nx-claude:add-command \
  --createNewPackage \
  --newPackageName=backend \
  --newPackageDescription="Backend-specific commands"
```

## Options

### Required (Prompted if not provided)

- `package` - Target package for the command (e.g., "agnostic", "typescript", "backend")
  - Use special value `__create_new__` to trigger package creation flow

### Optional

- `createNewPackage` - Boolean flag to create a new package instead
- `newPackageName` - Name for the new package (alphanumeric, lowercase, hyphens allowed)
- `newPackageDescription` - Description of the new package

## Generator Flow

1. **Package Selection**:

   - Prompt for target package
   - List existing command packages in workspace
   - Option to create new package

2. **Command Definition**:

   - Prompt for command name (kebab-case)
   - Prompt for command description
   - Prompt for parameters and usage

3. **File Generation**:

   - Create `{command-name}.md` in package's `src/` directory
   - Follow command definition template
   - Update package index exports

4. **Validation**:
   - Verify command name uniqueness
   - Validate markdown structure
   - Check package structure

## Generated Files

```
packages/commands/{package}/
└── src/
    └── {command-name}.md    # Command definition
```

## Command Template Structure

Generated command files follow this template:

```markdown
# Command Name

## Overview

Brief description of what the command does

## Usage

/command-name [arguments] [--flags]

## Parameters

- parameter1: description
- parameter2: description

## Behavior

Detailed explanation of command behavior

## Examples

Example usage scenarios

## Integration

How it integrates with other commands/tools
```

## File Structure

- `generator.ts` - Main generator logic
- `schema.json` - Configuration schema with custom prompt properties
- `schema.d.ts` - TypeScript interface
- `files/` - Template files for generation

## Development Status

**Current**: Placeholder implementation with basic structure
**Needed**:

- Complete command creation logic
- Package creation flow
- Template file system
- Index file updates
- Validation and error handling

## Related Documentation

- Parent package: `../../CLAUDE.md`
- Command definitions: `../../../../commands/agnostic/src/CLAUDE.md`
- Init generator: `../init/CLAUDE.md`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
