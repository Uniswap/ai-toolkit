# Agents Package - CLAUDE.md

## Package Overview

This package contains agnostic agent definitions for Claude Code. Agents are specialized submodules that perform specific analysis or implementation tasks when invoked by commands.

## Agent Architecture

**📚 For comprehensive architectural documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)**

The agent infrastructure implements a sophisticated hierarchical model:

- **Hierarchical Organization**: Four-tier system from orchestration to meta-learning
- **No Direct User Interaction**: Agents are invoked by commands, not users
- **Tool Permission Inheritance**: Agents use tools allowed by the invoking command
- **Structured Input/Output**: Clear contracts for data exchange
- **Specialized Capabilities**: Each agent excels at one specific task
- **Continuous Improvement**: Meta-agents optimize the system over time

## Available Agents

### Documentation & Context Management

- **claude-docs-initializer**: Discover repository structure and create initial CLAUDE.md documentation at all appropriate levels with batching and approval checkpoints
- **claude-docs-manager**: Analyze code changes and update all affected CLAUDE.md documentation files with verification workflow
- **claude-docs-fact-checker**: Verify CLAUDE.md documentation accuracy against actual codebase state to prevent hallucinations (NEW)
- **context-loader**: Advanced context management with summarization, checkpointing, and cross-agent sharing
- **doc-writer**: Advanced documentation specialist for API docs, architecture documentation, and README generation

### Core Specialist Agents

- **code-explainer**: Analyze and explain complex code with pattern recognition and security analysis
- **code-generator**: Comprehensive code generation specialist with tests and best practices
- **debug-assistant**: Advanced debugging with root cause analysis and fix validation
- **planner**: Create clear, actionable implementation plans (no code writing)
- **plan-reviewer**: Validate and improve existing plans
- **refactorer**: Advanced refactoring with architectural analysis and safe incremental strategies
- **researcher**: Comprehensive research including architectural patterns and technology comparison
- **security-analyzer**: Comprehensive security analysis for vulnerability assessment and threat modeling
- **performance-analyzer**: Comprehensive performance analysis with bottleneck identification and optimization strategies
- **style-enforcer**: Advanced multi-language style enforcement with pattern detection, automated fixes, and comprehensive reporting
- **test-writer**: Generate comprehensive tests with scenario generation and edge case identification
- **test-runner**: Automated agent testing specialist for behavior validation and regression detection
- **migration-assistant**: Migration specialist for version upgrades, compatibility checking, and rollback strategies

### Infrastructure & Deployment Agents

- **cicd-agent**: CI/CD pipeline specialist for automated deployment setup and workflow configuration
- **infrastructure-agent**: Infrastructure automation specialist for cloud architecture and scaling strategies

### Orchestration & Coordination

- **agent-orchestrator**: Master orchestrator with hierarchical task decomposition and meta-agent coordination
- **agent-capability-analyst**: Advanced capability analysis with semantic matching and team composition recommendations
- **claude-agent-discovery**: Discovers and catalogs all available agents from Claude Code directories

### Meta-Agents (Self-Improvement)

- **agent-optimizer**: Analyzes and optimizes agent performance through systematic refinement strategies
- **prompt-engineer**: Expert in analyzing and optimizing prompts for maximum clarity and efficiency
- **pattern-learner**: Extracts reusable patterns and provides recommendations for pattern application
- **feedback-collector**: Comprehensive feedback gathering and transformation into actionable insights

## Agent Structure

All agents follow this pattern:

```yaml
---
name: agent-name
description: Specialized purpose
---

# Agent Name

## Mission
[Agent's specialized purpose and constraints]

## Inputs
[Expected parameter format]

## Process/Output
[Methodology and return format]

## Guidelines
[Important constraints and principles]
```

## Context-Aware Agents

### Enhanced Context-Loader Capabilities

The **context-loader** agent now serves as a sophisticated context management system with:

1. **Advanced Context Management**:

   - Hierarchical summarization (file → module → system levels)
   - Relevance scoring (0-100) for different contexts
   - Semantic compression while preserving essential information
   - Executive summaries for large codebases
   - Key insight extraction from complex systems

