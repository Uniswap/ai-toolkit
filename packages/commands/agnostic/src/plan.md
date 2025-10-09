---
description: Create clear, actionable implementation plans for any task, feature, refactor, or architectural change through collaborative multi-agent refinement
argument-hint: <task/feature description or plan file path>
allowed-tools: Read(*), Glob(*), Grep(*), LS(*), Task(*), WebSearch(*), WebFetch(*), Write(*.md), MultiEdit(*.md), Bash(git ls-files:*), Bash(mkdir:*)
model: claude-sonnet-4-5-20250929
---

# Plan Command

Create clear, actionable implementation plans through collaborative multi-agent discussion. Plans are refined through expert consensus, constructive disagreement, and cross-domain collaboration to ensure comprehensive coverage and high-quality implementation strategy.

## Workflow Integration

This command is **Step 2** of the implementation workflow:

1. Explore → 2. **Plan** → 3. Review → 4. Execute

### Recommended Workflow

**BEST PRACTICE: Use this command AFTER running `/explore` for optimal results**

1. First: `/explore <relevant area>` - Builds comprehensive context
2. Then: `/plan <task>` - Creates plan through collaborative refinement
3. Next: `/review-plan <plan-file>` - Review and validate the plan
4. Finally: `/execute-plan <plan-file>` - Executes the approved implementation

This four-step process ensures optimal understanding, planning, validation, and execution.

**Note for Claude Code**: When you have context-loader findings from a previous `/explore` command, automatically pass them to the planning process. The user doesn't need to specify any flags.

## Overview

This command takes a task description or existing plan and orchestrates a collaborative refinement process using 3-10 specialized agents selected based on the plan's context and requirements.

**Key Features:**

- **Intelligent Agent Selection**: Automatically identifies and selects 3-10 specialized agents based on plan context
- **True Collaboration**: Agents engage in multi-round discussions, building on each other's feedback
- **Constructive Disagreement**: Agents respectfully challenge ideas and propose alternatives
- **Consensus Building**: Multiple discussion rounds lead to a refined, consensus-based final plan
- **Expert Emulation**: Mimics how human experts would collaboratively refine a plan
- **Context Integration**: Leverages findings from `/explore` command automatically

## Inputs

Accept natural language description or file path to existing plan:

**Description-based:**

```
/plan add user authentication with JWT tokens
/plan implement real-time notifications using WebSockets
/plan migrate monolith to microservices
/plan implement real-time collaborative editing with CRDT
/plan optimize database queries for the user dashboard
```

**File-based (for refining existing plans):**

```
/plan /tmp/plans/plan-20250821-a4b3c2.md
/plan plans/user-auth-implementation.md
```

Extract:

- `plan_input`: Either file path or description
- `is_file`: Boolean indicating if input is a file path
- `plan_content`: The actual plan content (read from file or use description directly)
- `scope`: Any specific scope or boundaries mentioned
- `constraints`: Any explicit constraints or requirements
- `context_findings`: Automatically include context-loader findings from `/explore` if available

Examples:

**Simple Bug Fixes:**

- `/plan fix the memory leak in the image processing module`
- `/plan resolve race condition in checkout process`
- `/plan fix broken unit tests in auth module`

**Feature Implementation:**

- `/plan add user authentication with JWT tokens`
- `/plan implement real-time notifications using WebSockets`
- `/plan add dark mode toggle to settings`
- `/plan implement search functionality with elasticsearch`

**Refactoring & Optimization:**

- `/plan refactor the data pipeline to use async/await`
- `/plan optimize database queries for user dashboard`
- `/plan migrate from callbacks to promises in legacy code`

**Complex Architectural Planning:**

- `/plan migrate monolith to microservices architecture for the e-commerce platform`
- `/plan implement event-driven order processing system with Kafka`
- `/plan design domain-driven architecture for healthcare management system`
- `/plan implement real-time collaborative editing with conflict resolution`

## Task

