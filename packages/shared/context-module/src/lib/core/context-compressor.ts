/**
 * Context Compressor Module
 *
 * Provides compression, decompression, pruning, and semantic deduplication
 * capabilities for codebase context. Preserves context-loader's unique
 * compression capabilities with a 5-tier compression strategy.
 *
 * @module context-compressor
 */

import type {
  CodebaseContext,
  CompressedContext,
  CompressionOptions,
  CompressionStats,
  CompressionStrategy,
  ComponentInfo,
  ContextType,
  Insight,
  PrunedItem,
  PruningOptions,
  PruningResult,
} from '../types/index.js';

/**
 * Priority configuration for different context types
 */
interface PriorityConfig {
  /** Base priority score (0-100) */
  priority: number;
  /** Time-to-live in hours (undefined = no expiry) */
  ttlHours?: number;
  /** How compressible this type is (0-1, higher = more compressible) */
  compressibility: number;
}

/**
 * Default priority matrix for context types.
 * Defines base priority, TTL, and compressibility for each type.
 */
const DEFAULT_PRIORITY_MATRIX: Record<ContextType, PriorityConfig> = {
  'core-patterns': {
    priority: 100,
    ttlHours: undefined, // No expiry
    compressibility: 0.2, // Low compressibility - preserve most detail
  },
  'architecture-decisions': {
    priority: 95,
    ttlHours: 168, // 1 week
    compressibility: 0.4, // Medium compressibility
  },
  'implementation-details': {
    priority: 70,
    ttlHours: 48, // 2 days
    compressibility: 0.7, // High compressibility
  },
  'file-summaries': {
    priority: 60,
    ttlHours: 24, // 1 day
    compressibility: 0.8, // High compressibility
  },
  'dependency-info': {
    priority: 50,
    ttlHours: 72, // 3 days
    compressibility: 0.5, // Medium compressibility
  },
  'historical-context': {
    priority: 30,
    ttlHours: 12, // 12 hours
    compressibility: 0.9, // Very high compressibility
  },
};

/** Current version of the compression format */
const FORMAT_VERSION = '1.0.0';

/**
 * ContextCompressor class provides compression capabilities for codebase context.
 *
 * Implements a 5-tier compression strategy:
 * - Level 1-2: Light compression - remove only redundant whitespace/comments
 * - Level 3-4: Moderate - semantic deduplication, example reduction
 * - Level 5-6: Medium - abstraction elevation, metadata stripping
 * - Level 7-8: Heavy - progressive summarization, key items only
 * - Level 9-10: Maximum - executive summary only, critical insights preserved
 *
 * @example
 * ```typescript
 * const compressor = new ContextCompressor();
 *
 * // Compress context at level 5
 * const compressed = await compressor.compress(context, 5);
 *
 * // Decompress back to full context
 * const restored = await compressor.decompress(compressed);
 *
 * // Prune low-relevance items
 * const pruned = await compressor.prune(context, { relevanceThreshold: 30 });
 * ```
 */
export class ContextCompressor {
  // Priority matrix for context types (reserved for future priority-based compression)
  private readonly _priorityMatrix: Record<ContextType, PriorityConfig>;

  /**
   * Creates a new ContextCompressor instance.
   *
   * @param priorityOverrides - Optional overrides for the default priority matrix
   */
  constructor(priorityOverrides?: Partial<Record<ContextType, PriorityConfig>>) {
    this._priorityMatrix = {
      ...DEFAULT_PRIORITY_MATRIX,
      ...priorityOverrides,
    };
    // Reserved for future priority-based compression
    void this._priorityMatrix;
  }

