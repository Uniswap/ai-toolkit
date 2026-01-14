/**
 * Types for the context-module package
 * Consolidated from context-loader, code-explainer, and researcher patterns
 *
 * @packageDocumentation
 */

// =============================================================================
// Pattern Types
// =============================================================================

/**
 * Supported design pattern types that can be detected in code
 */
export type DesignPatternType =
  | 'factory'
  | 'singleton'
  | 'observer'
  | 'repository'
  | 'strategy'
  | 'decorator'
  | 'adapter'
  | 'facade'
  | 'builder'
  | 'prototype'
  | 'command'
  | 'mediator'
  | 'state'
  | 'template-method'
  | 'visitor';

/**
 * Quality rating for detected patterns
 */
export type PatternQuality = 'excellent' | 'good' | 'acceptable' | 'poor';

/**
 * Impact level assessment
 */
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Represents a detected design pattern in the codebase
 */
export interface DesignPattern {
  /** Human-readable name of the pattern */
  name: string;
  /** The type of design pattern detected */
  type: DesignPatternType;
  /** File paths where this pattern was detected */
  locations: string[];
  /** Quality assessment of the pattern implementation */
  quality: PatternQuality;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Description of how the pattern is implemented */
  description: string;
  /** Example code snippets demonstrating the pattern */
  examples?: string[];
}

/**
 * Architectural style classifications
 */
export type ArchitectureStyleType =
  | 'layered'
  | 'microservices'
  | 'monolithic'
  | 'hexagonal'
  | 'clean'
  | 'event-driven'
  | 'serverless'
  | 'modular-monolith'
  | 'cqrs'
  | 'domain-driven'
  | 'unknown';

/**
 * Represents the overall architecture style of a codebase
 */
export interface ArchitectureStyle {
  /** Primary architecture style */
  primary: ArchitectureStyleType;
  /** Secondary patterns that complement the primary style */
  secondary: ArchitectureStyleType[];
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Evidence supporting the classification */
  evidence: string[];
  /** Characteristics observed in the codebase */
  characteristics: string[];
}

/**
 * Types of conventions that can be detected
 */
export type ConventionType =
  | 'naming'
  | 'file-structure'
  | 'import'
  | 'export'
  | 'testing'
  | 'documentation'
  | 'error-handling'
  | 'logging'
  | 'configuration';

/**
 * Represents a detected convention or pattern in the codebase
 */
export interface Convention {
  /** Name/identifier for the convention */
  name: string;
  /** Type of convention */
  type: ConventionType;
  /** Regex or description pattern that defines the convention */
  pattern: string;
  /** Example occurrences that match this convention */
  examples: string[];
  /** How frequently this convention appears (0-1) */
  frequency: number;
  /** Consistency score measuring how uniformly the convention is applied (0-100) */
  consistency: number;
  /** Description of the convention */
  description?: string;
}

// =============================================================================
// Hierarchical Summary Types
// =============================================================================

/**
 * Multi-level summary supporting different detail requirements
 */
export interface HierarchicalSummary {
  /** High-level executive summary (1-2 sentences) */
  executive: string;
  /** Detailed overview (5-10 sentences) */
  detailed: string;
  /** Full technical implementation details */
  technical: string;
}

// =============================================================================
// Pattern Catalog Types
// =============================================================================

/**
 * Catalog of all detected patterns in the codebase
 */
export interface PatternCatalog {
  /** Detected design patterns (Factory, Singleton, etc.) */
  design: DesignPattern[];
  /** Architectural patterns (Layered, microservices, etc.) */
  architectural: string[];
  /** Detected conventions (naming, structure, etc.) */
  conventions: Convention[];
  /** Pattern occurrence frequency map */
  frequency: Record<string, number>;
}

// =============================================================================
// Relevance Score Types
// =============================================================================

/**
 * Individual factors used in relevance scoring
 */
export interface RelevanceFactors {
  /** How frequently the element appears in the codebase (0-100) */
  frequency: number;
  /** How recently the element was modified (0-100) */
  recency: number;
  /** How many other elements depend on this (0-100) */
  dependency: number;
  /** Complexity score of the element (0-100) */
  complexity: number;
  /** User-specified focus weight (0-100) */
  userFocus: number;
}