Execute a structured collaborative refinement process:

### Phase 1: Context Understanding & Agent Selection

1. **Analyze Plan Context**

   - If file provided, read and analyze the plan document
   - If description provided, understand the high-level goals and requirements
   - Leverage any context-loader findings from `/explore` if available
   - Identify key technical domains (e.g., frontend, backend, database, security, performance)
   - Identify complexity factors (e.g., distributed systems, real-time features, data migration)
   - Identify architectural concerns (e.g., scalability, reliability, maintainability)

2. **Select Specialized Agents** (3-10 agents)

   Query available agents and select based on:

   - **Domain Relevance**: Match agent capabilities to technical domains in the plan
   - **Perspective Diversity**: Include different viewpoints (architecture, security, performance, testing, DevOps, etc.)
   - **Complexity Alignment**: More complex plans warrant more agents

   **Selection Guidelines:**

   - **Simple plans** (bug fixes, minor features): 3-4 agents
   - **Medium plans** (features, refactors): 5-7 agents
   - **Complex plans** (architecture changes, major features): 8-10 agents

   **Example Agent Combinations:**

   _For "migrate monolith to microservices":_

   - backend-architect (system design)
   - cloud-architect (infrastructure)
   - database-optimizer (data architecture)
   - performance-engineer (scalability)
   - devops-troubleshooter (deployment)
   - security-auditor (service boundaries)

   _For "implement real-time collaborative editing":_

   - frontend-developer (UI/state management)
   - backend-architect (API design)
   - performance-engineer (optimization)
   - database-optimizer (conflict resolution)
   - security-auditor (data integrity)

3. **Brief Each Agent**
   - Provide full plan content/description to each selected agent
   - Include context-loader findings from `/explore` if available
   - Request each agent to analyze from their specialized perspective
   - Ask agents to prepare initial feedback focusing on their domain

### Phase 2: Multi-Round Collaborative Discussion

**Round 1: Initial Perspectives**

1. Invoke each agent in parallel with the plan and ask for:

   - Initial assessment from their specialized perspective
   - Key concerns or risks they identify
   - Suggestions for improvement in their domain
   - Questions for other specialists

2. Synthesize all initial feedback into a structured summary

**Round 2: Cross-Domain Discussion**

1. Share Round 1 feedback with all agents
2. Invoke agents again (in parallel or sequentially based on dependencies) asking them to:

   - Respond to feedback from other agents
   - Identify areas of agreement and disagreement
   - Propose solutions to concerns raised by others
   - Refine their own recommendations based on peer input
   - Respectfully challenge ideas when they see potential issues

3. Look for:
   - **Consensus areas**: Where agents agree
   - **Disagreements**: Where agents have conflicting views
   - **Gaps**: Issues not yet addressed by any agent
   - **Synergies**: How different agents' suggestions complement each other

**Round 3: Consensus Building** (if needed)

If significant disagreements remain:

1. Identify the key points of contention
2. Invoke specific agents involved in disagreements
3. Ask them to:
   - Find middle ground or propose compromises
   - Evaluate trade-offs explicitly
   - Consider the full system perspective beyond their domain
4. Work toward resolution of major conflicts

### Phase 3: Final Plan Synthesis

1. **Integrate Feedback**

   - Compile all agent feedback across rounds
   - Identify consensus recommendations
   - Document remaining trade-offs and decisions needed
   - Organize feedback by category (architecture, implementation, testing, deployment, etc.)

2. **Generate Final Plan**

   Create a comprehensive implementation plan that includes:

   1. **Overview** - High-level summary of the proposed changes and approach
   2. **Scope** - What will and won't be implemented
   3. **Current State** - Relevant architecture, files, and patterns
   4. **API Design** (optional) - Function signatures, data structures, and algorithms when creating/modifying interfaces
   5. **Implementation Steps** - Clear, sequential steps (typically 5-7 for medium tasks)
   6. **Files Summary** - Files to be created or modified
   7. **Critical Challenges** (optional) - Blocking or high-risk issues with mitigation strategies
   8. **Agent Collaboration Summary**:
      - List of agents involved and their focus areas
      - Key consensus recommendations by category
      - Design decisions and trade-offs
      - Open questions requiring human decision
      - Dissenting opinions (important disagreements with rationale)