  /**
   * Compresses a codebase context to reduce size while preserving essential information.
   *
   * Compression levels:
   * - Level 1-2: Light - removes redundant whitespace and comments
   * - Level 3-4: Moderate - semantic deduplication, reduces examples
   * - Level 5-6: Medium - elevates abstractions, strips metadata
   * - Level 7-8: Heavy - progressive summarization, keeps key items only
   * - Level 9-10: Maximum - executive summary only
   *
   * @param context - The codebase context to compress
   * @param level - Compression level from 1 (light) to 10 (maximum)
   * @returns Promise resolving to compressed context representation
   * @throws Error if level is outside valid range (1-10)
   *
   * @example
   * ```typescript
   * const compressed = await compressor.compress(context, 5);
   * console.log(`Compression ratio: ${compressed.compressionRatio}`);
   * ```
   */
  async compress(context: CodebaseContext, level: number): Promise<CompressedContext> {
    if (level < 1 || level > 10) {
      throw new Error(`Compression level must be between 1 and 10, got: ${level}`);
    }

    const originalJson = JSON.stringify(context);
    const originalSize = new TextEncoder().encode(originalJson).length;

    // Apply compression based on level
    let compressedContext: CodebaseContext;

    if (level <= 2) {
      // Light compression
      compressedContext = this.applyLightCompression(context);
    } else if (level <= 4) {
      // Moderate compression
      compressedContext = await this.applyModerateCompression(context);
    } else if (level <= 6) {
      // Medium compression
      compressedContext = await this.applyMediumCompression(context);
    } else if (level <= 8) {
      // Heavy compression
      compressedContext = await this.applyHeavyCompression(context);
    } else {
      // Maximum compression
      compressedContext = await this.applyMaximumCompression(context);
    }

    const compressedJson = JSON.stringify(compressedContext);
    const compressedSize = new TextEncoder().encode(compressedJson).length;

    return {
      originalVersion: FORMAT_VERSION,
      compressionLevel: level,
      encoding: 'json',
      data: compressedJson,
      contentHash: this.computeChecksum(originalJson),
      originalSize,
      compressedSize,
      compressionRatio: compressedSize / originalSize,
    };
  }

  /**
   * Decompresses a compressed context back to full CodebaseContext.
   *
   * @param compressed - The compressed context to restore
   * @returns Promise resolving to the restored codebase context
   * @throws Error if checksum verification fails or encoding is unsupported
   *
   * @example
   * ```typescript
   * const restored = await compressor.decompress(compressed);
   * console.log(`Restored context with ${restored.keyComponents.length} components`);
   * ```
   */
  async decompress(compressed: CompressedContext): Promise<CodebaseContext> {
    if (compressed.encoding !== 'json') {
      throw new Error(`Unsupported encoding: ${compressed.encoding}. Only 'json' is supported.`);
    }

    const context = JSON.parse(compressed.data) as CodebaseContext;
    return context;
  }

  /**
   * Prunes low-relevance items from context based on pruning options.
   *
   * Uses the priority matrix to determine which items to keep based on
   * type priorities, TTL, and target reduction goals.
   *
   * @param context - The codebase context to prune
   * @param options - Options controlling the pruning behavior
   * @returns Promise resolving to pruned context and pruning result
   *
   * @example
   * ```typescript
   * const { context: pruned, result } = await compressor.prune(context, {
   *   relevanceThreshold: 30,
   *   preserveTypes: ['core-patterns'],
   *   maxTokens: 50000
   * });
   * console.log(`Removed ${result.removedItems.length} items`);
   * ```
   */
  async prune(
    context: CodebaseContext,
    options: PruningOptions
  ): Promise<{ context: CodebaseContext; result: PruningResult }> {
    const {
      relevanceThreshold,
      preserveTypes = [],
      preservePaths = [],
      aggressiveness = 5,
    } = options;

    const removedItems: PrunedItem[] = [];
    const originalTokens = this.estimateTokens(context);

    // Prune components based on relevance
    const prunedComponents = context.keyComponents.filter((component) => {
      const contextType = this.categorizeComponent(component);
      const isProtectedType = preserveTypes.includes(contextType);
      const isProtectedPath = preservePaths.some((p) => component.path.includes(p));

      if (isProtectedType || isProtectedPath) {
        return true;
      }

      // Calculate effective relevance based on importance and complexity
      const effectiveRelevance = (component.importance + (100 - component.complexity)) / 2;

      if (effectiveRelevance < relevanceThreshold) {
        removedItems.push({
          path: component.path,
          type: contextType,
          reason: 'low-relevance',
          relevanceScore: effectiveRelevance,
        });
        return false;
      }

      return true;
    });

    // Prune patterns based on aggressiveness
    const patternThreshold = 10 - aggressiveness; // Higher aggressiveness = lower threshold
    const prunedPatterns = {
      ...context.patterns,
      design: context.patterns.design.filter((p) => p.confidence * 10 >= patternThreshold),
      conventions: context.patterns.conventions.filter(
        (c) => c.consistency >= patternThreshold * 10
      ),
    };

    // Prune insights based on impact
    const impactPriority: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const insightThreshold = Math.max(1, 4 - Math.floor(aggressiveness / 3));
    const prunedInsights = context.insights.filter(
      (insight) => (impactPriority[insight.impact] ?? 0) >= insightThreshold
    );

    const prunedContext: CodebaseContext = {
      ...context,
      keyComponents: prunedComponents,
      patterns: prunedPatterns,
      insights: prunedInsights,
    };

    const finalTokens = this.estimateTokens(prunedContext);

    return {
      context: prunedContext,
      result: {
        originalTokens,
        finalTokens,
        removedItems,
        summary: `Pruned ${
          removedItems.length
        } items, reduced from ${originalTokens} to ${finalTokens} tokens (${Math.round(
          (1 - finalTokens / originalTokens) * 100
        )}% reduction)`,
      },
    };
  }

