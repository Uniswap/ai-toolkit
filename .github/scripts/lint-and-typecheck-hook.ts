#!/usr/bin/env npx tsx
/**
 * Claude Code PostToolUse Hook: Lint and Typecheck
 *
 * This hook runs after Claude Code's Write or Edit tools to lint and typecheck
 * the files that were just modified. It provides immediate feedback to Claude
 * about any issues introduced by its changes.
 *
 * @usage
 *   Configured as a PostToolUse hook in .claude/settings.json:
 *   {
 *     "hooks": {
 *       "PostToolUse": [{
 *         "matcher": "Write|Edit",
 *         "hooks": [{
 *           "type": "command",
 *           "command": "npx tsx .github/scripts/lint-and-typecheck-hook.ts"
 *         }]
 *       }]
 *     }
 *   }
 *
 * @input JSON via stdin:
 *   {
 *     "session_id": string,
 *     "hook_event_name": "PostToolUse",
 *     "tool_name": "Write" | "Edit",
 *     "tool_input": {
 *       "file_path": string,
 *       ...
 *     },
 *     "tool_response": string,
 *     "cwd": string
 *   }
 *
 * @output
 *   - Exit 0: No issues found (success message to stdout)
 *   - Exit 2: Issues found (error details to stderr for Claude feedback)
 *
 * @environment
 *   No special environment variables required.
 *   Assumes npx, eslint, and typescript are available in the project.
 */

import { execSync, type ExecSyncOptions } from 'node:child_process';
import { existsSync, readSync, statSync } from 'node:fs';
import { extname, resolve, dirname, basename } from 'node:path';

// =============================================================================
// Types
// =============================================================================

interface HookInput {
  session_id?: string;
  hook_event_name: string;
  tool_name: string;
  tool_input: {
    file_path: string;
    [key: string]: unknown;
  };
  tool_response?: string;
  cwd?: string;
}

interface LintResult {
  success: boolean;
  output: string;
  errorCount: number;
  warningCount: number;
}

interface TypecheckResult {
  success: boolean;
  output: string;
  errorCount: number;
}

// =============================================================================
// Constants
// =============================================================================

/** File extensions that should be linted */
const LINTABLE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
]);

/** File extensions that require typechecking */
const TYPECHECKABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);

/** Maximum time (ms) to wait for lint/typecheck commands */
const COMMAND_TIMEOUT = 60000; // 60 seconds

// =============================================================================
// Utilities
// =============================================================================

function log(message: string): void {
  console.log(`[lint-hook] ${message}`);
}

function logError(message: string): void {
  console.error(`[lint-hook] ${message}`);
}

/**
 * Reads all input from stdin synchronously
 */
function readStdin(): string {
  const chunks: Buffer[] = [];
  const BUFSIZE = 1024;
  let bytesRead: number;
  const buf = Buffer.alloc(BUFSIZE);
  const fd = 0; // stdin

  try {
    for (;;) {
      try {
        bytesRead = readSync(fd, buf, 0, BUFSIZE, null);
        if (bytesRead === 0) break;
        chunks.push(Buffer.from(buf.subarray(0, bytesRead)));
      } catch {
        // EAGAIN or other read error - done reading
        break;
      }
    }
  } catch {
    // stdin not available or other error
  }

  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Executes a command and returns the result
 */
function execCommand(
  command: string,
  cwd: string
): { success: boolean; stdout: string; stderr: string } {
  const options: ExecSyncOptions = {
    cwd,
    encoding: 'utf-8',
    timeout: COMMAND_TIMEOUT,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024, // 10MB
  };

  try {
    const stdout = execSync(command, options) as string;
    return { success: true, stdout: stdout || '', stderr: '' };
  } catch (error) {
    const execError = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      status?: number;
    };
    return {
      success: false,
      stdout: execError.stdout?.toString() || '',
      stderr: execError.stderr?.toString() || '',
    };
  }
}

/**
 * Finds the project root by looking for package.json
 */