/**
 * Relevance scoring for context elements
 */
export interface RelevanceScore {
  /** Overall relevance score (0-100) */
  overall: number;
  /** Relevance scores by component path */
  byComponent: Record<string, number>;
  /** Relevance scores by pattern name */
  byPattern: Record<string, number>;
  /** Individual factor weights contributing to the score */
  factors: RelevanceFactors;
}

// =============================================================================
// Component Types
// =============================================================================

/**
 * Information about a key component in the codebase
 */
export interface ComponentInfo {
  /** File or directory path */
  path: string;
  /** Human-readable description of the component */
  description: string;
  /** Importance score (0-100) */
  importance: number;
  /** Complexity score (0-100) */
  complexity: number;
  /** List of dependencies this component relies on */
  dependencies: string[];
  /** Brief summary of the component's purpose */
  summary?: string;
  /** Lines of code */
  linesOfCode?: number;
  /** Primary programming language */
  language?: string;
}

// =============================================================================
// Dependency Types
// =============================================================================

/**
 * A node in the dependency graph
 */
export interface DependencyNode {
  /** Unique identifier for the node */
  id: string;
  /** File or module path */
  path: string;
  /** Type of node */
  type: 'file' | 'module' | 'package' | 'external';
  /** Number of incoming dependencies */
  inDegree: number;
  /** Number of outgoing dependencies */
  outDegree: number;
}

/**
 * An edge in the dependency graph
 */
export interface DependencyEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Type of dependency relationship */
  type: 'import' | 'export' | 'type-import' | 'dynamic';
  /** Specific symbols imported/exported */
  symbols?: string[];
}

/**
 * Detected circular dependency
 */
export interface CircularDependency {
  /** Files involved in the circular dependency */
  cycle: string[];
  /** Severity of the circular dependency */
  severity: ImpactLevel;
  /** Suggested resolution approach */
  suggestion?: string;
}

/**
 * Statistics about the dependency graph
 */
export interface DependencyStats {
  /** Total number of nodes */
  totalNodes: number;
  /** Total number of edges */
  totalEdges: number;
  /** Number of circular dependencies detected */
  circularCount: number;
  /** Maximum dependency depth */
  maxDepth: number;
  /** Average dependencies per file */
  avgDependencies: number;
}

/**
 * Complete dependency graph representation
 */
export interface DependencyGraph {
  /** Nodes in the dependency graph */
  nodes: DependencyNode[];
  /** Edges connecting dependencies */
  edges: DependencyEdge[];
  /** Detected circular dependencies */
  circular: CircularDependency[];
  /** Summary statistics */
  stats: DependencyStats;
}

/**
 * A direct dependency of a file
 */
export interface DirectDependency {
  /** Path to the dependency */
  path: string;
  /** Type of dependency */
  type: 'internal' | 'external' | 'type-only';
  /** Imported symbols */
  imports: string[];
  /** Whether the import is dynamic */
  isDynamic: boolean;
}

/**
 * A transitive dependency chain
 */
export interface DependencyChain {
  /** Starting point of the chain */
  root: string;
  /** Ordered list of dependencies in the chain */
  chain: string[];
  /** Total depth of the chain */
  depth: number;
  /** Whether this chain contains any circular references */
  hasCircular: boolean;
}

/**
 * External effects tracked for a file
 */
export interface ExternalEffect {
  /** Type of external effect */
  type: 'file-system' | 'network' | 'database' | 'environment' | 'console' | 'other';
  /** Description of the effect */
  description: string;
  /** File where the effect originates */
  source: string;
  /** Whether this is a side effect (vs. explicit dependency) */
  isSideEffect: boolean;
}

// =============================================================================
// Data Flow Types
// =============================================================================

/**
 * A single data flow in the system
 */
export interface DataFlow {
  /** Name/identifier for the flow */
  name: string;
  /** Source of the data */
  source: string;
  /** Destination of the data */
  destination: string;
  /** Transformations applied along the flow */
  transformations: string[];
  /** Whether this is a critical data path */
  critical: boolean;
  /** Data type being transferred */
  dataType?: string;
}

