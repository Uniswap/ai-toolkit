# Agent Development Guide

This comprehensive guide covers everything you need to know about creating, testing, and integrating new agents into the AI Toolkit infrastructure.

## Table of Contents

1. [Understanding Agent Architecture](#understanding-agent-architecture)
2. [Creating Your First Agent](#creating-your-first-agent)
3. [Prompt Engineering Best Practices](#prompt-engineering-best-practices)
4. [Testing Strategies](#testing-strategies)
5. [Integration Tips](#integration-tips)
6. [Advanced Topics](#advanced-topics)

## Understanding Agent Architecture

### Agent Hierarchy

The AI Toolkit implements a four-tier agent hierarchy:

```
┌─────────────────────────────────────────┐
│        Meta-Learning Layer              │
│  (agent-optimizer, pattern-learner)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Orchestration Layer                │
│  (agent-orchestrator, capability-       │
│   analyst)                              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Coordination Layer                │
│  (planner, plan-reviewer)               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Specialist Layer                  │
│  (code-generator, test-writer, etc.)    │
└─────────────────────────────────────────┘
```

### Core Principles

1. **Single Responsibility**: Each agent should excel at one specific task
2. **No Direct User Interaction**: Agents are invoked by commands, not users
3. **Tool Permission Inheritance**: Agents inherit tool permissions from invoking commands
4. **Structured Input/Output**: Clear contracts for data exchange
5. **Composability**: Agents should work well together in workflows

## Creating Your First Agent

### Step 1: Define Agent Purpose

Before writing any code, clearly define:

- What problem does this agent solve?
- What are its inputs and outputs?
- How does it complement existing agents?
- What expertise does it encapsulate?

### Step 2: Create Agent File

Create a new file in the appropriate package directory:

```bash
# For language-agnostic agents
packages/agents/agnostic/src/your-agent.md

# For language-specific agents (future)
packages/agents/javascript/src/your-agent.md
packages/agents/python/src/your-agent.md
```

### Step 3: Agent Structure

Every agent must follow this structure:

```markdown
---
name: your-agent-name
description: Concise description of agent's specialization and capabilities
---

# Your Agent Name

You are a [specialization] focused on [primary responsibility]. Your expertise includes [key areas].

## Core Competencies

### Competency Area 1

- Specific capability
- Another capability
- Related skill

### Competency Area 2

- Specific capability
- Another capability

## Workflow Patterns

### 1. Assessment Phase

- Analyze the input
- Identify requirements
- Evaluate constraints

### 2. Planning Phase

- Design approach
- Consider alternatives
- Define success criteria

### 3. Execution Phase

- Implement solution
- Validate results
- Document decisions

## Best Practices

### Quality Standards

- Always validate inputs
- Provide clear error messages
- Document assumptions
- Include examples

### Performance Considerations

- Optimize for common cases
- Handle edge cases gracefully
- Consider resource constraints

## Response Patterns

When asked to [common task]:

1. First step
2. Second step
3. Third step
4. Validation step

Always prioritize:

- Accuracy over speed
- Clarity over brevity
- Safety over features
```

### Step 4: Add to Index

After creating your agent, regenerate the index:

```bash
bunx nx run @ai-toolkit/agents-agnostic:generate-index
```

## Prompt Engineering Best Practices

### 1. Clear Role Definition

**Good Example:**

```markdown
You are a database migration specialist focused on zero-downtime migrations. Your expertise includes schema evolution, data transformation, and rollback strategies.
```

**Why it works:**

- Specific role (database migration specialist)
- Clear focus (zero-downtime migrations)
- Defined expertise areas

### 2. Structured Instructions

**Use Hierarchical Organization:**

```markdown
## Primary Tasks

### Task Category 1

- Specific instruction
- Another instruction

### Task Category 2

- Specific instruction
- Another instruction
```

### 3. Examples and Patterns

**Always Include Examples:**

```markdown
## Example Workflow

Input: User needs to migrate from PostgreSQL 12 to 14
Analysis: Check compatibility, identify breaking changes
Plan: Create staged migration with validation checkpoints
Output: Detailed migration script with rollback procedures
```

### 4. Constraints and Guardrails

**Define Clear Boundaries:**

```markdown
## Constraints

- Never modify production data without backup
- Always validate schema changes in staging first
- Require explicit confirmation for destructive operations
- Maximum downtime window: 5 minutes
```

### 5. Output Formatting

**Specify Expected Output Structure:**

````markdown
## Output Format

Return results as:

```yaml
analysis:
  compatibility_issues: []
  risks: []
  estimated_downtime: '2 minutes'
migration_plan:
  steps: []
  validation_points: []
  rollback_procedure: []
```
````

### 6. Context Awareness

**Make Agents Context-Aware:**

```markdown
## Context Handling

When provided with context:

- Analyze existing patterns in the codebase
- Maintain consistency with current architecture
- Respect established conventions
- Build upon previous decisions
```

## Testing Strategies

### 1. Unit Testing Agents

**Test File Structure:**

```typescript
// your-agent.test.ts
import { testAgent } from '@ai-toolkit/testing';
import { YourAgent } from './your-agent';

describe('YourAgent', () => {
  it('should handle basic input correctly', async () => {
    const input = {
      task: 'analyze_code',
      code: 'function example() { return 42; }',
    };

    const result = await testAgent(YourAgent, input);

    expect(result).toHaveProperty('analysis');
    expect(result.analysis).toContain('function');
  });

  it('should handle edge cases', async () => {
    const input = { task: 'analyze_code', code: '' };
    const result = await testAgent(YourAgent, input);

    expect(result.error).toBe('No code provided');
  });
});
```

### 2. Integration Testing

**Test Agent Combinations:**

```typescript
describe('Agent Integration', () => {
  it('should work with planner agent', async () => {
    const plannerOutput = await testAgent(Planner, {
      requirements: 'Build user authentication',
    });

    const yourAgentOutput = await testAgent(YourAgent, {
      plan: plannerOutput.plan,
    });

    expect(yourAgentOutput.implementation).toBeDefined();
  });
});
```

### 3. Behavioral Testing

**Test Expected Behaviors:**

```typescript
describe('Agent Behavior', () => {
  const scenarios = [
    {
      name: 'handles_missing_input',
      input: {},
      expectedBehavior: 'returns_error',
    },
    {
      name: 'processes_valid_input',
      input: { valid: true },
      expectedBehavior: 'returns_success',
    },
  ];

  scenarios.forEach((scenario) => {
    it(`should ${scenario.name}`, async () => {
      const result = await testAgent(YourAgent, scenario.input);
      validateBehavior(result, scenario.expectedBehavior);
    });
  });
});
```

### 4. Performance Testing

**Measure Agent Performance:**

```typescript
describe('Agent Performance', () => {
  it('should complete within time limit', async () => {
    const startTime = Date.now();

    await testAgent(YourAgent, largeInput);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 seconds
  });

  it('should handle concurrent requests', async () => {
    const requests = Array(10)
      .fill(null)
      .map(() => testAgent(YourAgent, input));

    const results = await Promise.all(requests);
    expect(results).toHaveLength(10);
  });
});
```

## Integration Tips

### 1. Working with Other Agents

**Design for Composability:**

```markdown
## Integration Points

### Accepts Input From:

- planner: Implementation plans
- context-loader: Code context
- analyzer: Analysis results

### Provides Output To:

- test-writer: Generated code
- doc-writer: Implementation details
- reviewer: Code for review
```

### 2. Command Integration

**Make Agents Command-Ready:**

```typescript
// In command file
import { YourAgent } from '@ai-toolkit/agents';

export const yourCommand = {
  name: 'your-command',
  description: 'Uses your agent to perform tasks',

  async execute(input) {
    // Prepare input for agent
    const agentInput = {
      task: input.task,
      context: await loadContext(input.path),
    };

    // Invoke agent
    const result = await YourAgent.process(agentInput);

    // Format output for user
    return formatForUser(result);
  },
};
```

### 3. Workflow Integration

**Enable Orchestration:**

```yaml
# workflow-config.yaml
workflows:
  your_workflow:
    stages:
      - agent: context-loader
        output: context
      - agent: your-agent
        input:
          context: '${context}'
        output: result
      - agent: validator
        input:
          result: '${result}'
```

### 4. Error Handling

**Implement Graceful Failures:**

````markdown
## Error Handling

When errors occur:

1. Return structured error response
2. Include actionable error messages
3. Suggest alternatives or fixes
4. Preserve partial results when possible

Error Response Format:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "context": "What was being attempted",
  "suggestions": ["Try this", "Or this"],
  "partial_result": {}
}
```
````

## Advanced Topics

### 1. Meta-Agent Development

**Creating Self-Improving Agents:**

```markdown
## Meta-Learning Capabilities

### Pattern Recognition

- Identify recurring patterns in executions
- Extract reusable strategies
- Optimize based on historical performance

### Self-Optimization

- Analyze own performance metrics
- Adjust strategies based on feedback
- Learn from successful executions
```

### 2. Multi-Modal Agents

**Handling Different Input Types:**

```markdown
## Multi-Modal Support

### Input Types

- Text: Code, documentation, requirements
- Structured: JSON, YAML, XML
- Binary: Images, PDFs (when applicable)
- Streaming: Real-time data feeds

### Processing Strategies

- Detect input type automatically
- Apply appropriate parsing
- Maintain type safety
- Handle type conversions
```

### 3. Stateful Agents

**Managing Agent State:**

```typescript
class StatefulAgent {
  private state: AgentState;

  async initialize(context: Context) {
    this.state = {
      history: [],
      learned_patterns: [],
      performance_metrics: {},
    };
  }

  async process(input: Input) {
    // Use state to improve processing
    const enhancedInput = this.enrichWithState(input);
    const result = await this.execute(enhancedInput);

    // Update state based on execution
    this.updateState(result);

    return result;
  }

  private enrichWithState(input: Input) {
    return {
      ...input,
      patterns: this.state.learned_patterns,
      history_context: this.state.history.slice(-5),
    };
  }
}
```

### 4. Agent Versioning

**Managing Agent Evolution:**

````markdown
## Version Management

### Version Format

name: your-agent
version: 2.1.0
compatibility: ">=1.0.0"

### Migration Support

- Maintain backward compatibility
- Provide migration guides
- Support legacy input formats
- Document breaking changes

### Feature Flags

```yaml
features:
  advanced_analysis: true
  experimental_mode: false
  legacy_support: true
```
````

### 5. Performance Optimization

**Optimizing Agent Execution:**

```typescript
class OptimizedAgent {
  private cache: Map<string, Result>;

  async process(input: Input) {
    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Process with optimizations
    const result = await this.executeOptimized(input);

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  private async executeOptimized(input: Input) {
    // Use parallel processing where possible
    const [analysis, validation] = await Promise.all([
      this.analyze(input),
      this.validate(input),
    ]);

    // Early return on validation failure
    if (!validation.isValid) {
      return { error: validation.error };
    }

    return this.generateResult(analysis);
  }
}
```

## Best Practices Summary

### Do's ✅

- Keep agents focused on a single responsibility
- Provide clear, structured documentation
- Include comprehensive examples
- Test thoroughly with various inputs
- Design for composability with other agents
- Handle errors gracefully
- Optimize for common use cases
- Version your agents properly

### Don'ts ❌

- Create overly complex agents that do everything
- Hardcode assumptions about the environment
- Ignore edge cases and error scenarios
- Skip testing and validation
- Break existing agent contracts
- Mix concerns within a single agent
- Forget about performance implications
- Neglect documentation updates

## Conclusion

Creating effective agents requires careful planning, clear design, and thorough testing. By following this guide and the established patterns in the AI Toolkit, you can create agents that:

1. **Integrate seamlessly** with the existing infrastructure
2. **Perform reliably** across various scenarios
3. **Compose well** with other agents in workflows
4. **Scale effectively** as requirements grow
5. **Maintain easily** over time

Remember: Great agents are focused, reliable, and composable. They do one thing exceptionally well and work harmoniously with others to accomplish complex tasks.
