# Implementation Planning Guide

## Agent Selection Strategy

### By Domain

Select agents based on technical domains in the task. The names below are the dispatch names
(`Task(subagent_type:<name>)`) of agents that ship in this marketplace:

| Domain                   | Agents                                          |
| ------------------------ | ----------------------------------------------- |
| Codebase context         | `context-loader-agent`, `code-explainer-agent`  |
| Conventions and patterns | `pattern-learner-agent`, `style-enforcer-agent` |
| Security                 | `security-analyzer-agent`                       |
| Performance              | `performance-analyzer-agent`                    |
| Testing                  | `test-writer-agent`                             |
| Refactors and migrations | `refactorer-agent`, `migration-assistant-agent` |
| CI/CD and infrastructure | `cicd-agent`, `infrastructure-agent`            |
| Documentation            | `documentation-agent`                           |
| External research        | `researcher-agent`                              |
| Debugging                | `debug-assistant-agent`                         |

Before dispatching an agent that is not in this table, confirm it exists - a name that does not
match an agent's frontmatter `name:` fails at dispatch:

```bash
grep -rhE '^name: ' packages/plugins/*/agents/ | sort -u
```

### By Complexity

These are **ceilings, not quotas**. Staff only the domains the task actually raises. If the
analysis would finish in a handful of direct tool calls, do it yourself instead of spawning an
agent for it.

- **Simple tasks**: up to 2 agents, and often zero
- **Medium tasks**: up to 5 agents covering the domains in play
- **Complex tasks**: up to 10 agents

### Example Combinations

**"Add user authentication with JWT"**

- `context-loader-agent` (existing auth surface and conventions)
- `security-analyzer-agent` (token handling, storage, session risks)
- `test-writer-agent` (auth test coverage)

**"Migrate a legacy module to the new API"**

- `migration-assistant-agent` (migration path)
- `pattern-learner-agent` (target-side conventions)
- `performance-analyzer-agent` (only if the migration has a measured performance stake)

## Multi-Round Discussion Protocol

### Round 1: Initial Perspectives

Each agent provides:

- Assessment from their specialized perspective
- Key concerns or risks they identify
- Suggestions for improvement in their domain
- Questions for other specialists

### Round 2: Cross-Domain Discussion

Agents respond to each other:

- React to feedback from other agents
- Identify agreements and disagreements
- Propose solutions to concerns raised
- Refine recommendations based on peer input

### Round 3: Consensus Building (if needed)

Resolve remaining disagreements:

- Find middle ground or compromises
- Evaluate trade-offs explicitly
- Document decisions and rationale

## Discussion Prompts

Use these to facilitate productive discussion:

- "Agent X raised concerns about [Y]. What's your perspective?"
- "How would your domain be affected by Agent X's suggestion?"
- "Agent X and Y disagree about [Z]. Can you provide a third perspective?"
- "Are there trade-offs in Agent X's proposal we haven't considered?"

## Output Format

### Plan File Location

`.claude-output/plan-[YYYYMMDD]-[hash].md`

### Required Sections

```markdown
# Implementation Plan: [Title]

## Overview

[2-3 sentence summary of the approach]

## Scope

### Included

- [What will be implemented]

### Excluded

- [What won't be implemented]

## Current State

### Relevant Architecture

[Description of current system relevant to task]

### Key Files

- `path/to/file.ts` - [purpose]

## API Design (optional)

### Interfaces

[Type definitions, function signatures]

### Data Structures

[Key data shapes]

## Implementation Steps

### Step 1: [Title]

**Files**: `file1.ts`, `file2.ts`

[Description of what to do]

### Step 2: [Title]

...

## Files Summary

### Create

- `path/to/new/file.ts` - [purpose]

### Modify

- `path/to/existing/file.ts` - [changes]

## Critical Challenges (optional)

### [Challenge Name]

- **Risk**: [What could go wrong]
- **Mitigation**: [How to address it]

## Agent Collaboration Summary

### Participants

- [agent-1]: [focus area]
- [agent-2]: [focus area]

### Key Consensus

- [Agreement 1]
- [Agreement 2]

### Trade-offs Decided

- [Trade-off]: [Decision and rationale]

### Open Questions

- [Question requiring human decision]
```

## Quality Indicators

Good collaborative planning shows:

- Multiple agents reference each other's feedback
- Conflicting views backed by clear rationale
- Later rounds show growing consensus
- Recommendations are specific and actionable
- Trade-offs documented, not hidden

## Integration with Execution

The plan file format is designed for the `execute-plan` skill:

- Clear step ordering for sequential execution
- File lists for each step
- Explicit scope boundaries
- Commit points identified
