/**
 * Checkpoint Store - Versioned context snapshots for codebase analysis
 *
 * This module preserves context-loader's unique versioning capabilities,
 * providing semantic versioning, parent-child relationships, diff generation,
 * and size metrics tracking for codebase context snapshots.
 *
 * @module checkpoint-store
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import type {
  Checkpoint,
  CheckpointSizeMetrics,
  CheckpointStorageBackend,
  CheckpointStoreConfig,
  CheckpointSummary,
  CodebaseContext,
  ContextDiff,
  FileDiff,
  DiffChangeType,
  ListOptions,
} from '../types/index.js';

/**
 * Internal diff result without checkpoint IDs (for context-to-context comparison)
 */
interface InternalDiffResult {
  added: FileDiff[];
  removed: FileDiff[];
  modified: FileDiff[];
  stats: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    totalChanges: number;
  };
}

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

/**
 * Generates a unique identifier for checkpoints
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Estimates token count for a string (rough approximation: ~4 chars per token)
 *
 * @param content - The content to estimate tokens for
 * @returns Estimated token count
 */
function estimateTokenCount(content: string): number {
  return Math.ceil(content.length / 4);
}

/**
 * Parses a semantic version string into components
 *
 * @param version - Version string in format "major.minor.patch"
 * @returns Object with major, minor, patch numbers
 */
function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] ?? 0,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
  };
}

/**
 * Compares two semantic versions
 *
 * @param a - First version string
 * @param b - Second version string
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vA.major - vB.major;
  if (vA.minor !== vB.minor) return vA.minor - vB.minor;
  return vA.patch - vB.patch;
}

/**
 * Extracts root path from context
 */
function extractRootPath(context: CodebaseContext): string {
  if (context.metadata?.files && context.metadata.files.length > 0) {
    // Find common root from file paths
    const paths = context.metadata.files;
    if (paths.length === 1) return paths[0].split('/').slice(0, -1).join('/') || '/';
    const parts = paths[0].split('/');
    let commonRoot = '';
    for (let i = 0; i < parts.length; i++) {
      const prefix = parts.slice(0, i + 1).join('/');
      if (paths.every((p) => p.startsWith(prefix))) {
        commonRoot = prefix;
      } else {
        break;
      }
    }
    return commonRoot || '/';
  }
  return '/';
}

// ============================================================================
// Storage Backends
// ============================================================================

/**
 * In-memory storage backend for development and testing
 */
class InMemoryStorageBackend implements CheckpointStorageBackend {
  private readonly store = new Map<string, Checkpoint>();

  /**
   * Stores a checkpoint in memory
   *
   * @param checkpoint - The checkpoint to store
   */
  async save(checkpoint: Checkpoint): Promise<void> {
    this.store.set(checkpoint.id, structuredClone(checkpoint));
  }

  /**
   * Retrieves a checkpoint from memory
   *
   * @param id - The checkpoint ID to retrieve
   * @returns The checkpoint or null if not found
   */
  async load(id: string): Promise<Checkpoint | null> {
    const checkpoint = this.store.get(id);
    return checkpoint ? structuredClone(checkpoint) : null;
  }

  /**
   * Deletes a checkpoint from memory
   *
   * @param id - The checkpoint ID to delete
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  /**
   * Lists all checkpoint IDs from memory
   *
   * @returns Array of checkpoint IDs
   */
  async listIds(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  /**
   * Checks if a checkpoint exists in memory
   *
   * @param id - The checkpoint ID to check
   * @returns True if exists
   */
  async exists(id: string): Promise<boolean> {
    return this.store.has(id);
  }

  /**
   * Clears all checkpoints from memory
   */
  async clear(): Promise<void> {
    this.store.clear();
  }
}

/**
 * File system storage backend for persistent checkpoint storage
 */
class FileSystemStorageBackend implements CheckpointStorageBackend {
  private readonly baseDir: string;
  private readonly enableCompression: boolean;

