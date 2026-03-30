#!/usr/bin/env npx tsx
/**
 * Post Docs Check Script
 *
 * Processes Claude's documentation check output and posts results to GitHub.
 * Supports multiple modes for providing fix suggestions:
 *
 * MODES:
 * - check: Just post a summary comment (no suggestions)
 * - suggest: Post inline commit suggestions via PR review
 * - branch: Create a fixup branch with all suggested changes
 * - auto: Use suggest for ≤3 suggestions, branch for >3
 *
 * AUTO-COMMIT:
 * When --auto-commit is passed, suggestions are applied directly to the PR branch
 * and committed/pushed by the workflow. This bypasses suggestion_mode entirely.
 *
 * @usage
 *   npx tsx .github/scripts/post-docs-check.ts \
 *     --owner "Uniswap" \
 *     --repo "ai-toolkit" \
 *     --pr-number 123 \
 *     --head-ref "feature/my-branch" \
 *     --mode "suggest" \
 *     --response-file "/tmp/docs-check-response.json"
 *
 *   # With auto-commit:
 *   npx tsx .github/scripts/post-docs-check.ts \
 *     --owner "Uniswap" \
 *     --repo "ai-toolkit" \
 *     --pr-number 123 \
 *     --head-ref "feature/my-branch" \
 *     --mode "suggest" \
 *     --auto-commit \
 *     --response-file "/tmp/docs-check-response.json"
 *
 * @environment
 *   GITHUB_TOKEN - GitHub token for API authentication
 *   WORKFLOW_PAT - Optional PAT for branch creation and auto-commit push (falls back to GITHUB_TOKEN)
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';

// =============================================================================
// Types
// =============================================================================

interface Suggestion {
  type: 'commit_suggestion' | 'file_creation' | 'file_modification';
  severity: 'info' | 'warning' | 'error';
  file_path: string;
  line_start?: number | null;
  line_end?: number | null;
  current_content?: string;
  suggested_content: string;
  explanation: string;
}

interface MissingUpdate {
  type: 'claude_md' | 'readme' | 'version_bump' | 'changelog';
  file_path: string;
  reason: string;
  severity: 'info' | 'warning' | 'error';
}

interface DocsCheckOutput {
  verdict: 'PASS' | 'FAIL';
  verdict_reason: string;
  summary: string;
  suggestions: Suggestion[];
  missing_updates: MissingUpdate[];
  files_analyzed?: string[];
  confidence?: number;
}

type Mode = 'check' | 'suggest' | 'branch' | 'auto';

// =============================================================================
// Utilities
// =============================================================================

function log(message: string): void {
  console.log(`[post-docs-check] ${message}`);
}

function logError(message: string): void {
  console.error(`[post-docs-check] ERROR: ${message}`);
}

function gh(args: string[], input?: string): string {
  log(`Executing: gh ${args.join(' ')}`);

  try {
    if (input !== undefined) {
      // Write input to temp file to avoid shell escaping issues
      const tempFile = `/tmp/gh-input-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
      writeFileSync(tempFile, input, 'utf-8');

      const modifiedArgs = args.map((arg, i) => {
        if (args[i - 1] === '--input' && arg === '-') {
          return tempFile;
        }
        return arg;
      });

      const result = execFileSync('gh', modifiedArgs, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      return result.trim();
    }

    const result = execFileSync('gh', args, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return result.trim();
  } catch (error) {
    const execError = error as { stderr?: string; message?: string };
    logError(`gh command failed: ${execError.stderr || execError.message}`);
    throw error;
  }
}

function git(args: string[]): string {
  log(`Executing: git ${args.join(' ')}`);

  try {
    const result = execFileSync('git', args, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return result.trim();
  } catch (error) {
    const execError = error as { stderr?: string; message?: string };
    logError(`git command failed: ${execError.stderr || execError.message}`);
    throw error;
  }
}

// =============================================================================
// Constants
// =============================================================================

const COMMENT_MARKER = '<!-- claude-docs-check-bot -->';

const SEVERITY_EMOJI = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
};

const TYPE_EMOJI = {
  claude_md: '📘',
  readme: '📄',
  version_bump: '🏷️',
  changelog: '📝',
};

// =============================================================================
// GitHub API Functions
// =============================================================================

/**
 * Find existing bot comment on the PR
 */