/**
 * Complete data flow map for the codebase
 */
export interface DataFlowMap {
  /** High-level overview of data flows */
  overview: string;
  /** Individual data flows identified */
  flows: DataFlow[];
}

// =============================================================================
// Insight Types
// =============================================================================

/**
 * Type of insight discovered
 */
export type InsightType = 'pattern' | 'risk' | 'opportunity' | 'gotcha' | 'recommendation';

/**
 * A key insight or discovery about the codebase
 */
export interface Insight {
  /** Type of insight */
  type: InsightType;
  /** Description of the insight */
  description: string;
  /** Impact assessment */
  impact: ImpactLevel;
  /** Recommended action or consideration */
  recommendation?: string;
  /** Related files or components */
  relatedPaths?: string[];
  /** Confidence in the insight (0-1) */
  confidence?: number;
}

// =============================================================================
// Metadata Types
// =============================================================================

/**
 * Metadata about context creation and scope
 */
export interface ContextMetadata {
  /** When the context was created (ISO 8601) */
  createdAt: string;
  /** When the context was last updated (ISO 8601) */
  updatedAt?: string;
  /** Topic or area the context covers */
  topic: string;
  /** Files included in the analysis */
  files: string[];
  /** Specific focus areas requested */
  focus?: string[];
  /** Version of the context module that generated this */
  moduleVersion?: string;
  /** Total analysis time in milliseconds */
  analysisTimeMs?: number;
  /** Token count estimate for the context */
  tokenCount?: number;
}

// =============================================================================
// Core Codebase Context Type
// =============================================================================

/**
 * Main context container representing comprehensive codebase understanding
 */
export interface CodebaseContext {
  /** Multi-level hierarchical summary of the codebase */
  summary: HierarchicalSummary;
  /** Core files/modules with importance metadata */
  keyComponents: ComponentInfo[];
  /** Identified patterns catalog */
  patterns: PatternCatalog;
  /** Dependency information and graph */
  dependencies: DependencyGraph;
  /** Data flow mappings */
  dataFlow: DataFlowMap;
  /** Key discoveries, recommendations, and gotchas */
  insights: Insight[];
  /** Context generation metadata */
  metadata: ContextMetadata;
}

// =============================================================================
// Summary Types
// =============================================================================

/**
 * Summary of a single file
 */
export interface FileSummary {
  /** File path */
  path: string;
  /** File purpose and role */
  purpose: string;
  /** Key exports from the file */
  exports: string[];
  /** Key imports into the file */
  imports: string[];
  /** Patterns detected in the file */
  patterns: string[];
  /** Complexity score (0-100) */
  complexity: number;
  /** Lines of code */
  linesOfCode: number;
  /** Primary language */
  language: string;
}

/**
 * Summary of a module/directory
 */
export interface ModuleSummary {
  /** Module/directory path */
  path: string;
  /** Module name */
  name: string;
  /** Module purpose and responsibility */
  purpose: string;
  /** Public API surface */
  publicApi: string[];
  /** Internal components */
  internalComponents: string[];
  /** External dependencies */
  dependencies: string[];
  /** Files in the module */
  files: FileSummary[];
  /** Patterns detected in the module */
  patterns: string[];
  /** Total lines of code */
  totalLinesOfCode: number;
}

// =============================================================================
// Checkpoint Types
// =============================================================================

/**
 * Size metrics for a checkpoint
 */
export interface CheckpointSizeMetrics {
  /** Raw size in bytes */
  raw: number;
  /** Compressed size in bytes */
  compressed?: number;
  /** Estimated token count */
  tokenCount: number;
  /** Number of components */
  componentCount?: number;
  /** Number of patterns */
  patternCount?: number;
}

/**
 * A versioned snapshot of context state
 */
