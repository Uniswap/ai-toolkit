---
name: plan-swarm
description: Collaboratively refine plans through multi-agent discussion and consensus-building. Use when user wants multiple perspectives on a plan, needs expert opinions, or wants to improve a strategy through collaborative refinement. Triggers: "get feedback from experts", "multiple perspectives", "collaborative review", "swarm", "expert opinions", "refine the plan", "discuss the approach".
allowed-tools: Read, Glob, Grep, Task, WebSearch, WebFetch
model: opus
---

# Plan Swarm

Refine plans through collaborative multi-agent expert discussion.

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