function findProjectRoot(startPath: string): string {
  let current = resolve(startPath);

  while (current !== '/') {
    if (existsSync(resolve(current, 'package.json'))) {
      return current;
    }
    current = dirname(current);
  }

  return startPath;
}

/**
 * Checks if a file should be linted based on its extension
 */
function shouldLint(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return LINTABLE_EXTENSIONS.has(ext);
}

/**
 * Checks if a file should be typechecked based on its extension
 */
function shouldTypecheck(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return TYPECHECKABLE_EXTENSIONS.has(ext);
}

/**
 * Checks if the file still exists (might have been deleted by Edit tool)
 */
function fileExists(filePath: string): boolean {
  try {
    return existsSync(filePath) && statSync(filePath).isFile();
  } catch {
    return false;
  }
}

// =============================================================================
// Lint Functions
// =============================================================================

/**
 * Runs ESLint on a specific file
 */
function lintFile(filePath: string, projectRoot: string): LintResult {
  log(`Linting: ${filePath}`);

  // Use ESLint directly on the specific file
  // The --format option outputs machine-readable JSON
  const command = `npx eslint "${filePath}" --format json --no-error-on-unmatched-pattern`;

  const result = execCommand(command, projectRoot);

  if (result.success) {
    return {
      success: true,
      output: '',
      errorCount: 0,
      warningCount: 0,
    };
  }

  // Parse ESLint JSON output to extract error/warning counts
  let errorCount = 0;
  let warningCount = 0;
  let formattedOutput = '';

  try {
    const eslintResults = JSON.parse(result.stdout || '[]') as Array<{
      filePath: string;
      errorCount: number;
      warningCount: number;
      messages: Array<{
        ruleId: string | null;
        severity: number;
        message: string;
        line: number;
        column: number;
      }>;
    }>;

    for (const fileResult of eslintResults) {
      errorCount += fileResult.errorCount;
      warningCount += fileResult.warningCount;

      for (const msg of fileResult.messages) {
        const severity = msg.severity === 2 ? 'error' : 'warning';
        const ruleId = msg.ruleId ? ` (${msg.ruleId})` : '';
        formattedOutput += `  ${fileResult.filePath}:${msg.line}:${msg.column} ${severity}: ${msg.message}${ruleId}\n`;
      }
    }
  } catch {
    // If JSON parsing fails, use raw output
    formattedOutput = result.stdout || result.stderr;
  }

  return {
    success: errorCount === 0,
    output: formattedOutput.trim(),
    errorCount,
    warningCount,
  };
}

// =============================================================================
// Typecheck Functions
// =============================================================================

/**
 * Finds the Nx project that contains a file
 */
function findNxProject(filePath: string, projectRoot: string): string | null {
  // Use Nx to find the project for this file
  const command = `npx nx show project --file="${filePath}" 2>/dev/null || true`;

  const result = execCommand(command, projectRoot);

  if (result.success && result.stdout.trim()) {
    // The output might be project name or JSON - extract project name
    const output = result.stdout.trim();
    // If it's a simple project name, return it
    if (/^[\w-]+$/.test(output)) {
      return output;
    }
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(output) as { name?: string };
      if (parsed.name) {
        return parsed.name;
      }
    } catch {
      // Not JSON, use as-is if it looks like a project name
      const firstLine = output.split('\n')[0].trim();
      if (/^[\w-@/]+$/.test(firstLine)) {
        return firstLine;
      }
    }
  }

  return null;
}

/**
 * Runs typecheck on the affected Nx project
 */