export interface Checkpoint {
  /** Unique identifier for the checkpoint */
  id: string;
  /** Semantic version of the checkpoint */
  version: string;
  /** Parent checkpoint ID for incremental updates */
  parentId?: string;
  /** Human-readable label for the checkpoint */
  label?: string;
  /** The stored codebase context */
  context: CodebaseContext;
  /** Size metrics */
  sizeMetrics: CheckpointSizeMetrics;
  /** When this checkpoint was created */
  createdAt: Date;
  /** Optional description of what changed */
  description?: string;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Summary information about a checkpoint (for listing)
 */
export interface CheckpointSummary {
  /** Unique identifier */
  id: string;
  /** Semantic version */
  version: string;
  /** Parent checkpoint ID */
  parentId?: string;
  /** Human-readable label */
  label?: string;
  /** When created */
  createdAt: Date;
  /** Description */
  description?: string;
  /** Tags */
  tags?: string[];
  /** Size metrics */
  sizeMetrics: CheckpointSizeMetrics;
  /** Number of files in the checkpoint */
  fileCount: number;
  /** Root path of the codebase */
  rootPath: string;
}

/**
 * A single entry in a diff
 */
export interface DiffEntry {
  /** Path or identifier of the changed item */
  path: string;
  /** Type of the changed item */
  type: 'component' | 'pattern' | 'insight' | 'dependency';
  /** Description of the change */
  description?: string;
}

/**
 * Types of changes between two checkpoints
 */
export type DiffChangeType = 'added' | 'removed' | 'modified';

/**
 * Represents a single file change between checkpoints
 */
export interface FileDiff {
  /** Path to the file */
  path: string;
  /** Type of change */
  changeType: DiffChangeType;
  /** Previous content (for modified/removed) */
  previousContent?: string;
  /** New content (for modified/added) */
  newContent?: string;
  /** Previous hash */
  previousHash?: string;
  /** New hash */
  newHash?: string;
}

/**
 * Difference between two context states
 */
export interface ContextDiff {
  /** Source checkpoint ID */
  fromCheckpointId: string;
  /** Target checkpoint ID */
  toCheckpointId: string;
  /** Source version */
  fromVersion: string;
  /** Target version */
  toVersion: string;
  /** Files that were added */
  added: FileDiff[];
  /** Files that were removed */
  removed: FileDiff[];
  /** Files that were modified */
  modified: FileDiff[];
  /** Summary statistics */
  stats: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    totalChanges: number;
  };
  /** When this diff was computed */
  computedAt: Date;
}

/**
 * Options for listing checkpoints
 */