2. **Checkpoint Management**:

   - Versioned context snapshots with semantic versioning
   - Incremental context updates and delta generation
   - Context diff generation between checkpoints
   - Checkpoint restoration mechanisms
   - Complete context history tracking

3. **Cross-Agent Context Sharing**:

   - Standardized JSON-LD exchange format
   - Context inheritance patterns
   - Partial context extraction for targeted sharing
   - Intelligent context merging strategies
   - Cross-agent synchronization protocols

4. **Intelligent Pruning**:
   - Relevance-based pruning with scoring
   - Time-based expiration with TTL settings
   - Size optimization for token/memory limits
   - Importance scoring to preserve high-value context
   - Adaptive context windowing based on task needs

### Planner Agent Integration

The **planner** agent leverages **context-loader's** enhanced capabilities:

1. **Context-loader** provides multi-level understanding:

   - Hierarchical summaries at appropriate detail levels
   - Relevance-scored components and patterns
   - Compressed context packages optimized for planning
   - Historical context from checkpoints
   - Risk assessments and gotchas with severity ratings

2. **Planner** uses enriched context to create concise, actionable plans:
   - Leverages context to understand existing patterns
   - Uses compressed summaries for efficient analysis
   - Accounts for gotchas and edge cases from context
   - Creates clear implementation steps (typically 5-7 for medium tasks)
   - Focuses on strategic direction, not exhaustive documentation

### Inter-Agent Context Flow

The enhanced context-loader enables sophisticated agent coordination:

```yaml
context_flow:
  context-loader:
    outputs: [compressed_context, checkpoints, summaries]
    shares_with: [planner, code-writer, test-writer]

  planner:
    receives: [compressed_context, summaries]
    outputs: [implementation_plan]
    shares_with: [code-writer, test-writer]

  code-writer:
    receives: [context, plan]
    outputs: [implementation]
    shares_with: [test-writer, doc-writer]
```

This sophisticated context management ensures all agents work with consistent, optimized, and relevant information.

## Key Design Principles

1. **Single Responsibility**: Each agent has one clear purpose
2. **No Code in Analysis Agents**: Reconnaissance agents don't write code
3. **Structured Data Exchange**: Clear input/output contracts
4. **Tool Permission Inheritance**: Agents don't define their own tools
5. **Deep Thinking, Concise Output**: Agents like planner think thoroughly but communicate concisely

## Guidelines for Agents

### Analysis Agents (context-loader, code-explainer, researcher)

- Focus on understanding and explaining
- Return structured findings
- NO CODE WRITING principle

### Implementation Agents (refactorer, test-writer)

- Create specific code changes
- Follow existing patterns
- Return executable patches or code

### Planning Agents (planner)

- Think deeply, communicate concisely
- No unnecessary features or extras
- Context-aware when findings provided
- Focus on strategic direction (not exhaustive documentation)
- Target: 200-400 lines for medium tasks

## Context Template System

### Standardized Context Format

The package now includes a comprehensive **context template** (`templates/context-template.md`) that provides:

1. **JSON-LD Structure**: Semantic representation with standardized vocabularies
2. **Context Type Classification**: Code, business, technical, execution, and historical contexts
3. **Metadata Tracking**: Creation timestamps, authorship, relevance scores, usage statistics
4. **Storage Configuration**: Compression, backend selection, encryption, size management
5. **Expiration Strategies**: TTL, access-based, size-based, and priority-based retention
6. **Relationship Management**: Parent/child hierarchies and cross-references
7. **Extension Points**: Custom fields and plugin integration

### Context Categories

The template supports five primary context types:

- **Code Context**: Files, modules, dependencies, patterns, conventions
- **Business Context**: Requirements, constraints, goals, stakeholders
- **Technical Context**: Architecture, technologies, patterns, decisions
- **Execution Context**: Runtime state, performance metrics, sessions
- **Historical Context**: Past decisions, changes, experiments, incidents

### Agent Integration

All agents can now use the standardized context template for:

