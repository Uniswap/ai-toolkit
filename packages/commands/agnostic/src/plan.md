---
description: Create a comprehensive implementation plan with hierarchical task decomposition, agent orchestration, and risk assessment for any task, feature, refactor, or architectural change
argument-hint: <task/feature description>
allowed-tools: Read(*), Glob(*), Grep(*), LS(*), WebSearch(*), WebFetch(*), Write(*.md), MultiEdit(*.md), Bash(git ls-files:*), agent-orchestrator, code-explainer, test-writer, documentation-agent
---

# Plan Command

Create a comprehensive implementation plan with hierarchical task decomposition, intelligent agent assignment, and risk assessment for any development task - from simple bug fixes to complex architectural changes.

## Recommended Workflow

**BEST PRACTICE: Use this command AFTER running `/understand-area` for optimal results**

1. First: `/understand-area <relevant area>` - Builds comprehensive context
2. Then: `/plan <task>` - Creates plan using that context automatically

This two-step process ensures the planner has deep understanding before creating the implementation plan.

**Note for Claude Code**: When you have context-loader findings from a previous `/understand-area` command, automatically pass them to the planner agent. The user doesn't need to specify any flags.

## Inputs

Accept natural language description and extract:

- `task`: The full description of what needs to be implemented/fixed/refactored
- `scope`: Any specific scope or boundaries mentioned
- `constraints`: Any explicit constraints or requirements
- `context_findings`: Automatically include context-loader findings from `/understand-area` if available
- `complexity`: Optional complexity hint (simple|medium|complex|epic) - auto-detected if not specified
- `timeline`: Optional timeline constraints
- `team_size`: Optional team size for parallel execution planning

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

**With Resource Constraints:**

- `/plan optimize database queries with 2-week deadline and $5k budget`
- `/plan implement CI/CD pipeline requiring DevOps expertise`
- `/plan build multi-tenant SaaS architecture with AWS infrastructure`

## Task

Generate a comprehensive implementation plan using enhanced orchestrator capabilities:

### Core Planning Capabilities

1. **Context Integration**
   - Leverage any context-loader findings if available
   - Analyze the current codebase state and architecture
   - Map existing patterns, conventions, and constraints
2. **Hierarchical Task Decomposition**

   Break down tasks into three levels of granularity:

   **Epic Level** (Complex/Epic tasks only)

   - High-level feature groupings
   - Major architectural decisions
   - Cross-team dependencies

   **Story Level** (Medium-Epic complexity)

   - User-facing functionality
   - Testable deliverables
   - 1-3 day implementation chunks

   **Subtask Level** (All complexities)

   - Atomic, single-responsibility tasks
   - 2-8 hour implementation units
   - Clear acceptance criteria
   - Specific agent assignments

3. **Dependency Analysis**

   - Create task dependency graphs showing execution order
   - Identify technical dependencies (APIs, databases, services)
   - Map code dependencies and impact analysis
   - Determine optimal implementation sequence
   - Highlight blocking dependencies and critical paths

4. **Architectural Planning**

   - Support multiple architectural patterns:
     - Microservices architecture with service boundaries
     - Event-driven architecture with event flows
     - Domain-driven design with bounded contexts
     - Layered architecture with clear separation
   - Generate Architectural Decision Records (ADRs)
   - Plan for scalability and maintainability

5. **Resource Estimation**

   - Time estimates for each task phase (development, testing, review)
   - Required expertise and skills per component
   - Infrastructure requirements and scaling needs
   - Cost implications for cloud resources or third-party services
   - Team capacity and parallel work streams

6. **Risk Assessment & Mitigation**

   Comprehensive risk analysis covering:

   - **Technical Risks**: Architecture, scalability, performance
   - **Dependency Risks**: Third-party services, library updates
   - **Security Risks**: Vulnerabilities, data protection
   - **Compatibility Risks**: Breaking changes, deprecations
   - **Timeline Risks**: Estimation accuracy, resource availability

   For each risk, provide:

   - Probability (low|medium|high)
   - Impact (low|medium|high|critical)
   - Mitigation strategy
   - Contingency plan
   - Responsible agent/team

7. **Agent Assignment & Orchestration**

   Intelligent agent allocation for each task:

   - **Primary Agent**: Best-suited agent based on capability matching
   - **Support Agents**: Secondary agents for specialized subtasks
   - **Team Composition**: Agent teams for complex parallel work
   - **Execution Strategy**: Parallel vs sequential execution paths

   Agent capability mapping:

   - `code-writer`: Implementation tasks, refactoring
   - `test-writer`: Test creation, coverage analysis
   - `documentation-agent`: API docs, user guides
   - `code-reviewer`: Architecture review, security audit
   - `bug-fixer`: Error handling, edge cases
   - `performance-optimizer`: Optimization tasks
   - `security-auditor`: Security review and hardening

## Context Integration

**Claude Code**: When you have findings from a previous `/understand-area` command, automatically extract and pass:

- Key components and their responsibilities
- Existing patterns and conventions
- Dependencies and integration points
- Known gotchas and edge cases
- Testing approaches in use

## Delegation

Invoke **enhanced planner agent** with orchestrator integration:

### Required Parameters

- `task`: The complete task description
- `planning_mode`: Architecture type (standard|microservices|event-driven|domain-driven)
- `orchestration_strategy`: Execution approach (sequential|parallel|hybrid|meta-agent)

### Optional Parameters