export interface ListCheckpointsOptions {
  /** Filter by label pattern */
  labelPattern?: string;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter checkpoints created after this date */
  after?: Date;
  /** Filter checkpoints created before this date */
  before?: Date;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  sortBy?: 'createdAt' | 'version' | 'size';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Alias for ListCheckpointsOptions
 */
export type ListOptions = ListCheckpointsOptions;

// =============================================================================
// Compression Types
// =============================================================================

/**
 * Types of context that can be compressed/pruned
 */
export type ContextType =
  | 'core-patterns'
  | 'architecture-decisions'
  | 'implementation-details'
  | 'file-summaries'
  | 'dependency-info'
  | 'historical-context';

/**
 * Compression strategy
 */
export type CompressionStrategy =
  | 'semantic-deduplication'
  | 'abstraction-elevation'
  | 'example-reduction'
  | 'metadata-stripping'
  | 'progressive-summarization'
  | 'balanced';

/**
 * Compressed context representation
 */
export interface CompressedContext {
  /** Original context version */
  originalVersion: string;
  /** Compression level applied (1-10) */
  compressionLevel: number;
  /** Encoding format used */
  encoding: 'json' | 'msgpack' | 'base64';
  /** The compressed data */
  data: string;
  /** Hash of original content for integrity checking */
  contentHash: string;
  /** Original size in bytes */
  originalSize: number;
  /** Compressed size in bytes */
  compressedSize: number;
  /** Compression ratio achieved */
  compressionRatio: number;
}

/**
 * Options for context pruning
 */
export interface PruningOptions {
  /** Minimum relevance score to retain (0-100) */
  relevanceThreshold: number;
  /** Maximum token count to target */
  maxTokens?: number;
  /** Time-to-live per context type (in hours) */
  ttl?: Partial<Record<ContextType, number>>;
  /** Context types to always preserve */
  preserveTypes?: ContextType[];
  /** Specific paths to always preserve */
  preservePaths?: string[];
  /** Aggressiveness of pruning (1-10) */
  aggressiveness?: number;
}

/**
 * An item removed during pruning
 */
export interface PrunedItem {
  /** Path or identifier */
  path: string;
  /** Type of item pruned */
  type: ContextType;
  /** Reason for pruning */
  reason: 'low-relevance' | 'expired' | 'size-limit' | 'duplicate';
  /** Relevance score at time of pruning */
  relevanceScore?: number;
}

/**
 * Result of a pruning operation
 */
export interface PruningResult {
  /** Original token count */
  originalTokens: number;
  /** Final token count after pruning */
  finalTokens: number;
  /** Items removed during pruning */
  removedItems: PrunedItem[];
  /** Pruning summary */
  summary: string;
}

/**
 * Options for context compression
 */
export interface CompressionOptions {
  /** Compression level (1-10, higher = more aggressive) */
  level: number;
  /** Strategy for compression */
  strategy?: CompressionStrategy;
  /** Whether to preserve code examples */
  preserveExamples?: boolean;
  /** Target token count */
  targetTokens?: number;
}

/**
 * Statistics from compression
 */
export interface CompressionStats {
  /** Original size in bytes */
  originalSize: number;
  /** Compressed size in bytes */
  compressedSize: number;
  /** Compression ratio */
  ratio: number;
  /** Original token count */
  originalTokens: number;
  /** Final token count */
  finalTokens: number;
  /** Compression time in milliseconds */
  compressionTimeMs: number;
  /** Strategy used */
  strategyUsed: CompressionStrategy;
}

/**
 * Result of compression
 */
export interface CompressionResult {
  /** The compressed context */
  compressed: CompressedContext;
  /** Compression statistics */
  stats: CompressionStats;
}

// =============================================================================
// Context Exchange Types
// =============================================================================

/**
 * Context type classification for exchange
 */
export type ContextClassification = 'feature' | 'architecture' | 'module' | 'component' | 'full';

/**
 * Merge strategy for combining contexts
 */
export type MergeStrategy = 'union' | 'intersection' | 'override' | 'newest' | 'highest-relevance';

/**
 * Standardized format for cross-agent context sharing
 */
export interface ContextExchangeFormat {
  /** Exchange format version */
  formatVersion: '1.0.0';
  /** Agent that created this context */
  sourceAgent: string;
  /** Type of context being shared */
  contextType: ContextClassification;
  /** Chain of parent contexts */
  inheritanceChain: string[];
  /** Recommended merge strategy */
  mergeStrategy: MergeStrategy;
  /** The context payload */
  payload: CodebaseContext;
  /** Required capabilities for consuming agent */
  requiredCapabilities?: string[];
  /** Optional merge instructions */
  mergeInstructions?: string;
}

/**
 * Options for exporting context
 */
export interface ExportOptions {
  /** Target agent identifier */
  targetAgent?: string;
  /** Minimum relevance to include */
  relevanceThreshold?: number;
  /** Context types to include */
  includeTypes?: ContextType[];
  /** Context types to exclude */
  excludeTypes?: ContextType[];
  /** Maximum size in bytes */
  maxSize?: number;
  /** Compression level (1-10) */
  compressionLevel?: number;
  /** Whether to include full examples */
  includeExamples?: boolean;
}

/**
 * Options for importing context
 */
export interface ImportOptions {
  /** How to merge with existing context */
  mergeStrategy: MergeStrategy;
  /** Whether to validate before import */
  validate?: boolean;
  /** Whether to update relevance scores */
  recalculateRelevance?: boolean;
  /** Paths to exclude from import */
  excludePaths?: string[];
}

// =============================================================================
// Pattern Extraction Types
// =============================================================================

/**
 * Options for pattern extraction
 */
export interface PatternExtractionOptions {
  /** Minimum confidence threshold for including patterns (0-1) */
  minConfidence?: number;
  /** Maximum number of patterns to return per category */
  maxPatterns?: number;
  /** Whether to include code examples */
  includeExamples?: boolean;
  /** File patterns to exclude from analysis */
  excludePatterns?: string[];
  /** Maximum files to analyze */
  maxFiles?: number;
  /** Analysis depth */
  depth?: 'shallow' | 'normal' | 'deep';
}

/**
 * Statistics from pattern extraction
 */
export interface PatternExtractionStats {
  /** Number of files analyzed */
  filesAnalyzed: number;
  /** Total patterns found */
  patternsFound: number;
  /** Analysis time in milliseconds */
  analysisTimeMs: number;
  /** Number of conventions detected */
  conventionsFound: number;
  /** Average confidence score */
  avgConfidence: number;
}

/**
 * Result of a complete pattern extraction analysis
 */
export interface PatternExtractionResult {
  /** Detected design patterns */
  designPatterns: DesignPattern[];
  /** Detected architectural patterns */
  architecturalPatterns: string[];
  /** Detected conventions */
  conventions: Convention[];
  /** Overall architecture classification */
  architectureStyle: ArchitectureStyle;
  /** Summary statistics */
  stats: PatternExtractionStats;
}

// =============================================================================
// Dependency Analysis Types
// =============================================================================

/**
 * Options for dependency analysis
 */
export interface DependencyAnalysisOptions {
  /** Maximum depth for transitive analysis */
  maxDepth?: number;
  /** Whether to detect circular dependencies */
  detectCircular?: boolean;
  /** Whether to track external effects */
  trackExternalEffects?: boolean;
  /** File patterns to exclude */
  excludePatterns?: string[];
  /** Whether to include type-only imports */
  includeTypeImports?: boolean;
}

/**
 * Statistics from dependency analysis
 */
export interface DependencyAnalysisStats {
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total dependencies found */
  totalDependencies: number;
  /** Internal dependencies */
  internalDependencies: number;
  /** External dependencies */
  externalDependencies: number;
  /** Circular dependencies found */
  circularDependencies: number;
  /** Analysis time in milliseconds */
  analysisTimeMs: number;
}

/**
 * Result of dependency analysis
 */
export interface DependencyAnalysisResult {
  /** The dependency graph */
  graph: DependencyGraph;
  /** Transitive dependency chains */
  chains: DependencyChain[];
  /** External effects detected */
  externalEffects: ExternalEffect[];
  /** Analysis statistics */
  stats: DependencyAnalysisStats;
}

// =============================================================================
// Summarization Types
// =============================================================================

/**
 * Options for summarization
 */
export interface SummarizationOptions {
  /** Maximum length for summaries */
  maxLength?: number;
  /** Detail level */
  detailLevel?: 'brief' | 'standard' | 'comprehensive';
  /** Whether to include code examples */
  includeExamples?: boolean;
  /** Focus areas to emphasize */
  focusAreas?: string[];
  /** Target audience */
  audience?: 'developer' | 'architect' | 'manager';
}

/**
 * Statistics from summarization
 */
export interface SummarizationStats {
  /** Files summarized */
  filesSummarized: number;
  /** Modules summarized */
  modulesSummarized: number;
  /** Total content processed (chars) */
  contentProcessed: number;
  /** Compression ratio achieved */
  compressionRatio: number;
  /** Summarization time in milliseconds */
  analysisTimeMs: number;
}

/**
 * Result of summarization
 */
export interface SummarizationResult {
  /** The hierarchical summary */
  summary: HierarchicalSummary;
  /** Key insights extracted */
  insights: Insight[];
  /** Summarization statistics */
  stats: SummarizationStats;
}

// =============================================================================
// Checkpoint Store Types
// =============================================================================

/**
 * Storage backend types for checkpoint persistence
 */
export type CheckpointStorageType = 'memory' | 'filesystem' | 'custom';

/**
 * Configuration for checkpoint storage
 */
export interface CheckpointStoreConfig {
  /** Storage backend type */
  backend: 'filesystem' | 'memory' | 'custom';
  /** Base path for filesystem storage */
  basePath?: string;
  /** Maximum checkpoints to retain */
  maxCheckpoints?: number;
  /** Auto-prune old checkpoints */
  autoPrune?: boolean;
  /** Compression settings */
  compression?: {
    enabled: boolean;
    level: number;
  };
}

/**
 * Options for creating a checkpoint store
 */
export interface CheckpointStoreOptions {
  /** Storage backend type */
  storageType?: CheckpointStorageType;
  /** Base directory for filesystem storage */
  baseDir?: string;
  /** Whether to enable compression */
  enableCompression?: boolean;
  /** Maximum number of checkpoints to retain (0 = unlimited) */
  maxCheckpoints?: number;
  /** Custom storage backend implementation */
  customStorage?: CheckpointStorageBackend;
}

/**
 * Options for creating a checkpoint
 */
export interface CreateCheckpointOptions {
  /** Version to assign */
  version?: string;
  /** Tags to apply */
  tags?: string[];
  /** Whether to compress */
  compress?: boolean;
  /** Compression level if compressing */
  compressionLevel?: number;
}

/**
 * Options for restoring a checkpoint
 */
export interface RestoreOptions {
  /** Whether to decompress if compressed */
  decompress?: boolean;
  /** Whether to recalculate relevance scores */
  recalculateRelevance?: boolean;
}

/**
 * Abstract interface for checkpoint storage backends
 */
export interface CheckpointStorageBackend {
  /** Store a checkpoint */
  save(checkpoint: Checkpoint): Promise<void>;
  /** Retrieve a checkpoint by ID */
  load(id: string): Promise<Checkpoint | null>;
  /** Delete a checkpoint */
  delete(id: string): Promise<boolean>;
  /** List all checkpoint IDs */
  listIds(): Promise<string[]>;
  /** Check if a checkpoint exists */
  exists(id: string): Promise<boolean>;
  /** Clear all checkpoints */
  clear(): Promise<void>;
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation result for exchange format validation
 */
export interface ValidationResult {
  /** Whether the exchange format is valid */
  valid: boolean;
  /** Validation errors if any */
  errors: ValidationError[];
  /** Validation warnings if any */
  warnings: ValidationWarning[];
}

/**
 * A validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Path in the object where the error occurred */
  path?: string;
}

/**
 * A validation warning
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Path in the object where the warning occurred */
  path?: string;
}

