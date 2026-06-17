#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS hook executed by the Claude Code runtime */
/* global require, process */
/**
 * PostToolUse hook: when a PR is opened, inject a note asking Claude to offer
 * running /skill-mine (mine this session for skills/agents worth codifying).
 *
 * Fires on:
 *   - Bash commands containing `gh pr create`, `gt submit`, or `gt create`
 *   - the GitHub MCP `create_pull_request` tool
 *
 * Never blocks the PR. Asks at most once per session (sentinel file keyed by
 * session_id). The injected `additionalContext` is what realizes "ask me if I
 * want to run this" — Claude sees it and asks the user in normal conversation.
 *
 * Plain CommonJS so it runs under the Node that ships with Claude Code — no
 * `tsx`, `bun`, or `jq` dependency. Invoked via:
 *   node ${CLAUDE_PLUGIN_ROOT}/hooks/pr-skill-doctor-prompt.cjs
 */
const { existsSync, mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const os = require('os');

// Per-session sentinel lives in the OS temp dir so the hook works wherever the
// plugin is installed (it never writes into the plugin install location).
const WORKSPACE = join(os.tmpdir(), 'skill-doctor-hook');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) input += chunk;
});

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const sessionId = data.session_id || 'unknown';

    if (!isPrOpen(toolName, toolInput) || !toolSucceeded(data)) {
      process.exit(0);
    }

    // Once-per-session guard.
    const sentinel = join(WORKSPACE, `pr-prompted-${sanitize(sessionId)}`);
    if (existsSync(sentinel)) process.exit(0);
    try {
      mkdirSync(WORKSPACE, { recursive: true });
      writeFileSync(sentinel, new Date().toISOString());
    } catch {
      // If we can't write the sentinel, still prompt once rather than failing.
    }

    const additionalContext =
      'A PR was just opened. Offer to run /skill-mine to mine this session for ' +
      'workflows worth codifying into a new or edited skill or agent (and to ' +
      "catch any skill that should have triggered this session but didn't). Ask " +
      'once, conversationally; do not auto-run it.';

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext,
        },
      })
    );
    process.exit(0);
  } catch {
    // A hook must never break the user's flow. Swallow everything.
    process.exit(0);
  }
});

function isPrOpen(toolName, toolInput) {
  if (toolName === 'Bash') {
    const cmd = String((toolInput && toolInput.command) || '');
    return /\bgh\s+pr\s+create\b/.test(cmd) || /\bgt\s+(submit|create)\b/.test(cmd);
  }
  // GitHub MCP tool names look like
  // mcp__plugin_uniswap-integrations_github__create_pull_request
  return toolName.endsWith('create_pull_request');
}

/**
 * Best-effort success check. Bash failures surface as a non-zero exit or an
 * error field; if we can't tell, assume success (better to occasionally prompt
 * than to miss a real PR open).
 */
function toolSucceeded(data) {
  const resp = data.tool_response;
  if (!resp || typeof resp !== 'object') return true;
  if (resp.success === false) return false;
  if (typeof resp.exit_code === 'number' && resp.exit_code !== 0) return false;
  if (resp.is_error === true) return false;
  return true;
}

function sanitize(s) {
  return String(s).replace(/[^A-Za-z0-9._-]/g, '_');
}
