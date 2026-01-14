/**
 * Dependency Analyzer Module
 *
 * Consolidates dependency analysis functionality from:
 * - context-loader's dependency chain tracking
 * - code-explainer's import/export analysis
 * - researcher's dependency graph generation
 *
 * Provides comprehensive dependency analysis including direct imports,
 * transitive dependencies, circular dependency detection, external effects
 * tracking, and full dependency graph generation.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  CircularDependency,
  DependencyAnalysisOptions,
  DependencyChain,
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
  DependencyStats,
  DirectDependency,
  ExternalEffect,
  ImpactLevel,
} from '../types/index.js';

// =============================================================================
// Constants
// =============================================================================

/** Node.js built-in modules */
const BUILTIN_MODULES = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
]);

/** Patterns for detecting external effects in code */
const EXTERNAL_EFFECT_PATTERNS: ReadonlyArray<{
  type: ExternalEffect['type'];
  patterns: RegExp[];
  description: string;
  isSideEffect: boolean;
}> = [
  {
    type: 'file-system',
    patterns: [
      /\bfs\.(read|write|append|mkdir|rmdir|unlink|rename|copy|chmod|chown|stat|access)/i,
      /\bfsPromises\./i,
      /\breadFileSync|writeFileSync\b/i,
    ],
    description: 'File system operations',
    isSideEffect: true,
  },
  {
    type: 'network',
    patterns: [
      /\bfetch\s*\(/i,
      /\baxios\./i,
      /\bhttp\.request|https\.request/i,
      /\bWebSocket\b/i,
      /\bnet\.connect|net\.createConnection/i,
    ],
    description: 'Network requests',
    isSideEffect: true,
  },
  {
    type: 'database',
    patterns: [
      /\b(mongoose|sequelize|prisma|knex|pg|mysql|mongodb)\./i,
      /\.(query|find|insert|update|delete|create)\s*\(/i,
      /\bdb\.(execute|query|run)\b/i,
    ],
    description: 'Database operations',
    isSideEffect: true,
  },
  {
    type: 'environment',
    patterns: [/\bprocess\.env\b/i, /\bdotenv\./i, /\benv\[|getenv\(/i],
    description: 'Environment variable access',
    isSideEffect: false,
  },
  {
    type: 'console',
    patterns: [/\bconsole\.(log|warn|error|info|debug|trace)\b/i],
    description: 'Console output',
    isSideEffect: true,
  },
];

/** Import statement patterns */
const IMPORT_PATTERNS = {
  esm: {
    static:
      /import\s+(?:(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\}|\*\s+as\s+(\w+))?\s*from\s*)?['"]([^'"]+)['"]/g,
    dynamic: /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    typeOnly: /import\s+type\s+(?:\{([^}]*)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g,
  },
  commonjs: {
    require:
      /(?:const|let|var)\s+(?:(\w+)|(\{[^}]*\}))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    requireInline: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  },
};

/** Export statement patterns (exported for future use) */
export const EXPORT_PATTERNS = {
  named: /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g,
  default: /export\s+default\s+(?:(?:class|function)\s+)?(\w+)?/g,
  reExport: /export\s+(?:\{([^}]*)\}|\*(?:\s+as\s+(\w+))?)\s+from\s+['"]([^'"]+)['"]/g,
};

// =============================================================================
// DependencyAnalyzer Class
// =============================================================================

/**
 * Comprehensive dependency analyzer for codebases.
 *
 * Provides methods for analyzing direct and transitive dependencies,
 * detecting circular dependencies, tracking external effects, and
 * building complete dependency graphs.
 *
 * @example
 * ```typescript
 * const analyzer = createDependencyAnalyzer({
 *   rootDir: '/path/to/project',
 *   maxDepth: 5,
 *   trackExternalEffects: true,
 * });
 *
 * // Analyze direct dependencies
 * const deps = await analyzer.analyzeDirect('/path/to/file.ts');
 *
 * // Build full dependency graph
 * const graph = await analyzer.buildDependencyGraph(['src/index.ts']);
 * ```
 */
export class DependencyAnalyzer {
  private readonly options: Required<DependencyAnalysisOptions>;
  private readonly fileCache: Map<string, string> = new Map();
  private readonly dependencyCache: Map<string, DirectDependency[]> = new Map();

  /**
   * Creates a new DependencyAnalyzer instance.
   *
   * @param options - Configuration options for the analyzer
   */
  constructor(options: DependencyAnalysisOptions = {}) {
    this.options = {
      maxDepth: options.maxDepth ?? 10,
      detectCircular: options.detectCircular ?? true,
      trackExternalEffects: options.trackExternalEffects ?? true,
      excludePatterns: options.excludePatterns ?? [
        '**/node_modules/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      includeTypeImports: options.includeTypeImports ?? true,
    };
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Analyzes direct (immediate) dependencies of a file.
   *
   * Parses import/require statements to identify all direct dependencies
   * including internal, external, and built-in modules with version constraints.
   *
   * @param file - Absolute path to the file to analyze
   * @returns Array of direct dependencies with metadata
   *
   * @example
   * ```typescript
   * const deps = await analyzer.analyzeDirect('/src/index.ts');
   * // Returns: [
   * //   { path: './utils', type: 'internal', imports: ['formatDate'] },
   * //   { path: 'lodash', type: 'external', imports: ['debounce'] }
   * // ]
   * ```
   */
  async analyzeDirect(file: string): Promise<DirectDependency[]> {
    // Check cache first
    const cached = this.dependencyCache.get(file);
    if (cached) {
      return cached;
    }

    const content = await this.readFile(file);
    if (!content) {
      return [];
    }

    const dependencies: DirectDependency[] = [];

    // Parse ESM static imports
    this.parseStaticImports(content, file, dependencies);

    // Parse ESM dynamic imports
    this.parseDynamicImports(content, file, dependencies);

    // Parse CommonJS requires
    this.parseCommonJSImports(content, file, dependencies);

    // Parse type-only imports if enabled
    if (this.options.includeTypeImports) {
      this.parseTypeImports(content, file, dependencies);
    }

    // Cache and return
    this.dependencyCache.set(file, dependencies);
    return dependencies;
  }

  /**
   * Analyzes transitive dependencies up to a specified depth.
   *
   * Recursively traces the dependency tree from the given file,
   * building a chain of dependencies at each level.
   *
   * @param file - Absolute path to the root file
   * @param depth - Maximum depth to traverse (defaults to options.maxDepth)
   * @returns Array of dependency chains representing the full tree
   *
   * @example
   * ```typescript
   * const chains = await analyzer.analyzeTransitive('/src/app.ts', 3);
   * // Returns nested chain structure up to depth 3
   * ```
   */
  async analyzeTransitive(file: string, depth?: number): Promise<DependencyChain[]> {
    const maxDepth = depth ?? this.options.maxDepth;
    const visited = new Set<string>();

    return this.buildDependencyChain(file, 0, maxDepth, visited);
  }

  /**
   * Detects circular dependencies within a set of files.
   *
   * Uses depth-first search to identify cycles in the dependency graph,
   * providing severity assessments and resolution suggestions.
   *
   * @param files - Array of file paths to analyze
   * @returns Array of detected circular dependencies with metadata
   *
   * @example
   * ```typescript
   * const circular = await analyzer.detectCircular([
   *   '/src/a.ts',
   *   '/src/b.ts',
   *   '/src/c.ts'
   * ]);
   * // Returns: [{ cycle: ['a.ts', 'b.ts', 'c.ts', 'a.ts'], severity: 'medium' }]
   * ```
   */
  async detectCircular(files: string[]): Promise<CircularDependency[]> {
    const circularDeps: CircularDependency[] = [];
    const adjacencyMap = new Map<string, string[]>();

    // Build adjacency map
    for (const file of files) {
      const deps = await this.analyzeDirect(file);
      const resolvedDeps = deps
        .filter((d) => d.type === 'internal')
        .map((d) => this.resolveModulePath(d.path, file))
        .filter((p): p is string => p !== null);
      adjacencyMap.set(file, resolvedDeps);
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacencyMap.get(node) ?? [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          const cycle = [...path.slice(cycleStart), neighbor];
          const severity = this.assessCircularSeverity(cycle);
          circularDeps.push({
            cycle,
            severity,
            suggestion: this.generateCircularResolutionSuggestion(cycle),
          });
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const file of files) {
      if (!visited.has(file)) {
        dfs(file);
      }
    }

    return circularDeps;
  }

  /**
   * Tracks external effects (side effects) in a file.
   *
   * Identifies operations that interact with the outside world including
   * file system access, network calls, database operations, and more.
   *
   * @param file - Absolute path to the file to analyze
   * @returns Array of detected external effects
   *
   * @example
   * ```typescript
   * const effects = await analyzer.trackExternalEffects('/src/api.ts');
   * // Returns: [
   * //   { type: 'network', description: 'HTTP fetch call', source: '/src/api.ts' }
   * // ]
   * ```
   */
  async trackExternalEffects(file: string): Promise<ExternalEffect[]> {
    const content = await this.readFile(file);
    if (!content) {
      return [];
    }

    const effects: ExternalEffect[] = [];

    for (const pattern of EXTERNAL_EFFECT_PATTERNS) {
      for (const regex of pattern.patterns) {
        if (regex.test(content)) {
          effects.push({
            type: pattern.type,
            description: pattern.description,
            source: file,
            isSideEffect: pattern.isSideEffect,
          });
          break; // Only add one effect per type per file
        }
      }
    }

    return effects;
  }

  /**
   * Builds a complete dependency graph for a set of files.
   *
   * Creates a comprehensive graph structure with nodes, edges, circular
   * dependency detection, and computed statistics.
   *
   * @param files - Array of file paths to include in the graph
   * @returns Complete dependency graph with nodes, edges, and metrics
   *
   * @example
   * ```typescript
   * const graph = await analyzer.buildDependencyGraph([
   *   '/src/index.ts',
   *   '/src/utils/index.ts'
   * ]);
   * console.log(`Graph has ${graph.stats.totalNodes} nodes`);
   * ```
   */
  async buildDependencyGraph(files: string[]): Promise<DependencyGraph> {
    const nodes = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];
    const allFiles = new Set<string>(files);

    // First pass: discover all files transitively
    for (const file of files) {
      await this.discoverAllDependencies(file, allFiles, new Set());
    }

    // Build nodes
    for (const file of allFiles) {
      const deps = await this.analyzeDirect(file);
      const internalDeps = deps.filter((d) => d.type === 'internal');

      const node: DependencyNode = {
        id: file,
        path: file,
        type: 'file',
        inDegree: 0,
        outDegree: internalDeps.length,
      };
      nodes.set(file, node);
    }

    // Build edges and calculate in-degrees
    for (const file of allFiles) {
      const deps = await this.analyzeDirect(file);
      for (const dep of deps) {
        if (dep.type === 'internal') {
          const resolvedPath = this.resolveModulePath(dep.path, file);
          if (resolvedPath && nodes.has(resolvedPath)) {
            edges.push({
              source: file,
              target: resolvedPath,
              type: dep.isDynamic ? 'dynamic' : 'import',
              symbols: dep.imports,
            });

            // Increment in-degree
            const targetNode = nodes.get(resolvedPath);
            if (targetNode) {
              targetNode.inDegree++;
            }
          }
        }
      }
    }

    // Detect circular dependencies
    const circular = this.options.detectCircular ? await this.detectCircular([...allFiles]) : [];

    // Calculate stats
    const nodeArray = [...nodes.values()];
    const stats: DependencyStats = {
      totalNodes: nodeArray.length,
      totalEdges: edges.length,
      circularCount: circular.length,
      maxDepth: await this.calculateMaxDepth(files, allFiles),
      avgDependencies:
        nodeArray.length > 0
          ? nodeArray.reduce((sum, n) => sum + n.outDegree, 0) / nodeArray.length
          : 0,
    };

    return {
      nodes: nodeArray,
      edges,
      circular,
      stats,
    };
  }

  /**
   * Clears all internal caches.
   *
   * Useful when files have changed on disk and cached analysis
   * results may be stale.
   */
  clearCache(): void {
    this.fileCache.clear();
    this.dependencyCache.clear();
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * Reads a file from disk or cache.
   */
  private async readFile(filePath: string): Promise<string | null> {
    const cached = this.fileCache.get(filePath);
    if (cached) {
      return cached;
    }

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      this.fileCache.set(filePath, content);
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Parses ESM static import statements.
   */
  private parseStaticImports(
    content: string,
    sourceFile: string,
    dependencies: DirectDependency[]
  ): void {
    const regex = new RegExp(IMPORT_PATTERNS.esm.static.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const [, defaultImport, namedImports, namespaceImport, modulePath] = match;

      const imports: string[] = [];
      if (defaultImport) imports.push(defaultImport);
      if (namespaceImport) imports.push(`* as ${namespaceImport}`);
      if (namedImports) {
        imports.push(
          ...namedImports
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        );
      }

      dependencies.push(this.createDependency(modulePath, imports, sourceFile, false));
    }
  }

  /**
   * Parses ESM dynamic import statements.
   */
  private parseDynamicImports(
    content: string,
    sourceFile: string,
    dependencies: DirectDependency[]
  ): void {
    const regex = new RegExp(IMPORT_PATTERNS.esm.dynamic.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const [, modulePath] = match;
      dependencies.push(this.createDependency(modulePath, [], sourceFile, true));
    }
  }

  /**
   * Parses CommonJS require statements.
   */
  private parseCommonJSImports(
    content: string,
    sourceFile: string,
    dependencies: DirectDependency[]
  ): void {
    const regex = new RegExp(IMPORT_PATTERNS.commonjs.require.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const [, singleImport, destructuredImports, modulePath] = match;

      const imports: string[] = [];
      if (singleImport) imports.push(singleImport);
      if (destructuredImports) {
        imports.push(
          ...destructuredImports
            .replace(/[{}]/g, '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        );
      }

      dependencies.push(this.createDependency(modulePath, imports, sourceFile, false));
    }
  }

  /**
   * Parses TypeScript type-only import statements.
   */
  private parseTypeImports(
    content: string,
    sourceFile: string,
    dependencies: DirectDependency[]
  ): void {
    const regex = new RegExp(IMPORT_PATTERNS.esm.typeOnly.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const [, namedTypes, namespaceType, defaultType, modulePath] = match;

      const imports: string[] = [];
      if (defaultType) imports.push(defaultType);
      if (namespaceType) imports.push(`* as ${namespaceType}`);
      if (namedTypes) {
        imports.push(
          ...namedTypes
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        );
      }

      const dep = this.createDependency(modulePath, imports, sourceFile, false);
      dep.type = 'type-only';
      dependencies.push(dep);
    }
  }

  /**
   * Creates a DirectDependency object from parsed import data.
   */
  private createDependency(
    modulePath: string,
    imports: string[],
    sourceFile: string,
    isDynamic: boolean
  ): DirectDependency {
    let type: DirectDependency['type'] = 'internal';

    // Check if it's a built-in module
    const baseModule = modulePath.split('/')[0];
    if (BUILTIN_MODULES.has(baseModule) || modulePath.startsWith('node:')) {
      type = 'external';
    } else if (!modulePath.startsWith('.') && !modulePath.startsWith('/')) {
      // External package
      type = 'external';
    }

    return {
      path: modulePath,
      type,
      imports,
      isDynamic,
    };
  }

  /**
   * Resolves a module path relative to the importing file.
   */
  private resolveModulePath(modulePath: string, fromFile: string): string | null {
    if (!modulePath.startsWith('.')) {
      return null; // External module
    }

    const dir = path.dirname(fromFile);
    const resolved = path.resolve(dir, modulePath);

    // Try common extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', ''];
    for (const ext of extensions) {
      const fullPath = resolved + ext;
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return fullPath;
      }

      // Try index file
      const indexPath = path.join(resolved, `index${ext}`);
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return indexPath;
      }
    }

    return null;
  }

  /**
   * Builds a dependency chain recursively.
   */
  private async buildDependencyChain(
    file: string,
    currentDepth: number,
    maxDepth: number,
    visited: Set<string>
  ): Promise<DependencyChain[]> {
    if (currentDepth >= maxDepth || visited.has(file)) {
      return [];
    }

    visited.add(file);

    const deps = await this.analyzeDirect(file);
    const chains: DependencyChain[] = [];

    for (const dep of deps) {
      if (dep.type === 'internal') {
        const resolvedPath = this.resolveModulePath(dep.path, file);
        if (resolvedPath) {
          const nestedChains = await this.buildDependencyChain(
            resolvedPath,
            currentDepth + 1,
            maxDepth,
            new Set(visited)
          );

          chains.push({
            root: file,
            chain: [file, resolvedPath],
            depth: currentDepth,
            hasCircular: visited.has(resolvedPath),
          });

          chains.push(...nestedChains);
        }
      }
    }

    return chains;
  }

  /**
   * Discovers all dependencies transitively.
   */
  private async discoverAllDependencies(
    file: string,
    allFiles: Set<string>,
    visited: Set<string>
  ): Promise<void> {
    if (visited.has(file)) {
      return;
    }

    visited.add(file);

    const deps = await this.analyzeDirect(file);
    for (const dep of deps) {
      if (dep.type === 'internal') {
        const resolvedPath = this.resolveModulePath(dep.path, file);
        if (resolvedPath && !allFiles.has(resolvedPath)) {
          allFiles.add(resolvedPath);
          await this.discoverAllDependencies(resolvedPath, allFiles, visited);
        }
      }
    }
  }

  /**
   * Calculates the maximum depth of the dependency tree.
   */
  private async calculateMaxDepth(entryPoints: string[], allFiles: Set<string>): Promise<number> {
    let maxDepth = 0;

    const calculateDepth = async (
      file: string,
      depth: number,
      visited: Set<string>
    ): Promise<number> => {
      if (visited.has(file)) {
        return depth;
      }

      visited.add(file);
      let localMax = depth;

      const deps = await this.analyzeDirect(file);
      for (const dep of deps) {
        if (dep.type === 'internal') {
          const resolvedPath = this.resolveModulePath(dep.path, file);
          if (resolvedPath && allFiles.has(resolvedPath)) {
            const childDepth = await calculateDepth(resolvedPath, depth + 1, new Set(visited));
            localMax = Math.max(localMax, childDepth);
          }
        }
      }

      return localMax;
    };

    for (const entry of entryPoints) {
      const depth = await calculateDepth(entry, 0, new Set());
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  /**
   * Assesses the severity of a circular dependency.
   */
  private assessCircularSeverity(cycle: string[]): ImpactLevel {
    const length = cycle.length - 1; // Subtract 1 because last element repeats first

    if (length <= 2) {
      return 'high'; // Tight circular dependency is problematic
    } else if (length <= 4) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generates resolution suggestions for circular dependencies.
   */
  private generateCircularResolutionSuggestion(cycle: string[]): string {
    const suggestions: string[] = [
      'Consider extracting shared logic into a separate module',
      'Use dependency injection to break the cycle',
      'Apply the Interface Segregation Principle to create abstraction boundaries',
      'Consider lazy loading or dynamic imports for one direction of the dependency',
    ];

    return suggestions[Math.min(cycle.length - 2, suggestions.length - 1)];
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Creates a new DependencyAnalyzer instance.
 *
 * Factory function for creating dependency analyzers with optional configuration.
 *
 * @param options - Optional configuration options
 * @returns Configured DependencyAnalyzer instance
 *
 * @example
 * ```typescript
 * const analyzer = createDependencyAnalyzer({
 *   maxDepth: 5,
 *   trackExternalEffects: true,
 *   excludePatterns: ['**\/*.test.ts'],
 * });
 * ```
 */
export function createDependencyAnalyzer(options?: DependencyAnalysisOptions): DependencyAnalyzer {
  return new DependencyAnalyzer(options);
}
