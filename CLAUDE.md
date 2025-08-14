# CLAUDE.md - AI Toolkit Project Guidelines

## Core Requirements

### Nx Usage
- **REQUIREMENT**: Use Nx for ALL packages and tooling in this monorepo
- Every package must be an Nx project with proper configuration
- Use Nx generators, executors, and workspace features wherever possible
- Leverage Nx's dependency graph and caching capabilities

### Package Structure
- All packages must be properly configured Nx libraries or applications
- Use Nx's project.json for configuration
- Follow Nx best practices for monorepo organization

### Development Workflow
- Use Nx commands for all operations (build, test, lint, etc.)
- Maintain proper inter-package dependencies through Nx
- Ensure all packages are part of the Nx workspace graph

## Project Context
This is the AI Toolkit monorepo that provides standardized, one-shot setup for Claude Code AI workflows. The project uses:
- Nx for monorepo management
- TypeScript with strict settings
- Bun as the package manager
- ESLint and Prettier for code quality

## Package Scope
All packages use the `@ai-toolkit` scope.