// =============================================================================
// Legacy Types (for backwards compatibility with existing implementations)
// =============================================================================

/**
 * Represents a file in the codebase context (legacy format)
 * Used by checkpoint-store and exchange-format implementations
 */
export interface ContextFile {
  /** Relative path from repository root */
  path: string;
  /** File content (may be truncated for large files) */
  content: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  lastModified: Date;
  /** Programming language detected */
  language?: string;
  /** Content hash for change detection */
  hash: string;
}

/**
 * Represents a directory structure in the codebase (legacy format)
 */
export interface ContextDirectory {
  /** Directory path */
  path: string;
  /** Child directories */
  directories: string[];
  /** Files in this directory */
  files: string[];
  /** Total file count including subdirectories */
  totalFiles: number;
}

/**
 * Represents a symbol in the codebase (legacy format)
 */
export interface ContextSymbol {
  /** Symbol name */
  name: string;
  /** Symbol kind */
  kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'enum' | 'module';
  /** File path where the symbol is defined */
  filePath: string;
  /** Line number in the file */
  line?: number;
  /** Symbol signature or type annotation */
  signature?: string;
  /** Documentation or JSDoc comment */
  documentation?: string;
}

/**
 * Represents a relationship between entities (legacy format)
 */
export interface ContextRelationship {
  /** Source entity identifier */
  source: string;
  /** Target entity identifier */
  target: string;
  /** Type of relationship */
  type: 'imports' | 'exports' | 'extends' | 'implements' | 'calls' | 'references';
  /** Additional relationship metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Legacy dependency type for backwards compatibility
 */
export interface ContextDependency {
  /** Package or module name */
  name: string;
  /** Version constraint or resolved version */
  version?: string;
  /** Dependency type (production, development, peer) */
  type?: 'production' | 'development' | 'peer';
  /** Source of the dependency */
  source?: string;
}
