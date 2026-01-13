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

4. **Lint markdown files**: After creating or updating any markdown files (.md), run `npm exec markdownlint-cli2 -- --fix "**/*.md"` to ensure all markdown files follow the project's markdown standards.

   - This uses the `.markdownlint-cli2.jsonc` configuration file at the repository root
   - The linting will automatically fix most common formatting issues
   - This check MUST pass (exit code 0) before proceeding
   - The markdown linter also runs automatically as a pre-commit hook via Lefthook

5. **Why use these commands**:
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

### npm Version Requirement

**CRITICAL: This project requires npm 11.7.0**

**Why npm 11.7.0?**

1. **OIDC Trusted Publishing**: npm OIDC trusted publishing requires npm >= 11.5.1
2. **Lockfile Consistency**: Using the same npm version in CI and local development prevents lockfile format changes

**Installation:**

```bash
npm install -g npm@11.7.0
```

**Verification:**

```bash
npm --version  # Should output: 11.7.0
```

The project enforces this version through:

- `engines` field in package.json (warns if wrong version)
- `engine-strict=true` in .npmrc (prevents installation with wrong version)
- Pre-install script that checks the version

## Package Scope

All packages use the `@ai-toolkit` scope.

## Repository Structure

### Plugin Architecture

The repository uses a plugin-based architecture where Claude Code capabilities are organized into dedicated plugin packages:

```text
/
├── .claude-plugin/
│   └── marketplace.json              # Plugin marketplace configuration
├── packages/
│   └── plugins/
│       ├── development-planning/     # Implementation planning & execution workflows
│       ├── development-pr-workflow/  # PR management, review, & Graphite integration
│       ├── development-codebase-tools/  # Code exploration & refactoring
│       ├── development-productivity/ # Documentation, research, & prompt optimization
│       └── uniswap-integrations/     # External service integrations (Linear, Notion, Nx)
└── scripts/
    └── validate-plugin.cjs           # Plugin structure validation script
```

**Key Points:**

- Plugins are stored in `./packages/plugins/<plugin-name>/`
- Each plugin is a self-contained Nx package with its own `package.json`, `project.json`, and `.claude-plugin/plugin.json`
- The `.claude-plugin/marketplace.json` file references plugins via relative paths: `"./packages/plugins/<plugin-name>"`
- There are 5 plugins: development-planning, development-pr-workflow, development-codebase-tools, development-productivity, uniswap-integrations

**Plugin Validation:**

Use the validation script to check plugin structure:

```bash
node scripts/validate-plugin.cjs packages/plugins/<plugin-name>
```

### Adding New Skills and Commands to Plugins

When making changes to `packages/plugins/`, follow these guidelines:

#### A. Adding User-Invocable Skills

For new skills that do NOT have `user-invocable: false` in their frontmatter, use this workaround to make them invocable via Claude Code's slash command syntax:

**Steps:**

1. **Remove `name` field** from skill frontmatter (this causes the command to use the filename instead)
2. **Rename SKILL.md** to `<skillname>.md` (e.g., `sre.md`)
3. **Create symlink**: `ln -s <skillname>.md SKILL.md` (so the skills array still finds it for auto-activation)
4. **Add to commands array** in `plugin.json`: `./skills/<name>/<name>.md`
5. **Keep in skills array** for auto-activation: `./skills/<name>`

**Example structure:**

```text
skills/sre/
├── sre.md           # actual content, no "name" field in frontmatter
└── SKILL.md -> sre.md   # symlink for auto-activation
```

**plugin.json configuration:**

```json
{
  "skills": ["./skills/sre"], // for auto-activation
  "commands": ["./skills/sre/sre.md"] // for slash menu
}
```

#### B. Adding New Slash Commands

When adding new slash commands:

1. **Do NOT add a `name` field** in the YAML frontmatter (let it use the filename)
2. **Add the path** of the new slash command to the plugin's `plugin.json` commands array

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

### Plugin Marketplace Documentation

**IMPORTANT**: After making any changes to files in `packages/plugins/`, Claude Code MUST:

