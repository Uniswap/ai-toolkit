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

- **claude-docs-initializer**: Discover repository structure and create initial CLAUDE.md documentation at all appropriate levels
- **claude-docs-manager**: Analyze code changes and update all affected CLAUDE.md documentation files
- **context-loader**: Advanced context management with summarization, checkpointing, and cross-agent sharing
- **doc-writer**: Advanced documentation specialist for API docs, architecture documentation, and README generation

### Core Specialist Agents

- **code-explainer**: Analyze and explain complex code with pattern recognition and security analysis
- **code-generator**: Comprehensive code generation specialist with tests and best practices
- **debug-assistant**: Advanced debugging with root cause analysis and fix validation
- **planner**: Create detailed implementation plans (no code writing)
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

2. **Planner** uses enriched context to create superior plans:
   - Leverages relevance scores to prioritize work
   - Uses compressed summaries for efficient processing
   - References checkpoint history for evolution context
   - Accounts for severity-rated risks and gotchas
   - Aligns with importance-scored patterns

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
5. **Ultrathink When Needed**: Some agents (like planner) require maximum thinking

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

- Maximum thinking budget (ultrathink)
- No unnecessary features or extras
- Context-aware when findings provided
- Detailed but readable output

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

## Recent Changes

### Claude-Docs System Implementation (Latest)

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

### Previous Updates

- Added **planner** agent with ultrathink requirement
- Added **prompt-engineer** agent for AI prompt optimization
- Enhanced context integration between context-loader and planner
- Implemented strict "no extras" policy for planning
- Added context_findings parameter support for better integration
