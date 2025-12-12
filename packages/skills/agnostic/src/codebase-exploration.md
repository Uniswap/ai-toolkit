---
name: codebase-exploration
description: Use this skill when exploring or analyzing a codebase structure, understanding architecture, or mapping out dependencies between components.
allowed-tools: Read, Grep, Glob, Bash(git ls-files:*), Bash(find:*)
---

# Codebase Exploration Skill

This skill provides structured guidance for comprehensive codebase exploration and analysis.

## When to Use

Activate this skill when:

- Exploring an unfamiliar codebase or project structure
- Mapping out architecture and component relationships
- Understanding dependency graphs and integration points
- Preparing context for implementation tasks
- Answering questions about "how does X work" or "where is Y implemented"

## Exploration Methodology

### Phase 1: High-Level Structure

1. **Project Root Analysis**
   - Check for package.json, cargo.toml, go.mod, or other manifest files
   - Identify the build system (nx, make, gradle, etc.)
   - Look for configuration files (.env.example, docker-compose.yml)
   - Read README.md and CONTRIBUTING.md if present

2. **Directory Structure**
   - Map top-level directories and their purposes
   - Identify src/, lib/, pkg/, internal/, cmd/ patterns
   - Note test directories and their organization
   - Find documentation locations

### Phase 2: Dependency Mapping

1. **Internal Dependencies**
   - Trace imports and module relationships
   - Build a mental model of the dependency graph
   - Identify core modules vs. peripheral utilities

2. **External Dependencies**
   - Review package manifests for third-party deps
   - Note which external services are integrated
   - Check for API clients or SDK usage

### Phase 3: Pattern Recognition

1. **Code Patterns**
   - Identify naming conventions (camelCase, snake_case)
   - Note architectural patterns (MVC, hexagonal, etc.)
   - Find common utilities and shared code

2. **Data Flow**
   - Trace how data enters and exits the system
   - Map transformation pipelines
   - Identify persistence layers

## Output Format

When using this skill, structure findings as:

```markdown
## Summary
[1-2 sentence overview]

## Key Components
- component-name: purpose and responsibility
- ...

## Patterns Observed
- Pattern: description

## Dependencies
- Internal: list of core internal dependencies
- External: list of key external dependencies

## Data Flow
[Description of how data moves through the system]

## Gotchas
- Non-obvious behaviors or potential pitfalls

## Suggested Next Steps
- Recommended areas for deeper investigation
```

## Best Practices

- Start broad, then narrow focus based on findings
- Document assumptions and verify them
- Cross-reference multiple files to confirm patterns
- Note areas that seem inconsistent or unusual
