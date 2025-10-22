# Implementation Plan: Fix CLAUDE.md Documentation Agent Hallucinations

**Generated:** 2025-10-22
**Task:** Improve ai-toolkit's CLAUDE.md documentation agents by fixing volume and quality problems
**Context Used:** Yes - analyzed claude-docs-manager, claude-docs-initializer, and agents architecture

## Overview

The current claude-docs system has two critical problems: (1) claude-docs-initializer creates too many CLAUDE.md files at once, making PRs impossible to review, and (2) both claude-docs-manager and claude-docs-initializer generate documentation with hallucinations—non-existent directory structures, incorrect technology references, and general inaccuracies.

This plan addresses these issues through three main improvements: (1) creating a new claude-docs-fact-checker agent that the main Claude Code agent will automatically invoke after documentation generation to verify accuracy, (2) implementing batching and approval mechanisms to control volume, and (3) adding verification steps to existing agents to prevent hallucinations at the source.

The solution leverages the existing agent architecture in the ai-toolkit monorepo, which uses Nx workspace management, TypeScript, and markdown files with YAML front matter for agent definitions located in `packages/agents/agnostic/src/`. The fact-checker uses the proactive agent pattern where its description causes Claude Code to automatically invoke it after documentation agents complete their work.

## Scope

### Included

- Create new claude-docs-fact-checker agent with proactive description that triggers automatic invocation
- Add batching mechanism to claude-docs-initializer with approval checkpoints
- Update documentation agent output formats to support fact-checking workflow
- Add pre-generation verification to both documentation agents
- Modify documentation workflow to require human approval at batch boundaries

### Excluded

- Changes to the agent orchestration system (using existing proactive agent pattern)
- Direct agent-to-agent calls (fact-checker invoked by main Claude Code agent, not by doc agents)
- Modifications to non-documentation agents
- UI/dashboard for approval management (use structured output instead)
- Automated approval based on confidence scores (always require human review)
- Performance optimizations for fact-checking
- Integration with git hooks or CI/CD pipelines

## Current State

- **Architecture:** Nx monorepo with specialized agents defined as markdown files with YAML front matter
- **Relevant Files:**
  - `packages/agents/agnostic/src/claude-docs-manager.md` - Updates CLAUDE.md based on code changes
  - `packages/agents/agnostic/src/claude-docs-initializer.md` - Creates initial CLAUDE.md documentation
  - `packages/agents/agnostic/CLAUDE.md` - Package documentation
  - `packages/agents/agnostic/package.json` - Package configuration and build targets
- **Patterns:**
  - Agents use structured YAML inputs/outputs
  - Documentation agents operate on file paths and directory structures
  - Git-based discovery is preferred over manual file traversal
  - Agents inherit tool permissions from invoking commands

## Implementation Steps

### Step 1: Create claude-docs-fact-checker Agent

Create a specialized agent that verifies documentation accuracy by checking actual filesystem state against documentation claims. The agent uses the proactive pattern where its description explicitly states it should be used after CLAUDE.md generation, causing the main Claude Code agent to automatically invoke it.

**Agent capabilities:**

- Verify directory structures exist as documented
- Validate file references point to real files
- Check technology stack claims against package.json dependencies
- Detect references to non-existent frameworks/languages
- Verify code patterns mentioned exist in actual codebase
- Score documentation sections by accuracy (0-100)

**Verification algorithm:**

```
1. Parse documentation content to extract verifiable claims:
   - Directory/file paths mentioned
   - Technology/framework references
   - Package dependencies
   - Code patterns described

2. For each claim, perform filesystem/code verification:
   - Directory claims: Check if directory exists
   - File claims: Check if file exists and matches description
   - Tech stack: Compare against package.json dependencies
   - Pattern claims: Grep/search codebase for pattern evidence

3. Generate inaccuracy report:
   - List each inaccurate claim with evidence
   - Provide correction suggestions
   - Calculate overall accuracy score

4. Return structured findings with severity levels:
   - Critical: Non-existent paths/files blocking usage
   - High: Wrong technology references
   - Medium: Misleading pattern descriptions
   - Low: Minor naming inconsistencies
```

**Key implementation considerations:**

- Use git ls-files for filesystem verification when available
- Leverage Grep tool for pattern verification
- Parse package.json for accurate dependency verification
- Handle monorepo structure (multiple package.json files)
- Provide specific line numbers/sections for inaccuracies

**Files to create:**

- `packages/agents/agnostic/src/claude-docs-fact-checker.md`

### Step 2: Define Fact-Checker Input/Output Contract

Define clear interfaces for the fact-checker agent to ensure consistent integration with documentation agents.

**Input structure:**

