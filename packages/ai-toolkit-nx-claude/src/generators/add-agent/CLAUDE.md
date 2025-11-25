# Add Agent Generator

## Purpose

Nx generator for adding individual AI agent definitions to the AI Toolkit. Allows adding agents to existing packages or creating new agent packages.

## Usage

```bash
# Interactive mode (recommended)
npx nx generate @uniswap/ai-toolkit-nx-claude:add-agent

# With options
npx nx generate @uniswap/ai-toolkit-nx-claude:add-agent \
  --package=backend \
  --agent-name=my-agent \
  --description="My custom agent"

# Create new package
npx nx generate @uniswap/ai-toolkit-nx-claude:add-agent \
  --createNewPackage \
  --newPackageName=backend \
  --newPackageDescription="Backend-specific agents"
```

## Options

### Required (Prompted if not provided)

- `package` - Target package for the agent (e.g., "agnostic", "typescript", "backend")
  - Use special value `__create_new__` to trigger package creation flow

### Optional

- `createNewPackage` - Boolean flag to create a new package instead
- `newPackageName` - Name for the new package (alphanumeric, lowercase, hyphens allowed)
- `newPackageDescription` - Description of the new package

## Generator Flow

1. **Package Selection**:

   - Prompt for target package
   - List existing agent packages in workspace
   - Option to create new package

2. **Agent Definition**:

   - Prompt for agent name (kebab-case)
   - Prompt for agent description
   - Prompt for capabilities and tools

3. **File Generation**:

   - Create `{agent-name}.md` in package's `src/` directory
   - Follow agent definition template
   - Update package index exports

4. **Validation**:
   - Verify agent name uniqueness
   - Validate markdown structure
   - Check package structure

## Generated Files

```
packages/{package}/
└── src/
    └── {agent-name}.md    # Agent definition
```

## Agent Template Structure

Generated agent files follow this template:

```markdown
# Agent Name

## Capabilities

What this agent can do

## Specialization

Specific domain expertise

## When to Invoke

Conditions that warrant using this agent

## Tools Available

Tools this agent has access to

## Output Format

Expected output structure

## Integration

How it works with other agents
```

## File Structure

- `generator.ts` - Main generator logic
- `schema.json` - Configuration schema with custom prompt properties
- `schema.d.ts` - TypeScript interface
- `files/` - Template files for generation

## Development Status

**Current**: Placeholder implementation with basic structure
**Needed**:

- Complete agent creation logic
- Package creation flow
- Template file system
- Index file updates
- Validation and error handling

## Related Documentation

- Parent package: `../../CLAUDE.md`
- Agent definitions: `../../../../agents/agnostic/src/CLAUDE.md`
- Init generator: `../init/CLAUDE.md`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
