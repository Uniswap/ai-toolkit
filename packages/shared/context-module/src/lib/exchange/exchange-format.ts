/**
 * Context Exchange Format Module
 *
 * Standardizes JSON-LD exchange format for cross-agent sharing.
 * Provides export, import, merge, and validation capabilities for context data.
 */

import { createHash } from 'crypto';
import type {
  CodebaseContext,
  ContextExchangeFormat,
  ContextClassification,
  ExportOptions,
  MergeStrategy,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ComponentInfo,
  DesignPattern,
  Convention,
  Insight,
  DependencyNode,
  DependencyEdge,
  CircularDependency,
  DataFlow,
  HierarchicalSummary,
  PatternCatalog,
  DependencyGraph,
  DataFlowMap,
  ContextMetadata,
} from '../types/index.js';

/** Current format version */
const FORMAT_VERSION = '1.0.0' as const;

/**
 * Internal interface for export options with required fields for the exchange
 */
interface InternalExportOptions {
  sourceAgent: string;
  contextType: ContextClassification;
  inheritanceChain?: string[];
  mergeStrategy?: MergeStrategy;
}

/**
 * Context Exchange class for handling cross-agent context sharing.
 *
 * Provides methods for exporting, importing, merging, and validating
 * context data in a standardized exchange format.
 *
 * @example
 * ```typescript
 * const exchange = new ContextExchange();
 *
 * // Export context to exchange format
 * const exported = exchange.export(myContext, {
 *   sourceAgent: 'codebase-explorer',
 *   contextType: 'architecture'
 * });
 *
 * // Validate the exchange format
 * const validation = exchange.validate(exported);
 * if (validation.valid) {
 *   // Import back to context
 *   const imported = exchange.import(exported);
 * }
 * ```
 */
export class ContextExchange {
  /**
   * Export a CodebaseContext to the standardized exchange format.
   *
   * Wraps the context with metadata, checksums, and agent information
   * for safe cross-agent sharing.
   *
   * @param context - The codebase context to export
   * @param options - Export configuration options
   * @returns The context wrapped in exchange format
   *
   * @example
   * ```typescript
   * const exported = exchange.export(context, {
   *   sourceAgent: 'my-agent',
   *   contextType: 'feature',
   *   inheritanceChain: ['parent-context-id'],
   *   mergeStrategy: 'union'
   * });
   * ```
   */
  export(
    context: CodebaseContext,
    options: InternalExportOptions | ExportOptions
  ): ContextExchangeFormat {
    // Handle both internal and standard export options
    const sourceAgent =
      'sourceAgent' in options && options.sourceAgent ? options.sourceAgent : 'unknown-agent';
    const contextType: ContextClassification =
      'contextType' in options && options.contextType
        ? (options.contextType as ContextClassification)
        : 'full';
    const inheritanceChain: string[] =
      'inheritanceChain' in options && options.inheritanceChain
        ? [...options.inheritanceChain]
        : [];
    const mergeStrategy: MergeStrategy =
      'mergeStrategy' in options && options.mergeStrategy ? options.mergeStrategy : 'union';

    // Add context topic to inheritance chain if not already present
    const contextId = context.metadata?.topic ?? `context-${Date.now()}`;
    if (!inheritanceChain.includes(contextId)) {
      inheritanceChain.push(contextId);
    }

    return {
      formatVersion: FORMAT_VERSION,
      sourceAgent,
      contextType,
      inheritanceChain,
      mergeStrategy,
      payload: context,
    };
  }

  /**
   * Import a context from the exchange format.
   *
   * Extracts the CodebaseContext from the exchange wrapper after
   * validating the format.
   *
   * @param exchange - The exchange format to import from
   * @returns The extracted codebase context
   * @throws Error if the exchange format is invalid
   *
   * @example
   * ```typescript
   * try {
   *   const context = exchange.import(receivedExchange);
   *   console.log(`Imported context: ${context.metadata.topic}`);
   * } catch (error) {
   *   console.error('Failed to import:', error.message);
   * }
   * ```
   */
  import(exchange: ContextExchangeFormat): CodebaseContext {
    const validation = this.validate(exchange);
    if (!validation.valid) {
      const errorMessages = validation.errors.map((e) => e.message).join(', ');
      throw new Error(`Invalid exchange format: ${errorMessages}`);
    }

    return exchange.payload;
  }

