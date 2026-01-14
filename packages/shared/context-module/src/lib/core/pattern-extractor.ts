/**
 * Pattern Extractor Module
 *
 * Consolidates pattern recognition from:
 * - context-loader's pattern taxonomy
 * - code-explainer's design pattern detection
 * - researcher's architectural analysis
 *
 * Uses static code analysis techniques to identify design patterns,
 * architectural patterns, and coding conventions.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type {
  ArchitectureStyle,
  ArchitectureStyleType,
  Convention,
  ConventionType,
  DesignPattern,
  DesignPatternType,
  PatternExtractionOptions,
  PatternQuality,
} from '../types/index.js';

/**
 * Default options for pattern extraction
 */
const DEFAULT_OPTIONS: Required<PatternExtractionOptions> = {
  minConfidence: 0.5,
  maxPatterns: 20,
  includeExamples: true,
  excludePatterns: ['node_modules', 'dist', 'build', '.git', 'coverage'],
  maxFiles: 1000,
  depth: 'normal',
};

/**
 * Pattern detection rules for design patterns
 */
interface PatternRule {
  type: DesignPatternType;
  name: string;
  /** Patterns in file names that suggest this pattern */
  fileNamePatterns: RegExp[];
  /** Patterns in code content that suggest this pattern */
  codePatterns: RegExp[];
  /** Description of the pattern */
  description: string;
}

/**
 * Design pattern detection rules
 */