- `scope`: Extracted scope/boundaries
- `constraints`: Any specific constraints or requirements
- `context_findings`: Structured findings from context-loader if available:
  - `key_components`: Core files and responsibilities
  - `patterns`: Conventions to follow
  - `dependencies`: External integrations
  - `gotchas`: Known issues/edge cases
  - `testing_approach`: Current testing patterns

### Enhanced Planning Features

- `dependency_analysis`: Enable full dependency graph generation (default: true)
- `resource_estimation`: Include time/cost/skill estimates (default: true)
- `risk_assessment`: Perform risk analysis (default: true)
- `adr_generation`: Create architectural decision records (default: auto)
- `parallelization_analysis`: Identify parallel execution opportunities (default: true)
- `meta_agent_coordination`: Enable meta-agent task distribution (default: auto)

## Output

Return the enhanced plan summary with orchestrator integration:

### Core Output

- `plan_file_path`: Absolute path to the generated markdown plan file
- `summary`: Executive summary of the implementation plan
- `task_analyzed`: Original task that was analyzed
- `context_used`: Whether context-loader findings were leveraged

### Enhanced Output Structure

- `task_hierarchy`: Hierarchical breakdown with epic/story/subtask levels
- `dependency_graph`: Visual or structured representation of dependencies
- `execution_strategy`: Recommended execution approach (parallel/sequential/hybrid)
- `architectural_decisions`: Key architectural choices and ADRs if generated
- `resource_estimates`:
  - `total_time`: Estimated total implementation time
  - `parallel_time`: Time with optimal parallelization
  - `required_skills`: List of expertise areas needed
  - `infrastructure_needs`: Required services and resources
  - `effort_distribution`: T-shirt sizes (XS, S, M, L, XL) or story points
- `risk_matrix`: Comprehensive risk assessment with mitigation strategies
- `agent_orchestration`:
  - `team_composition`: Recommended agent teams
  - `agent_assignments`: Task-to-agent mapping
  - `execution_phases`: Sequential and parallel execution paths
  - `checkpoints`: Synchronization points for quality gates
- `implementation_files`: Files to be created/modified with rationale
- `quality_assurance`: Test strategy and review checkpoints

### Plan File Contents

The generated markdown file includes:

1. **Executive Summary** - High-level overview, complexity assessment, and timeline
2. **Architecture Overview** - Architectural patterns and decisions
3. **Hierarchical Task Structure** - Epic/Story/Subtask breakdown with:
   - Task IDs and descriptions
   - Effort estimates (T-shirt sizes or story points)
   - Priority levels (Critical/High/Medium/Low)
   - Agent assignments
   - Acceptance criteria
4. **Dependency Graph** - Visual representation of task relationships and critical path
5. **Agent Orchestration Plan** - Team composition and execution strategy:
   - Parallel execution tracks
   - Sequential dependencies
   - Synchronization checkpoints
   - Fallback strategies
6. **Implementation Phases** - Ordered phases with deliverables
7. **Resource Requirements** - Time, skills, and infrastructure
8. **Risk Matrix** - Categorized risks with probability, impact, and mitigation
9. **Files Impact Analysis** - Files to be created/modified with complexity assessment
10. **Quality Assurance Plan** - Test strategy and review checkpoints
11. **Success Criteria** - Definition of done for the implementation
12. **Next Steps** - Immediate actions to begin implementation
13. **Follow-up Enhancements** - Future improvements and optimizations

The detailed plan is written to the markdown file for use with `/review-plan`, execution with `/execute-plan`, or future reference.

## Complexity-Based Planning

The planner automatically adapts its output based on task complexity:

### Simple Tasks (Bug fixes, minor features)

- Single-level task breakdown
- Basic dependency mapping
- Single agent assignment
- Streamlined risk assessment
- 1-2 day timeline

### Medium Tasks (Features, refactors)

- Story and subtask levels
- Dependency graph with parallel opportunities
- Primary and support agent assignments
- Moderate risk analysis
- 3-7 day timeline

### Complex Tasks (Major features, integrations)

- Full story/subtask hierarchy
- Complex dependency analysis
- Team-based agent assignments
- Comprehensive risk matrix
- 1-3 week timeline

### Epic Tasks (Architecture changes, system redesigns)

- Complete epic/story/subtask hierarchy
- Multi-phase execution planning
- Multiple agent teams with orchestration
- Extensive risk assessment and mitigation
- 3+ week timeline with milestones

## Integration with Other Commands

### Workflow Integration

1. **Context Building**: `/understand-area` → `/plan` → `/review-plan`
2. **Execution**: `/plan` → `/execute-plan` (leverages orchestrator for parallel execution)
3. **Architecture**: `/plan` → `/document-architecture` (uses ADRs from plan)
4. **Team Coordination**: `/plan` → `/assign-tasks` (uses meta-agent assignments)

### Orchestrator Integration

The planner seamlessly integrates with the agent-orchestrator to:

- **Task Distribution**: Automatically assign tasks to best-suited agents
- **Parallel Execution**: Identify and coordinate concurrent work streams
- **Team Formation**: Create agent teams for complex features
- **Dependency Management**: Handle inter-task and inter-agent dependencies
- **Progress Tracking**: Monitor execution and adjust plans dynamically
- **Fallback Strategies**: Provide alternative approaches for blocked tasks
- **Quality Gates**: Define checkpoints for validation and review

### Architecture-Specific Modes

**Microservices Mode**: Generates service boundaries, API contracts, and deployment strategies
**Event-Driven Mode**: Maps event flows, defines event schemas, and plans event sourcing
**Domain-Driven Mode**: Creates bounded contexts, defines aggregates, and plans domain events
**Hybrid Mode**: Combines multiple architectural patterns based on requirements