  /**
   * Creates a new file system storage backend
   *
   * @param baseDir - Base directory for storing checkpoint files
   * @param enableCompression - Whether to compress checkpoint data
   */
  constructor(baseDir: string, enableCompression = true) {
    this.baseDir = baseDir;
    this.enableCompression = enableCompression;
  }

  /**
   * Gets the file path for a checkpoint
   */
  private getFilePath(id: string): string {
    const ext = this.enableCompression ? '.json.gz' : '.json';
    return path.join(this.baseDir, `checkpoint-${id}${ext}`);
  }

  /**
   * Ensures the storage directory exists
   */
  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  /**
   * Stores a checkpoint to the file system
   *
   * @param checkpoint - The checkpoint to store
   */
  async save(checkpoint: Checkpoint): Promise<void> {
    await this.ensureDir();
    const filePath = this.getFilePath(checkpoint.id);
    const data = JSON.stringify(checkpoint, null, 2);

    if (this.enableCompression) {
      const compressed = await gzipAsync(Buffer.from(data));
      await fs.writeFile(filePath, compressed);
    } else {
      await fs.writeFile(filePath, data, 'utf-8');
    }
  }

  /**
   * Loads a checkpoint from the file system
   *
   * @param id - The checkpoint ID to load
   * @returns The checkpoint or null if not found
   */
  async load(id: string): Promise<Checkpoint | null> {
    const filePath = this.getFilePath(id);

    try {
      if (this.enableCompression) {
        const compressed = await fs.readFile(filePath);
        const decompressed = await gunzipAsync(compressed);
        return JSON.parse(decompressed.toString()) as Checkpoint;
      } else {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as Checkpoint;
      }
    } catch {
      return null;
    }
  }

  /**
   * Deletes a checkpoint from the file system
   *
   * @param id - The checkpoint ID to delete
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const filePath = this.getFilePath(id);

    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lists all checkpoint IDs from the file system
   *
   * @returns Array of checkpoint IDs
   */
  async listIds(): Promise<string[]> {
    try {
      await this.ensureDir();
      const files = await fs.readdir(this.baseDir);
      const ext = this.enableCompression ? '.json.gz' : '.json';

      return files
        .filter((f) => f.startsWith('checkpoint-') && f.endsWith(ext))
        .map((f) => f.replace('checkpoint-', '').replace('.json.gz', '').replace('.json', ''));
    } catch {
      return [];
    }
  }