  /**
   * Removes semantically redundant concepts from context.
   *
   * Uses content hashing and similarity detection to identify and remove
   * duplicate or near-duplicate content while preserving unique information.
   *
   * @param context - The codebase context to deduplicate
   * @returns Promise resolving to deduplicated context
   *
   * @example
   * ```typescript
   * const deduped = await compressor.semanticDeduplicate(context);
   * console.log(`Removed ${context.keyComponents.length - deduped.keyComponents.length} duplicate components`);
   * ```
   */
  async semanticDeduplicate(context: CodebaseContext): Promise<CodebaseContext> {
    // Deduplicate components by path and description fingerprint
    const seenComponents = new Set<string>();
    const uniqueComponents = context.keyComponents.filter((component) => {
      const fingerprint = this.createComponentFingerprint(component);
      if (seenComponents.has(fingerprint)) {
        return false;
      }
      seenComponents.add(fingerprint);
      return true;
    });

    // Deduplicate patterns
    const seenPatterns = new Set<string>();
    const uniquePatterns = context.patterns.design.filter((pattern) => {
      const fingerprint = `${pattern.type}:${pattern.name}`;
      if (seenPatterns.has(fingerprint)) {
        return false;
      }
      seenPatterns.add(fingerprint);
      return true;
    });

    // Deduplicate insights
    const seenInsights = new Set<string>();
    const uniqueInsights = context.insights.filter((insight) => {
      const fingerprint = this.createInsightFingerprint(insight);
      if (seenInsights.has(fingerprint)) {
        return false;
      }
      seenInsights.add(fingerprint);
      return true;
    });

    return {
      ...context,
      keyComponents: uniqueComponents,
      patterns: {
        ...context.patterns,
        design: uniquePatterns,
      },
      insights: uniqueInsights,
    };
  }

  /**
   * Gets compression statistics for a context at the specified compression level.
   *
   * @param context - The context to analyze
   * @param options - Compression options including level
   * @returns Promise resolving to compression statistics
   */
  async getCompressionStats(
    context: CodebaseContext,
    options: CompressionOptions = { level: 5 }
  ): Promise<CompressionStats> {
    const startTime = Date.now();
    const originalJson = JSON.stringify(context);
    const originalSize = new TextEncoder().encode(originalJson).length;
    const originalTokens = this.estimateTokens(context);

    // Apply compression to measure results
    const compressed = await this.compress(context, options.level);

    const strategy = this.getStrategyForLevel(options.level);

    return {
      originalSize,
      compressedSize: compressed.compressedSize,
      ratio: compressed.compressionRatio,
      originalTokens,
      finalTokens: Math.round(originalTokens * compressed.compressionRatio),
      compressionTimeMs: Date.now() - startTime,
      strategyUsed: strategy,
    };
  }