```yaml
inputs:
  - documentation_content: string # The CLAUDE.md content to verify
  - base_path: string # Root directory path for relative path resolution
  - documentation_type: "root" | "package" | "module" | "feature" # Level of documentation
  - git_available: boolean # Whether git ls-files can be used
```

**Output structure:**

```yaml
outputs:
  - verification_passed: boolean # Overall pass/fail
  - accuracy_score: number # 0-100 overall accuracy
  - inaccuracies:
      - claim: string # The inaccurate claim from documentation
        section: string # Section where claim appears
        severity: "critical" | "high" | "medium" | "low"
        evidence: string # Why it's inaccurate
        correction: string # Suggested correction
        line_number: number # Optional line number in doc
  - verified_sections:
      - section: string # Section name
        accuracy: number # 0-100 for this section
        verified_claims: number
        inaccurate_claims: number
  - summary: string # Human-readable summary of findings
```

**Files to modify:**

- `packages/agents/agnostic/src/claude-docs-fact-checker.md`

### Step 3: Add Batching Mechanism to claude-docs-initializer

Implement batch creation workflow with approval checkpoints to control documentation volume.

**Batching strategy:**

```
1. Discovery phase (unchanged):
   - Analyze repository structure
   - Identify all directories needing documentation

2. Batch planning phase (new):
   - Group directories into logical batches (1-2 files per batch)
   - Prioritize by importance: packages → major modules → features
   - Generate batch plan showing what each batch will create

3. Batch execution with approval:
   For each batch:
     a. Generate CLAUDE.md content for batch
     b. Return batch content to main Claude Code agent
     c. Main agent automatically invokes fact-checker (via proactive pattern)
     d. Present batch summary with verification results
     e. Wait for human approval (approve/reject/skip)
     f. If approved, create files and proceed
     g. If rejected, skip batch and continue
     h. After batch completion, provide next batch preview

4. Completion:
   - Summary of all batches (created/skipped/rejected)
   - List of verification issues found
```

**Approval checkpoint format:**

```yaml
batch_checkpoint:
  batch_number: number
  total_batches: number
  files_in_batch:
    - path: string
      summary: string
      accuracy_score: number
      issues_found: number
  wait_for_approval: true
  approval_options: ['approve', 'reject', 'skip', 'edit']
```

**Files to modify:**

- `packages/agents/agnostic/src/claude-docs-initializer.md`

### Step 4: Update Documentation Agent Output Formats

Update both claude-docs-initializer and claude-docs-manager output formats to support the fact-checking workflow orchestrated by the main Claude Code agent.

**Orchestration flow:**

```
1. User requests documentation update/creation
2. Main Claude Code agent invokes appropriate doc agent
3. Doc agent generates content and returns structured output
4. Main agent sees fact-checker's proactive description
5. Main agent automatically invokes fact-checker with doc content
6. Main agent presents combined results with verification status
7. User approves or rejects based on verification results
8. If approved, main agent instructs doc agent to write files (or writes directly)
```

**Updated output structure for both agents:**

```yaml
outputs:
  - operation: "update" | "create"
  - files:
      - path: string
        content: string
        action: "pending_verification" | "ready_to_write"
  - summary: string # What was generated and why
  - requires_verification: boolean # Signal to main agent to invoke fact-checker
```

**Key changes:**

- Agents return generated content without writing files immediately
- Output includes `requires_verification: true` flag
- Main Claude Code agent handles fact-checker invocation and final file writing
- Supports multi-step approval workflow for batching

**Files to modify:**

- `packages/agents/agnostic/src/claude-docs-initializer.md`
- `packages/agents/agnostic/src/claude-docs-manager.md`

### Step 5: Add Pre-Generation Verification to Both Agents

Implement filesystem verification BEFORE writing documentation content to prevent hallucinations at the source.

**Pre-generation checks for claude-docs-initializer:**

```
Before analyzing a directory:
1. Verify directory exists: test -d <path>
2. Get actual directory listing: git ls-files <path> OR ls -la <path>
3. Parse actual package.json if present
4. Count actual source files
5. Store verified facts for content generation
6. Generate content ONLY from verified facts
```

**Pre-generation checks for claude-docs-manager:**

```
Before updating documentation:
1. Verify all changed file paths exist
2. Read actual file contents for pattern detection
3. Verify package boundaries with package.json parsing
4. Confirm technology stack from actual dependencies
5. Use verified facts for update content
```

**Verification helper functions:**

```typescript
// Example pseudocode - NOT actual implementation code
interface VerifiedFacts {
  directory_exists: boolean;
  files_found: string[];
  dependencies: Record<string, string>;
  source_file_count: number;
  has_tests: boolean;
  frameworks: string[];
}

function verifyDirectoryFacts(path: string): VerifiedFacts;
function verifyTechStack(packageJsonPath: string): string[];
function verifyFileExists(path: string): boolean;
```