function typecheckProject(
  filePath: string,
  projectRoot: string
): TypecheckResult {
  log(`Typechecking project containing: ${filePath}`);

  // First, try to find the Nx project
  const nxProject = findNxProject(filePath, projectRoot);

  let command: string;
  if (nxProject) {
    log(`Found Nx project: ${nxProject}`);
    // Run typecheck target on the specific project
    command = `npx nx run ${nxProject}:typecheck --skip-nx-cache 2>&1 || true`;
  } else {
    // Fallback: run tsc on the file's directory
    log(`No Nx project found, using tsc directly`);
    const fileDir = dirname(filePath);
    const fileName = basename(filePath);

    // Check for tsconfig in the directory or use project root's
    const tsconfigPath = existsSync(resolve(fileDir, 'tsconfig.json'))
      ? resolve(fileDir, 'tsconfig.json')
      : existsSync(resolve(projectRoot, 'tsconfig.base.json'))
        ? resolve(projectRoot, 'tsconfig.base.json')
        : resolve(projectRoot, 'tsconfig.json');

    if (!existsSync(tsconfigPath)) {
      return {
        success: true,
        output: '',
        errorCount: 0,
      };
    }

    // Run tsc with noEmit to just check types
    command = `npx tsc --noEmit --project "${tsconfigPath}" 2>&1 | grep -E "${fileName}" || true`;
  }

  const result = execCommand(command, projectRoot);

  // Parse tsc output for errors
  let errorCount = 0;
  const errorLines: string[] = [];

  const lines = (result.stdout || '').split('\n');
  for (const line of lines) {
    // TypeScript errors follow pattern: file.ts(line,col): error TS####: message
    if (line.includes(': error TS') || line.includes(': error:')) {
      errorCount++;
      errorLines.push(line.trim());
    }
  }

  // Also check stderr for errors
  const stderrLines = (result.stderr || '').split('\n');
  for (const line of stderrLines) {
    if (line.includes(': error TS') || line.includes(': error:')) {
      errorCount++;
      errorLines.push(line.trim());
    }
  }

  return {
    success: errorCount === 0,
    output: errorLines.join('\n'),
    errorCount,
  };
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  // Read input from stdin
  const stdinData = readStdin();

  if (!stdinData.trim()) {
    log('No input received, skipping');
    process.exit(0);
  }

  // Parse the hook input
  let input: HookInput;
  try {
    input = JSON.parse(stdinData);
  } catch (error) {
    logError(`Failed to parse input JSON: ${(error as Error).message}`);
    process.exit(0); // Don't block on parse errors
  }

  // Extract file path from tool input
  const filePath = input.tool_input?.file_path;

  if (!filePath) {
    log('No file_path in tool_input, skipping');
    process.exit(0);
  }

  // Resolve the file path
  const cwd = input.cwd || process.cwd();
  const absoluteFilePath = resolve(cwd, filePath);

  // Check if file exists (it might have been deleted)
  if (!fileExists(absoluteFilePath)) {
    log(`File does not exist (possibly deleted): ${filePath}`);
    process.exit(0);
  }

  // Find project root
  const projectRoot = findProjectRoot(absoluteFilePath);
  log(`Project root: ${projectRoot}`);

  const errors: string[] = [];
  const warnings: string[] = [];

  // Run lint if applicable
  if (shouldLint(absoluteFilePath)) {
    const lintResult = lintFile(absoluteFilePath, projectRoot);

    if (!lintResult.success) {
      errors.push(`ESLint found ${lintResult.errorCount} error(s):`);
      errors.push(lintResult.output);
    } else if (lintResult.warningCount > 0) {
      warnings.push(
        `ESLint found ${lintResult.warningCount} warning(s):\n${lintResult.output}`
      );
    }
  }

  // Run typecheck if applicable
  if (shouldTypecheck(absoluteFilePath)) {
    const typecheckResult = typecheckProject(absoluteFilePath, projectRoot);

    if (!typecheckResult.success) {
      errors.push(
        `TypeScript found ${typecheckResult.errorCount} type error(s):`
      );
      errors.push(typecheckResult.output);
    }
  }

  // Report results
  if (errors.length > 0) {
    // Exit code 2: blocking error - stderr becomes feedback to Claude
    const errorMessage = [
      `Lint/typecheck issues found in ${filePath}:`,
      '',
      ...errors,
      '',
      'Please fix these issues before continuing.',
    ].join('\n');

    logError(errorMessage);
    process.exit(2);
  }

  if (warnings.length > 0) {
    log(`Warnings found:\n${warnings.join('\n')}`);
  }

  log(`No issues found in ${filePath}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logError(`Unexpected error: ${message}`);
  process.exit(0); // Don't block on unexpected errors
});