- **Consistent Data Exchange**: Uniform format across all agents
- **Context Versioning**: Track context evolution and changes
- **Intelligent Storage**: Compression and expiration management
- **Relationship Tracking**: Context hierarchies and dependencies
- **Extensibility**: Custom fields for specialized agent needs

## Enhanced Style-Enforcer Capabilities

### Advanced Multi-Language Style Enforcement

The **style-enforcer** agent has been significantly enhanced with comprehensive capabilities:

1. **Multi-Language Support**:

   - Language-specific analysis for JavaScript/TypeScript, Python, Go, Rust, Java, C#, PHP, Ruby, Swift, Kotlin
   - Framework-specific conventions (React, Vue, Angular, Django, Flask, Spring, Express, Next.js, etc.)
   - Automatic language and framework detection from codebase patterns
   - Company/project-specific style rule support

2. **Advanced Pattern Detection**:

   - **Code Smell Identification**: Long methods, large classes, feature envy, duplicate code analysis
   - **Anti-Pattern Detection**: God objects, spaghetti code, copy-paste programming, magic numbers, dead code, shotgun surgery
   - **Design Pattern Validation**: Proper singleton, factory, observer, strategy, decorator pattern implementation
   - **Complexity Metrics**: Cyclomatic and cognitive complexity analysis with refactoring suggestions
   - **Naming Convention Enforcement**: Variables, functions, classes, files with language-specific rules

3. **Automated Fix Generation**:

   - **Safe Fix Categories**: Formatting, import organization, naming fixes, simple refactoring
   - **Progressive Fix Suggestions**: Three-level approach from simple formatting to complex structural improvements
   - **Context-Aware Refactoring**: Extract method/class, inline variables, rename methods, move methods
   - **Batch Fix Application**: Dependency-sorted fixes with rollback capability and risk assessment
   - **Fix Confidence Scoring**: High/medium/low confidence levels with effort estimation

4. **Style Guide Management**:

   - **Config File Integration**: ESLint, Prettier, TSLint, EditorConfig parsing and enforcement
   - **Custom Rule Creation**: YAML-based rule definition with complexity and pattern constraints
   - **Style Guide Versioning**: Track changes over time with migration strategies
   - **Team-Specific Overrides**: Allow project-specific customizations while maintaining consistency

5. **Comprehensive Reporting and Analytics**:

   - **Style Compliance Dashboard**: Overall scores with category breakdowns and trend analysis
   - **Style Debt Tracking**: Weighted violation scoring, hotspot analysis, regression detection
   - **Team Metrics**: Developer compliance scores, code review impact analysis
   - **Progress Tracking**: Violations resolved over time with measurable improvements

6. **Integration Capabilities**:
   - **Pre-commit Hook Generation**: Automated staged file checking with safe fix application
   - **CI/CD Pipeline Integration**: GitHub Actions, Jenkins, and other CI systems support
   - **IDE Integration**: VS Code, IntelliJ, and other editor configuration generation
   - **Git Blame-Aware Enforcement**: Skip old code, focus on recent changes, gradual improvement strategies

### Usage Scenarios

The enhanced style-enforcer supports various usage patterns:

- **Basic Analysis**: Simple style checking with language/framework detection
- **Advanced Analysis**: Full pattern detection with automated fix generation
- **Team Integration**: Dashboard generation, metrics tracking, and notification systems
- **Progressive Adoption**: Gradual rule introduction with warning-to-error progression

## Documentation Agents Enhancement

### Fact-Checking System

The **claude-docs-fact-checker** agent provides comprehensive verification of CLAUDE.md documentation to prevent hallucinations and ensure accuracy:

#### Verification Capabilities

1. **Filesystem Verification**:

   - Verify directory structures exist as documented
   - Validate file references point to real files
   - Check path accuracy and naming conventions
   - Use git ls-files for fast, accurate verification

2. **Technology Stack Validation**:

   - Check technology stack claims against package.json dependencies
   - Detect references to non-existent frameworks/languages
   - Verify version information when specified
   - Handle monorepo structures with multiple package.json files

