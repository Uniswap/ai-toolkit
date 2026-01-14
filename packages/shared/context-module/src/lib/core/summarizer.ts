/**
 * Summarizer Module
 *
 * Consolidates summarization capabilities from:
 * - context-loader's hierarchical summarization
 * - code-explainer's architectural synthesis
 * - researcher's documentation synthesis
 *
 * Provides multi-level summarization of files, modules, and codebases
 * with insight extraction and relevance scoring.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type {
  CodebaseContext,
  FileSummary,
  HierarchicalSummary,
  Insight,
  InsightType,
  ImpactLevel,
  ModuleSummary,
  SummarizationOptions,
} from '../types/index.js';

/**
 * Default options for summarization operations
 */
const DEFAULT_OPTIONS: Required<SummarizationOptions> = {
  maxLength: 2000,
  detailLevel: 'standard',
  includeExamples: true,
  focusAreas: [],
  audience: 'developer',
};

/**
 * Language detection patterns
 */
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React)',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript (React)',
  '.mjs': 'JavaScript (ESM)',
  '.cjs': 'JavaScript (CJS)',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.cpp': 'C++',
  '.c': 'C',
  '.h': 'C/C++ Header',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.md': 'Markdown',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
};

/**
 * Patterns for detecting file purpose from content
 */
interface PurposePattern {
  pattern: RegExp;
  purpose: string;
  confidence: number;
}