function findExistingComment(owner: string, repo: string, prNumber: number): number | null {
  try {
    const result = gh([
      'api',
      `repos/${owner}/${repo}/issues/${prNumber}/comments`,
      '--jq',
      `.[] | select(.user.login == "github-actions[bot]") | select(.body | contains("${COMMENT_MARKER}")) | .id`,
    ]);

    if (result) {
      const commentId = parseInt(result.split('\n')[0], 10);
      if (!isNaN(commentId)) {
        return commentId;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Post or update the summary comment
 */
function upsertComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): { id: number; html_url: string } {
  const existingId = findExistingComment(owner, repo, prNumber);

  if (existingId) {
    log(`Updating existing comment ${existingId}...`);
    const result = gh(
      [
        'api',
        '--method',
        'PATCH',
        `repos/${owner}/${repo}/issues/comments/${existingId}`,
        '--input',
        '-',
      ],
      JSON.stringify({ body })
    );
    return JSON.parse(result);
  } else {
    log('Creating new comment...');
    const result = gh(
      [
        'api',
        '--method',
        'POST',
        `repos/${owner}/${repo}/issues/${prNumber}/comments`,
        '--input',
        '-',
      ],
      JSON.stringify({ body })
    );
    return JSON.parse(result);
  }
}

/**
 * Get valid diff lines for inline comments
 */
function getValidDiffLines(
  owner: string,
  repo: string,
  prNumber: number
): Map<string, Set<number>> {
  const validLines = new Map<string, Set<number>>();

  try {
    const diff = gh(['pr', 'diff', prNumber.toString(), '--repo', `${owner}/${repo}`]);

    let currentFile: string | null = null;

    for (const line of diff.split('\n')) {
      if (line.startsWith('+++ b/')) {
        currentFile = line.substring(6);
        if (!validLines.has(currentFile)) {
          validLines.set(currentFile, new Set<number>());
        }
        continue;
      }

      if (line.startsWith('@@') && currentFile) {
        const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
        if (match) {
          const start = parseInt(match[1], 10);
          const count = match[2] ? parseInt(match[2], 10) : 1;
          const fileLines = validLines.get(currentFile)!;
          for (let i = start; i < start + count; i++) {
            fileLines.add(i);
          }
        }
      }
    }

    return validLines;
  } catch {
    return validLines;
  }
}

/**
 * Create a PR review with inline suggestions
 */
function createReviewWithSuggestions(
  owner: string,
  repo: string,
  prNumber: number,
  output: DocsCheckOutput,
  validLines: Map<string, Set<number>>
): void {
  // Filter suggestions that can be posted as inline comments
  const inlineSuggestions = output.suggestions.filter((s) => {
    if (s.type !== 'commit_suggestion' || !s.line_start) return false;
    const fileLines = validLines.get(s.file_path);
    return fileLines?.has(s.line_start);
  });

  if (inlineSuggestions.length === 0) {
    log('No valid inline suggestions to post');
    return;
  }

  log(`Creating review with ${inlineSuggestions.length} inline suggestion(s)...`);

  const comments = inlineSuggestions.map((s) => ({
    path: s.file_path,
    line: s.line_start!,
    body: `${SEVERITY_EMOJI[s.severity]} **Documentation Update Suggested**

${s.explanation}

\`\`\`suggestion
${s.suggested_content}
\`\`\``,
    side: 'RIGHT' as const,
  }));

  const reviewBody = `## 📚 Documentation Check - Inline Suggestions

Found ${inlineSuggestions.length} suggestion(s) that can be committed directly.

Click **"Commit suggestion"** on each comment to apply the fix, or **"Add to batch"** to commit multiple at once.`;

  const requestBody = {
    body: reviewBody,
    event: 'COMMENT' as const,
    comments,
  };

  gh(
    ['api', '--method', 'POST', `repos/${owner}/${repo}/pulls/${prNumber}/reviews`, '--input', '-'],
    JSON.stringify(requestBody)
  );

  log('Review with suggestions posted');
}

/**
 * Create a fixup branch with all suggested changes
 */
function createFixupBranch(
  owner: string,
  repo: string,
  prNumber: number,
  headRef: string,
  output: DocsCheckOutput
): string | null {
  const fileChanges = output.suggestions.filter(
    (s) => s.type === 'file_creation' || s.type === 'file_modification'
  );

  if (fileChanges.length === 0) {
    log('No file changes to commit to fixup branch');
    return null;
  }

  const branchName = `docs-fixup/${headRef}`;

  log(`Creating fixup branch: ${branchName}`);

  try {
    // Create branch from PR head
    const prData = gh(['api', `repos/${owner}/${repo}/pulls/${prNumber}`, '--jq', '.head.sha']);
    const headSha = prData.trim();

    // Create the branch
    gh(
      ['api', '--method', 'POST', `repos/${owner}/${repo}/git/refs`, '--input', '-'],
      JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: headSha,
      })
    );

    log(`Branch ${branchName} created from ${headSha}`);

    // Apply each file change
    for (const change of fileChanges) {
      log(`Applying change to ${change.file_path}...`);

      // Get current file content (if exists) to get the SHA
      let fileSha: string | undefined;
      try {
        const fileData = gh([
          'api',
          `repos/${owner}/${repo}/contents/${change.file_path}?ref=${branchName}`,
          '--jq',
          '.sha',
        ]);
        fileSha = fileData.trim();
      } catch {
        // File doesn't exist yet
      }

      // Create/update file
      const commitMessage =
        change.type === 'file_creation'
          ? `docs: create ${change.file_path}`
          : `docs: update ${change.file_path}`;

      const requestBody: Record<string, unknown> = {
        message: commitMessage,
        content: Buffer.from(change.suggested_content).toString('base64'),
        branch: branchName,
      };

      if (fileSha) {
        requestBody.sha = fileSha;
      }

      gh(
        [
          'api',
          '--method',
          'PUT',
          `repos/${owner}/${repo}/contents/${change.file_path}`,
          '--input',
          '-',
        ],
        JSON.stringify(requestBody)
      );

      log(`Applied: ${change.file_path}`);
    }

    // Save branch name for workflow output
    writeFileSync('/tmp/fixup-branch-name.txt', branchName);

    return branchName;
  } catch (error) {
    logError(`Failed to create fixup branch: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Auto-commit changes directly to the PR branch
 * Applies all suggestions locally and pushes to the PR branch
 */
function autoCommitChanges(
  owner: string,
  repo: string,
  headRef: string,
  output: DocsCheckOutput
): number {
  const allSuggestions = output.suggestions;

  if (allSuggestions.length === 0) {
    log('No suggestions to auto-commit');
    return 0;
  }

  log(`Auto-committing ${allSuggestions.length} suggestion(s) to ${headRef}...`);

  try {
    // Configure git user for commits
    git(['config', 'user.name', 'github-actions[bot]']);
    git(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);

    // Ensure we're on the correct branch
    // The workflow checks out by SHA which leaves us in detached HEAD state.
    // We need to create/checkout a local branch that tracks the PR branch.
    // This handles both same-repo PRs and fork PRs.
    try {
      // Try to checkout existing local branch
      git(['checkout', headRef]);
    } catch {
      // Branch doesn't exist locally - create it from current HEAD
      // (which is already at the correct commit from the SHA checkout)
      log(`Creating local branch ${headRef} from current HEAD`);
      git(['checkout', '-B', headRef, 'HEAD']);
    }

    let filesModified = 0;

    // Apply each suggestion
    for (const suggestion of allSuggestions) {
      const filePath = suggestion.file_path;

      if (suggestion.type === 'file_creation') {
        // Create new file
        log(`Creating file: ${filePath}`);

        // Ensure directory exists
        const dir = dirname(filePath);
        if (dir && dir !== '.') {
          mkdirSync(dir, { recursive: true });
        }

        writeFileSync(filePath, suggestion.suggested_content, 'utf-8');
        git(['add', filePath]);
        filesModified++;
      } else if (suggestion.type === 'file_modification') {
        // Modify existing file
        log(`Modifying file: ${filePath}`);

        if (existsSync(filePath)) {
          writeFileSync(filePath, suggestion.suggested_content, 'utf-8');
          git(['add', filePath]);
          filesModified++;
        } else {
          log(`Warning: File ${filePath} does not exist, creating it`);

          const dir = dirname(filePath);
          if (dir && dir !== '.') {
            mkdirSync(dir, { recursive: true });
          }

          writeFileSync(filePath, suggestion.suggested_content, 'utf-8');
          git(['add', filePath]);
          filesModified++;
        }
      } else if (
        suggestion.type === 'commit_suggestion' &&
        suggestion.line_start &&
        suggestion.current_content
      ) {
        // Handle inline suggestions by replacing content at specific line location
        // Using line-based replacement to avoid replacing wrong occurrence of duplicate content
        log(`Applying inline suggestion to: ${filePath} at line ${suggestion.line_start}`);

        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          // Convert 1-indexed line_start to 0-indexed array position
          const startLineIdx = suggestion.line_start - 1;

          // Find the exact content to replace by comparing lines at the specified location
          const currentLines = suggestion.current_content.split('\n');
          const suggestedLines = suggestion.suggested_content.split('\n');

          // Verify the content at the specified location matches what we expect
          const actualContent = lines
            .slice(startLineIdx, startLineIdx + currentLines.length)
            .join('\n');
          const expectedContent = suggestion.current_content;

          // Normalize for comparison (trim trailing whitespace from lines)
          const normalizeContent = (s: string) =>
            s
              .split('\n')
              .map((line) => line.trimEnd())
              .join('\n');

          if (normalizeContent(actualContent) === normalizeContent(expectedContent)) {
            // Replace the lines at the specific location
            const newLines = [
              ...lines.slice(0, startLineIdx),
              ...suggestedLines,
              ...lines.slice(startLineIdx + currentLines.length),
            ];
            const newContent = newLines.join('\n');

            writeFileSync(filePath, newContent, 'utf-8');
            git(['add', filePath]);
            filesModified++;
          } else {
            // Fallback: try simple string replacement if line-based match fails
            // This handles cases where line numbers may be slightly off
            log(
              `Line content mismatch at line ${suggestion.line_start}, falling back to string match`
            );
            const newContent = content.replace(
              suggestion.current_content,
              suggestion.suggested_content
            );

            if (newContent !== content) {
              writeFileSync(filePath, newContent, 'utf-8');
              git(['add', filePath]);
              filesModified++;
            } else {
              log(`Warning: Could not find content to replace in ${filePath}`);
            }
          }
        } else {
          log(`Warning: File ${filePath} does not exist for inline suggestion`);
        }
      }
    }

    if (filesModified === 0) {
      log('No files were modified');
      return 0;
    }

    // Create commit
    const commitMessage = `docs: auto-update documentation

Applied ${filesModified} documentation update(s) from Claude docs check:
${allSuggestions.map((s) => `- ${s.file_path}: ${s.explanation}`).join('\n')}

Co-authored-by: Claude <claude@anthropic.com>`;

    git(['commit', '-m', commitMessage]);

    // Push to remote
    log(`Pushing to origin/${headRef}...`);

    // Use WORKFLOW_PAT if available for push (has more permissions)
    const token = process.env.WORKFLOW_PAT || process.env.GITHUB_TOKEN;
    if (token) {
      const remoteUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
      git(['push', remoteUrl, `HEAD:${headRef}`]);
    } else {
      git(['push', 'origin', `HEAD:${headRef}`]);
    }

    log(`Successfully pushed ${filesModified} file change(s)`);

    // Save commits pushed count for workflow output
    writeFileSync('/tmp/commits-pushed.txt', '1');

    return 1;
  } catch (error) {
    logError(`Failed to auto-commit changes: ${(error as Error).message}`);
    return 0;
  }
}

/**
 * Build the summary comment body
 */
function buildSummaryComment(
  output: DocsCheckOutput,
  mode: Mode,
  branchName: string | null,
  owner: string,
  repo: string,
  autoCommitted: boolean = false,
  commitsPushed: number = 0
): string {
  const verdictEmoji = output.verdict === 'PASS' ? '✅' : '❌';
  const verdictText = output.verdict === 'PASS' ? 'Passed' : 'Failed';

  let body = `${COMMENT_MARKER}
## 📚 Documentation Check ${verdictEmoji}

**Verdict:** ${verdictText}

${output.verdict_reason}

---

${output.summary}
`;

  // Add missing updates section
  if (output.missing_updates.length > 0) {
    body += `
### Missing Updates

| Type | File | Severity | Reason |
|------|------|----------|--------|
`;
    for (const update of output.missing_updates) {
      const emoji = TYPE_EMOJI[update.type] || '📄';
      const severity = SEVERITY_EMOJI[update.severity];
      body += `| ${emoji} ${update.type} | \`${update.file_path}\` | ${severity} ${update.severity} | ${update.reason} |\n`;
    }
  }

  // Add suggestions section
  if (output.suggestions.length > 0) {
    body += `
### Suggestions (${output.suggestions.length})

`;
    if (autoCommitted && commitsPushed > 0) {
      body += `> ✅ **Changes have been automatically committed and pushed to this PR.**
>
> ${commitsPushed} commit(s) with documentation updates have been added to your branch.\n\n`;
    } else if (mode === 'suggest') {
      body += `> 💡 **Inline suggestions have been posted as review comments.** Click "Commit suggestion" to apply each fix directly.\n\n`;
    } else if (mode === 'branch' && branchName) {
      body += `> 🌿 **A fixup branch has been created:** [\`${branchName}\`](https://github.com/${owner}/${repo}/tree/${branchName})
>
> You can merge this branch into your PR branch to apply all documentation fixes.\n\n`;
    }

    for (const suggestion of output.suggestions) {
      const emoji = SEVERITY_EMOJI[suggestion.severity];
      body += `- ${emoji} **${suggestion.file_path}**: ${suggestion.explanation}\n`;
    }
  } else {
    body += `
### ✨ No Documentation Updates Needed

All documentation appears to be up to date with the code changes.
`;
  }

  // Add footer
  const modeDisplay = autoCommitted ? 'auto-commit' : mode;
  body += `
---

<sub>🤖 Generated by Claude Documentation Validator | Mode: \`${modeDisplay}\`</sub>
`;

  return body;
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      owner: { type: 'string' },
      repo: { type: 'string' },
      'pr-number': { type: 'string' },
      'head-ref': { type: 'string' },
      mode: { type: 'string', default: 'suggest' },
      'auto-commit': { type: 'boolean', default: false },
      'response-file': { type: 'string' },
    },
    strict: true,
  });

  const owner = values.owner;
  const repo = values.repo;
  const prNumber = parseInt(values['pr-number'] || '', 10);
  const headRef = values['head-ref'] || '';
  let mode = values.mode as Mode;
  const autoCommit = values['auto-commit'] || false;
  const responseFile = values['response-file'];

  // Validate inputs
  if (!owner || !repo || isNaN(prNumber)) {
    logError('Missing required arguments: --owner, --repo, --pr-number');
    process.exit(1);
  }

  if (!responseFile || !existsSync(responseFile)) {
    logError('Missing or invalid --response-file');
    process.exit(1);
  }

  // Read response
  const responseContent = readFileSync(responseFile, 'utf-8');
  const output: DocsCheckOutput = JSON.parse(responseContent);

  log(`Processing docs check for ${owner}/${repo}#${prNumber}`);
  log(`Verdict: ${output.verdict}`);
  log(`Suggestions: ${output.suggestions.length}`);
  log(`Missing updates: ${output.missing_updates.length}`);

  // Determine actual mode
  if (mode === 'auto') {
    mode = output.suggestions.length <= 3 ? 'suggest' : 'branch';
    log(`Auto mode selected: ${mode}`);
  }

  let branchName: string | null = null;
  let commitsPushed = 0;

  // Process based on mode (auto-commit takes precedence)
  if (autoCommit && output.suggestions.length > 0) {
    log('Auto-commit mode enabled');
    commitsPushed = autoCommitChanges(owner, repo, headRef, output);
  } else if (mode === 'suggest' && output.suggestions.length > 0) {
    const validLines = getValidDiffLines(owner, repo, prNumber);
    createReviewWithSuggestions(owner, repo, prNumber, output, validLines);
  } else if (mode === 'branch' && output.suggestions.length > 0) {
    branchName = createFixupBranch(owner, repo, prNumber, headRef, output);
  }

  // Post summary comment
  const commentBody = buildSummaryComment(
    output,
    mode,
    branchName,
    owner,
    repo,
    autoCommit,
    commitsPushed
  );
  const comment = upsertComment(owner, repo, prNumber, commentBody);

  log(`Summary comment posted: ${comment.html_url}`);

  // Output summary
  console.log('\n=== Docs Check Summary ===');
  console.log(`Verdict: ${output.verdict}`);
  console.log(`Suggestions: ${output.suggestions.length}`);
  console.log(`Missing updates: ${output.missing_updates.length}`);
  console.log(`Mode: ${autoCommit ? 'auto-commit' : mode}`);
  if (autoCommit && commitsPushed > 0) {
    console.log(`Commits pushed: ${commitsPushed}`);
  }
  if (branchName) {
    console.log(`Fixup branch: ${branchName}`);
  }
  console.log(`Comment URL: ${comment.html_url}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logError(`Unexpected error: ${message}`);
  process.exit(1);
});
