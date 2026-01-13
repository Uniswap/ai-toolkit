# Slash Commands (Agnostic)

## Purpose

Language-agnostic slash command definitions for Claude Code. Each markdown file defines a command's behavior, parameters, and usage. These are the core commands available in the AI Toolkit.

## Command Files (27 total)

### Core Workflow Commands

- `explore.md` - Deep dive into codebase areas
- `plan.md` - Create implementation plans
- `execute-plan.md` - Execute implementation plans step-by-step
- `implement-spec.md` - Implement spec workflow tasks
- `auto-spec.md` - Autonomous spec creation and implementation

### Code Quality & Review

- `review-code.md` - Multi-agent code review (architecture, security, performance)
- `review-pr.md` - Comprehensive pull request review
- `review-plan.md` - Review implementation plans
- `fix-bug.md` - Diagnose and fix bugs with tests
- `refactor.md` - Comprehensive refactoring with safety checks
- `gen-tests.md` - Generate comprehensive test suites

### Code Understanding

- `explain-file.md` - Multi-agent code explanation
- `research.md` - Research topics with web + codebase analysis

### Git & PR Management

- `create-pr.md` - Create/update Graphite PRs with auto-generated messages
- `address-pr-issues.md` - Review and address PR comments/CI issues
- `work-through-pr-comments.md` - Methodically work through PR comments
- `generate-commit-message.md` - Generate structured commit messages
- `split-stack.md` - Split Graphite PR stacks
- `git-worktree-orchestrator.md` - Create and manage git worktrees with spec-workflow, Graphite, setup scripts, and Linear integration

### Documentation

- `claude-docs.md` - Initialize/update CLAUDE.md documentation
- `claude-init-plus.md` - Discover and create CLAUDE.md files workspace-wide
- `update-claude-md.md` - Update CLAUDE.md based on code changes

### Development Operations

- `deploy.md` - Orchestrate deployment pipelines
- `monitor.md` - Set up application monitoring
- `daily-standup.md` - Generate daily standup reports

### Performance

- `perf-analyze.md` - Performance analysis and optimization

### Orchestration (Internal)

- `index.ts` - TypeScript exports for command registration

## File Structure

Each command file follows a consistent markdown format:

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

## Command Categories

### High-Complexity Commands (Multi-Agent)

These commands orchestrate multiple specialized agents:

- `/review-code` - Architecture, security, performance agents
- `/review-pr` - Multiple review dimensions
- `/explain-file` - Multiple analysis agents
- `/refactor` - Safety and pattern agents
- `/fix-bug` - Debugging and testing agents

### Single-Purpose Commands

Focused commands with clear, singular objectives:

- `/generate-commit-message` - Git commit formatting
- `/create-pr` - PR creation
- `/perf-analyze` - Performance analysis

### Workflow Commands

Commands that manage larger processes:

- `/auto-spec` - Full spec workflow
- `/implement-spec` - Spec task implementation
- `/execute-plan` - Plan execution
- `/work-through-pr-comments` - Comment resolution workflow
- `/git-worktree-orchestrator` - Worktree creation with Graphite, setup scripts, and Linear automation

## Development

### Adding New Commands

1. Create `new-command.md` in this directory
2. Follow the standard format (see existing files)
3. Add to `index.ts` exports
4. Update this CLAUDE.md file
5. Test with `/new-command` in Claude Code

### Modifying Existing Commands

1. Edit the markdown file
2. Test changes in Claude Code
3. Update any affected documentation
4. Update this CLAUDE.md if behavior changes

## Usage in Claude Code

Commands are automatically discovered and loaded:

```typescript
import * as commands from '@ai-toolkit/commands-agnostic';
```

Claude Code registers these as slash commands:

```bash
/explore <description>
/plan <task description>
/review-code [paths]
```

## Command Invocation

### Direct Invocation

User types command in Claude Code:

```
/review-code src/components/
```

### From Other Commands

Commands can invoke other commands:

```markdown
After reviewing, run `/gen-tests` to add coverage
```

### From Agents

Agents can recommend commands:

```markdown
I recommend running `/refactor src/utils/` to improve this code
```

## Best Practices

### Command Design

- **Single responsibility**: Each command does one thing well
- **Clear parameters**: Document all arguments and flags
- **Predictable behavior**: Same inputs = same outputs
- **Composable**: Commands should work together
- **Fail gracefully**: Handle errors with clear messages

### Documentation

- Keep markdown files up to date
- Include examples for common use cases
- Document edge cases and limitations
- Link to related commands

## Related Packages

- `@ai-toolkit/commands-typescript` - TypeScript-specific implementations
- `packages/plugins/*` - Plugin-based agents used by commands
- `@uniswap/ai-toolkit-nx-claude` - Nx integration and CLI

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