const PURPOSE_PATTERNS: PurposePattern[] = [
  { pattern: /export\s+default\s+function\s+\w+Page/i, purpose: 'Page component', confidence: 0.9 },
  {
    pattern: /export\s+(?:const|function)\s+\w+Controller/i,
    purpose: 'Controller',
    confidence: 0.9,
  },
  {
    pattern: /export\s+(?:const|function)\s+\w+Service/i,
    purpose: 'Service layer',
    confidence: 0.9,
  },
  {
    pattern: /export\s+(?:const|function)\s+\w+Repository/i,
    purpose: 'Data repository',
    confidence: 0.9,
  },
  {
    pattern: /export\s+(?:const|function)\s+\w+Hook/i,
    purpose: 'Custom React hook',
    confidence: 0.85,
  },
  {
    pattern: /export\s+(?:const|function)\s+use[A-Z]\w+/,
    purpose: 'Custom React hook',
    confidence: 0.85,
  },
  {
    pattern: /export\s+interface\s+\w+Props/i,
    purpose: 'Component props definition',
    confidence: 0.8,
  },
  { pattern: /export\s+type\s+\w+State/i, purpose: 'State type definition', confidence: 0.8 },
  { pattern: /export\s+const\s+\w+Schema/i, purpose: 'Validation schema', confidence: 0.85 },
  { pattern: /export\s+const\s+\w+Config/i, purpose: 'Configuration', confidence: 0.85 },
  { pattern: /export\s+const\s+\w+Constants/i, purpose: 'Constants definition', confidence: 0.85 },
  {
    pattern: /export\s+class\s+\w+Error\s+extends/i,
    purpose: 'Custom error class',
    confidence: 0.9,
  },
  { pattern: /describe\s*\(\s*['"`]/, purpose: 'Test suite', confidence: 0.95 },
  { pattern: /it\s*\(\s*['"`].*should/i, purpose: 'Test suite', confidence: 0.9 },
  { pattern: /test\s*\(\s*['"`]/, purpose: 'Test suite', confidence: 0.9 },
  { pattern: /export\s+\*\s+from/, purpose: 'Barrel/index file', confidence: 0.9 },
  { pattern: /export\s+{\s*\w+\s*}\s+from/, purpose: 'Re-export module', confidence: 0.8 },
  { pattern: /createSlice\s*\(/, purpose: 'Redux slice', confidence: 0.95 },
  { pattern: /createAsyncThunk\s*\(/, purpose: 'Redux async thunk', confidence: 0.95 },
  { pattern: /styled\.\w+`/, purpose: 'Styled component', confidence: 0.9 },
  { pattern: /css`/, purpose: 'CSS-in-JS styles', confidence: 0.85 },
  { pattern: /prisma\.\w+\./, purpose: 'Prisma database operations', confidence: 0.9 },
  {
    pattern: /router\.(get|post|put|delete|patch)\s*\(/,
    purpose: 'API route handler',
    confidence: 0.9,
  },
  { pattern: /app\.(get|post|put|delete|patch)\s*\(/, purpose: 'Express route', confidence: 0.85 },
];

/**
 * Patterns for extracting insights
 */
interface InsightPattern {
  pattern: RegExp;
  type: InsightType;
  impact: ImpactLevel;
  title: string;
  descriptionTemplate: string;
}

const INSIGHT_PATTERNS: InsightPattern[] = [
  {
    pattern: /TODO:\s*(.+)/gi,
    type: 'opportunity',
    impact: 'low',
    title: 'Pending TODO',
    descriptionTemplate: 'TODO item found: {match}',
  },
  {
    pattern: /FIXME:\s*(.+)/gi,
    type: 'risk',
    impact: 'medium',
    title: 'FIXME Required',
    descriptionTemplate: 'FIXME item requires attention: {match}',
  },
  {
    pattern: /HACK:\s*(.+)/gi,
    type: 'gotcha',
    impact: 'medium',
    title: 'Known Hack',
    descriptionTemplate: 'Known hack in codebase: {match}',
  },
  {
    pattern: /DEPRECATED:\s*(.+)/gi,
    type: 'risk',
    impact: 'medium',
    title: 'Deprecated Code',
    descriptionTemplate: 'Deprecated code found: {match}',
  },
  {
    pattern: /@deprecated/gi,
    type: 'risk',
    impact: 'low',
    title: 'Deprecated API',
    descriptionTemplate: 'Deprecated API usage detected',
  },
  {
    pattern: /any\s*[;,)]/g,
    type: 'gotcha',
    impact: 'low',
    title: 'Type Safety Gap',
    descriptionTemplate: 'Use of `any` type reduces type safety',
  },
  {
    pattern: /eslint-disable/gi,
    type: 'gotcha',
    impact: 'low',
    title: 'Linting Disabled',
    descriptionTemplate: 'ESLint rules disabled - verify this is intentional',
  },
  {
    pattern: /ts-ignore|ts-expect-error/gi,
    type: 'gotcha',
    impact: 'low',
    title: 'TypeScript Override',
    descriptionTemplate: 'TypeScript error suppressed - verify this is safe',
  },
  {
    pattern: /process\.env\.\w+/g,
    type: 'pattern',
    impact: 'low',
    title: 'Environment Variable',
    descriptionTemplate: 'Environment variable dependency detected',
  },
  {
    pattern: /console\.(log|warn|error|debug)/g,
    type: 'gotcha',
    impact: 'low',
    title: 'Console Statement',
    descriptionTemplate: 'Console statement found - may need removal for production',
  },
  {
    pattern: /catch\s*\(\s*\w*\s*\)\s*{\s*}/g,
    type: 'risk',
    impact: 'medium',
    title: 'Empty Catch Block',
    descriptionTemplate: 'Empty catch block silently swallows errors',
  },
  {
    pattern: /\/\/\s*@ts-nocheck/gi,
    type: 'risk',
    impact: 'high',
    title: 'TypeScript Disabled',
    descriptionTemplate: 'TypeScript checking disabled for entire file',
  },
];

/**
 * Summarizer class for generating multi-level code summaries and extracting insights.
 *
 * Consolidates summarization capabilities from context-loader, code-explainer,
 * and researcher agents into a unified module.
 *
 * @example
 * ```typescript
 * const summarizer = new Summarizer();
 *
 * // Summarize a single file
 * const fileSummary = await summarizer.summarizeFile('src/services/user.service.ts');
 *
 * // Summarize a module
 * const moduleSummary = await summarizer.summarizeModule('src/services');
 *
 * // Generate hierarchical codebase summary
 * const codebaseSummary = await summarizer.summarizeCodebase('authentication', files);
 * ```
 */
export class Summarizer {
  // Summarization options (reserved for future option-based summarization)
  private _options: Required<SummarizationOptions>;

  /**
   * Creates a new Summarizer instance
   *
   * @param options - Configuration options for summarization
   */
  constructor(options: SummarizationOptions = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...options };
    // Reserved for future option-based summarization
    void this._options;
  }

  /**
   * Summarizes a single file, extracting purpose, exports, and dependencies.
   *
   * Analyzes the file content to determine its role in the codebase,
   * identifies exported symbols, and tracks import dependencies.
   *
   * @param filePath - Absolute or relative path to the file
   * @returns Promise resolving to a FileSummary object
   * @throws Error if the file cannot be read
   *
   * @example
   * ```typescript
   * const summarizer = new Summarizer();
   * const summary = await summarizer.summarizeFile('src/services/auth.service.ts');
   * console.log(summary.purpose); // "Authentication service handling user login and session management"
   * console.log(summary.exports); // ["AuthService", "createAuthService", "AuthConfig"]
   * ```
   */
  async summarizeFile(filePath: string): Promise<FileSummary> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);
    const language = LANGUAGE_EXTENSIONS[ext] ?? 'Unknown';

    // Count lines of code (excluding blank lines and comments)
    const linesOfCode = this.countLinesOfCode(content);

    // Extract purpose from content
    const purpose = this.extractPurpose(content, filePath);

    // Extract exports
    const exports = this.extractExports(content);

    // Extract imports
    const imports = this.extractImports(content);

    // Detect patterns
    const patterns = this.detectFilePatterns(content);

    // Calculate complexity
    const complexity = this.calculateComplexity(content);

    return {
      path: filePath,
      purpose,
      exports,
      imports,
      patterns,
      complexity,
      linesOfCode,
      language,
    };
  }

  /**
   * Summarizes a module (directory), identifying components and relationships.
   *
   * Analyzes all source files in a directory to understand the module's
   * purpose, public API, and internal structure.
   *
   * @param directoryPath - Path to the module directory
   * @returns Promise resolving to a ModuleSummary object
   * @throws Error if the directory cannot be read
   *
   * @example
   * ```typescript
   * const summarizer = new Summarizer();
   * const summary = await summarizer.summarizeModule('src/features/auth');
   * console.log(summary.purpose); // "Authentication feature module"
   * console.log(summary.publicApi); // Exports from index file
   * ```
   */
  async summarizeModule(directoryPath: string): Promise<ModuleSummary> {
    const files = await this.getSourceFiles(directoryPath);
    const fileSummaries: FileSummary[] = [];

    for (const file of files) {
      try {
        const summary = await this.summarizeFile(file);
        fileSummaries.push(summary);
      } catch {
        // Skip files that cannot be summarized
        continue;
      }
    }

    const moduleName = path.basename(directoryPath);
    const purpose = this.synthesizeModulePurpose(fileSummaries, moduleName);
    const publicApi = this.extractPublicApi(fileSummaries, directoryPath);
    const internalComponents = this.identifyInternalComponents(fileSummaries);
    const dependencies = this.aggregateDependencies(fileSummaries);
    const patterns = this.aggregatePatterns(fileSummaries);
    const totalLinesOfCode = fileSummaries.reduce((sum, f) => sum + f.linesOfCode, 0);

    return {
      path: directoryPath,
      name: moduleName,
      purpose,
      publicApi,
      internalComponents,
      dependencies,
      files: fileSummaries,
      patterns,
      totalLinesOfCode,
    };
  }

  /**
   * Generates a hierarchical summary of multiple files around a topic.
   *
   * Creates executive, detailed, and technical summaries suitable for
   * different audiences and use cases.
   *
   * @param topic - The topic or area being analyzed
   * @param files - Array of file paths to include in the summary
   * @returns Promise resolving to a HierarchicalSummary object
   *
   * @example
   * ```typescript
   * const summarizer = new Summarizer();
   * const summary = await summarizer.summarizeCodebase('payment processing', [
   *   'src/services/payment.service.ts',
   *   'src/controllers/payment.controller.ts',
   *   'src/models/payment.model.ts',
   * ]);
   * console.log(summary.executive); // Brief 1-2 sentence summary
   * console.log(summary.detailed);  // 5-10 sentence overview
   * console.log(summary.technical); // Full technical details
   * ```
   */
  async summarizeCodebase(topic: string, files: string[]): Promise<HierarchicalSummary> {
    const fileSummaries: FileSummary[] = [];

    for (const file of files) {
      try {
        const summary = await this.summarizeFile(file);
        fileSummaries.push(summary);
      } catch {
        continue;
      }
    }

    const executive = this.generateExecutiveSummary(topic, fileSummaries);
    const detailed = this.generateDetailedSummary(topic, fileSummaries);
    const technical = this.generateTechnicalSummary(topic, fileSummaries);

    return {
      executive,
      detailed,
      technical,
    };
  }

  /**
   * Extracts key insights from a codebase context.
   *
   * Identifies patterns, risks, opportunities, and gotchas from
   * the analyzed code structure and content.
   *
   * @param context - The codebase context to analyze
   * @returns Promise resolving to an array of Insight objects
   *
   * @example
   * ```typescript
   * const summarizer = new Summarizer();
   * const insights = await summarizer.extractKeyInsights(codebaseContext);
   * const risks = insights.filter(i => i.type === 'risk');
   * const opportunities = insights.filter(i => i.type === 'opportunity');
   * ```
   */
  async extractKeyInsights(context: CodebaseContext): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Extract insights from patterns
    if (context.patterns) {
      insights.push(...this.extractPatternInsights(context.patterns));
    }

    // Extract insights from components
    if (context.keyComponents) {
      insights.push(...this.extractComponentInsights(context.keyComponents));
    }

    // Extract insights from dependencies
    if (context.dependencies) {
      insights.push(...this.extractDependencyInsights(context.dependencies));
    }

    // Include existing insights with deduplication
    if (context.insights) {
      for (const existing of context.insights) {
        if (!insights.some((i) => i.description === existing.description.slice(0, 50))) {
          insights.push(existing);
        }
      }
    }

    // Sort by impact
    const impactOrder: Record<ImpactLevel, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return insights.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
  }

  /**
   * Extracts insights from file content using pattern matching.
   *
   * @param content - File content to analyze
   * @param filePath - Path to the file (for context)
   * @returns Array of extracted insights
   */
  extractInsightsFromContent(content: string, filePath: string): Insight[] {
    const insights: Insight[] = [];

    for (const pattern of INSIGHT_PATTERNS) {
      const matches = content.matchAll(pattern.pattern);
      for (const match of matches) {
        const description = pattern.descriptionTemplate.replace('{match}', match[1] ?? match[0]);

        insights.push({
          type: pattern.type,
          description,
          impact: pattern.impact,
          relatedPaths: [filePath],
          confidence: 0.8,
        });
      }
    }

    return insights;
  }

  /**
   * Counts lines of code excluding blank lines and comments
   */
  private countLinesOfCode(content: string): number {
    const lines = content.split('\n');
    let count = 0;
    let inMultiLineComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Handle multi-line comments
      if (inMultiLineComment) {
        if (trimmed.includes('*/')) {
          inMultiLineComment = false;
        }
        continue;
      }

      if (trimmed.startsWith('/*')) {
        if (!trimmed.includes('*/')) {
          inMultiLineComment = true;
        }
        continue;
      }

      // Skip blank lines and single-line comments
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('#')) {
        continue;
      }

      count++;
    }

    return count;
  }

  /**
   * Extracts the purpose of a file from its content and name
   */
  private extractPurpose(content: string, filePath: string): string {
    // Try to extract from JSDoc or file header comment
    const jsdocMatch = content.match(/\/\*\*\s*\n?\s*\*?\s*(.+?)(?:\n|\*\/)/);
    if (jsdocMatch?.[1]) {
      return jsdocMatch[1].replace(/^\s*\*\s*/, '').trim();
    }

    // Try to match against purpose patterns
    for (const pattern of PURPOSE_PATTERNS) {
      if (pattern.pattern.test(content)) {
        return pattern.purpose;
      }
    }

    // Infer from file name
    const fileName = path.basename(filePath, path.extname(filePath));
    const nameParts = fileName.split(/[.-]/);

    if (nameParts.includes('spec') || nameParts.includes('test')) {
      return 'Test suite';
    }
    if (nameParts.includes('index')) {
      return 'Module entry point / barrel file';
    }
    if (nameParts.includes('types') || nameParts.includes('type')) {
      return 'Type definitions';
    }
    if (nameParts.includes('utils') || nameParts.includes('util')) {
      return 'Utility functions';
    }
    if (nameParts.includes('constants') || nameParts.includes('const')) {
      return 'Constants definition';
    }
    if (nameParts.includes('config')) {
      return 'Configuration';
    }

    return 'Source file';
  }

  /**
   * Extracts exports from file content
   */
  private extractExports(content: string): string[] {
    const exports: string[] = [];

    // Named exports
    const namedExports = content.matchAll(
      /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g
    );
    for (const match of namedExports) {
      if (match[1]) exports.push(match[1]);
    }

    // Default export
    if (/export\s+default/.test(content)) {
      const defaultMatch = content.match(/export\s+default\s+(?:class|function)?\s*(\w+)/);
      if (defaultMatch?.[1]) {
        exports.push(`default: ${defaultMatch[1]}`);
      } else {
        exports.push('default');
      }
    }

    // Re-exports
    const reExports = content.matchAll(/export\s+{\s*([^}]+)\s*}\s+from/g);
    for (const match of reExports) {
      if (match[1]) {
        const items = match[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]);
        exports.push(...items.filter((item): item is string => Boolean(item)));
      }
    }

    return [...new Set(exports)];
  }

  /**
   * Extracts imports from file content
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // Standard imports
    const importMatches = content.matchAll(
      /import\s+(?:type\s+)?(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g
    );
    for (const match of importMatches) {
      if (match[1]) imports.push(match[1]);
    }

    // Dynamic imports
    const dynamicImports = content.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
    for (const match of dynamicImports) {
      if (match[1]) imports.push(`dynamic: ${match[1]}`);
    }

    // Require statements
    const requires = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
    for (const match of requires) {
      if (match[1]) imports.push(match[1]);
    }

    return [...new Set(imports)];
  }

  /**
   * Detects patterns in file content
   */
  private detectFilePatterns(content: string): string[] {
    const patterns: string[] = [];

    // Detect common patterns
    if (/export\s+default\s+function/.test(content)) patterns.push('default-export-function');
    if (/export\s+default\s+class/.test(content)) patterns.push('default-export-class');
    if (/export\s+\*\s+from/.test(content)) patterns.push('barrel-export');
    if (/import\s+type\s+{/.test(content)) patterns.push('type-only-imports');
    if (/\.then\s*\(/.test(content) || /async\s+/.test(content)) patterns.push('async-code');
    if (/useEffect|useState|useCallback|useMemo/.test(content)) patterns.push('react-hooks');
    if (/describe\s*\(|it\s*\(|test\s*\(/.test(content)) patterns.push('test-file');
    if (/createSlice|createAsyncThunk/.test(content)) patterns.push('redux-toolkit');
    if (/styled\.\w+`|css`/.test(content)) patterns.push('css-in-js');
    if (/interface\s+\w+Props/.test(content)) patterns.push('react-props-interface');
    if (/@Injectable|@Controller|@Service/.test(content)) patterns.push('decorator-based-di');
    if (/prisma\.\w+\./.test(content)) patterns.push('prisma-orm');

    return patterns;
  }

  /**
   * Calculates a complexity score for the content
   */
  private calculateComplexity(content: string): number {
    let score = 0;
    const lines = this.countLinesOfCode(content);

    // Base complexity from size
    if (lines > 500) score += 30;
    else if (lines > 200) score += 20;
    else if (lines > 100) score += 10;

    // Complexity from nesting
    const maxNesting = this.calculateMaxNesting(content);
    score += Math.min(maxNesting * 5, 25);

    // Complexity from conditionals
    const conditionals = (content.match(/if\s*\(|switch\s*\(|\?\s*[^:]/g) ?? []).length;
    score += Math.min(conditionals * 2, 20);

    // Complexity from loops
    const loops = (content.match(/for\s*\(|while\s*\(|\.forEach\(|\.map\(|\.reduce\(/g) ?? [])
      .length;
    score += Math.min(loops * 2, 15);

    // Complexity from error handling
    const errorHandling = (content.match(/try\s*{|catch\s*\(/g) ?? []).length;
    score += Math.min(errorHandling, 10);

    return Math.min(score, 100);
  }

  /**
   * Calculates maximum nesting depth
   */
  private calculateMaxNesting(content: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of content) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    return maxDepth;
  }

  /**
   * Gets all source files in a directory recursively
   */
  private async getSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip common non-source directories
        if (entry.isDirectory()) {
          if (
            ['node_modules', 'dist', 'build', '.git', 'coverage', '__pycache__'].includes(
              entry.name
            )
          ) {
            continue;
          }
          const subFiles = await this.getSourceFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (sourceExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory might not exist or be inaccessible
    }

    return files;
  }

  /**
   * Synthesizes a purpose statement for a module from its files
   */
  private synthesizeModulePurpose(files: FileSummary[], moduleName: string): string {
    // Look for common patterns in file purposes
    const purposeCounts = new Map<string, number>();

    for (const file of files) {
      const key = file.purpose.toLowerCase();
      purposeCounts.set(key, (purposeCounts.get(key) ?? 0) + 1);
    }

    // Find dominant purpose
    let dominantPurpose = '';
    let maxCount = 0;
    for (const [purpose, count] of purposeCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantPurpose = purpose;
      }
    }

    // Generate purpose based on patterns
    const patterns = this.aggregatePatterns(files);
    if (patterns.includes('react-hooks')) {
      return `${moduleName} module providing React hooks and state management`;
    }
    if (patterns.includes('test-file')) {
      return `Test suite for ${moduleName}`;
    }
    if (dominantPurpose.includes('service')) {
      return `${moduleName} service layer providing business logic`;
    }
    if (dominantPurpose.includes('controller')) {
      return `${moduleName} controller handling request/response flow`;
    }

    return `${moduleName} module containing ${files.length} files`;
  }

  /**
   * Extracts public API from module files
   */
  private extractPublicApi(files: FileSummary[], modulePath: string): string[] {
    // Look for index/barrel file exports
    const indexFile = files.find(
      (f) =>
        path.basename(f.path) === 'index.ts' ||
        path.basename(f.path) === 'index.js' ||
        path.basename(f.path, path.extname(f.path)) === path.basename(modulePath)
    );

    if (indexFile) {
      return indexFile.exports.filter((e) => !e.startsWith('default'));
    }

    // Fall back to all exports from all files
    return [...new Set(files.flatMap((f) => f.exports))];
  }

  /**
   * Identifies internal components from file summaries
   */
  private identifyInternalComponents(files: FileSummary[]): string[] {
    return files
      .filter((f) => !f.patterns.includes('barrel-export'))
      .map((f) => path.basename(f.path, path.extname(f.path)));
  }

  /**
   * Aggregates external dependencies from file summaries
   */
  private aggregateDependencies(files: FileSummary[]): string[] {
    const external = new Set<string>();

    for (const file of files) {
      for (const imp of file.imports) {
        // External if not relative path
        if (!imp.startsWith('.') && !imp.startsWith('/') && !imp.startsWith('dynamic:')) {
          // Extract package name (handle scoped packages)
          const parts = imp.split('/');
          const pkg = imp.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
          if (pkg) external.add(pkg);
        }
      }
    }

    return [...external];
  }

  /**
   * Aggregates patterns from file summaries
   */
  private aggregatePatterns(files: FileSummary[]): string[] {
    const patternCounts = new Map<string, number>();

    for (const file of files) {
      for (const pattern of file.patterns) {
        patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1);
      }
    }

    // Return patterns that appear in at least 2 files or are significant
    return [...patternCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([pattern]) => pattern);
  }

  /**
   * Generates an executive summary (1-2 sentences)
   */
  private generateExecutiveSummary(topic: string, files: FileSummary[]): string {
    const fileCount = files.length;
    const totalLines = files.reduce((sum, f) => sum + f.linesOfCode, 0);
    const languages = [...new Set(files.map((f) => f.language))];
    const mainLanguage = languages[0] ?? 'code';

    const patterns = this.aggregatePatterns(files);
    const hasTests = patterns.includes('test-file');
    const hasReact = patterns.some((p) => p.includes('react'));

    let summary = `The ${topic} implementation consists of ${fileCount} ${mainLanguage} files totaling ~${totalLines} lines of code.`;

    if (hasReact) {
      summary += ' Uses React with hooks-based architecture.';
    } else if (hasTests) {
      summary += ' Includes comprehensive test coverage.';
    }

    return summary;
  }

  /**
   * Generates a detailed summary (5-10 sentences)
   */
  private generateDetailedSummary(topic: string, files: FileSummary[]): string {
    const parts: string[] = [];

    // Overview
    parts.push(this.generateExecutiveSummary(topic, files));

    // File breakdown
    const byPurpose = new Map<string, number>();
    for (const file of files) {
      byPurpose.set(file.purpose, (byPurpose.get(file.purpose) ?? 0) + 1);
    }

    const purposeBreakdown = [...byPurpose.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([purpose, count]) => `${count} ${purpose.toLowerCase()}${count > 1 ? 's' : ''}`)
      .join(', ');

    parts.push(`The codebase includes ${purposeBreakdown}.`);

    // Complexity overview
    const avgComplexity = files.reduce((sum, f) => sum + f.complexity, 0) / files.length;
    const complexityLevel = avgComplexity > 60 ? 'high' : avgComplexity > 30 ? 'moderate' : 'low';
    parts.push(
      `Overall complexity is ${complexityLevel} (avg score: ${Math.round(avgComplexity)}/100).`
    );

    // Patterns
    const patterns = this.aggregatePatterns(files);
    if (patterns.length > 0) {
      parts.push(`Key patterns detected: ${patterns.slice(0, 5).join(', ')}.`);
    }

    // Dependencies
    const deps = this.aggregateDependencies(files);
    if (deps.length > 0) {
      parts.push(`External dependencies include ${deps.slice(0, 5).join(', ')}.`);
    }

    return parts.join(' ');
  }

  /**
   * Generates a technical summary (full details)
   */
  private generateTechnicalSummary(topic: string, files: FileSummary[]): string {
    const sections: string[] = [];

    // Header
    sections.push(`# Technical Summary: ${topic}\n`);

    // File listing with details
    sections.push('## Files\n');
    for (const file of files.slice(0, 20)) {
      sections.push(
        `- **${path.basename(file.path)}** (${file.linesOfCode} LOC, complexity: ${
          file.complexity
        }/100)`
      );
      sections.push(`  - Purpose: ${file.purpose}`);
      if (file.exports.length > 0) {
        sections.push(`  - Exports: ${file.exports.slice(0, 5).join(', ')}`);
      }
      if (file.patterns.length > 0) {
        sections.push(`  - Patterns: ${file.patterns.join(', ')}`);
      }
    }

    // Patterns section
    const patterns = this.aggregatePatterns(files);
    if (patterns.length > 0) {
      sections.push('\n## Detected Patterns\n');
      for (const pattern of patterns) {
        sections.push(`- ${pattern}`);
      }
    }

    // Dependencies section
    const deps = this.aggregateDependencies(files);
    if (deps.length > 0) {
      sections.push('\n## External Dependencies\n');
      for (const dep of deps) {
        sections.push(`- ${dep}`);
      }
    }

    return sections.join('\n');
  }

  /**
   * Extracts insights from pattern analysis
   */
  private extractPatternInsights(patterns: CodebaseContext['patterns']): Insight[] {
    const insights: Insight[] = [];

    // Check for inconsistent conventions
    if (patterns.conventions) {
      for (const convention of patterns.conventions) {
        if (convention.consistency < 50) {
          insights.push({
            type: 'risk',
            description: `Inconsistent ${convention.name} convention (${convention.consistency}% consistency)`,
            impact: 'low',
            recommendation: 'Consider standardizing the convention across the codebase',
            confidence: 0.8,
          });
        }
      }
    }

    // Architectural insights
    if (patterns.architectural) {
      if (patterns.architectural.length > 3) {
        insights.push({
          type: 'gotcha',
          description:
            'Multiple architectural patterns detected, which may indicate inconsistent design',
          impact: 'medium',
          recommendation: 'Consider consolidating to a primary architecture pattern',
          confidence: 0.7,
        });
      }
    }

    return insights;
  }

  /**
   * Extracts insights from component analysis
   */
  private extractComponentInsights(components: CodebaseContext['keyComponents']): Insight[] {
    const insights: Insight[] = [];

    // Check for high complexity components
    const highComplexity = components.filter((c) => c.complexity > 70);
    for (const component of highComplexity) {
      insights.push({
        type: 'risk',
        description: `High complexity in ${component.path} (score: ${component.complexity}/100)`,
        impact: 'medium',
        relatedPaths: [component.path],
        recommendation: 'Consider refactoring to reduce complexity',
        confidence: 0.85,
      });
    }

    // Check for highly important components
    const critical = components.filter((c) => c.importance > 80);
    if (critical.length > 0) {
      insights.push({
        type: 'pattern',
        description: `${critical.length} critical components identified that require careful maintenance`,
        impact: 'high',
        relatedPaths: critical.map((c) => c.path),
        confidence: 0.9,
      });
    }

    return insights;
  }

  /**
   * Extracts insights from dependency analysis
   */
  private extractDependencyInsights(deps: CodebaseContext['dependencies']): Insight[] {
    const insights: Insight[] = [];

    // Check for circular dependencies
    if (deps.circular && deps.circular.length > 0) {
      for (const circular of deps.circular.slice(0, 5)) {
        insights.push({
          type: 'risk',
          description: `Circular dependency detected: ${circular.cycle.join(' -> ')}`,
          impact: circular.severity,
          relatedPaths: circular.cycle,
          recommendation:
            circular.suggestion ?? 'Break the cycle by introducing an interface or restructuring',
          confidence: 0.95,
        });
      }
    }

    // Check for high dependency counts
    if (deps.stats) {
      if (deps.stats.avgDependencies > 10) {
        insights.push({
          type: 'gotcha',
          description: `High average dependency count (${deps.stats.avgDependencies.toFixed(
            1
          )} per file)`,
          impact: 'medium',
          recommendation: 'Consider reducing coupling between modules',
          confidence: 0.75,
        });
      }

      if (deps.stats.maxDepth > 8) {
        insights.push({
          type: 'risk',
          description: `Deep dependency chain detected (max depth: ${deps.stats.maxDepth})`,
          impact: 'medium',
          recommendation: 'Deep chains can cause maintenance issues and slow build times',
          confidence: 0.8,
        });
      }
    }

    return insights;
  }
}

/**
 * Factory function to create a new Summarizer instance.
 *
 * Provides a convenient way to create a summarizer with optional configuration.
 *
 * @param options - Configuration options for the summarizer
 * @returns A new Summarizer instance
 *
 * @example
 * ```typescript
 * // Create with defaults
 * const summarizer = createSummarizer();
 *
 * // Create with custom options
 * const customSummarizer = createSummarizer({
 *   detailLevel: 'comprehensive',
 *   includeExamples: true,
 *   audience: 'architect',
 * });
 * ```
 */
export function createSummarizer(options?: SummarizationOptions): Summarizer {
  return new Summarizer(options);
}
