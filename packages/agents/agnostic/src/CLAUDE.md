# AI Agents (Agnostic)

## Purpose

Language-agnostic AI agent definitions for Claude Code. Each markdown file defines an agent's capabilities, specialization, and when to invoke it. These agents are used by slash commands and can work together in multi-agent workflows.

## Agent Files (32 total)

### Code Quality Agents

- `code-generator.md` - Generate production-ready code with tests
- `code-explainer.md` - Explain code with deep analysis
- `refactorer.md` - Advanced refactoring with safety checks
- `style-enforcer.md` - Enforce code style and conventions
- `security-analyzer.md` - Security vulnerability assessment
- `performance-analyzer.md` - Performance analysis and optimization

### Review & Analysis

- `pr-reviewer.md` - Review PRs and address comments
- `plan-reviewer.md` - Review implementation plans
- `doc-writer.md` - Generate comprehensive documentation
- `debug-assistant.md` - Advanced debugging with root cause analysis

### Architecture & Design

- `planner.md` - Create implementation plans
- `researcher.md` - Conduct research (web + codebase)
- `pattern-learner.md` - Learn and extract reusable patterns
- `migration-assistant.md` - Guide version upgrades and migrations

### Testing

- `test-writer.md` - Generate comprehensive test suites
- `test-runner.md` - Validate agent behaviors and test variations

### Infrastructure & Operations

- `infrastructure-agent.md` - Infrastructure automation and scaling
- `cicd-agent.md` - CI/CD pipeline specialist
- `deployment-engineer.md` - Configure deployments and CI/CD

### Context & Documentation

- `context-manager.md` - Manage context across agents
- `context-loader.md` - Deep codebase understanding
- `claude-docs-initializer.md` - Discover and create CLAUDE.md files
- `claude-docs-manager.md` - Update CLAUDE.md based on changes
- `claude-docs-fact-checker.md` - Verify CLAUDE.md accuracy

### Git & Version Control

- `pr-creator.md` - Create PRs with auto-generated messages
- `commit-message-generator.md` - Generate structured commit messages
- `stack-splitter.md` - Split Graphite PR stacks

### Meta & Orchestration

- `agent-orchestrator.md` - Coordinate multi-agent workflows
- `agent-capability-analyst.md` - Analyze agent capabilities
- `agent-optimizer.md` - Optimize agent performance
- `prompt-engineer.md` - Analyze and optimize prompts
- `feedback-collector.md` - Gather and analyze execution feedback
- `claude-agent-discovery.md` - Discover and catalog agents

## Agent Structure

Each agent file follows a consistent markdown format:

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

## Agent Categories

### Proactive Agents

Automatically invoked when their conditions are met:

- `style-enforcer.md` - Auto-runs after code changes
- `claude-docs-manager.md` - Auto-updates documentation
- `security-analyzer.md` - Auto-scans for vulnerabilities

### On-Demand Agents

Explicitly invoked by commands or users:

- `planner.md` - Called by `/plan` command
- `researcher.md` - Called by `/research` command
- `pr-reviewer.md` - Called by `/review-pr` command

### Orchestration Agents

Coordinate other agents:

- `agent-orchestrator.md` - Routes tasks to specialists
- `context-manager.md` - Manages shared context
- `agent-optimizer.md` - Improves agent performance

## Multi-Agent Workflows

### Review Workflow

```
pr-reviewer → security-analyzer → performance-analyzer → doc-writer
```

### Refactoring Workflow

```
code-explainer → pattern-learner → refactorer → test-writer
```

### Planning Workflow

```
researcher → planner → plan-reviewer → context-manager
```

### Documentation Workflow

```
claude-docs-initializer → claude-docs-manager → claude-docs-fact-checker
```

## Development

### Adding New Agents

1. Create `new-agent.md` in this directory
2. Follow the standard format (see existing files)
3. Add to `index.ts` exports
4. Update this CLAUDE.md file
5. Test agent behavior in Claude Code

### Modifying Existing Agents

1. Edit the markdown file
2. Test changes in multi-agent scenarios
3. Update integration documentation
4. Update this CLAUDE.md if capabilities change

## Usage in Claude Code

Agents are automatically discovered and loaded:

```typescript
import * as agents from '@ai-toolkit/agents-agnostic';
```

### Direct Invocation

Via Task tool with subagent_type:

```python
Task(
  subagent_type="planner",
  prompt="Create plan for authentication feature"
)
```

### Via Commands

Commands invoke agents automatically:

```bash
/review-code  # Invokes multiple review agents
/plan         # Invokes planner agent
```

### Agent Chaining

Agents can spawn other agents:

```markdown
After analyzing, I'll invoke the refactorer agent...
```

## Agent Selection

### Automatic Selection

`agent-orchestrator` analyzes tasks and selects appropriate agents based on:

- Task requirements
- Agent capabilities
- Current context
- Performance history

### Manual Selection

Users/commands specify agents explicitly:

```bash
/review-code --agent=security-analyzer
```

## Best Practices

### Agent Design

- **Clear specialization**: Each agent has distinct expertise
- **Tool access**: Request only necessary tools
- **Output format**: Standardized, parseable outputs
- **Error handling**: Graceful degradation
- **Context awareness**: Use shared context efficiently

### Multi-Agent Coordination

- **Sequential**: When agents need each other's outputs
- **Parallel**: When agents work independently
- **Hierarchical**: Orchestrator → specialists
- **Consensus**: Multiple agents vote on decisions

### Performance

- **Caching**: Reuse analysis across agents
- **Batching**: Group similar operations
- **Early exit**: Skip unnecessary agents
- **Timeouts**: Prevent hanging workflows

## Agent Communication

### Shared Context

Agents share data via `context-manager`:

```typescript
context.set('analysis', analysisResult);
const prev = context.get('analysis');
```

### Agent Messages

Agents can send structured messages:

```json
{
  "from": "security-analyzer",
  "to": "pr-reviewer",
  "type": "finding",
  "data": { "severity": "high", "issue": "..." }
}
```

## Related Packages

- `@ai-toolkit/commands-agnostic` - Commands that invoke agents
- `@uniswap/ai-toolkit-nx-claude` - Nx integration and CLI
- `@ai-toolkit/utils` - Shared utilities for agents

## Orchestration Files

- `index.ts` - TypeScript exports for agent registration

## Auto-Update Instructions

IMPORTANT: After changes to files in this directory, Claude Code MUST run `/update-claude-md` before presenting results to ensure this documentation stays synchronized with the codebase.