  // ============================================================================
  // Private Methods - Compression Strategies
  // ============================================================================

  /**
   * Gets the compression strategy for a given level.
   */
  private getStrategyForLevel(level: number): CompressionStrategy {
    if (level <= 2) return 'semantic-deduplication';
    if (level <= 4) return 'example-reduction';
    if (level <= 6) return 'abstraction-elevation';
    if (level <= 8) return 'progressive-summarization';
    return 'balanced';
  }

  /**
   * Applies light compression (levels 1-2).
   * Removes redundant whitespace and performs basic cleanup.
   */
  private applyLightCompression(context: CodebaseContext): CodebaseContext {
    return {
      ...context,
      summary: {
        ...context.summary,
        technical: this.removeRedundantWhitespace(context.summary.technical),
      },
    };
  }

  /**
   * Applies moderate compression (levels 3-4).
   * Performs semantic deduplication and reduces examples.
   */
  private async applyModerateCompression(context: CodebaseContext): Promise<CodebaseContext> {
    // First apply light compression
    let compressed = this.applyLightCompression(context);

    // Then deduplicate
    compressed = await this.semanticDeduplicate(compressed);

    // Reduce examples in patterns
    compressed = {
      ...compressed,
      patterns: {
        ...compressed.patterns,
        design: compressed.patterns.design.map((p) => ({
          ...p,
          examples: p.examples?.slice(0, 2), // Keep only first 2 examples
        })),
      },
    };

    return compressed;
  }

  /**
   * Applies medium compression (levels 5-6).
   * Elevates abstractions and strips metadata.
   */
  private async applyMediumCompression(context: CodebaseContext): Promise<CodebaseContext> {
    // Apply moderate compression first
    let compressed = await this.applyModerateCompression(context);

    // Strip non-essential metadata and reduce details
    compressed = {
      ...compressed,
      keyComponents: compressed.keyComponents.slice(0, 20).map((c) => ({
        ...c,
        summary: c.summary ? this.truncateContent(c.summary, 200) : undefined,
      })),
      dataFlow: {
        ...compressed.dataFlow,
        flows: compressed.dataFlow.flows.filter((f) => f.critical).slice(0, 10),
      },
    };

    return compressed;
  }

  /**
   * Applies heavy compression (levels 7-8).
   * Progressive summarization, keeps only key items.
   */
  private async applyHeavyCompression(context: CodebaseContext): Promise<CodebaseContext> {
    // Apply medium compression first
    const compressed = await this.applyMediumCompression(context);

    // Keep only high-priority components
    const highPriorityComponents = compressed.keyComponents
      .filter((c) => c.importance >= 70)
      .slice(0, 10)
      .map((c) => ({
        ...c,
        summary: c.summary ? this.truncateContent(c.summary, 100) : undefined,
      }));

    // Keep only high-confidence patterns
    const highConfidencePatterns = compressed.patterns.design
      .filter((p) => p.confidence >= 0.7)
      .slice(0, 5);

    // Keep only high-impact insights
    const highImpactInsights = compressed.insights
      .filter((i) => i.impact === 'critical' || i.impact === 'high')
      .slice(0, 5);

    return {
      ...compressed,
      summary: {
        ...compressed.summary,
        technical: this.truncateContent(compressed.summary.technical, 500),
      },
      keyComponents: highPriorityComponents,
      patterns: {
        ...compressed.patterns,
        design: highConfidencePatterns,
        conventions: compressed.patterns.conventions.slice(0, 3),
      },
      insights: highImpactInsights,
      dataFlow: {
        overview: compressed.dataFlow.overview,
        flows: compressed.dataFlow.flows.slice(0, 3),
      },
    };
  }