3. **Code Pattern Verification**:

   - Verify claimed architectural patterns exist (MVC, layered, etc.)
   - Check for design pattern implementations (singleton, factory, etc.)
   - Validate component organization patterns (atomic design, feature-based)
   - Search codebase for pattern evidence using grep and file structure

4. **Accuracy Scoring**:

   - Per-section accuracy scores (0-100)
   - Overall document accuracy with weighted scoring
   - Severity-based scoring (critical, high, medium, low issues)
   - Verification pass/fail status (fails at <70% accuracy or critical issues)

5. **Detailed Reporting**:
   - Specific inaccuracies with evidence and corrections
   - Section-by-section breakdown
   - Human-readable summary with key issues highlighted
   - Line numbers for each inaccuracy when available

### Batching and Approval Workflow

**claude-docs-initializer** now creates documentation in manageable batches with approval checkpoints:

#### Batching Strategy

- **Batch Size**: 1-2 files per batch to enable thorough review
- **Logical Grouping**: Related files batched together (e.g., core packages)
- **Prioritization**: Critical documentation first (root, then packages, then modules)
- **Progress Tracking**: Clear indication of batch number, total batches, and progress

#### Approval Workflow

```
1. Discovery Phase: Analyze repository structure
2. Batch Planning: Group documentation targets into logical batches
3. For Each Batch:
   a. Generate documentation content
   b. Apply pre-generation verification
   c. Return content with requires_verification flag
   d. Main agent invokes fact-checker automatically
   e. Present batch with verification results to user
   f. User approves/rejects/skips/edits
   g. Write files if approved
   h. Move to next batch
4. Completion: Summary of all batches created
```

#### Benefits

- **Manageable Reviews**: Small batches prevent overwhelming PRs
- **Quality Control**: Verification before writing ensures accuracy
- **Flexibility**: Skip problematic batches without stopping entire process
- **Transparency**: Clear progress and preview of upcoming work

### Pre-Generation Verification

Both **claude-docs-initializer** and **claude-docs-manager** now implement pre-generation verification to prevent hallucinations at the source:

#### Verification Before Content Generation

**For claude-docs-initializer**:

1. Verify directory exists before documenting
2. Get actual directory listing (via git ls-files or ls)
3. Parse actual package.json if present
4. Count actual source files
5. Detect actual patterns in codebase
6. Store verified facts
7. Generate content ONLY from verified facts

**For claude-docs-manager**:

1. Verify all changed file paths exist
2. Read actual file contents for accurate description
3. Verify package boundaries with package.json
4. Confirm technology stack from dependencies
5. Store verified change facts
6. Generate updates ONLY from verified facts

#### Example: Preventing Hallucinations

```yaml
# WITHOUT pre-generation verification:
# ❌ "The src/pages directory uses Next.js routing"
# ❌ "Built with React 19 and Next.js 15"
# ❌ "Implements microservices architecture"

# WITH pre-generation verification:
verified_facts:
  actualFiles: ['app/layout.tsx', 'app/page.tsx']
  dependencies: { 'react': '^18.2.0', 'next': '^14.0.0' }
  detectedPatterns: ['app-router', 'server-components']
# ✅ "The app directory uses Next.js 14 App Router"
# ✅ "Built with React 18 and Next.js 14"
# ✅ "Uses Next.js App Router with Server Components"
```

### Integration Pattern

The fact-checker uses the **proactive agent pattern** where the main Claude Code agent automatically orchestrates verification:

#### Workflow Orchestrated by Main Agent

```
1. User requests documentation update/creation
2. Main Claude Code agent invokes appropriate doc agent
   (claude-docs-manager or claude-docs-initializer)
3. Doc agent:
   - Applies pre-generation verification
   - Generates content based on verified facts
   - Returns structured output with requires_verification: true
4. Main agent sees requires_verification flag
5. Main agent reads fact-checker's proactive description
6. Main agent automatically invokes fact-checker with generated content
7. Fact-checker verifies accuracy and returns findings
8. Main agent presents combined results:
   - Generated documentation content
   - Verification status and accuracy score
   - List of inaccuracies found with severity levels
   - Recommendation (approve/reject/edit)
9. User reviews and approves/rejects
10. If approved, main agent writes files
11. If rejected, main agent may regenerate or ask for guidance
```