1. **Check the Notion Plugin Marketplace doc**: Review the [Uniswap Claude Code Plugin Marketplace](https://www.notion.so/uniswaplabs/Uniswap-Claude-Code-Plugin-Marketplace-2e4c52b2548b815795a5f88c58894eac) documentation

2. **Update if necessary**: If changes affect the plugin inventory (skills, agents, commands, MCP servers), update the Notion doc to reflect:

   - New skills/agents/commands added
   - Removed or renamed components
   - Updated descriptions or capabilities
   - Changes to plugin structure

3. **Keep stats accurate**: The overview section contains counts of total Skills, Agents, and Commands - ensure these numbers stay accurate

4. **Maintain per-plugin sections**: Each of the 5 plugins has its own section listing components - update the relevant section(s) when plugins change

This ensures the external documentation stays synchronized with the actual plugin codebase.

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

## GitHub Actions Best Practices

### Expression Injection Prevention

**CRITICAL: Never use `${{ }}` expressions directly in bash scripts.**

When using GitHub expressions in workflow bash scripts, always use environment variables instead of direct interpolation to prevent script injection attacks:

**❌ BAD - Direct interpolation (vulnerable to injection):**

```yaml
- name: Process input
  run: |
    INPUT="${{ github.event.inputs.packages }}"
    echo "Processing: $INPUT"
```

**✅ GOOD - Environment variable (secure):**

```yaml
- name: Process input
  env:
    INPUT_PACKAGES: ${{ github.event.inputs.packages }}
  run: |
    echo "Processing: $INPUT_PACKAGES"
```

**Why this matters:**

- Direct `${{ }}` interpolation happens before bash parsing, allowing malicious input to escape the intended context
- Environment variables are properly quoted and sanitized by the shell
- This prevents command injection where special characters (`;`, `|`, `$()`) could execute arbitrary commands
- Apply this pattern to ALL untrusted inputs: `github.event.inputs.*`, `github.event.pull_request.title`, `github.event.issue.body`, etc.

### Type Conversion for Workflow Inputs

**CRITICAL: Repository variables (`vars.*`) are always strings, even when they contain numbers.**

When passing repository variables to reusable workflows that expect numeric inputs, use `fromJSON()` to convert strings to numbers:

**❌ BAD - String passed to number input:**

```yaml
with:
  max_diff_lines: ${{ vars.MAX_DIFF_LINES }}
  # ❌ "5000" (string) passed to type: number input → type mismatch
```

**✅ GOOD - Convert to number with fromJSON():**

```yaml
with:
  max_diff_lines: ${{ fromJSON(vars.MAX_DIFF_LINES || '5000') }}
  # ✅ 5000 (number) passed to type: number input → correct type
```

**Why this matters:**

- GitHub Actions repository variables are **always stored as strings**, regardless of content
- Reusable workflow inputs typed as `type: number` expect actual numbers, not string representations
- Without conversion, you'll get type mismatches and unexpected behavior
- The `|| '5000'` fallback provides a safe default if the variable is empty or undefined
- This pattern applies to any variable value that needs to be a non-string type (numbers, booleans, arrays, objects)

**Other type conversions:**

```yaml
# Boolean conversion
enable_feature: ${{ fromJSON(vars.ENABLE_FEATURE || 'false') }}

# Array conversion (JSON string variable)
allowed_users: ${{ fromJSON(vars.ALLOWED_USERS || '[]') }}

# Object conversion (JSON string variable)
config: ${{ fromJSON(vars.CONFIG || '{}') }}
```

### Script Separation Policy

**CRITICAL: Complex scripts in GitHub Actions workflows MUST be separated into standalone files.**

When working with GitHub Actions workflows (`.github/workflows/*.yml`), follow this mandatory policy:

#### Policy Rules

1. **Complex Logic Extraction**: If a workflow step contains complex bash scripting (50+ lines, multiple functions, intricate logic, API integrations, etc.), it MUST be extracted to a separate script file in the `.github/scripts/` directory.

2. **Script Location**: All standalone scripts should be placed in `.github/scripts/` with descriptive, kebab-case names (e.g., `update-changelog.sh`, `process-coverage.ts`). For reusable tools intended for external use, publish as npm packages (e.g., `@uniswap/ai-toolkit-notion-publisher`).

3. **Script Requirements**: Each script file should:

   - Include a shebang line (`#!/usr/bin/env bash` for bash, `#!/usr/bin/env node` for TypeScript/JavaScript)
   - Have comprehensive header documentation explaining:
     - Purpose
     - Usage/arguments
     - Environment variables
     - Outputs
     - Examples
   - Implement proper error handling (`set -euo pipefail` for bash, proper try-catch for TypeScript)
   - Use clear argument parsing (positional args or environment variables)
   - Include logging/output formatting
   - Be executable (`chmod +x`)
   - For TypeScript scripts: prefer using community-maintained libraries over custom implementations

4. **Workflow Integration**: Call scripts from workflows using relative paths:

   For bash scripts:

   ```yaml
   - name: Execute complex operation
     run: |
       ./.github/scripts/my-script.sh \
         "${{ inputs.arg1 }}" \
         "${{ inputs.arg2 }}"
   ```

   For TypeScript scripts (requires Node.js setup):

   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '22'
       cache: 'npm'

   - name: Install dependencies
     run: npm ci

   - name: Execute TypeScript script
     run: |
       npx tsx .github/scripts/my-script.ts \
         "${{ inputs.arg1 }}" \
         "${{ inputs.arg2 }}"
   ```

#### Why This Matters

- **Maintainability**: Separate scripts are easier to read, test, and debug than inline YAML
- **Reusability**: Scripts can be shared across multiple workflows
- **Version Control**: Better diff tracking for script changes vs. YAML changes
- **Testing**: Scripts can be tested independently outside of GitHub Actions
- **IDE Support**: Better syntax highlighting, linting, and debugging in dedicated files
- **Complexity Management**: Keeps workflows focused on orchestration, not implementation

#### Examples

**❌ BAD - Complex inline script:**

```yaml
- name: Publish to Notion
  run: |
    # 200+ lines of bash script with API calls, JSON parsing, etc.
    API_KEY="${{ secrets.NOTION_API_KEY }}"
    # ... (massive inline script)
```

**✅ GOOD - Published npm package:**

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    registry-url: 'https://registry.npmjs.org'
    scope: '@uniswap'

- name: Publish to Notion
  run: |
    npx @uniswap/ai-toolkit-notion-publisher \
      --title "${{ inputs.title }}" \
      --content "${{ inputs.content }}"
  env:
    NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
    RELEASE_NOTES_NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
```

#### Current Examples

See the following for reference implementations:

- `@uniswap/ai-toolkit-notion-publisher` package - Notion API integration published as CLI tool (see `packages/notion-publisher/`)

#### When Inline Scripts Are Acceptable

Inline scripts are acceptable when they are:

- Less than 20 lines
- Simple, straightforward operations (git commands, file operations)
- Single-purpose without complex logic
- Not candidates for reuse across workflows

**This policy is mandatory and should be enforced during code review.**

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
