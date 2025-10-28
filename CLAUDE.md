F# CLAUDE.md - AI Toolkit Project Guidelines

## Core Requirements

### Nx Usage

- **REQUIREMENT**: Use Nx for ALL packages and tooling in this monorepo
- Every package must be an Nx project with proper configuration
- Use Nx generators, executors, and workspace features wherever possible
- Leverage Nx's dependency graph and caching capabilities

#### Nx Generator Schema Configuration - Critical Rules

When creating Nx generators with conditional prompting (showing/hiding prompts based on other values), follow these rules:

**CRITICAL: Avoid `x-prompt` for conditional fields**

The `x-prompt` property can interfere with conditional prompting logic. For fields that should only appear conditionally:

1. ❌ **DO NOT** use `x-prompt` (even nested as `x-prompt.when`) IF the variable is not ALWAYS something we want to know from the User (i.e. it's NOT CONDITIONAL)
2. ❌ **DO NOT** include a `default` value if the field should be optional
3. ✅ **DO** use only `prompt-when` at the property level
4. ✅ **DO** rely on the prompt-utils to generate prompts from property metadata

**Example - Conditional Prompt Implementation:**

```json
{
  "properties": {
    "installMode": {
      "type": "string",
      "enum": ["all", "specific"],
      "default": "all",
      "x-prompt": {
        "message": "What would you like to install?",
        "type": "list",
        "items": [...]
      }
    },
    "addon": {
      "type": "string",
      "enum": ["option1", "option2", "option3"],
      // ❌ NO x-prompt here - it would always trigger
      // ❌ NO default value - would prevent prompt from showing when needed
      "prompt-when": "installMode === 'specific'"  // ✅ ONLY this
    }
  }
}
```

**Why this matters:**

- `x-prompt` presence can cause prompts to appear regardless of conditions
- `default` values can interfere with the `shouldPrompt` logic in prompt-utils
- The prompt-utils checks for `prompt-when` AFTER checking if prompting is needed
- Only properties without `x-prompt` and without defaults will properly respect `prompt-when`

**Reference:** See packages/ai-toolkit-nx-claude/src/generators/addons/schema.json for a working example of conditional prompting with `installMode` controlling `addon` visibility.

### Package Structure

- All packages must be properly configured Nx libraries or applications
- Use Nx's project.json for configuration
- Follow Nx best practices for monorepo organization

### Development Workflow

- Use Nx commands for all operations (build, test, lint, etc.)
- Maintain proper inter-package dependencies through Nx
- Ensure all packages are part of the Nx workspace graph

### Code Quality Enforcement

After making any code changes, Claude Code MUST:

1. **Format the code**: Run `npx nx format:write --uncommitted` to format all uncommitted files using Prettier configuration

   - For CI or when comparing against a specific base: `npx nx format:write --affected --base=HEAD~1`
   - This ensures consistent code style across the entire codebase

2. **Lint the code**: Run `npx nx affected --target=lint --base=HEAD~1` to check for linting errors

   - This runs ESLint on all affected projects based on your changes
   - If there are linting errors that can be auto-fixed, add the `--fix` flag: `npx nx affected --target=lint --base=HEAD~1 --fix`

3. **Typecheck the code**: Run `npx nx affected --target=typecheck --base=HEAD~1` to typecheck all affected projects.

4. **Why use these commands**:
   - `--uncommitted` flag formats only files that haven't been committed yet
   - `--affected` with `--base=HEAD~1` identifies all projects affected by changes since the last commit
   - Using Nx's affected commands ensures only relevant code is checked, making the process fast and efficient
   - These commands leverage Nx's dependency graph to include downstream projects that might be affected

## Project Context

This is the AI Toolkit monorepo that provides standardized, one-shot setup for Claude Code AI workflows. The project uses:

- Nx for monorepo management
- TypeScript with strict settings
- npm as the package manager
- ESLint and Prettier for code quality

## Package Scope

All packages use the `@ai-toolkit` scope.

## Documentation Management

### CLAUDE.md File Management

After making any changes to files in this repository, Claude Code MUST:

1. **Identify the affected package or app**: Look at the directories where changes were made and find the closest parent package or app directory (typically containing a `package.json` or `project.json`). It should use the Nx MCP, if available, to determine the affected package or app based on the file paths modified.

2. **Check for existing CLAUDE.md**:

   - If a CLAUDE.md file exists in that package/app directory, update it to reflect the changes made and the resulting state of the code
   - If no CLAUDE.md file exists, create one with content relevant to that specific package/app and its code

3. **Content scope**: The CLAUDE.md content should be scoped to the specific package or app, including:

   - Package-specific guidelines and patterns
   - Architecture decisions for that package
   - API documentation and usage examples
   - Dependencies and integrations specific to that package
   - Any special considerations or gotchas

4. **Continuous updates**: Always update the relevant CLAUDE.md file whenever files in that directory or its subdirectories are modified by Claude Code. This ensures documentation stays in sync with the codebase.

5. **Format**: Each package-level CLAUDE.md should follow a consistent format:
   - Package overview and purpose
   - Key components and their roles
   - Usage patterns and examples
   - Development guidelines specific to that package
   - Recent changes and their rationale

### README.md File Management

After making any changes to files in this repository, Claude Code MUST:

1. check all `README.md` files in directories with changes and, if appropriate, UPDATE the `README.md` file(s) so they're accurate, reliable, valid, and indicative of the state of the repository with the added changes

## Git Hooks Configuration

### Lefthook Setup

This project uses [Lefthook](https://github.com/evilmartians/lefthook) to manage Git hooks, ensuring code quality and consistency before commits are made to the repository.

#### What is Lefthook?

Lefthook is a fast and powerful Git hooks manager that runs checks on your code before Git operations. It's polyglot, parallel, and incredibly fast compared to other Git hooks solutions.

#### Pre-commit Hooks

The following hooks run automatically before each commit:

1. **Format affected files**: Runs `nx format:write --affected` to automatically format all files modified in your commit using Prettier configuration
2. **Lint affected files**: Runs `nx affected --target=lint` to check for linting errors in all affected packages

These hooks leverage Nx's affected commands to only check and format files that have been changed, making the pre-commit process fast and efficient.

#### How to Use

The hooks are automatically installed when you run `npm install` (via the `prepare` script in package.json). No additional setup is required.

##### Available npm scripts

- `npm run prepare`: Installs lefthook (runs automatically after `npm install`)
- `npm run lefthook`: Manually run lefthook commands

##### Skipping hooks when needed

Sometimes you may need to bypass the hooks (e.g., for a work-in-progress commit):

- Using Git flag: `git commit --no-verify -m "WIP: your message"`
- Using environment variable: `LEFTHOOK=0 git commit -m "WIP: your message"`

**Note**: Use skip options sparingly. The hooks are there to maintain code quality across the monorepo.

#### Configuration

The lefthook configuration is defined in `lefthook.yml` at the root of the repository. The configuration ensures that:

- All committed code is properly formatted
- All committed code passes linting rules
- Only affected files are checked (leveraging Nx's dependency graph)