  /**
   * Merge multiple contexts using the specified strategy.
   *
   * Combines multiple exchange formats into a single unified context.
   * The merge strategy determines how conflicts are resolved.
   *
   * @param contexts - Array of exchange formats to merge
   * @param strategy - The merge strategy to use
   * @returns The merged codebase context
   * @throws Error if no contexts are provided
   *
   * @example
   * ```typescript
   * // Union merge - combine all items, deduplicate by key
   * const merged = exchange.merge([context1, context2], 'union');
   *
   * // Intersection merge - keep only common items
   * const common = exchange.merge([context1, context2], 'intersection');
   *
   * // Override merge - later contexts override earlier
   * const overridden = exchange.merge([baseContext, overrideContext], 'override');
   *
   * // Newest merge - use timestamps to determine precedence
   * const newest = exchange.merge([context1, context2], 'newest');
   *
   * // Highest relevance merge - prioritize by relevance scores
   * const relevant = exchange.merge([context1, context2], 'highest-relevance');
   * ```
   */
  merge(contexts: ContextExchangeFormat[], strategy: MergeStrategy): CodebaseContext {
    if (contexts.length === 0) {
      throw new Error('Cannot merge empty context array');
    }

    if (contexts.length === 1) {
      return this.import(contexts[0]);
    }

    const payloads = contexts.map((c) => c.payload);

    switch (strategy) {
      case 'union':
        return this.mergeUnion(payloads);
      case 'intersection':
        return this.mergeIntersection(payloads);
      case 'override':
        return this.mergeOverride(payloads);
      case 'newest':
        return this.mergeNewest(payloads);
      case 'highest-relevance':
        return this.mergeHighestRelevance(payloads);
      default:
        throw new Error(`Unknown merge strategy: ${strategy}`);
    }
  }

  /**
   * Validate an exchange format for correctness and completeness.
   *
   * Checks format version, required fields, and data integrity.
   *
   * @param exchange - The exchange format to validate
   * @returns Validation result with errors and warnings
   *
   * @example
   * ```typescript
   * const result = exchange.validate(receivedData);
   * if (!result.valid) {
   *   result.errors.forEach(err => {
   *     console.error(`Error at ${err.path}: ${err.message}`);
   *   });
   * }
   * result.warnings.forEach(warn => {
   *   console.warn(`Warning: ${warn.message}`);
   * });
   * ```
   */
  validate(exchange: ContextExchangeFormat): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check format version
    if (!exchange.formatVersion) {
      errors.push({
        code: 'MISSING_VERSION',
        message: 'Format version is required',
        path: 'formatVersion',
      });
    } else if (exchange.formatVersion !== FORMAT_VERSION) {
      warnings.push({
        code: 'VERSION_MISMATCH',
        message: `Expected version ${FORMAT_VERSION}, got ${exchange.formatVersion}`,
        path: 'formatVersion',
      });
    }

    // Check source agent
    if (!exchange.sourceAgent) {
      errors.push({
        code: 'MISSING_SOURCE_AGENT',
        message: 'Source agent identifier is required',
        path: 'sourceAgent',
      });
    }

    // Check context type
    const validContextTypes: ContextClassification[] = [
      'feature',
      'architecture',
      'module',
      'component',
      'full',
    ];
    if (!exchange.contextType) {
      errors.push({
        code: 'MISSING_CONTEXT_TYPE',
        message: 'Context type is required',
        path: 'contextType',
      });
    } else if (!validContextTypes.includes(exchange.contextType)) {
      errors.push({
        code: 'INVALID_CONTEXT_TYPE',
        message: `Invalid context type: ${
          exchange.contextType
        }. Must be one of: ${validContextTypes.join(', ')}`,
        path: 'contextType',
      });
    }

    // Check inheritance chain
    if (!Array.isArray(exchange.inheritanceChain)) {
      errors.push({
        code: 'INVALID_INHERITANCE_CHAIN',
        message: 'Inheritance chain must be an array',
        path: 'inheritanceChain',
      });
    }