#### Key Features

- **Automatic Invocation**: Main agent triggers fact-checker without manual request
- **Two-Layer Verification**: Pre-generation verification + post-generation fact-checking
- **No Direct Agent-to-Agent Calls**: Main agent coordinates all interactions
- **Structured Output**: Clear contracts between agents and main agent
- **User Control**: Final approval always requires human decision

### Output Format Changes

Both documentation agents now return enhanced output:

#### New Output Fields

```yaml
requires_verification: true  # Signals main agent to invoke fact-checker
files:
  - path: string
    content: string  # Full content (not written yet)
    action: "pending_verification"  # Status indicator
    operation: "updated" | "created"
```

#### Batching Output (claude-docs-initializer)

```yaml
phase: "planning" | "batch_execution" | "batch_completed" | "completed"
current_batch:
  batch_number: number
  total_batches: number
  files: [{path, content, type, summary}]
progress:
  batches_completed: number
  batches_remaining: number
  files_created_so_far: number
```

## Recent Changes

### Claude-Docs Hallucination Prevention System (Latest - 2025-10-22)

**Major enhancement to eliminate hallucinations in CLAUDE.md documentation generation:**

- **New claude-docs-fact-checker agent**: Comprehensive verification system

  - Filesystem verification (directories, files, paths)
  - Technology stack validation against package.json
  - Code pattern verification (grep-based evidence)
  - Accuracy scoring (0-100 per section and overall)
  - Severity-based issue reporting (critical, high, medium, low)
  - Detailed inaccuracy reports with evidence and corrections
  - Proactive agent pattern for automatic invocation

- **Enhanced claude-docs-initializer**: Batching with approval workflow

  - Creates documentation in small batches (1-2 files per batch)
  - Human approval checkpoints between batches
  - Pre-generation verification before content creation
  - Batch planning phase with prioritization
  - Progress tracking and next batch previews
  - Updated output format with `requires_verification` flag
  - Three-phase operation: planning, batch execution, completion

- **Enhanced claude-docs-manager**: Verification workflow integration

  - Pre-generation verification of changed files
  - Reads actual file contents to verify claims
  - Updated output format with `requires_verification` flag
  - Returns generated content without writing (awaits verification)
  - Content based only on verified facts from filesystem

- **Integration Pattern**: Main agent orchestration

  - Doc agents generate content with `requires_verification: true`
  - Main Claude Code agent automatically invokes fact-checker
  - Combined results presented to user (docs + verification)
  - User approves/rejects based on accuracy scores
  - Files written only after approval
  - Two-layer verification: pre-generation + post-generation

- **Hallucination Prevention**:
  - Pre-generation verification checks filesystem before writing
  - Post-generation fact-checking verifies all claims
  - Evidence-based reporting for all inaccuracies
  - Content generated only from verified facts
  - Technology stack verified against actual dependencies
  - Patterns verified with grep and file structure analysis

### Claude-Docs System Implementation (Previous - 2025-10-15)

- **New claude-docs-initializer agent**: Comprehensive repository analysis and CLAUDE.md initialization

  - Deep repository discovery and analysis
  - Technology and pattern detection
  - Hierarchical documentation generation
  - Multi-level file creation with cross-reference management
  - Intelligent filtering for documentation targets

- **New claude-docs-manager agent**: Intelligent CLAUDE.md update management
  - Change-driven documentation updates
  - Documentation Proximity Principle implementation
  - Multi-level update propagation
  - Content scope enforcement based on hierarchy
  - Automatic detection of new CLAUDE.md requirements

### Architecture Documentation

- **Comprehensive documentation**: Added ARCHITECTURE.md with complete system documentation
- **Hierarchical model explained**: Four-tier agent organization from orchestration to meta-learning
- **Integration patterns**: Documented how commands, agents, and meta-agents work together
- **Advanced features**: Hierarchical task decomposition, risk assessment, pattern learning
- **Workflow examples**: Complex feature implementation, bug fixing with learning, architecture refactoring
- **Implementation guide**: Setup instructions, custom agent creation, best practices
- **Key decisions documented**: Why no universal "implement" command, specialization principles