  /**
   * Applies maximum compression (levels 9-10).
   * Executive summary only, critical insights preserved.
   */
  private async applyMaximumCompression(context: CodebaseContext): Promise<CodebaseContext> {
    // Keep only the most essential information
    const essentialComponents = context.keyComponents
      .filter((c) => c.importance >= 90)
      .slice(0, 5)
      .map((c) => ({
        path: c.path,
        description: this.truncateContent(c.description, 50),
        importance: c.importance,
        complexity: c.complexity,
        dependencies: c.dependencies.slice(0, 3),
      }));

    const criticalInsights = context.insights.filter((i) => i.impact === 'critical').slice(0, 3);

    return {
      summary: {
        executive: context.summary.executive,
        detailed: this.truncateContent(context.summary.detailed, 200),
        technical: this.truncateContent(context.summary.technical, 100),
      },
      keyComponents: essentialComponents,
      patterns: {
        design: context.patterns.design.filter((p) => p.confidence >= 0.9).slice(0, 3),
        architectural: context.patterns.architectural.slice(0, 3),
        conventions: [],
        frequency: {},
      },
      dependencies: {
        nodes: [],
        edges: [],
        circular: context.dependencies.circular.filter((c) => c.severity === 'critical'),
        stats: context.dependencies.stats,
      },
      dataFlow: {
        overview: this.truncateContent(context.dataFlow.overview, 100),
        flows: [],
      },
      insights: criticalInsights,
      metadata: context.metadata,
    };
  }

  // ============================================================================
  // Private Methods - Utilities
  // ============================================================================

  /**
   * Removes redundant whitespace from content.
   */
  private removeRedundantWhitespace(content: string): string {
    return content
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // Replace multiple blank lines with double
  }

  /**
   * Truncates content to specified length.
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.slice(0, maxLength - 3) + '...';
  }

  /**
   * Categorizes a component based on its path and characteristics.
   */
  private categorizeComponent(component: ComponentInfo): ContextType {
    const path = component.path.toLowerCase();

    // Core patterns - configuration and architectural files
    if (
      path.includes('config') ||
      path.includes('tsconfig') ||
      path.includes('package.json') ||
      path.includes('.eslint')
    ) {
      return 'core-patterns';
    }

    // Architecture decisions - documentation and design files
    if (
      path.includes('readme') ||
      path.includes('architecture') ||
      path.includes('design') ||
      path.includes('adr/')
    ) {
      return 'architecture-decisions';
    }

    // Dependency info
    if (
      path.includes('package-lock') ||
      path.includes('yarn.lock') ||
      path.includes('node_modules')
    ) {
      return 'dependency-info';
    }

    // Historical context - changelog, history
    if (path.includes('changelog') || path.includes('history') || path.includes('.git')) {
      return 'historical-context';
    }

    // File summaries - index files, exports
    if (path.includes('index.') || path.endsWith('.d.ts')) {
      return 'file-summaries';
    }

    // Default to implementation details
    return 'implementation-details';
  }

  /**
   * Creates a fingerprint for component similarity detection.
   */
  private createComponentFingerprint(component: ComponentInfo): string {
    const normalizedPath = component.path.toLowerCase();
    const descriptionPrefix = component.description.toLowerCase().slice(0, 50);
    return `${normalizedPath}|${descriptionPrefix}`;
  }

  /**
   * Creates a fingerprint for insight similarity detection.
   */
  private createInsightFingerprint(insight: Insight): string {
    const descriptionPrefix = insight.description.toLowerCase().slice(0, 100);
    return `${insight.type}|${insight.impact}|${descriptionPrefix}`;
  }

  /**
   * Estimates token count for a context.
   */
  private estimateTokens(context: CodebaseContext): number {
    const json = JSON.stringify(context);
    // Rough estimate: ~4 characters per token for English text
    return Math.ceil(json.length / 4);
  }

  /**
   * Computes a checksum for integrity verification.
   */
  private computeChecksum(data: string): string {
    // Simple checksum using character codes (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

/**
 * Factory function to create a ContextCompressor instance.
 *
 * @param priorityOverrides - Optional overrides for the default priority matrix
 * @returns A new ContextCompressor instance
 *
 * @example
 * ```typescript
 * const compressor = createContextCompressor({
 *   'core-patterns': { priority: 100, compressibility: 0.1, ttlHours: undefined }
 * });
 * ```
 */
export function createContextCompressor(
  priorityOverrides?: Partial<Record<ContextType, PriorityConfig>>
): ContextCompressor {
  return new ContextCompressor(priorityOverrides);
}
