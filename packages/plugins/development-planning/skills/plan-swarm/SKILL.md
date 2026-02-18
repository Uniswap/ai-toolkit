---
description: Refine plans through multi-agent expert discussion. Use when user says "get multiple expert opinions on this plan", "I want different perspectives on this approach", "have the agents discuss this strategy", "refine the plan through collaborative review", or "what would different specialists think about this design".
allowed-tools: Read, Glob, Grep, Task, WebSearch, WebFetch
model: opus
---

# Plan Swarm

Refine plans through collaborative multi-agent expert discussion.

> ⚠️ **Cost Warning**: This skill uses the Opus model and spawns 3-10 agents for multi-round discussions. A typical plan-swarm session consumes **5-20x more tokens** than a standard skill invocation. Consider using `review-plan` for simpler validation needs.

## When to Activate

- User wants multiple expert perspectives
- Plan needs collaborative refinement
- Complex trade-offs require discussion
- Consensus building needed
- User asks for "expert opinions" or "different perspectives"

## Key Features

- **Intelligent Agent Selection**: 3-10 agents based on plan context
- **True Collaboration**: Multi-round discussions
- **Constructive Disagreement**: Respectful challenging of ideas
- **Consensus Building**: Resolution of conflicts

## Quick Process

### Phase 1: Context & Agent Selection

- Analyze plan domains (frontend, backend, security, etc.)
- Select 3-10 relevant specialized agents
- Brief each agent on the plan

### Phase 2: Multi-Round Discussion

1. **Round 1**: Initial perspectives from each agent
2. **Round 2**: Cross-domain discussion and response
3. **Round 3**: Consensus building (if needed)

### Phase 3: Synthesis

- Compile feedback across rounds
- Document consensus recommendations
- Identify trade-offs and open questions

## Agent Selection Guidelines

| Plan Complexity | Agents |
| --------------- | ------ |
| Simple          | 3-4    |
| Medium          | 5-7    |
| Complex         | 8-10   |

## Output Format

Generates refinement document with:

- Executive summary
- Agent participants and focus areas
- Consensus recommendations by category
- Design decisions and trade-offs
- Open questions requiring human decision
- Dissenting opinions with rationale
- Next steps

## Discussion Guidelines

Agents are encouraged to:

- Be direct and state opinions clearly
- Challenge constructively with alternatives
- Build on other agents' ideas
- Change positions when persuaded
- Acknowledge expertise limits