**Files to modify:**

- `packages/agents/agnostic/src/claude-docs-initializer.md`
- `packages/agents/agnostic/src/claude-docs-manager.md`

### Step 6: Document Fact-Checker Agent

Write complete agent definition following the established agent pattern with proactive invocation.

**Agent structure:**

```markdown
---
name: claude-docs-fact-checker
description: Verify CLAUDE.md documentation accuracy against actual codebase state. Use this agent proactively after claude-docs-manager or claude-docs-initializer generate documentation content to verify accuracy before files are written.
---

# Claude-Docs Fact-Checker Agent

## Mission

[Verification purpose and approach]

## Inputs

[Expected parameters with types]

## Process

[Detailed verification algorithm]

## Output

[Structured verification results]

## Guidelines

[Verification best practices]

## Verification Categories

[Types of checks performed]

## Critical Constraints

[Important limitations and considerations]
```

**Content sections:**

- Mission statement emphasizing accuracy verification and proactive invocation
- Clear input/output contracts
- Detailed verification methodology
- Examples of inaccuracies detected
- Proactive invocation pattern explanation
- Performance considerations
- Instructions for when main agent should invoke this agent

**Files to create:**

- `packages/agents/agnostic/src/claude-docs-fact-checker.md`

### Step 8: Update CLAUDE.md Files with New Patterns

Document the new fact-checking and batching patterns in package documentation.

**Updates to packages/agents/agnostic/CLAUDE.md:**

- Add claude-docs-fact-checker to agent list
- Document verification workflow
- Explain batching mechanism
- Provide examples of fact-checking integration
- Update "Recent Changes" section

**Section additions:**

```markdown
## Documentation Agents Enhancement

### Fact-Checking System

- **claude-docs-fact-checker**: Verifies documentation accuracy
  - Filesystem verification
  - Technology stack validation
  - Pattern existence checking
  - Severity-based issue reporting

### Batching and Approval

- claude-docs-initializer now creates docs in batches
- Human approval required between batches
- Verification scores included in approval data
- Configurable batch sizes (default 1-2 files)

### Integration Pattern

The fact-checker uses the proactive agent pattern:

1. Documentation agents (claude-docs-manager, claude-docs-initializer) generate content
2. They return structured output with `requires_verification: true` flag
3. Main Claude Code agent reads fact-checker's description
4. Description explicitly states to use after documentation generation
5. Main agent automatically invokes fact-checker with generated content
6. Main agent presents combined results to user
7. User approves/rejects based on verification results

**Example workflow:**
```

User: Update CLAUDE.md files
→ Main agent invokes claude-docs-manager
→ claude-docs-manager returns content with requires_verification: true
→ Main agent reads claude-docs-fact-checker description
→ Description says "use proactively after documentation generation"
→ Main agent automatically invokes claude-docs-fact-checker
→ Main agent presents: "Generated docs + verification results"
→ User approves
→ Main agent writes files

```

```

**Files to modify:**

- `packages/agents/agnostic/CLAUDE.md`

## Files Summary

| File Path                                                  | Changes                                                                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `packages/agents/agnostic/src/claude-docs-fact-checker.md` | Create new agent with proactive description, verification logic, input/output contracts, and integration guidelines                |
| `packages/agents/agnostic/src/claude-docs-initializer.md`  | Add batching mechanism, approval checkpoints, pre-generation verification, updated output format with `requires_verification` flag |
| `packages/agents/agnostic/src/claude-docs-manager.md`      | Add pre-generation verification, update output format with `requires_verification` flag for main agent coordination                |
| `packages/agents/agnostic/CLAUDE.md`                       | Document new fact-checker agent, proactive invocation pattern, batching workflow, update agent list and recent changes             |

## Critical Challenges

| Challenge                                                | Mitigation                                                                                                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fact-checking may slow down documentation generation** | Keep verification focused on critical claims only; use git ls-files for fast filesystem checks; cache verification results within a batch      |
| **Approval checkpoints require human intervention**      | Provide clear batch summaries with verification scores; allow skip/abort options; default batch size small enough (1-2 files) to avoid fatigue |
| **False positives in verification**                      | Implement severity levels; allow low-severity issues to pass; provide correction suggestions for manual review                                 |
| **Proactive agent invocation timing**                    | Fact-checker description must be clear about when to invoke; output format includes explicit `requires_verification` flag as signal            |
| **Monorepo complexity with multiple package.json files** | Use git ls-files to find all package.json files; resolve relative paths from correct base directory; handle workspace dependencies correctly   |
