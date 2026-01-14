# DEV-220: Context/Exploration Consolidation Implementation Plan

**Linear Task**: [DEV-220](https://linear.app/uniswap/issue/DEV-220/consolidate-contextexploration-agents-into-unified-context-system)
**Branch**: `nickkoutrelakos/DEV-220-consolidate-context-exploration-agents`
**Created**: 2026-01-14

---

## Executive Summary

This plan addresses the **Context/Exploration Fragmentation** issue identified in the plugin audit report. Four components across three plugins have overlapping capabilities for codebase understanding:

| Component         | Plugin                     | Primary Role                                    |
| ----------------- | -------------------------- | ----------------------------------------------- |
| context-loader    | development-planning       | Context management with checkpointing           |
| codebase-explorer | development-codebase-tools | Natural language codebase exploration           |
| code-explainer    | development-codebase-tools | Deep file/component analysis                    |
| researcher        | development-productivity   | External research + codebase pattern extraction |

**Goal**: Create a shared context module that eliminates duplication while preserving each component's unique value.

---

## Phase 1: Create Shared Context Module Foundation

### 1.1 Create Nx Library Package

**Location**: `packages/shared/context-module/`

```bash
npx nx g @nx/js:library context-module \
  --directory=packages/shared \
  --bundler=tsc \
  --unitTestRunner=vitest \
  --publishable \
  --importPath=@ai-toolkit/context-module
```

### 1.2 Define Core Interfaces

**File**: `packages/shared/context-module/src/lib/types/index.ts`

```typescript
// Core context types
export interface CodebaseContext {
  summary: HierarchicalSummary;
  keyComponents: ComponentInfo[];
  patterns: PatternCatalog;
  dependencies: DependencyGraph;
  dataFlow: DataFlowMap;
  insights: Insight[];
  metadata: ContextMetadata;
}

export interface HierarchicalSummary {
  executive: string; // 1-2 sentences
  detailed: string; // Full overview
  technical: string; // Implementation details
}

export interface PatternCatalog {
  design: DesignPattern[]; // Factory, Singleton, etc.
  architectural: string[]; // Layered, microservices, etc.
  conventions: Convention[]; // Naming, structure
  frequency: Record<string, number>;
}

export interface RelevanceScore {
  overall: number; // 0-100
  byComponent: Record<string, number>;
  byPattern: Record<string, number>;
  factors: {
    frequency: number;
    recency: number;
    dependency: number;
    complexity: number;
    userFocus: number;
  };
}

export interface Checkpoint {
  id: string;
  version: string; // Semantic versioning
  timestamp: string; // ISO 8601
  parentCheckpoint?: string;
  context: CodebaseContext;
  sizeMetrics: {
    raw: number;
    compressed: number;
    tokenCount: number;
  };
  diffSummary?: string;
}
```

### 1.3 Implement Pattern Extractor

**File**: `packages/shared/context-module/src/lib/core/pattern-extractor.ts`

Consolidates pattern recognition from:

- context-loader's pattern taxonomy
- code-explainer's design pattern detection
- researcher's architectural analysis

```typescript
export interface PatternExtractor {
  extractDesignPatterns(files: string[]): Promise<DesignPattern[]>;
  extractArchitecturalPatterns(files: string[]): Promise<string[]>;
  extractConventions(files: string[]): Promise<Convention[]>;
  classifyArchitectureStyle(files: string[]): Promise<ArchitectureStyle>;
}
```

### 1.4 Implement Dependency Analyzer

**File**: `packages/shared/context-module/src/lib/core/dependency-analyzer.ts`

Consolidates dependency analysis from:

- context-loader's dependency chain tracking
- code-explainer's import/export analysis
- researcher's dependency graph generation

```typescript
export interface DependencyAnalyzer {
  analyzeDirect(file: string): Promise<DirectDependency[]>;
  analyzeTransitive(file: string, depth?: number): Promise<DependencyChain[]>;
  detectCircular(files: string[]): Promise<CircularDependency[]>;
  trackExternalEffects(file: string): Promise<ExternalEffect[]>;
}
```

### 1.5 Implement Summarizer

**File**: `packages/shared/context-module/src/lib/core/summarizer.ts`

Consolidates summarization from:

- context-loader's hierarchical summarization
- code-explainer's architectural synthesis
- researcher's documentation synthesis

```typescript
export interface Summarizer {
  summarizeFile(file: string): Promise<FileSummary>;
  summarizeModule(directory: string): Promise<ModuleSummary>;
  summarizeCodebase(topic: string): Promise<HierarchicalSummary>;
  extractKeyInsights(context: CodebaseContext): Promise<Insight[]>;
}
```

### 1.6 Implement Context Compressor

**File**: `packages/shared/context-module/src/lib/core/context-compressor.ts`

Preserves context-loader's unique compression capabilities:

```typescript
export interface ContextCompressor {
  compress(context: CodebaseContext, level: 1-10): Promise<CompressedContext>;
  decompress(compressed: CompressedContext): Promise<CodebaseContext>;
  prune(context: CodebaseContext, options: PruningOptions): Promise<CodebaseContext>;
  semanticDeduplicate(context: CodebaseContext): Promise<CodebaseContext>;
}

export interface PruningOptions {
  relevanceThreshold: number;    // 0-100
  maxTokens?: number;
  ttl?: Record<ContextType, number>;  // Hours
  preserveTypes?: ContextType[];
}
```

---

## Phase 2: Implement Checkpoint System

### 2.1 Checkpoint Store

**File**: `packages/shared/context-module/src/lib/checkpoint/checkpoint-store.ts`

Preserves context-loader's unique versioning capabilities:

```typescript
export interface CheckpointStore {
  create(context: CodebaseContext, parentId?: string): Promise<Checkpoint>;
  restore(checkpointId: string): Promise<CodebaseContext>;
  diff(checkpointA: string, checkpointB: string): Promise<ContextDiff>;
  list(options?: ListOptions): Promise<CheckpointSummary[]>;
  prune(olderThan?: Date): Promise<number>;
}
```

### 2.2 Context Exchange Format

**File**: `packages/shared/context-module/src/lib/exchange/exchange-format.ts`

Standardizes JSON-LD exchange format for cross-agent sharing:

```typescript
export interface ContextExchangeFormat {
  formatVersion: '1.0.0';
  sourceAgent: string;
  contextType: 'feature' | 'architecture' | 'module';
  inheritanceChain: string[];
  mergeStrategy: 'union' | 'intersection' | 'override';
  payload: CodebaseContext;
}

export interface ContextExchange {
  export(context: CodebaseContext, options: ExportOptions): ContextExchangeFormat;
  import(exchange: ContextExchangeFormat): CodebaseContext;
  merge(contexts: ContextExchangeFormat[], strategy: MergeStrategy): CodebaseContext;
}
```

---

## Phase 3: Refactor Existing Agents

### 3.1 Refactor context-loader Agent

**File**: `packages/plugins/development-planning/agents/context-loader.md`

**Changes**:

1. Import and use shared context module for analysis
2. Retain checkpoint/versioning orchestration
3. Retain compression/pruning configuration
4. Delegate pattern extraction to shared module

**Before** (in agent instructions):

```markdown
## Pattern Recognition

├─ Extract recurring patterns with occurrence counting
├─ Identify naming conventions with consistency scoring
...
```

**After**:

```markdown
## Analysis Delegation

Invoke shared context module for codebase analysis:

- Use @ai-toolkit/context-module for pattern extraction
- Use @ai-toolkit/context-module for dependency analysis
- Retain checkpoint orchestration locally

## Checkpoint Management (Unique Capability)

...retained...
```

### 3.2 Refactor codebase-explorer Skill

**File**: `packages/plugins/development-codebase-tools/skills/codebase-explorer/codebase-explorer.md`

**Changes**:

1. Continue delegating to context-loader (no change to delegation pattern)
2. Update allowed-tools if shared module exposes new capabilities
3. Keep natural language parsing as unique value

**No significant changes needed** - codebase-explorer already delegates to context-loader.

### 3.3 Refactor code-explainer Agent

**File**: `packages/plugins/development-codebase-tools/agents/code-explainer.md`

**Changes**:

1. Import shared context module for pattern extraction
2. Import shared context module for dependency analysis
3. Retain deep security/performance analysis as unique value
4. Retain OWASP/CWE classification locally

### 3.4 Refactor researcher Agent

**File**: `packages/plugins/development-productivity/agents/researcher.md`

**Changes**:

1. Import shared context module for codebase pattern extraction
2. Import shared context module for architectural analysis
3. Retain external research synthesis as unique value
4. Retain technology comparison as unique value

---

## Phase 4: Update Plugin Configurations

### 4.1 Update development-planning plugin.json

Add dependency on shared context module (if applicable for agent instructions).

### 4.2 Update development-codebase-tools plugin.json

Add dependency on shared context module.

### 4.3 Update development-productivity plugin.json

Add dependency on shared context module.

---

## Phase 5: Testing & Validation

### 5.1 Unit Tests for Shared Module

**Files**: `packages/shared/context-module/src/lib/**/*.spec.ts`

Test coverage for:

- Pattern extraction accuracy
- Dependency analysis correctness
- Summarization quality
- Compression/decompression roundtrip
- Checkpoint create/restore/diff

### 5.2 Integration Tests

Verify refactored agents produce equivalent or improved output:

- context-loader checkpoint functionality preserved
- codebase-explorer delegation still works
- code-explainer analysis quality maintained
- researcher synthesis quality maintained

### 5.3 Regression Tests

Compare before/after outputs for:

- Sample codebase exploration queries
- Pattern extraction on known codebases
- Dependency analysis accuracy

---

## Phase 6: Documentation Updates

### 6.1 Update Plugin CLAUDE.md Files

- development-planning/CLAUDE.md
- development-codebase-tools/CLAUDE.md
- development-productivity/CLAUDE.md

### 6.2 Update Notion Plugin Marketplace

Update component descriptions to reflect consolidated architecture.

### 6.3 Create Shared Module Documentation

- `packages/shared/context-module/README.md`
- `packages/shared/context-module/CLAUDE.md`

---

## Implementation Order

```
Week 1: Foundation
├─ [ ] 1.1 Create Nx library package
├─ [ ] 1.2 Define core interfaces
├─ [ ] 1.3 Implement pattern extractor (stub)
├─ [ ] 1.4 Implement dependency analyzer (stub)
└─ [ ] 1.5 Implement summarizer (stub)

Week 2: Core Implementation
├─ [ ] 1.3 Complete pattern extractor
├─ [ ] 1.4 Complete dependency analyzer
├─ [ ] 1.5 Complete summarizer
└─ [ ] 1.6 Implement context compressor

Week 3: Checkpoint & Exchange
├─ [ ] 2.1 Implement checkpoint store
├─ [ ] 2.2 Implement context exchange format
└─ [ ] Unit tests for checkpoint/exchange

Week 4: Agent Refactoring
├─ [ ] 3.1 Refactor context-loader
├─ [ ] 3.2 Verify codebase-explorer (no changes needed)
├─ [ ] 3.3 Refactor code-explainer
└─ [ ] 3.4 Refactor researcher

Week 5: Testing & Documentation
├─ [ ] 5.1 Unit tests for shared module
├─ [ ] 5.2 Integration tests
├─ [ ] 5.3 Regression tests
├─ [ ] 6.1 Update plugin CLAUDE.md files
├─ [ ] 6.2 Update Notion marketplace
└─ [ ] 6.3 Create shared module docs
```

---

## Risks & Mitigations

| Risk                                          | Probability | Impact | Mitigation                                   |
| --------------------------------------------- | ----------- | ------ | -------------------------------------------- |
| Breaking existing agent behavior              | Medium      | High   | Comprehensive regression tests before/after  |
| Performance degradation from module overhead  | Low         | Medium | Benchmark critical paths, optimize hot paths |
| Agent prompt changes break existing workflows | Medium      | Medium | Test with real user queries, gradual rollout |
| Checkpoint format incompatibility             | Low         | High   | Version exchange format, provide migration   |

---

## Success Criteria

1. **Elimination of duplication**: Pattern extraction, dependency analysis, and summarization consolidated into single implementations
2. **Preserved unique capabilities**: context-loader checkpointing, researcher external synthesis, code-explainer deep analysis
3. **No regression**: All existing agent behaviors work as before or better
4. **Improved maintainability**: Single source of truth for core analysis algorithms
5. **Documentation updated**: All affected CLAUDE.md files and Notion docs reflect new architecture

---

## Acceptance Criteria from Linear Task

- [ ] Create new shared "context" module in development-codebase-tools plugin
- [ ] Move context-loader capabilities (checkpointing, compression, sharing) to shared module
- [ ] Refactor codebase-explorer skill to USE context-loader internally
- [ ] Refactor researcher agent to USE context-loader for codebase analysis
- [ ] Deprecate standalone context-loader agent (becomes implementation detail)
- [ ] Single source of truth for codebase context across all plugins
- [ ] Cross-plugin context sharing enabled
- [ ] Documentation updated to reflect consolidated architecture