  /**
   * Checks if a checkpoint exists on the file system
   *
   * @param id - The checkpoint ID to check
   * @returns True if exists
   */
  async exists(id: string): Promise<boolean> {
    const filePath = this.getFilePath(id);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clears all checkpoints from the file system
   */
  async clear(): Promise<void> {
    const ids = await this.listIds();
    await Promise.all(ids.map((id) => this.delete(id)));
  }
}

/**
 * Filters and sorts checkpoints based on list options
 */
function filterAndSortCheckpoints(
  checkpoints: Checkpoint[],
  options?: ListOptions
): CheckpointSummary[] {
  const {
    labelPattern,
    after,
    before,
    tags,
    limit,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options ?? {};

  let summaries: CheckpointSummary[] = checkpoints.map((cp) => ({
    id: cp.id,
    version: cp.version,
    parentId: cp.parentId,
    label: cp.label,
    createdAt: cp.createdAt,
    description: cp.description,
    tags: cp.tags,
    sizeMetrics: cp.sizeMetrics,
    fileCount: cp.context.metadata?.files?.length ?? 0,
    rootPath: extractRootPath(cp.context),
  }));

  // Apply filters
  if (labelPattern) {
    const pattern = new RegExp(labelPattern, 'i');
    summaries = summaries.filter((s) => s.label && pattern.test(s.label));
  }

  if (tags && tags.length > 0) {
    summaries = summaries.filter((s) => s.tags && tags.some((t) => s.tags?.includes(t)));
  }

  if (after) {
    summaries = summaries.filter((s) => s.createdAt > after);
  }

  if (before) {
    summaries = summaries.filter((s) => s.createdAt < before);
  }

  // Sort
  summaries.sort((a, b) => {
    let comparison: number;

    switch (sortBy) {
      case 'version':
        comparison = compareVersions(a.version, b.version);
        break;
      case 'size':
        comparison = a.sizeMetrics.raw - b.sizeMetrics.raw;
        break;
      case 'createdAt':
      default:
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Paginate
  if (offset > 0 || limit !== undefined) {
    const end = limit !== undefined ? offset + limit : undefined;
    summaries = summaries.slice(offset, end);
  }

  return summaries;
}

// ============================================================================
// Checkpoint Store
// ============================================================================

/**
 * CheckpointStore manages versioned snapshots of codebase context.
 *
 * It provides:
 * - Semantic versioning with automatic version incrementing
 * - Parent-child relationships for incremental updates
 * - Diff generation showing what changed between checkpoints
 * - Size metrics tracking (raw, compressed, token count)
 * - Multiple storage backends (memory, filesystem, custom)
 *
 * @example
 * ```typescript
 * const store = new CheckpointStore({ backend: 'memory' });
 *
 * // Create a checkpoint
 * const checkpoint = await store.create(codebaseContext);
 *
 * // Create a child checkpoint with incremental changes
 * const childCheckpoint = await store.create(updatedContext, checkpoint.id);
 *
 * // Compare two checkpoints
 * const diff = await store.diff(checkpoint.id, childCheckpoint.id);
 *
 * // Restore a previous checkpoint
 * const restoredContext = await store.restore(checkpoint.id);
 * ```
 */
export class CheckpointStore {
  private readonly storage: CheckpointStorageBackend;
  private readonly enableCompression: boolean;
  private readonly maxCheckpoints: number;
  private readonly autoPrune: boolean;
  private versionCounter = { major: 1, minor: 0, patch: 0 };

  /**
   * Creates a new CheckpointStore instance
   *
   * @param config - Configuration options for the store
   */
  constructor(config: CheckpointStoreConfig = { backend: 'memory' }) {
    const {
      backend = 'memory',
      basePath = './.checkpoints',
      maxCheckpoints = 0,
      autoPrune = false,
      compression,
    } = config;

    this.enableCompression = compression?.enabled ?? true;
    this.maxCheckpoints = maxCheckpoints;
    this.autoPrune = autoPrune;

    if (backend === 'filesystem') {
      this.storage = new FileSystemStorageBackend(basePath, this.enableCompression);
    } else {
      this.storage = new InMemoryStorageBackend();
    }
  }

  /**
   * Calculates size metrics for a codebase context
   */
  private async calculateSizeMetrics(context: CodebaseContext): Promise<CheckpointSizeMetrics> {
    const serialized = JSON.stringify(context);
    const raw = Buffer.byteLength(serialized, 'utf-8');

    let compressed = raw;
    if (this.enableCompression) {
      const compressedBuffer = await gzipAsync(Buffer.from(serialized));
      compressed = compressedBuffer.length;
    }

    const tokenCount = estimateTokenCount(serialized);

    return {
      raw,
      compressed,
      tokenCount,
      componentCount: context.keyComponents?.length ?? 0,
      patternCount: context.patterns?.architectural?.length ?? 0,
    };
  }

  /**
   * Generates the next version string based on parent checkpoint
   */
  private async generateVersion(parentId?: string): Promise<string> {
    if (parentId) {
      const parent = await this.storage.load(parentId);
      if (parent) {
        const parentVersion = parseVersion(parent.version);
        return `${parentVersion.major}.${parentVersion.minor}.${parentVersion.patch + 1}`;
      }
    }

    // No parent or parent not found - increment minor version
    const version = `${this.versionCounter.major}.${this.versionCounter.minor}.${this.versionCounter.patch}`;
    this.versionCounter.minor++;
    return version;
  }

  /**
   * Enforces maximum checkpoint limit by pruning oldest checkpoints
   */
  private async enforceMaxCheckpoints(): Promise<void> {
    if (!this.autoPrune || this.maxCheckpoints <= 0) return;

    const ids = await this.storage.listIds();
    const checkpoints = await Promise.all(ids.map((id) => this.storage.load(id)));
    const validCheckpoints = checkpoints.filter((cp): cp is Checkpoint => cp !== null);

    // Sort by createdAt ascending (oldest first)
    validCheckpoints.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const excess = validCheckpoints.length - this.maxCheckpoints;

    if (excess > 0) {
      const toDelete = validCheckpoints.slice(0, excess);
      await Promise.all(toDelete.map((cp) => this.storage.delete(cp.id)));
    }
  }

  /**
   * Creates a versioned snapshot of codebase context
   *
   * @param context - The codebase context to checkpoint
   * @param parentId - Optional parent checkpoint ID for incremental versioning
   * @param tags - Optional tags for categorization
   * @returns The created checkpoint with version and metrics
   *
   * @example
   * ```typescript
   * // Create initial checkpoint
   * const checkpoint = await store.create(context);
   * console.log(checkpoint.version); // "1.0.0"
   *
   * // Create child checkpoint
   * const child = await store.create(updatedContext, checkpoint.id);
   * console.log(child.version); // "1.0.1"
   * ```
   */
  async create(context: CodebaseContext, parentId?: string, tags?: string[]): Promise<Checkpoint> {
    const id = generateId();
    const version = await this.generateVersion(parentId);
    const sizeMetrics = await this.calculateSizeMetrics(context);
    const createdAt = new Date();

    let description: string | undefined;
    if (parentId) {
      const parent = await this.storage.load(parentId);
      if (parent) {
        const diff = this.computeDiff(parent.context, context);
        const { stats } = diff;
        description = `${stats.addedCount} added, ${stats.removedCount} removed, ${stats.modifiedCount} modified (${stats.totalChanges} total changes)`;
      }
    }

    const checkpoint: Checkpoint = {
      id,
      version,
      parentId,
      context,
      sizeMetrics,
      createdAt,
      description,
      tags,
    };

    await this.storage.save(checkpoint);
    await this.enforceMaxCheckpoints();

    return checkpoint;
  }

  /**
   * Restores a codebase context from a checkpoint
   *
   * @param checkpointId - The ID of the checkpoint to restore
   * @returns The restored codebase context
   * @throws Error if checkpoint is not found
   *
   * @example
   * ```typescript
   * const context = await store.restore('checkpoint-123');
   * console.log(context.summary.executive);
   * ```
   */
  async restore(checkpointId: string): Promise<CodebaseContext> {
    const checkpoint = await this.storage.load(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    return checkpoint.context;
  }

  /**
   * Computes the differences between two contexts
   */
  private computeDiff(contextA: CodebaseContext, contextB: CodebaseContext): InternalDiffResult {
    const added: FileDiff[] = [];
    const removed: FileDiff[] = [];
    const modified: FileDiff[] = [];

    // Compare key components by path
    const componentsA = new Map(contextA.keyComponents?.map((c) => [c.path, c]) ?? []);
    const componentsB = new Map(contextB.keyComponents?.map((c) => [c.path, c]) ?? []);

    for (const [compPath] of componentsB) {
      if (!componentsA.has(compPath)) {
        added.push({ path: compPath, changeType: 'added' as DiffChangeType });
      }
    }

    for (const [compPath] of componentsA) {
      if (!componentsB.has(compPath)) {
        removed.push({ path: compPath, changeType: 'removed' as DiffChangeType });
      }
    }

    // Compare patterns (architectural is string[])
    const patternsA = new Set(contextA.patterns?.architectural ?? []);
    const patternsB = new Set(contextB.patterns?.architectural ?? []);

    for (const pattern of patternsB) {
      if (!patternsA.has(pattern)) {
        added.push({ path: `pattern:${pattern}`, changeType: 'added' as DiffChangeType });
      }
    }

    for (const pattern of patternsA) {
      if (!patternsB.has(pattern)) {
        removed.push({ path: `pattern:${pattern}`, changeType: 'removed' as DiffChangeType });
      }
    }

    // Compare insights (Insight has description, not title)
    const insightsA = new Set(contextA.insights?.map((i) => i.description) ?? []);
    const insightsB = new Set(contextB.insights?.map((i) => i.description) ?? []);

    for (const desc of insightsB) {
      if (!insightsA.has(desc)) {
        added.push({ path: `insight:${desc.slice(0, 50)}`, changeType: 'added' as DiffChangeType });
      }
    }

    for (const desc of insightsA) {
      if (!insightsB.has(desc)) {
        removed.push({
          path: `insight:${desc.slice(0, 50)}`,
          changeType: 'removed' as DiffChangeType,
        });
      }
    }

    const totalChanges = added.length + removed.length + modified.length;

    return {
      added,
      removed,
      modified,
      stats: {
        addedCount: added.length,
        removedCount: removed.length,
        modifiedCount: modified.length,
        totalChanges,
      },
    };
  }

  /**
   * Computes the differences between two checkpoints
   *
   * @param checkpointA - ID of the source checkpoint
   * @param checkpointB - ID of the target checkpoint
   * @returns Detailed diff showing added, removed, and modified items
   * @throws Error if either checkpoint is not found
   *
   * @example
   * ```typescript
   * const diff = await store.diff(oldCheckpointId, newCheckpointId);
   * console.log(diff.stats.totalChanges);
   * ```
   */
  async diff(checkpointA: string, checkpointB: string): Promise<ContextDiff> {
    const [cpA, cpB] = await Promise.all([
      this.storage.load(checkpointA),
      this.storage.load(checkpointB),
    ]);

    if (!cpA) {
      throw new Error(`Checkpoint not found: ${checkpointA}`);
    }
    if (!cpB) {
      throw new Error(`Checkpoint not found: ${checkpointB}`);
    }

    const internalDiff = this.computeDiff(cpA.context, cpB.context);
    return {
      fromCheckpointId: checkpointA,
      toCheckpointId: checkpointB,
      fromVersion: cpA.version,
      toVersion: cpB.version,
      added: internalDiff.added,
      removed: internalDiff.removed,
      modified: internalDiff.modified,
      stats: internalDiff.stats,
      computedAt: new Date(),
    };
  }

  /**
   * Lists available checkpoints with optional filtering and pagination
   *
   * @param options - Filtering and pagination options
   * @returns Array of checkpoint summaries (without full context)
   *
   * @example
   * ```typescript
   * // List all checkpoints
   * const all = await store.list();
   *
   * // List recent checkpoints with specific tags
   * const filtered = await store.list({
   *   tags: ['production'],
   *   after: new Date('2024-01-01T00:00:00Z'),
   *   limit: 10,
   *   sortBy: 'createdAt',
   *   sortOrder: 'desc',
   * });
   * ```
   */
  async list(options?: ListOptions): Promise<CheckpointSummary[]> {
    const ids = await this.storage.listIds();
    const checkpoints = await Promise.all(ids.map((id) => this.storage.load(id)));
    const validCheckpoints = checkpoints.filter((cp): cp is Checkpoint => cp !== null);
    return filterAndSortCheckpoints(validCheckpoints, options);
  }

  /**
   * Removes checkpoints older than a specified date
   *
   * @param olderThan - Delete checkpoints created before this date (ISO 8601 string).
   *                    If not provided, removes all checkpoints.
   * @returns Number of checkpoints deleted
   *
   * @example
   * ```typescript
   * // Remove checkpoints older than 30 days
   * const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
   * const deleted = await store.prune(thirtyDaysAgo);
   * console.log(`Deleted ${deleted} old checkpoints`);
   *
   * // Remove all checkpoints
   * const totalDeleted = await store.prune();
   * ```
   */
  async prune(olderThan?: Date): Promise<number> {
    const ids = await this.storage.listIds();
    let deleted = 0;

    for (const id of ids) {
      if (olderThan) {
        const checkpoint = await this.storage.load(id);
        if (checkpoint && checkpoint.createdAt < olderThan) {
          await this.storage.delete(id);
          deleted++;
        }
      } else {
        await this.storage.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Gets the semantic version string for a checkpoint
   *
   * @param checkpointId - The checkpoint ID to get the version for
   * @returns The semantic version string
   * @throws Error if checkpoint is not found
   *
   * @example
   * ```typescript
   * const version = await store.getVersion('checkpoint-123');
   * console.log(version); // "1.2.3"
   * ```
   */
  async getVersion(checkpointId: string): Promise<string> {
    const checkpoint = await this.storage.load(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    return checkpoint.version;
  }

  /**
   * Gets a checkpoint by ID
   *
   * @param checkpointId - The checkpoint ID to retrieve
   * @returns The checkpoint or null if not found
   */
  async get(checkpointId: string): Promise<Checkpoint | null> {
    return this.storage.load(checkpointId);
  }

  /**
   * Updates checkpoint tags
   *
   * @param checkpointId - The checkpoint ID to update
   * @param tags - The new tags to set
   * @returns The updated checkpoint
   * @throws Error if checkpoint is not found
   */
  async updateTags(checkpointId: string, tags: string[]): Promise<Checkpoint> {
    const checkpoint = await this.storage.load(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    const updated: Checkpoint = {
      ...checkpoint,
      tags,
    };

    await this.storage.save(updated);
    return updated;
  }

  /**
   * Gets the lineage (parent chain) of a checkpoint
   *
   * @param checkpointId - The checkpoint ID to trace lineage for
   * @returns Array of checkpoints from oldest ancestor to the specified checkpoint
   */
  async getLineage(checkpointId: string): Promise<CheckpointSummary[]> {
    const lineage: CheckpointSummary[] = [];
    let currentId: string | undefined = checkpointId;

    while (currentId) {
      const checkpoint = await this.storage.load(currentId);
      if (!checkpoint) break;

      lineage.unshift({
        id: checkpoint.id,
        version: checkpoint.version,
        parentId: checkpoint.parentId,
        label: checkpoint.label,
        createdAt: checkpoint.createdAt,
        description: checkpoint.description,
        tags: checkpoint.tags,
        sizeMetrics: checkpoint.sizeMetrics,
        fileCount: checkpoint.context.metadata?.files?.length ?? 0,
        rootPath: extractRootPath(checkpoint.context),
      });

      currentId = checkpoint.parentId;
    }

    return lineage;
  }

  /**
   * Gets the children of a checkpoint
   *
   * @param checkpointId - The parent checkpoint ID
   * @returns Array of checkpoint summaries that have this checkpoint as parent
   */
  async getChildren(checkpointId: string): Promise<CheckpointSummary[]> {
    const ids = await this.storage.listIds();
    const checkpoints = await Promise.all(ids.map((id) => this.storage.load(id)));
    const validCheckpoints = checkpoints.filter((cp): cp is Checkpoint => cp !== null);
    const children = validCheckpoints.filter((cp) => cp.parentId === checkpointId);
    return filterAndSortCheckpoints(children);
  }

  /**
   * Checks if a checkpoint exists
   *
   * @param checkpointId - The checkpoint ID to check
   * @returns True if the checkpoint exists
   */
  async exists(checkpointId: string): Promise<boolean> {
    return this.storage.exists(checkpointId);
  }
}

/**
 * Factory function to create a CheckpointStore instance
 *
 * @param config - Configuration options for the store
 * @returns A new CheckpointStore instance
 *
 * @example
 * ```typescript
 * // Create in-memory store (default)
 * const memoryStore = createCheckpointStore();
 *
 * // Create file system store
 * const fsStore = createCheckpointStore({
 *   backend: 'filesystem',
 *   basePath: './checkpoints',
 *   compression: { enabled: true, level: 6 },
 * });
 * ```
 */
export function createCheckpointStore(config?: CheckpointStoreConfig): CheckpointStore {
  return new CheckpointStore(config);
}

// Export storage backends for advanced use cases
export { InMemoryStorageBackend, FileSystemStorageBackend };
