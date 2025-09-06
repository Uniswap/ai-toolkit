# AI Toolkit

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

## Overview

The **AI Toolkit** is a standardized collection of AI agents and commands designed for Claude Code workflows. Its goal is to allow anyone at Uniswap to install and configure Claude Code to be maximally useful, all in a single command (`bunx install-all`)

**What it provides:**

- **One-shot Installation**: Automated setup of Claude Code configurations
- **Pre-built AI Agents**: Specialized subagents for code explanation, refactoring, testing, research, and more. Claude Code will use these automatically without any need for manual direction by the user
- **Ready-to-use Commands**: Quick access patterns (called "[Slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands)") for common development workflows like understanding codebases (`/explore`), generating tests (`/gen-tests`), and planning features (`/plan`)
- **Standardized Patterns**: Create a common toolset of Claude Code commands and agents shared by everyone at Uniswap

**Why it exists:**

Instead of each person at Uniswap manually configuring AI assistant behaviors for each project, the AI Toolkit provides curated, tested configurations that can be installed instantly. This makes AI-assisted development more consistent, efficient, and accessible to Uni teams.

## Prerequisites

Before working with this repository, ensure you have the following tools installed:

- **[Bun](https://bun.sh)** (recommended) or **Node.js 22+** with npm

### Setting up GitHub Packages Access

The `@uniswap/ai-toolkit-nx-claude` package is published to GitHub Packages with restricted access for Uniswap organization members.

#### For Uniswap Organization Members

1. **Create a GitHub Personal Access Token (PAT)**:

   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a token with `read:packages` scope
   - Save the token securely

2. **Configure npm authentication for GitHub Packages**:

   ```bash
   # Add to your ~/.npmrc
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```

   Or use environment variable:

   ```bash
   export NODE_AUTH_TOKEN=YOUR_GITHUB_TOKEN

   # Then add to ~/.npmrc:
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```

   **Note**: We don't set the entire `@uniswap` scope to GitHub Packages to avoid conflicts with public npm packages.

#### Standalone Package Usage (Uniswap Members Only)

Once authenticated, you can run the ai-toolkit-nx-claude init generator directly:

````bash
# Install and run with npx (specify GitHub registry)
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude@latest

Then choose `init`.

This will install Claude Code configurations to your global `~/.claude` directory or local `./.claude` directory.

## Getting Started

### 1. Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Uniswap/ai-toolkit
cd ai-toolkit

# Install all dependencies (also sets up git hooks automatically)
bun install # or npm install if you're not using bun
````

### 2. Setup Claude Code Integration

### Option A: Install Everything (Recommended)

```bash
# One-shot installer - installs Claude Code at ~/.claude and sets up all agents + commands
bun run install-all

# Install Claude code hooks, which are custom scripts that hook into Claude Code's lifecycle (such as emitting sound notifications when Claude Code needs your input)
```

### Option B: Selective Installation

```bash
# Install just the notification hooks
bunx nx generate @uniswap/ai-toolkit-nx-claude:hooks

# Or preview what would be installed (dry-run mode)
bunx nx generate @uniswap/ai-toolkit-nx-claude:init --dry-run
```

### Verify Installation

```bash
# Make sure you have Claude Code installed, and that the agents + commands are available when you run `claude`

claude # this should open up the Claude Code REPL

# executing the "/agents" slash command should show that multiple agents have been installed
> /agents

# you should see custom /slash commands, such as "/plan", are now available to you in your Claude Code REPL.
> /plan
```

Once installed, you'll have access to powerful Claude Code agents and commands that make development workflows more efficient and consistent.

## Contributing

We welcome contributions from all developers! This project uses a **trunk-based development workflow** with automated publishing. Please read our [Contributing Guide](./docs/readmes/CONTRIBUTING.md) for detailed information about:

- **Branch strategy** (`main` for stable, `next` for active development
- **Development workflow** and best practices
- **Code quality standards** and testing requirements
- **Automated publishing** to GitHub Packages

### Quick Start for Contributors

1. **Setup your environment**:

   ```bash
   git clone https://github.com/Uniswap/ai-toolkit
   cd ai-toolkit
   bun install  # Sets up everything including git hooks
   ```

2. **Install recommended tools**:

   - **Nx Console** for your IDE (VSCode, Cursor, or IntelliJ)
   - **MCP server** for AI assistance:

     ```bash
     claude mcp add nx-mcp npx nx-mcp@latest --scope user
     ```

3. **Create your feature**:

   ```bash
   git checkout next
   git checkout -b feature/your-feature
   # Make changes, then create PR to 'next' branch
   ```

For complete contribution guidelines, see [CONTRIBUTING.md](./docs/readmes/CONTRIBUTING.md).

## Development Workflow

This repository follows a structured development and release workflow:

### Branches

- **`main`**: Stable, production-ready code (publishes with `@latest` tag)
- **`next`**: Feature integration and testing (publishes with `@next` tag)
- **`feature/*`**: Individual feature branches (not published)

### Package Versions

Our packages are available in two release channels:

```bash
# Install stable version (from main branch)
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude@latest

# Install prerelease version (from next branch)
npx --@uniswap:registry=https://npm.pkg.github.com @uniswap/ai-toolkit-nx-claude@next
```

### Automated Features

- **Automated Publishing**: Packages are automatically published when changes merge to `main` or `next`
- **Version Management**: Conventional commits automatically determine version bumps
- **Branch Synchronization**: `next` is automatically rebased onto `main` after stable releases
- **Code Quality**: Pre-commit hooks ensure consistent formatting and linting

````sh

### Generate a publishable library

```sh
npx nx g @nx/js:lib packages/pkg1 --publishable --importPath=@my-org/pkg1
````

### Run tasks

To build the library use:

```sh
npx nx build pkg1
```

To run any task with Nx use:

```sh
npx nx <target> <project-name>
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or in the `nx` property of `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Versioning and releasing

This is done automatically in the CI on pushes to `main`.

Checkout the [publish-packages.yml](.github/workflows/publish-packages.yml) workflow file for more information.

[Learn more about Nx release &raquo;](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Keep TypeScript project references up to date

Nx automatically updates TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) in `tsconfig.json` files to ensure they remain accurate based on your project dependencies (`import` or `require` statements). This sync is automatically done when running tasks such as `build` or `typecheck`, which require updated references to function correctly.

To manually trigger the process to sync the project graph dependencies information to the TypeScript project references, run the following command:

```sh
npx nx sync
```

You can enforce that the TypeScript project references are always in the correct state when running in CI by adding a step to your CI job configuration that runs the following command:

```sh
npx nx sync:check
```

[Learn more about nx sync](https://nx.dev/reference/nx-commands#sync)

### Set up CI

#### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

#### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Automated Package Publishing

The repository uses sophisticated CI/CD automation for package publishing:

#### Publishing Pipeline

Our automated workflow (`.github/workflows/publish-packages.yml`) handles:

- **Dual-branch publishing**:
  - `main` → stable releases (`@latest` tag)
  - `next` → prerelease versions (`@next` tag)
- **Intelligent versioning**: Conventional commits drive automatic version bumps
- **Independent packages**: Each package versions independently based on changes
- **GitHub Packages registry**: Organization-scoped publishing with access control

#### How It Works

1. **Feature Development** (on `next` branch):

   ```bash
   git commit -m "feat: amazing new feature"
   git push origin next
   # Automatically publishes as 1.0.0-next.0
   ```

2. **Stable Release** (merged to `main`):

   ```bash
   # After testing on next, merge to main
   # Automatically publishes as 1.0.0
   ```

3. **Branch Synchronization**:
   - After `main` publishes, `next` automatically rebases
   - Keeps development branch current with stable changes
   - Conflicts create GitHub issues for manual resolution

For technical details, see [DEVELOPMENT.md](./docs/readmes/DEVELOPMENT.md).

### Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/js?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