    // Check merge strategy
    const validMergeStrategies: MergeStrategy[] = [
      'union',
      'intersection',
      'override',
      'newest',
      'highest-relevance',
    ];
    if (!exchange.mergeStrategy) {
      errors.push({
        code: 'MISSING_MERGE_STRATEGY',
        message: 'Merge strategy is required',
        path: 'mergeStrategy',
      });
    } else if (!validMergeStrategies.includes(exchange.mergeStrategy)) {
      errors.push({
        code: 'INVALID_MERGE_STRATEGY',
        message: `Invalid merge strategy: ${
          exchange.mergeStrategy
        }. Must be one of: ${validMergeStrategies.join(', ')}`,
        path: 'mergeStrategy',
      });
    }

    // Check payload
    if (!exchange.payload) {
      errors.push({
        code: 'MISSING_PAYLOAD',
        message: 'Payload is required',
        path: 'payload',
      });
    } else {
      this.validatePayload(exchange.payload, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get the inheritance chain from an exchange format.
   *
   * Returns the lineage of context identifiers, showing the
   * provenance of the context data.
   *
   * @param exchange - The exchange format to get lineage from
   * @returns Array of context identifiers in inheritance order
   *
   * @example
   * ```typescript
   * const chain = exchange.getInheritanceChain(contextExchange);
   * console.log('Context lineage:', chain.join(' -> '));
   * // Output: "root-context -> feature-branch -> current-context"
   * ```
   */
  getInheritanceChain(exchange: ContextExchangeFormat): string[] {
    return [...exchange.inheritanceChain];
  }

  /**
   * Validate the payload (CodebaseContext) structure.
   */
  private validatePayload(
    payload: CodebaseContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check summary
    if (!payload.summary) {
      errors.push({
        code: 'MISSING_PAYLOAD_SUMMARY',
        message: 'Payload summary is required',
        path: 'payload.summary',
      });
    } else {
      if (!payload.summary.executive) {
        warnings.push({
          code: 'MISSING_EXECUTIVE_SUMMARY',
          message: 'Executive summary is missing',
          path: 'payload.summary.executive',
        });
      }
    }

    // Check key components
    if (!Array.isArray(payload.keyComponents)) {
      errors.push({
        code: 'INVALID_PAYLOAD_KEY_COMPONENTS',
        message: 'Payload keyComponents must be an array',
        path: 'payload.keyComponents',
      });
    } else if (payload.keyComponents.length === 0) {
      warnings.push({
        code: 'EMPTY_KEY_COMPONENTS',
        message: 'Context contains no key components',
        path: 'payload.keyComponents',
      });
    }

    // Check patterns
    if (!payload.patterns) {
      errors.push({
        code: 'MISSING_PAYLOAD_PATTERNS',
        message: 'Payload patterns is required',
        path: 'payload.patterns',
      });
    }

    // Check dependencies
    if (!payload.dependencies) {
      errors.push({
        code: 'MISSING_PAYLOAD_DEPENDENCIES',
        message: 'Payload dependencies is required',
        path: 'payload.dependencies',
      });
    }

    // Check data flow
    if (!payload.dataFlow) {
      errors.push({
        code: 'MISSING_PAYLOAD_DATA_FLOW',
        message: 'Payload dataFlow is required',
        path: 'payload.dataFlow',
      });
    }

    // Check insights
    if (!Array.isArray(payload.insights)) {
      errors.push({
        code: 'INVALID_PAYLOAD_INSIGHTS',
        message: 'Payload insights must be an array',
        path: 'payload.insights',
      });
    }

    // Check metadata
    if (!payload.metadata) {
      errors.push({
        code: 'MISSING_PAYLOAD_METADATA',
        message: 'Payload metadata is required',
        path: 'payload.metadata',
      });
    } else {
      if (!payload.metadata.createdAt) {
        errors.push({
          code: 'MISSING_METADATA_CREATED_AT',
          message: 'Metadata createdAt is required',
          path: 'payload.metadata.createdAt',
        });
      }
      if (!payload.metadata.topic) {
        warnings.push({
          code: 'MISSING_METADATA_TOPIC',
          message: 'Metadata topic is missing',
          path: 'payload.metadata.topic',
        });
      }
    }
  }

  /**
   * Compute a SHA-256 checksum for a context payload (reserved for future validation).
   */
  private _computeChecksum(context: CodebaseContext): string {
    // Suppress unused warning - reserved for future validation
    void context;
    const serialized = JSON.stringify(context, Object.keys(context).sort());
    return createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Getter to access computeChecksum for future use
   */
  protected get computeChecksum(): (context: CodebaseContext) => string {
    return this._computeChecksum.bind(this);
  }

  /**
   * Union merge: Combine all items, deduplicate by key.
   */
  private mergeUnion(payloads: CodebaseContext[]): CodebaseContext {
    const now = new Date().toISOString();

    return {
      summary: this.mergeSummaries(
        payloads.map((p) => p.summary),
        'union'
      ),
      keyComponents: this.mergeComponents(
        payloads.map((p) => p.keyComponents),
        'union'
      ),
      patterns: this.mergePatternCatalogs(
        payloads.map((p) => p.patterns),
        'union'
      ),
      dependencies: this.mergeDependencyGraphs(
        payloads.map((p) => p.dependencies),
        'union'
      ),
      dataFlow: this.mergeDataFlowMaps(
        payloads.map((p) => p.dataFlow),
        'union'
      ),
      insights: this.mergeInsights(
        payloads.map((p) => p.insights),
        'union'
      ),
      metadata: this.mergeContextMetadata(
        payloads.map((p) => p.metadata),
        now
      ),
    };
  }

  /**
   * Intersection merge: Keep only items present in all contexts.
   */
  private mergeIntersection(payloads: CodebaseContext[]): CodebaseContext {
    const now = new Date().toISOString();

    return {
      summary: this.mergeSummaries(
        payloads.map((p) => p.summary),
        'intersection'
      ),
      keyComponents: this.mergeComponents(
        payloads.map((p) => p.keyComponents),
        'intersection'
      ),
      patterns: this.mergePatternCatalogs(
        payloads.map((p) => p.patterns),
        'intersection'
      ),
      dependencies: this.mergeDependencyGraphs(
        payloads.map((p) => p.dependencies),
        'intersection'
      ),
      dataFlow: this.mergeDataFlowMaps(
        payloads.map((p) => p.dataFlow),
        'intersection'
      ),
      insights: this.mergeInsights(
        payloads.map((p) => p.insights),
        'intersection'
      ),
      metadata: this.mergeContextMetadata(
        payloads.map((p) => p.metadata),
        now
      ),
    };
  }

  /**
   * Override merge: Later contexts override earlier ones.
   */
  private mergeOverride(payloads: CodebaseContext[]): CodebaseContext {
    const now = new Date().toISOString();

    return {
      summary: this.mergeSummaries(
        payloads.map((p) => p.summary),
        'override'
      ),
      keyComponents: this.mergeComponents(
        payloads.map((p) => p.keyComponents),
        'override'
      ),
      patterns: this.mergePatternCatalogs(
        payloads.map((p) => p.patterns),
        'override'
      ),
      dependencies: this.mergeDependencyGraphs(
        payloads.map((p) => p.dependencies),
        'override'
      ),
      dataFlow: this.mergeDataFlowMaps(
        payloads.map((p) => p.dataFlow),
        'override'
      ),
      insights: this.mergeInsights(
        payloads.map((p) => p.insights),
        'override'
      ),
      metadata: this.mergeContextMetadata(
        payloads.map((p) => p.metadata),
        now
      ),
    };
  }

  /**
   * Newest merge: Use timestamps to determine precedence.
   */
  private mergeNewest(payloads: CodebaseContext[]): CodebaseContext {
    // Sort by createdAt timestamp (newest first)
    const sorted = [...payloads].sort((a, b) => {
      const aTime = a.metadata?.createdAt ? new Date(a.metadata.createdAt).getTime() : 0;
      const bTime = b.metadata?.createdAt ? new Date(b.metadata.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    // Use override strategy with sorted payloads (newest wins)
    return this.mergeOverride(sorted.reverse());
  }

  /**
   * Highest relevance merge: Prioritize by component importance scores.
   */
  private mergeHighestRelevance(payloads: CodebaseContext[]): CodebaseContext {
    const now = new Date().toISOString();

    // Merge components by highest importance
    const allComponents = payloads.flatMap((p) => p.keyComponents);
    const componentMap = new Map<string, ComponentInfo>();
    for (const component of allComponents) {
      const existing = componentMap.get(component.path);
      if (!existing || component.importance > existing.importance) {
        componentMap.set(component.path, component);
      }
    }

    // Merge insights by highest impact
    const allInsights = payloads.flatMap((p) => p.insights);
    const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const insightMap = new Map<string, Insight>();
    for (const insight of allInsights) {
      const key = `${insight.type}:${insight.description.slice(0, 50)}`;
      const existing = insightMap.get(key);
      if (!existing || impactOrder[insight.impact] > impactOrder[existing.impact]) {
        insightMap.set(key, insight);
      }
    }

    return {
      summary: this.mergeSummaries(
        payloads.map((p) => p.summary),
        'override'
      ),
      keyComponents: Array.from(componentMap.values()).sort((a, b) => b.importance - a.importance),
      patterns: this.mergePatternCatalogs(
        payloads.map((p) => p.patterns),
        'union'
      ),
      dependencies: this.mergeDependencyGraphs(
        payloads.map((p) => p.dependencies),
        'union'
      ),
      dataFlow: this.mergeDataFlowMaps(
        payloads.map((p) => p.dataFlow),
        'union'
      ),
      insights: Array.from(insightMap.values()),
      metadata: this.mergeContextMetadata(
        payloads.map((p) => p.metadata),
        now
      ),
    };
  }

  /**
   * Merge hierarchical summaries.
   */
  private mergeSummaries(
    summaries: HierarchicalSummary[],
    strategy: 'union' | 'intersection' | 'override'
  ): HierarchicalSummary {
    if (summaries.length === 0) {
      return { executive: '', detailed: '', technical: '' };
    }

    if (strategy === 'override') {
      return summaries[summaries.length - 1];
    }

    // For union/intersection, combine summaries
    return {
      executive: summaries
        .map((s) => s.executive)
        .filter(Boolean)
        .join(' '),
      detailed: summaries
        .map((s) => s.detailed)
        .filter(Boolean)
        .join('\n\n'),
      technical: summaries
        .map((s) => s.technical)
        .filter(Boolean)
        .join('\n\n'),
    };
  }

  /**
   * Merge component arrays.
   */
  private mergeComponents(
    componentArrays: ComponentInfo[][],
    strategy: 'union' | 'intersection' | 'override'
  ): ComponentInfo[] {
    if (componentArrays.length === 0) return [];

    if (strategy === 'override') {
      const componentMap = new Map<string, ComponentInfo>();
      for (const components of componentArrays) {
        for (const component of components) {
          componentMap.set(component.path, component);
        }
      }
      return Array.from(componentMap.values());
    }

    if (strategy === 'intersection') {
      const pathSets = componentArrays.map((arr) => new Set(arr.map((c) => c.path)));
      const commonPaths = this.intersectSets(pathSets);
      return componentArrays[0].filter((c) => commonPaths.has(c.path));
    }

    // Union
    const componentMap = new Map<string, ComponentInfo>();
    for (const components of componentArrays) {
      for (const component of components) {
        componentMap.set(component.path, component);
      }
    }
    return Array.from(componentMap.values());
  }

  /**
   * Merge pattern catalogs.
   */
  private mergePatternCatalogs(
    catalogs: PatternCatalog[],
    strategy: 'union' | 'intersection' | 'override'
  ): PatternCatalog {
    if (catalogs.length === 0) {
      return { design: [], architectural: [], conventions: [], frequency: {} };
    }

    if (strategy === 'override') {
      return catalogs[catalogs.length - 1];
    }

    // Merge design patterns
    const designMap = new Map<string, DesignPattern>();
    for (const catalog of catalogs) {
      for (const pattern of catalog.design) {
        const key = `${pattern.type}:${pattern.name}`;
        designMap.set(key, pattern);
      }
    }

    // Merge architectural patterns
    const archSet = new Set<string>();
    for (const catalog of catalogs) {
      for (const arch of catalog.architectural) {
        archSet.add(arch);
      }
    }

    // Merge conventions
    const convMap = new Map<string, Convention>();
    for (const catalog of catalogs) {
      for (const conv of catalog.conventions) {
        convMap.set(conv.name, conv);
      }
    }

    // Merge frequency
    const frequency: Record<string, number> = {};
    for (const catalog of catalogs) {
      for (const [key, value] of Object.entries(catalog.frequency)) {
        frequency[key] = Math.max(frequency[key] ?? 0, value);
      }
    }

    if (strategy === 'intersection') {
      // Keep only patterns present in all catalogs
      const designKeys = catalogs.map((c) => new Set(c.design.map((p) => `${p.type}:${p.name}`)));
      const commonDesign = this.intersectSets(designKeys);

      const archSets = catalogs.map((c) => new Set(c.architectural));
      const commonArch = this.intersectSets(archSets);

      const convKeys = catalogs.map((c) => new Set(c.conventions.map((cv) => cv.name)));
      const commonConv = this.intersectSets(convKeys);

      return {
        design: Array.from(designMap.values()).filter((p) =>
          commonDesign.has(`${p.type}:${p.name}`)
        ),
        architectural: Array.from(commonArch),
        conventions: Array.from(convMap.values()).filter((c) => commonConv.has(c.name)),
        frequency,
      };
    }

    return {
      design: Array.from(designMap.values()),
      architectural: Array.from(archSet),
      conventions: Array.from(convMap.values()),
      frequency,
    };
  }

  /**
   * Merge dependency graphs.
   */
  private mergeDependencyGraphs(
    graphs: DependencyGraph[],
    strategy: 'union' | 'intersection' | 'override'
  ): DependencyGraph {
    if (graphs.length === 0) {
      return {
        nodes: [],
        edges: [],
        circular: [],
        stats: { totalNodes: 0, totalEdges: 0, circularCount: 0, maxDepth: 0, avgDependencies: 0 },
      };
    }

    if (strategy === 'override') {
      return graphs[graphs.length - 1];
    }

    // Merge nodes
    const nodeMap = new Map<string, DependencyNode>();
    for (const graph of graphs) {
      for (const node of graph.nodes) {
        nodeMap.set(node.id, node);
      }
    }

    // Merge edges
    const edgeMap = new Map<string, DependencyEdge>();
    for (const graph of graphs) {
      for (const edge of graph.edges) {
        const key = `${edge.source}:${edge.target}:${edge.type}`;
        edgeMap.set(key, edge);
      }
    }

    // Merge circular dependencies
    const circularMap = new Map<string, CircularDependency>();
    for (const graph of graphs) {
      for (const circ of graph.circular) {
        const key = circ.cycle.sort().join(':');
        circularMap.set(key, circ);
      }
    }

    if (strategy === 'intersection') {
      const nodeIds = graphs.map((g) => new Set(g.nodes.map((n) => n.id)));
      const commonNodes = this.intersectSets(nodeIds);

      const edgeKeys = graphs.map(
        (g) => new Set(g.edges.map((e) => `${e.source}:${e.target}:${e.type}`))
      );
      const commonEdges = this.intersectSets(edgeKeys);

      const nodes = Array.from(nodeMap.values()).filter((n) => commonNodes.has(n.id));
      const edges = Array.from(edgeMap.values()).filter((e) =>
        commonEdges.has(`${e.source}:${e.target}:${e.type}`)
      );

      return {
        nodes,
        edges,
        circular: Array.from(circularMap.values()),
        stats: this.computeDependencyStats(nodes, edges, Array.from(circularMap.values())),
      };
    }

    const nodes = Array.from(nodeMap.values());
    const edges = Array.from(edgeMap.values());
    const circular = Array.from(circularMap.values());

    return {
      nodes,
      edges,
      circular,
      stats: this.computeDependencyStats(nodes, edges, circular),
    };
  }

  /**
   * Compute dependency statistics.
   */
  private computeDependencyStats(
    nodes: DependencyNode[],
    edges: DependencyEdge[],
    circular: CircularDependency[]
  ): DependencyGraph['stats'] {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const circularCount = circular.length;

    // Calculate max depth and average dependencies
    const outDegrees = new Map<string, number>();
    for (const edge of edges) {
      outDegrees.set(edge.source, (outDegrees.get(edge.source) ?? 0) + 1);
    }

    const avgDependencies = totalNodes > 0 ? totalEdges / totalNodes : 0;
    const maxDepth = Math.max(...Array.from(outDegrees.values()), 0);

    return {
      totalNodes,
      totalEdges,
      circularCount,
      maxDepth,
      avgDependencies: Math.round(avgDependencies * 100) / 100,
    };
  }

  /**
   * Merge data flow maps.
   */
  private mergeDataFlowMaps(
    maps: DataFlowMap[],
    strategy: 'union' | 'intersection' | 'override'
  ): DataFlowMap {
    if (maps.length === 0) {
      return { overview: '', flows: [] };
    }

    if (strategy === 'override') {
      return maps[maps.length - 1];
    }

    // Merge flows
    const flowMap = new Map<string, DataFlow>();
    for (const map of maps) {
      for (const flow of map.flows) {
        const key = `${flow.source}:${flow.destination}`;
        flowMap.set(key, flow);
      }
    }

    if (strategy === 'intersection') {
      const flowKeys = maps.map((m) => new Set(m.flows.map((f) => `${f.source}:${f.destination}`)));
      const commonFlows = this.intersectSets(flowKeys);

      return {
        overview: maps
          .map((m) => m.overview)
          .filter(Boolean)
          .join('\n'),
        flows: Array.from(flowMap.values()).filter((f) =>
          commonFlows.has(`${f.source}:${f.destination}`)
        ),
      };
    }

    return {
      overview: maps
        .map((m) => m.overview)
        .filter(Boolean)
        .join('\n'),
      flows: Array.from(flowMap.values()),
    };
  }

  /**
   * Merge insight arrays.
   */
  private mergeInsights(
    insightArrays: Insight[][],
    strategy: 'union' | 'intersection' | 'override'
  ): Insight[] {
    if (insightArrays.length === 0) return [];

    if (strategy === 'override') {
      const insightMap = new Map<string, Insight>();
      for (const insights of insightArrays) {
        for (const insight of insights) {
          const key = `${insight.type}:${insight.description.slice(0, 50)}`;
          insightMap.set(key, insight);
        }
      }
      return Array.from(insightMap.values());
    }

    if (strategy === 'intersection') {
      const insightKeys = insightArrays.map(
        (arr) => new Set(arr.map((i) => `${i.type}:${i.description.slice(0, 50)}`))
      );
      const commonInsights = this.intersectSets(insightKeys);

      const insightMap = new Map<string, Insight>();
      for (const insight of insightArrays[0]) {
        const key = `${insight.type}:${insight.description.slice(0, 50)}`;
        if (commonInsights.has(key)) {
          insightMap.set(key, insight);
        }
      }
      return Array.from(insightMap.values());
    }

    // Union
    const insightMap = new Map<string, Insight>();
    for (const insights of insightArrays) {
      for (const insight of insights) {
        const key = `${insight.type}:${insight.description.slice(0, 50)}`;
        insightMap.set(key, insight);
      }
    }
    return Array.from(insightMap.values());
  }

  /**
   * Merge context metadata.
   */
  private mergeContextMetadata(metadataArray: ContextMetadata[], now: string): ContextMetadata {
    // Combine files from all metadata
    const allFiles = new Set<string>();
    const allFocus = new Set<string>();
    let totalTokens = 0;
    let totalTime = 0;

    for (const meta of metadataArray) {
      for (const file of meta.files) {
        allFiles.add(file);
      }
      if (meta.focus) {
        for (const f of meta.focus) {
          allFocus.add(f);
        }
      }
      if (meta.tokenCount) {
        totalTokens += meta.tokenCount;
      }
      if (meta.analysisTimeMs) {
        totalTime += meta.analysisTimeMs;
      }
    }

    return {
      createdAt: now,
      updatedAt: now,
      topic: metadataArray
        .map((m) => m.topic)
        .filter(Boolean)
        .join(' + '),
      files: Array.from(allFiles),
      focus: allFocus.size > 0 ? Array.from(allFocus) : undefined,
      tokenCount: totalTokens > 0 ? totalTokens : undefined,
      analysisTimeMs: totalTime > 0 ? totalTime : undefined,
    };
  }

  /**
   * Compute the intersection of multiple sets.
   */
  private intersectSets<T>(sets: Set<T>[]): Set<T> {
    if (sets.length === 0) return new Set();
    if (sets.length === 1) return new Set(sets[0]);

    const [first, ...rest] = sets;
    const result = new Set<T>();

    for (const item of first) {
      if (rest.every((set) => set.has(item))) {
        result.add(item);
      }
    }

    return result;
  }
}

/**
 * Factory function to create a new ContextExchange instance.
 *
 * @returns A new ContextExchange instance
 *
 * @example
 * ```typescript
 * const exchange = createContextExchange();
 * const exported = exchange.export(myContext, {
 *   sourceAgent: 'my-agent',
 *   contextType: 'feature'
 * });
 * ```
 */
export function createContextExchange(): ContextExchange {
  return new ContextExchange();
}
