# Documentation Examples

## Purpose

Practical examples demonstrating AI Toolkit features, patterns, and best practices. Provides working code that users can reference and adapt.

## Example Files

### Orchestration Workflows

- **File**: `orchestration-workflows.md`
- **Purpose**: Examples of multi-agent orchestration patterns
- **Topics**:
  - Sequential agent execution
  - Parallel agent execution
  - Hierarchical orchestration
  - Context sharing between agents
  - Error handling in workflows
  - Agent coordination patterns

## Example Categories

### Planned Examples

Future examples to be added:

1. **Custom Agent Examples**:

   - Simple single-purpose agent
   - Complex multi-tool agent
   - Specialized domain agent

2. **Custom Command Examples**:

   - Basic slash command
   - Command with parameters
   - Command invoking agents

3. **Workflow Examples**:

   - Code review workflow
   - Refactoring workflow
   - Testing workflow
   - Documentation workflow

4. **Integration Examples**:

   - MCP server integration
   - External API integration
   - CI/CD integration

5. **Configuration Examples**:
   - Global vs local setup
   - Custom hook configurations
   - MCP server configurations

## Example Standards

### File Format

Examples use markdown with embedded code blocks:

````markdown
# Example Title

## Objective

What this example demonstrates

## Setup

Prerequisites and configuration

## Implementation

```typescript
// Working code example
```
````

## Explanation

How it works

## Variations

Alternative approaches

## Related Examples

Links to similar examples

````

### Code Quality

All example code must:

- **Work**: Be tested and functional
- **Clear**: Include comments explaining key parts
- **Complete**: Not rely on omitted code
- **Idiomatic**: Follow project conventions
- **Documented**: Have accompanying explanation

### Testing Examples

Before publishing:

1. Run the example code
2. Verify it produces expected output
3. Test variations if provided
4. Check for errors and edge cases
5. Validate against current codebase

## Creating New Examples

### Process

1. **Identify use case**: Common pattern or requested feature
2. **Create working code**: Test thoroughly
3. **Write explanation**: Clear, step-by-step
4. **Add context**: When to use, alternatives
5. **Review**: Get feedback from users
6. **Publish**: Add to this directory
7. **Update docs**: Link from guides and README

### Example Template

```markdown
# Example: [Name]

## What You'll Build

Brief description

## Prerequisites

- Requirement 1
- Requirement 2

## Step 1: Setup

\`\`\`bash
# Setup commands
\`\`\`

## Step 2: Implementation

\`\`\`typescript
// Working code
\`\`\`

## Step 3: Testing

\`\`\`bash
# Test commands
\`\`\`

## Explanation

How it works...

## Next Steps

- Try variation A
- See related example B
````

## Maintenance

### Keeping Examples Current

- **Version compatibility**: Update for breaking changes
- **Deprecations**: Remove deprecated APIs
- **Best practices**: Update as patterns evolve
- **Links**: Fix broken references

### Review Schedule

- **With releases**: Test against new versions
- **Quarterly**: General accuracy review
- **On API changes**: Immediate update

## Related Documentation

- Guides: `../guides/CLAUDE.md`
- README files: `../readmes/CLAUDE.md`
- Workflow examples: `../../.github/workflows/examples/CLAUDE.md`

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