### Style-Enforcer Enhancement

- **Major upgrade**: Transformed into comprehensive style enforcement system
- **Multi-language support**: Added 10 programming languages with framework-specific rules
- **Pattern detection**: Advanced code smell, anti-pattern, and design pattern validation
- **Automated fixes**: Progressive fix suggestions with safety levels and rollback capability
- **Style guide management**: Config file integration, custom rules, versioning, and team overrides
- **Reporting system**: Comprehensive analytics, debt tracking, and team metrics
- **Integration support**: Pre-commit hooks, CI/CD pipelines, IDE configs, and git-blame awareness
- **Safety mechanisms**: Fix confidence scoring, batch application, and risk assessment

### Context Template Implementation (Previously)

- **New template system**: Added comprehensive context-template.md
- **JSON-LD standardization**: Semantic context representation
- **Multi-type support**: Code, business, technical, execution, historical contexts
- **Advanced metadata**: Tracking, versioning, relationships, usage statistics
- **Storage optimization**: Compression, backends, encryption, size limits
- **Expiration management**: TTL, access-based, size-based retention strategies
- **Extension framework**: Custom fields and plugin integration points

### Context-Loader Enhancement

- **Major upgrade**: Transformed into advanced context management system
- **Hierarchical summarization**: Added file, module, and system-level summaries
- **Checkpoint system**: Implemented versioned snapshots with incremental updates
- **Cross-agent sharing**: Added JSON-LD standardized exchange format
- **Intelligent pruning**: Implemented relevance, time, and size-based optimization
- **Context scoring**: Added relevance scoring algorithm (0-100 scale)
- **Compression strategies**: Semantic deduplication and progressive summarization
- **Storage backends**: Support for filesystem, object storage, cache, and vector DB
- **Performance metrics**: Added tracking for compression ratios and efficiency

### Agent Infrastructure Refactor (Latest - 2025-08-30)

**Completed comprehensive agent infrastructure refactor with 40 implementation tasks:**

- **Enhanced Agent Orchestrator**: Updated with hierarchical task decomposition, parallel/sequential execution strategies, and meta-agent coordination
- **New Infrastructure Agents**: Added cicd-agent and infrastructure-agent for deployment and cloud automation
- **Enhanced Documentation Agent**: Upgraded doc-writer with API documentation, architecture documentation, README generation, and interactive examples
- **Migration Specialist**: Added migration-assistant for version upgrades, platform migrations, and rollback strategies
- **Test Infrastructure**: Confirmed test-writer enhancements (scenario generation, edge case identification) and test-runner (agent testing, regression detection)
- **Code Generation**: Verified comprehensive code-generator with best practices, pattern reuse, and test generation
- **Documentation**: Created orchestration workflow examples and comprehensive agent development guide
- **All Agents Verified**: Ensured all 30+ agents are properly implemented with complete capabilities

### Planner Agent Simplification (2025-09-30)

- **Refocused on concise, actionable planning**: Changed from "comprehensive" to "clear, actionable"
- **Removed testing from planning**: Testing now handled separately during execution
- **Length guidance added**: Explicit targets (100-200, 200-400, 400-600 lines by complexity)
- **Template simplified**: Removed exhaustive sections (success criteria, risk matrices, dependency graphs, agent assignments)
- **Core sections retained**: Overview, Scope, Current State, API Design (optional), Steps, Files, Critical Challenges (optional)
- **Changed philosophy**: From "ultrathink with maximum output" to "think deeply, communicate concisely"
- **Separation of concerns**: Planning for strategic direction, execution handles orchestration and testing

### Previous Updates

- Added **planner** agent with deep thinking requirement
- Added **prompt-engineer** agent for AI prompt optimization
- Enhanced context integration between context-loader and planner
- Implemented strict "no extras" policy for planning
- Added context_findings parameter support for better integration