3. **Output Format**
   - Write plan to markdown file: `./.claude-output/plan-[timestamp]-[hash].md`
   - Include conversation transcript (summarized) showing agent discussions
   - Highlight areas of strong consensus vs. areas needing human judgment

**What Plans Omit:**

- Testing strategies (handled during execution)
- Detailed dependency graphs (execution handles orchestration)
- Agent assignments (orchestrator assigns automatically)
- Success criteria checklists (implementer validates)
- Risk matrices (only critical risks documented)

## Complexity-Based Planning

The planner automatically adapts its output based on task complexity:

### Simple Tasks (Bug fixes, minor features)

- **Length**: ~100-200 lines
- **Agents**: 3-4 specialized agents
- **Rounds**: 1-2 discussion rounds
- Focused scope and 3-5 implementation steps
- Minimal challenges section
- Optional API design section (often skipped)

### Medium Tasks (Features, refactors)

- **Length**: ~200-400 lines
- **Agents**: 5-7 specialized agents
- **Rounds**: 2-3 discussion rounds
- Clear scope with included/excluded items
- 5-7 implementation steps
- API design when creating new interfaces
- Critical challenges documented

### Complex Tasks (Major features, architectural changes)

- **Length**: ~400-600 lines
- **Agents**: 8-10 specialized agents
- **Rounds**: 2-3 discussion rounds
- Detailed scope and architectural context
- 7-10 implementation steps
- Comprehensive API design section
- Multiple critical challenges with mitigations

## Agent Discussion Guidelines

To emulate realistic expert collaboration:

### Encourage Agents To

- **Be Direct**: State opinions clearly without over-hedging
- **Challenge Constructively**: Disagree when they see issues, but propose alternatives
- **Build On Ideas**: Reference and expand on other agents' suggestions
- **Ask Questions**: Seek clarification from other agents
- **Change Positions**: Update views when presented with good arguments
- **Acknowledge Limits**: Recognize when an issue is outside their expertise

### Discussion Prompts

- "Agent X raised concerns about [Y]. What's your perspective on this?"
- "How would your domain be affected by Agent X's suggestion to [Y]?"
- "Agent X and Agent Y disagree about [Z]. Can you provide a third perspective?"
- "Are there any trade-offs in Agent X's proposal that we haven't considered?"

### Realistic Disagreement Examples

- Security agent wants encryption everywhere; Performance agent warns of latency impact
- Backend architect prefers microservices; DevOps engineer concerned about operational complexity
- Frontend developer wants rich interactivity; Performance engineer pushes for progressive enhancement

## Output

Return a structured summary and file path:

```markdown
## Implementation Plan Complete

**Plan File**: [./.claude-output/plan-20250821-a4b3c2.md](link)

**Participants**: [N agents]

- [agent-1]: [focus area]
- [agent-2]: [focus area]
  ...

**Discussion Rounds**: [2-3]

**Key Outcomes**:

- [Consensus item 1]
- [Consensus item 2]
- [Trade-off decision 1]

**Open Questions**: [N]

- [Question requiring human decision]

**Summary**:
[2-3 sentences summarizing the collaborative planning process and key implementation strategy]

**Next Steps**:

- Review the plan document using `/review-plan <plan-file>`
- Address any open questions before proceeding
- Execute with `/execute-plan <plan-file>` when ready
```

## Implementation Notes

### Agent Orchestration

- Use Task tool to invoke agents
- Run agents in parallel when gathering independent perspectives
- Run sequentially when one agent needs to respond to another's specific feedback
- Limit to 3 discussion rounds maximum to avoid diminishing returns