const DESIGN_PATTERN_RULES: PatternRule[] = [
  {
    type: 'factory',
    name: 'Factory Pattern',
    fileNamePatterns: [/factory/i, /creator/i, /builder/i],
    codePatterns: [
      /create[A-Z]\w+\s*\(/,
      /make[A-Z]\w+\s*\(/,
      /build[A-Z]\w+\s*\(/,
      /class\s+\w*Factory/,
      /function\s+create\w+/,
      /export\s+(?:const|function)\s+create\w+/,
    ],
    description:
      'Creates objects without specifying the exact class, delegating instantiation to subclasses or factory methods',
  },
  {
    type: 'singleton',
    name: 'Singleton Pattern',
    fileNamePatterns: [/singleton/i, /instance/i],
    codePatterns: [
      /private\s+static\s+instance/,
      /static\s+getInstance\s*\(/,
      /let\s+instance\s*[=:]/,
      /const\s+instance\s*=/,
      /if\s*\(\s*!instance\s*\)/,
      /instance\s*\?\?\s*=/,
    ],
    description:
      'Ensures a class has only one instance and provides a global point of access to it',
  },
  {
    type: 'observer',
    name: 'Observer Pattern',
    fileNamePatterns: [/observer/i, /subscriber/i, /listener/i, /emitter/i],
    codePatterns: [
      /subscribe\s*\(/,
      /unsubscribe\s*\(/,
      /notify\s*\(/,
      /addEventListener\s*\(/,
      /removeEventListener\s*\(/,
      /on\s*\(\s*['"`]\w+['"`]/,
      /emit\s*\(/,
      /EventEmitter/,
      /Subject/,
      /Observable/,
    ],
    description:
      'Defines a one-to-many dependency between objects so that when one object changes state, all dependents are notified',
  },
  {
    type: 'repository',
    name: 'Repository Pattern',
    fileNamePatterns: [/repository/i, /repo/i, /dao/i, /store/i],
    codePatterns: [
      /findById\s*\(/,
      /findAll\s*\(/,
      /findOne\s*\(/,
      /save\s*\(/,
      /delete\s*\(/,
      /update\s*\(/,
      /getById\s*\(/,
      /getAll\s*\(/,
      /class\s+\w*Repository/,
      /interface\s+\w*Repository/,
    ],
    description:
      'Mediates between the domain and data mapping layers, acting like an in-memory collection of domain objects',
  },
  {
    type: 'strategy',
    name: 'Strategy Pattern',
    fileNamePatterns: [/strategy/i, /policy/i, /algorithm/i],
    codePatterns: [
      /setStrategy\s*\(/,
      /execute\s*\(/,
      /interface\s+\w*Strategy/,
      /type\s+\w*Strategy/,
      /implements\s+\w*Strategy/,
      /:\s*\w*Strategy/,
    ],
    description:
      'Defines a family of algorithms, encapsulates each one, and makes them interchangeable',
  },
  {
    type: 'decorator',
    name: 'Decorator Pattern',
    fileNamePatterns: [/decorator/i, /wrapper/i],
    codePatterns: [
      /@\w+\s*\(/,
      /decorator/i,
      /wrap\s*\(/,
      /enhance\s*\(/,
      /class\s+\w*Decorator/,
      /function\s+with\w+/,
    ],
    description:
      'Attaches additional responsibilities to an object dynamically, providing a flexible alternative to subclassing',
  },
  {
    type: 'adapter',
    name: 'Adapter Pattern',
    fileNamePatterns: [/adapter/i, /wrapper/i, /bridge/i],
    codePatterns: [
      /class\s+\w*Adapter/,
      /interface\s+\w*Adapter/,
      /adapt\s*\(/,
      /convert\s*\(/,
      /transform\s*\(/,
    ],
    description: 'Converts the interface of a class into another interface that clients expect',
  },
  {
    type: 'facade',
    name: 'Facade Pattern',
    fileNamePatterns: [/facade/i, /api/i, /service/i],
    codePatterns: [
      /class\s+\w*Facade/,
      /class\s+\w*Service/,
      /class\s+\w*Api/,
      /export\s+const\s+\w*Api/,
    ],
    description:
      'Provides a unified interface to a set of interfaces in a subsystem, making the subsystem easier to use',
  },
  {
    type: 'builder',
    name: 'Builder Pattern',
    fileNamePatterns: [/builder/i],
    codePatterns: [
      /class\s+\w*Builder/,
      /\.with\w+\s*\(/,
      /\.set\w+\s*\(/,
      /\.add\w+\s*\(/,
      /\.build\s*\(/,
      /return\s+this/,
    ],
    description:
      'Separates the construction of a complex object from its representation, allowing the same construction process to create different representations',
  },
  {
    type: 'prototype',
    name: 'Prototype Pattern',
    fileNamePatterns: [/prototype/i, /clone/i],
    codePatterns: [
      /\.clone\s*\(/,
      /\.copy\s*\(/,
      /Object\.create\s*\(/,
      /structuredClone\s*\(/,
      /JSON\.parse\s*\(\s*JSON\.stringify/,
    ],
    description: 'Creates new objects by cloning an existing object, known as the prototype',
  },
];

/**
 * Architecture detection rules
 */
interface ArchitectureRule {
  type: ArchitectureStyleType;
  /** Directory patterns that suggest this architecture */
  directoryPatterns: string[];
  /** File patterns that suggest this architecture */
  filePatterns: RegExp[];
  /** Keywords in file content */
  contentKeywords: string[];
  /** Description/characteristics */
  characteristics: string[];
}

const ARCHITECTURE_RULES: ArchitectureRule[] = [
  {
    type: 'layered',
    directoryPatterns: [
      'controllers',
      'services',
      'repositories',
      'models',
      'views',
      'presentation',
      'business',
      'data',
    ],
    filePatterns: [/controller\./i, /service\./i, /repository\./i, /model\./i],
    contentKeywords: ['@Controller', '@Service', '@Repository'],
    characteristics: [
      'Separation of concerns by layers',
      'Unidirectional dependency flow',
      'Clear boundaries between presentation, business, and data layers',
    ],
  },
  {
    type: 'hexagonal',
    directoryPatterns: ['ports', 'adapters', 'domain', 'infrastructure', 'application', 'core'],
    filePatterns: [/port\./i, /adapter\./i, /\.port\./i, /\.adapter\./i],
    contentKeywords: ['Port', 'Adapter', 'UseCase', 'DomainService'],
    characteristics: [
      'Domain at the center',
      'Ports define interfaces',
      'Adapters implement external concerns',
      'Dependency inversion',
    ],
  },
  {
    type: 'clean',
    directoryPatterns: [
      'entities',
      'usecases',
      'use-cases',
      'interfaces',
      'frameworks',
      'domain',
      'application',
      'infrastructure',
      'presentation',
    ],
    filePatterns: [/usecase\./i, /use-case\./i, /entity\./i, /interactor\./i],
    contentKeywords: ['UseCase', 'Interactor', 'Entity', 'Gateway', 'Presenter'],
    characteristics: [
      'Entities at the core',
      'Use cases orchestrate business logic',
      'Interface adapters convert data',
      'Frameworks and drivers on the outside',
    ],
  },
  {
    type: 'microservices',
    directoryPatterns: ['services', 'microservices', 'apps', 'packages', 'modules'],
    filePatterns: [/docker-compose/i, /kubernetes/i, /\.service\./i, /api-gateway/i],
    contentKeywords: ['microservice', 'api-gateway', 'service-mesh', 'docker', 'kubernetes'],
    characteristics: [
      'Independent deployable services',
      'Decentralized data management',
      'Service-to-service communication',
      'Container orchestration',
    ],
  },
  {
    type: 'modular-monolith',
    directoryPatterns: ['modules', 'features', 'domains', 'bounded-contexts'],
    filePatterns: [/module\./i, /feature\./i, /\.module\./i],
    contentKeywords: ['@Module', 'BoundedContext', 'Feature'],
    characteristics: [
      'Single deployable unit',
      'Well-defined module boundaries',
      'Shared infrastructure',
      'Internal module communication',
    ],
  },
  {
    type: 'event-driven',
    directoryPatterns: ['events', 'handlers', 'sagas', 'subscribers', 'queues'],
    filePatterns: [/event\./i, /handler\./i, /saga\./i, /subscriber\./i, /queue\./i],
    contentKeywords: ['EventBus', 'EventEmitter', 'publish', 'subscribe', 'saga', 'CQRS'],
    characteristics: [
      'Asynchronous communication',
      'Event sourcing',
      'Loose coupling through events',
      'Eventual consistency',
    ],
  },
  {
    type: 'serverless',
    directoryPatterns: ['functions', 'lambdas', 'handlers'],
    filePatterns: [/serverless\./i, /lambda\./i, /\.handler\./i, /function\./i],
    contentKeywords: ['serverless', 'lambda', 'APIGateway', 'FaaS'],
    characteristics: [
      'Function-as-a-Service',
      'Event-triggered execution',
      'No server management',
      'Pay-per-execution model',
    ],
  },
  {
    type: 'monolithic',
    directoryPatterns: ['src', 'app', 'lib'],
    filePatterns: [/app\./i, /main\./i, /index\./i],
    contentKeywords: [],
    characteristics: [
      'Single deployable unit',
      'Shared codebase',
      'Centralized data management',
      'Simple deployment',
    ],
  },
];

/**
 * Convention detection rules
 */
interface ConventionRule {
  type: ConventionType;
  name: string;
  /** Regex patterns to detect */
  patterns: RegExp[];
  /** Description of the convention */
  description: string;
}

const NAMING_CONVENTION_RULES: ConventionRule[] = [
  {
    type: 'naming',
    name: 'camelCase functions',
    patterns: [/function\s+[a-z][a-zA-Z0-9]*\s*\(/],
    description: 'Functions use camelCase naming',
  },
  {
    type: 'naming',
    name: 'PascalCase classes',
    patterns: [/class\s+[A-Z][a-zA-Z0-9]*/],
    description: 'Classes use PascalCase naming',
  },
  {
    type: 'naming',
    name: 'PascalCase interfaces',
    patterns: [/interface\s+[A-Z][a-zA-Z0-9]*/],
    description: 'Interfaces use PascalCase naming',
  },
  {
    type: 'naming',
    name: 'SCREAMING_SNAKE_CASE constants',
    patterns: [/const\s+[A-Z][A-Z0-9_]+\s*=/],
    description: 'Constants use SCREAMING_SNAKE_CASE naming',
  },
  {
    type: 'naming',
    name: 'I-prefix interfaces',
    patterns: [/interface\s+I[A-Z][a-zA-Z0-9]*/],
    description: 'Interfaces use I-prefix naming convention',
  },
  {
    type: 'naming',
    name: 'kebab-case files',
    patterns: [/^[a-z][a-z0-9]*(-[a-z0-9]+)*\.[a-z]+$/],
    description: 'Files use kebab-case naming',
  },
];

const IMPORT_CONVENTION_RULES: ConventionRule[] = [
  {
    type: 'import',
    name: 'Named exports',
    patterns: [/export\s+(?:const|function|class|interface|type)\s+\w+/],
    description: 'Uses named exports instead of default exports',
  },
  {
    type: 'import',
    name: 'Default exports',
    patterns: [/export\s+default/],
    description: 'Uses default exports',
  },
  {
    type: 'import',
    name: 'Barrel exports',
    patterns: [/export\s+\*\s+from/],
    description: 'Uses barrel files for re-exporting',
  },
  {
    type: 'import',
    name: 'Type-only imports',
    patterns: [/import\s+type\s+\{/],
    description: 'Uses type-only imports for TypeScript types',
  },
  {
    type: 'import',
    name: 'Path aliases',
    patterns: [/from\s+['"]@\w+\//],
    description: 'Uses path aliases for imports',
  },
];

/**
 * Converts a confidence score to a quality rating
 */
function confidenceToQuality(confidence: number): PatternQuality {
  if (confidence >= 0.85) return 'excellent';
  if (confidence >= 0.7) return 'good';
  if (confidence >= 0.5) return 'acceptable';
  return 'poor';
}

/**
 * PatternExtractor class for detecting design patterns, architectural patterns,
 * and coding conventions in a codebase through static analysis.
 */
export class PatternExtractor {
  private options: Required<PatternExtractionOptions>;

  /**
   * Creates a new PatternExtractor instance
   * @param options - Configuration options for pattern extraction
   */
  constructor(options: PatternExtractionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Extracts design patterns from the given files
   *
   * Detects patterns including Factory, Singleton, Observer, Repository,
   * Strategy, Decorator, Adapter, Facade, Builder, and Prototype patterns.
   *
   * @param files - Array of file paths to analyze
   * @returns Promise resolving to array of detected design patterns
   *
   * @example
   * ```typescript
   * const extractor = new PatternExtractor();
   * const patterns = await extractor.extractDesignPatterns(['src/services/user.service.ts']);
   * console.log(patterns);
   * // [{ type: 'repository', name: 'Repository Pattern', confidence: 0.85, quality: 'excellent', ... }]
   * ```
   */
  async extractDesignPatterns(files: string[]): Promise<DesignPattern[]> {
    const patternMatches = new Map<
      DesignPatternType,
      {
        locations: string[];
        codeMatches: number;
        fileNameMatches: number;
        examples: string[];
      }
    >();

    // Initialize pattern tracking
    for (const rule of DESIGN_PATTERN_RULES) {
      patternMatches.set(rule.type, {
        locations: [],
        codeMatches: 0,
        fileNameMatches: 0,
        examples: [],
      });
    }

    // Limit files to analyze based on options
    const filesToAnalyze = files.slice(0, this.options.maxFiles);

    // Analyze each file
    for (const filePath of filesToAnalyze) {
      if (this.shouldExcludeFile(filePath)) continue;

      const fileName = path.basename(filePath);
      let content: string;

      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        continue; // Skip files that can't be read
      }

      // Check each pattern rule
      for (const rule of DESIGN_PATTERN_RULES) {
        const matches = patternMatches.get(rule.type);
        if (!matches) continue;

        // Check file name patterns
        const fileNameMatch = rule.fileNamePatterns.some((pattern) => pattern.test(fileName));
        if (fileNameMatch) {
          matches.fileNameMatches++;
          if (!matches.locations.includes(filePath)) {
            matches.locations.push(filePath);
          }
        }

        // Check code patterns
        for (const pattern of rule.codePatterns) {
          const codeMatch = content.match(pattern);
          if (codeMatch) {
            matches.codeMatches++;
            if (!matches.locations.includes(filePath)) {
              matches.locations.push(filePath);
            }

            // Capture example if enabled
            if (this.options.includeExamples && matches.examples.length < 3 && codeMatch[0]) {
              const example = this.extractCodeContext(content, codeMatch.index);
              if (example && !matches.examples.includes(example)) {
                matches.examples.push(example);
              }
            }
          }
        }
      }
    }

    // Convert matches to DesignPattern results
    const results: DesignPattern[] = [];
    const totalFiles = filesToAnalyze.length;

    for (const rule of DESIGN_PATTERN_RULES) {
      const matches = patternMatches.get(rule.type);
      if (!matches || matches.locations.length === 0) continue;

      // Calculate confidence based on matches
      const confidence = this.calculatePatternConfidence(
        matches.codeMatches,
        matches.fileNameMatches,
        matches.locations.length,
        totalFiles
      );

      if (confidence >= this.options.minConfidence) {
        results.push({
          type: rule.type,
          name: rule.name,
          locations: matches.locations.slice(0, 10), // Limit locations
          quality: confidenceToQuality(confidence),
          confidence,
          description: rule.description,
          examples: this.options.includeExamples ? matches.examples : undefined,
        });
      }
    }

    // Sort by confidence and limit results
    return results.sort((a, b) => b.confidence - a.confidence).slice(0, this.options.maxPatterns);
  }

  /**
   * Extracts architectural patterns from the given files
   *
   * Identifies patterns such as layered architecture, microservices,
   * hexagonal/ports-and-adapters, clean architecture, etc.
   *
   * @param files - Array of file paths to analyze
   * @returns Promise resolving to array of architectural pattern names
   *
   * @example
   * ```typescript
   * const extractor = new PatternExtractor();
   * const patterns = await extractor.extractArchitecturalPatterns(files);
   * console.log(patterns);
   * // ['layered', 'repository-pattern', 'dependency-injection']
   * ```
   */
  async extractArchitecturalPatterns(files: string[]): Promise<string[]> {
    const detectedPatterns = new Set<string>();

    // Analyze directory structure
    const directories = new Set<string>();
    for (const file of files) {
      const parts = file.split(path.sep);
      for (const part of parts) {
        directories.add(part.toLowerCase());
      }
    }

    // Check each architecture rule for directory patterns
    for (const rule of ARCHITECTURE_RULES) {
      const matchCount = rule.directoryPatterns.filter((pattern) =>
        directories.has(pattern.toLowerCase())
      ).length;

      if (matchCount >= 2) {
        detectedPatterns.add(rule.type);
      }
    }

    // Limit files to analyze based on options
    const filesToAnalyze = files.slice(0, this.options.maxFiles);

    // Analyze file contents for architectural keywords
    for (const filePath of filesToAnalyze) {
      if (this.shouldExcludeFile(filePath)) continue;

      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        continue;
      }

      for (const rule of ARCHITECTURE_RULES) {
        // Check file patterns
        const fileName = path.basename(filePath);
        if (rule.filePatterns.some((pattern) => pattern.test(fileName))) {
          detectedPatterns.add(rule.type);
        }

        // Check content keywords
        for (const keyword of rule.contentKeywords) {
          if (content.includes(keyword)) {
            detectedPatterns.add(rule.type);
            break;
          }
        }
      }
    }

    // Add common patterns detected through code analysis
    const commonPatterns = await this.detectCommonArchitecturalPatterns(filesToAnalyze);
    for (const pattern of commonPatterns) {
      detectedPatterns.add(pattern);
    }

    return Array.from(detectedPatterns);
  }

  /**
   * Extracts coding conventions from the given files
   *
   * Identifies naming conventions, file structure patterns,
   * import/export patterns, and other coding standards.
   *
   * @param files - Array of file paths to analyze
   * @returns Promise resolving to array of detected conventions
   *
   * @example
   * ```typescript
   * const extractor = new PatternExtractor();
   * const conventions = await extractor.extractConventions(files);
   * console.log(conventions);
   * // [{ type: 'naming', name: 'camelCase functions', frequency: 0.95, consistency: 95 }]
   * ```
   */
  async extractConventions(files: string[]): Promise<Convention[]> {
    const conventionCounts = new Map<
      string,
      { rule: ConventionRule; matches: number; examples: string[] }
    >();

    // Initialize convention tracking
    const allRules = [...NAMING_CONVENTION_RULES, ...IMPORT_CONVENTION_RULES];
    for (const rule of allRules) {
      conventionCounts.set(rule.name, { rule, matches: 0, examples: [] });
    }

    let analyzedFiles = 0;

    // Limit files to analyze based on options
    const filesToAnalyze = files.slice(0, this.options.maxFiles);

    // Analyze each file
    for (const filePath of filesToAnalyze) {
      if (this.shouldExcludeFile(filePath)) continue;
      if (!this.isSourceFile(filePath)) continue;

      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        continue;
      }

      analyzedFiles++;

      // Check naming conventions
      for (const rule of allRules) {
        const tracking = conventionCounts.get(rule.name);
        if (!tracking) continue;

        for (const pattern of rule.patterns) {
          const match = content.match(pattern);
          if (match) {
            tracking.matches++;
            if (tracking.examples.length < 3 && match[0]) {
              tracking.examples.push(match[0].trim().slice(0, 100));
            }
            break; // Count once per file per rule
          }
        }
      }
    }

    // Convert to Convention results
    const results: Convention[] = [];

    for (const [, { rule, matches, examples }] of conventionCounts) {
      if (matches === 0) continue;

      const frequency = analyzedFiles > 0 ? matches / analyzedFiles : 0;

      // Only include conventions that appear in at least 10% of files
      if (frequency >= 0.1) {
        // Convert frequency to consistency score (0-100)
        const consistency = Math.round(Math.min(frequency, 1) * 100);

        results.push({
          type: rule.type,
          name: rule.name,
          pattern: rule.patterns[0].source, // Use first pattern as the pattern string
          examples,
          frequency: Math.min(frequency, 1),
          consistency,
          description: rule.description,
        });
      }
    }

    // Add file structure conventions
    const fileStructureConventions = await this.analyzeFileStructureConventions(filesToAnalyze);
    results.push(...fileStructureConventions);

    return results.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Classifies the overall architecture style of the codebase
   *
   * Analyzes directory structure, file patterns, and code content
   * to determine the primary and secondary architectural styles.
   *
   * @param files - Array of file paths to analyze
   * @returns Promise resolving to the architecture style classification
   *
   * @example
   * ```typescript
   * const extractor = new PatternExtractor();
   * const style = await extractor.classifyArchitectureStyle(files);
   * console.log(style);
   * // { primary: 'clean', secondary: ['layered'], confidence: 0.85, ... }
   * ```
   */
  async classifyArchitectureStyle(files: string[]): Promise<ArchitectureStyle> {
    const scores = new Map<
      ArchitectureStyleType,
      { score: number; evidence: string[]; characteristics: string[] }
    >();

    // Initialize scores
    for (const rule of ARCHITECTURE_RULES) {
      scores.set(rule.type, {
        score: 0,
        evidence: [],
        characteristics: rule.characteristics,
      });
    }

    // Analyze directory structure
    const directories = new Set<string>();
    const directoryPaths: string[] = [];

    for (const file of files) {
      const dirPath = path.dirname(file);
      if (!directoryPaths.includes(dirPath)) {
        directoryPaths.push(dirPath);
      }
      const parts = file.split(path.sep);
      for (const part of parts) {
        directories.add(part.toLowerCase());
      }
    }

    // Score based on directory patterns
    for (const rule of ARCHITECTURE_RULES) {
      const scoreData = scores.get(rule.type);
      if (!scoreData) continue;

      for (const pattern of rule.directoryPatterns) {
        if (directories.has(pattern.toLowerCase())) {
          scoreData.score += 2;
          scoreData.evidence.push(`Directory '${pattern}' found`);
        }
      }
    }

    // Analyze file patterns and content
    let sampleSize = 0;
    const maxSamples = Math.min(100, this.options.maxFiles);

    for (const filePath of files) {
      if (sampleSize >= maxSamples) break;
      if (this.shouldExcludeFile(filePath)) continue;
      if (!this.isSourceFile(filePath)) continue;

      sampleSize++;
      const fileName = path.basename(filePath);

      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        continue;
      }

      for (const rule of ARCHITECTURE_RULES) {
        const scoreData = scores.get(rule.type);
        if (!scoreData) continue;

        // Check file patterns
        for (const pattern of rule.filePatterns) {
          if (pattern.test(fileName)) {
            scoreData.score += 1;
            if (scoreData.evidence.length < 5) {
              scoreData.evidence.push(`File pattern match: ${fileName}`);
            }
          }
        }

        // Check content keywords
        for (const keyword of rule.contentKeywords) {
          if (content.includes(keyword)) {
            scoreData.score += 1;
            if (scoreData.evidence.length < 5) {
              scoreData.evidence.push(`Keyword found: ${keyword}`);
            }
          }
        }
      }
    }

    // Calculate confidence and determine primary/secondary styles
    const sortedScores = Array.from(scores.entries())
      .filter(([, data]) => data.score > 0)
      .sort((a, b) => b[1].score - a[1].score);

    if (sortedScores.length === 0) {
      return {
        primary: 'unknown',
        secondary: [],
        confidence: 0,
        evidence: ['No clear architectural patterns detected'],
        characteristics: [],
      };
    }

    const maxScore = sortedScores[0][1].score;
    const primary = sortedScores[0][0];
    const primaryData = sortedScores[0][1];

    // Secondary styles are those with at least 50% of the max score
    const secondary = sortedScores
      .slice(1)
      .filter(([, data]) => data.score >= maxScore * 0.5)
      .map(([type]) => type);

    // Calculate confidence (0-1) based on score relative to total possible
    const totalPossibleScore = files.length * 0.5; // Rough estimate
    const confidence = Math.min(maxScore / Math.max(totalPossibleScore, 10), 1);

    return {
      primary,
      secondary,
      confidence,
      evidence: primaryData.evidence,
      characteristics: primaryData.characteristics,
    };
  }

  /**
   * Checks if a file should be excluded from analysis
   */
  private shouldExcludeFile(filePath: string): boolean {
    return this.options.excludePatterns.some((pattern) => filePath.includes(pattern));
  }

  /**
   * Checks if a file is a source file worth analyzing
   */
  private isSourceFile(filePath: string): boolean {
    const sourceExtensions = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.cjs',
      '.py',
      '.java',
      '.go',
      '.rs',
      '.rb',
      '.php',
      '.cs',
      '.swift',
      '.kt',
    ];
    return sourceExtensions.some((ext) => filePath.endsWith(ext));
  }

  /**
   * Calculates confidence score for a detected pattern
   */
  private calculatePatternConfidence(
    codeMatches: number,
    fileNameMatches: number,
    uniqueLocations: number,
    totalFiles: number
  ): number {
    // Weight code matches more heavily than file name matches
    const matchScore = codeMatches * 0.3 + fileNameMatches * 0.5;

    // Consider coverage (what percentage of files contain the pattern)
    const coverageScore = Math.min(uniqueLocations / Math.max(totalFiles, 1), 1);

    // Combine scores
    const rawScore = matchScore * 0.6 + coverageScore * 0.4;

    // Normalize to 0-1 range
    return Math.min(Math.max(rawScore, 0), 1);
  }

  /**
   * Extracts a code context snippet around a match
   */
  private extractCodeContext(content: string, matchIndex: number | undefined): string | null {
    if (matchIndex === undefined) return null;

    const lines = content.split('\n');
    let currentIndex = 0;
    let targetLine = 0;

    for (let i = 0; i < lines.length; i++) {
      if (currentIndex >= matchIndex) {
        targetLine = i;
        break;
      }
      currentIndex += lines[i].length + 1;
    }

    // Get 2 lines of context
    const start = Math.max(0, targetLine - 1);
    const end = Math.min(lines.length, targetLine + 2);

    return lines
      .slice(start, end)
      .map((line) => line.trim())
      .join('\n')
      .slice(0, 200);
  }

  /**
   * Detects common architectural patterns through code analysis
   */
  private async detectCommonArchitecturalPatterns(files: string[]): Promise<string[]> {
    const patterns: string[] = [];

    // Check for dependency injection
    let diCount = 0;
    let constructorInjection = 0;

    for (const filePath of files.slice(0, 50)) {
      // Sample files
      if (this.shouldExcludeFile(filePath)) continue;
      if (!this.isSourceFile(filePath)) continue;

      let content: string;
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        continue;
      }

      // Check for DI patterns
      if (
        content.includes('@Injectable') ||
        content.includes('@Inject') ||
        content.includes('inject(')
      ) {
        diCount++;
      }

      // Check for constructor injection
      if (/constructor\s*\([^)]+:\s*\w+/.test(content)) {
        constructorInjection++;
      }
    }

    if (diCount >= 3 || constructorInjection >= 5) {
      patterns.push('dependency-injection');
    }

    return patterns;
  }

  /**
   * Analyzes file structure conventions
   */
  private async analyzeFileStructureConventions(files: string[]): Promise<Convention[]> {
    const conventions: Convention[] = [];

    // Check for common file organization patterns
    const fileNames = files.map((f) => path.basename(f));

    // Check for .spec/.test file naming
    const testFiles = fileNames.filter((f) => f.includes('.spec.') || f.includes('.test.'));
    if (testFiles.length > files.length * 0.1) {
      const frequency = testFiles.length / files.length;
      conventions.push({
        type: 'testing',
        name: 'Co-located test files',
        pattern: '\\.spec\\.||\\.test\\.',
        examples: testFiles.slice(0, 3),
        frequency,
        consistency: Math.round(Math.min(frequency / 0.3, 1) * 100), // 30%+ is full consistency
        description: 'Test files are co-located with source files using .spec or .test suffix',
      });
    }

    // Check for index file barrel pattern
    const indexFiles = fileNames.filter((f) => f === 'index.ts' || f === 'index.js');
    if (indexFiles.length >= 3) {
      const frequency = indexFiles.length / Math.max(files.length * 0.1, 1);
      conventions.push({
        type: 'file-structure',
        name: 'Index barrel files',
        pattern: '^index\\.(ts|js)$',
        examples: ['index.ts', 'index.js'],
        frequency: Math.min(frequency, 1),
        consistency: 100, // Barrel files are typically consistent when present
        description: 'Uses index files as barrel exports for directories',
      });
    }

    return conventions;
  }
}

/**
 * Factory function to create a new PatternExtractor instance
 *
 * @param options - Configuration options for pattern extraction
 * @returns A new PatternExtractor instance
 *
 * @example
 * ```typescript
 * const extractor = createPatternExtractor({ minConfidence: 0.7 });
 * const patterns = await extractor.extractDesignPatterns(files);
 * ```
 */
export function createPatternExtractor(options?: PatternExtractionOptions): PatternExtractor {
  return new PatternExtractor(options);
}