### Context Management

- Keep agent prompts focused on their domain while providing full plan context
- In later rounds, provide relevant excerpts from other agents' feedback
- Summarize previous rounds to keep context manageable
- Automatically include context-loader findings from `/explore` when available

### Handling Edge Cases

- **No consensus reached**: Document the disagreement and provide trade-off analysis
- **Too many agents selected**: Prioritize and cap at 10 most relevant agents
- **Agent unavailable**: Select next best alternative or proceed with available agents
- **Circular disagreements**: Invoke a meta-level agent (e.g., architect-reviewer) to arbitrate

### File Management

- Create a `./.claude-output` directory if it doesn't exist
- Use descriptive filenames with timestamps and content hash
- Include conversation metadata (agents used, rounds completed, timestamp)

## Integration with Other Commands

### Recommended Workflow

1. **Complete Flow**: `/explore` → `/plan` → `/review-plan` → `/execute-plan`

   - Best for medium to complex tasks
   - Exploration context automatically flows to planner
   - Collaborative refinement ensures comprehensive coverage
   - Review validates the plan before execution

2. **Quick Planning**: `/plan` → `/execute-plan`

   - Suitable for simple, well-understood tasks
   - Skip review step when plan is straightforward
   - Still benefits from multi-agent collaboration

3. **With Review**: `/plan` → `/review-plan` → `/execute-plan`
   - Skip exploration for simple tasks in familiar code
   - Add review for validation and improvement suggestions
   - Multi-agent discussion ensures quality

### How Execution Works

- **`/execute-plan`** reads the plan file and orchestrates implementation
- Agent orchestrator automatically assigns specialized agents to tasks
- Testing is handled during execution (not part of planning)
- Dependencies and parallel execution are managed by the orchestrator

## Example Session

**Input:**

```
/plan implement real-time collaborative editing with CRDTs
```

**Process:**

1. Analyzes the task and identifies it as a complex feature
2. Selects 6 agents: frontend-developer, backend-architect, database-optimizer, performance-engineer, security-auditor, test-automator
3. Round 1: Each agent provides initial assessment
   - Frontend: Concerns about conflict UI/UX
   - Backend: Suggests operational transform vs CRDT comparison
   - Database: Warns about storage overhead for history
   - Performance: Highlights network bandwidth considerations
   - Security: Questions access control in real-time sync
   - Testing: Notes complexity of testing concurrent edits
4. Round 2: Cross-pollination
   - Backend responds to performance's bandwidth concerns with compression strategy
   - Security and Frontend discuss access control UX
   - Database and Performance agree on hybrid approach for history retention
5. Round 3: Final consensus
   - Agree on CRDT with compression
   - Consensus on 30-day history retention
   - Security and Frontend align on access control approach
   - Testing strategy defined for concurrent scenarios

**Output:**
Comprehensive implementation plan with consensus recommendations, remaining trade-offs, and implementation roadmap informed by multi-domain expert discussion.

## Best Practices

### For Simple Plans

- Limit to 3-4 agents
- 1-2 discussion rounds sufficient
- Focus on quick validation and obvious improvements

### For Complex Plans

- Use 7-10 agents for comprehensive coverage
- Allow 2-3 discussion rounds for thorough exploration
- Document dissenting views even if consensus reached
- Highlight areas needing human architectural decisions

### Quality Indicators

- **Good collaboration**: Multiple agents reference each other's feedback
- **Productive disagreement**: Conflicting views backed by clear rationale
- **Convergence**: Later rounds show narrowing of options and growing consensus
- **Actionable output**: Recommendations are specific and implementable

### Avoiding Common Pitfalls

- **Don't** force consensus on genuinely ambiguous trade-offs
- **Don't** let one agent dominate the discussion
- **Don't** run endless rounds hoping for perfect agreement
- **Do** document when human judgment is needed
- **Do** preserve valuable dissenting opinions
- **Do** prioritize practical over theoretical perfection
