#!/usr/bin/env bash
#
# Manage Claude PR Review Comment
#
# This script creates or updates a single PR comment to track the Claude review progress
# and display the final results. It ensures only one comment exists per review cycle.
#
# USAGE:
#   ./manage-claude-review-comment.sh <command>
#
# COMMANDS:
#   start   - Create or update comment to show review has started
#   update  - Update comment with current progress (reads from .claude-review-state.json)
#   finish  - Update comment with final results (reads verdict and summary files)
#   error   - Update comment with error message
#
# REQUIRED ENVIRONMENT VARIABLES:
#   PR_NUMBER       - Pull request number
#   GITHUB_TOKEN    - GitHub token with PR write permissions
#   GITHUB_RUN_ID   - GitHub Actions run ID (for job links)
#   GITHUB_REPOSITORY - Repository name (owner/repo)
#
# INPUTS (files):
#   .claude-review-state.json   - Progress tracking (optional)
#   .claude-review-verdict.txt  - Final verdict (for finish command)
#   .claude-review-summary.md   - Final summary (for finish command)
#
# OUTPUTS:
#   - Creates or updates a single PR comment
#   - Stores comment ID in .claude-review-comment-id
#
# EXAMPLES:
#   # Start review
#   PR_NUMBER=123 ./manage-claude-review-comment.sh start
#
#   # Update with progress
#   PR_NUMBER=123 ./manage-claude-review-comment.sh update
#
#   # Finish review
#   PR_NUMBER=123 ./manage-claude-review-comment.sh finish
#
#   # Mark as error
#   PR_NUMBER=123 ./manage-claude-review-comment.sh error

set -euo pipefail

# Configuration
readonly PR_NUMBER="${PR_NUMBER:?Error: PR_NUMBER environment variable is required}"
readonly GITHUB_RUN_ID="${GITHUB_RUN_ID:?Error: GITHUB_RUN_ID environment variable is required}"
readonly GITHUB_REPOSITORY="${GITHUB_REPOSITORY:?Error: GITHUB_REPOSITORY environment variable is required}"
readonly COMMENT_ID_FILE=".claude-review-comment-id"
readonly STATE_FILE=".claude-review-state.json"
readonly VERDICT_FILE=".claude-review-verdict.txt"
readonly SUMMARY_FILE=".claude-review-summary.md"
readonly COMMENT_MARKER="<!-- claude-pr-review-bot -->"

# Job URL for linking
readonly JOB_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"

# Logging functions
log_info() {
  echo "ℹ️  $1"
}

log_success() {
  echo "✅ $1"
}

log_warning() {
  echo "⚠️  $1"
}

log_error() {
  echo "❌ $1" >&2
}

# Get existing comment ID for this PR
get_existing_comment_id() {
  # Check if we have a cached comment ID
  if [ -f "$COMMENT_ID_FILE" ]; then
    local cached_id
    cached_id=$(cat "$COMMENT_ID_FILE")
    log_info "Found cached comment ID: $cached_id"
    echo "$cached_id"
    return 0
  fi

  # Search for existing comment with our marker
  log_info "Searching for existing Claude review comment..."
  local comment_id
  comment_id=$(gh api "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    --jq ".[] | select(.body | contains(\"${COMMENT_MARKER}\")) | .id" | head -1)

  if [ -n "$comment_id" ]; then
    log_info "Found existing comment ID: $comment_id"
    echo "$comment_id" > "$COMMENT_ID_FILE"
    echo "$comment_id"
  else
    log_info "No existing comment found"
    echo ""
  fi
}

# Create new comment
create_comment() {
  local body="$1"
  log_info "Creating new PR comment..."

  local response
  response=$(gh api "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    -X POST \
    -f body="$body" \
    --jq '.id')

  echo "$response" > "$COMMENT_ID_FILE"
  log_success "Created comment with ID: $response"
  echo "$response"
}

# Update existing comment
update_comment() {
  local comment_id="$1"
  local body="$2"
  log_info "Updating comment ID: $comment_id..."

  gh api "/repos/${GITHUB_REPOSITORY}/issues/comments/${comment_id}" \
    -X PATCH \
    -f body="$body" \
    > /dev/null

  log_success "Updated comment ID: $comment_id"
}

# Create or update comment with given body
upsert_comment() {
  local body="$1"
  local comment_id
  comment_id=$(get_existing_comment_id)

  if [ -n "$comment_id" ]; then
    update_comment "$comment_id" "$body"
  else
    create_comment "$body"
  fi
}

# Generate comment body for "start" state
generate_start_body() {
  cat <<EOF
${COMMENT_MARKER}
## 🤖 Claude Code Review

**Status:** 🔄 In Progress
**Job:** [View workflow run](${JOB_URL})

---

### Progress

Initializing code review...

<details>
<summary>Tasks</summary>

- [ ] Read repository guidelines
- [ ] Review changed files
- [ ] Check consistency across codebase
- [ ] Generate review comments
- [ ] Submit formal review

</details>

---

*This comment will be updated with progress and results. Do not delete.*
EOF
}

# Generate comment body for "update" state (reads from state file)
generate_update_body() {
  local state_file="${1:-$STATE_FILE}"

  # Read progress from state file if it exists
  local tasks_md="- [ ] Read repository guidelines
- [ ] Review changed files
- [ ] Check consistency across codebase
- [ ] Generate review comments
- [ ] Submit formal review"

  if [ -f "$state_file" ]; then
    log_info "Reading progress from state file..."
    # Parse JSON state file (expects format: {"tasks": [{"name": "...", "done": true/false}]})
    # For now, we'll use a simple implementation
    # TODO: Enhance to parse actual state file if needed
  fi

  cat <<EOF
${COMMENT_MARKER}
## 🤖 Claude Code Review

**Status:** 🔄 In Progress
**Job:** [View workflow run](${JOB_URL})

---

### Progress

Review is in progress. This may take a few minutes...

<details>
<summary>Tasks</summary>

${tasks_md}

</details>

---

*This comment will be updated with the final results.*
EOF
}

# Generate comment body for "finish" state
generate_finish_body() {
  local verdict="COMMENT"
  local summary=""
  local verdict_emoji="💬"
  local verdict_text="Review Completed"
  local verdict_color="⚪"

  # Read verdict if available
  if [ -f "$VERDICT_FILE" ]; then
    verdict=$(cat "$VERDICT_FILE" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')
    log_info "Read verdict: $verdict"
  else
    log_warning "No verdict file found, using default: COMMENT"
  fi

  # Set emoji and text based on verdict
  case "$verdict" in
    APPROVE)
      verdict_emoji="✅"
      verdict_text="Approved"
      verdict_color="🟢"
      ;;
    REQUEST_CHANGES)
      verdict_emoji="🔴"
      verdict_text="Changes Requested"
      verdict_color="🔴"
      ;;
    COMMENT)
      verdict_emoji="💬"
      verdict_text="Review Completed"
      verdict_color="⚪"
      ;;
  esac

  # Read summary if available
  if [ -f "$SUMMARY_FILE" ]; then
    summary=$(cat "$SUMMARY_FILE")
    log_info "Read summary (${#summary} chars)"
  else
    log_warning "No summary file found, using default"
    summary="Claude AI completed the code review. See inline comments for detailed feedback."
  fi

  cat <<EOF
${COMMENT_MARKER}
## 🤖 Claude Code Review

**Status:** ✅ Completed
**Verdict:** ${verdict_color} ${verdict_emoji} **${verdict_text}**
**Job:** [View workflow run](${JOB_URL})

---

${summary}

---

<details>
<summary>Review Details</summary>

**Verdict:** \`${verdict}\`
**Completed:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")

</details>
EOF
}

# Generate comment body for "error" state
generate_error_body() {
  cat <<EOF
${COMMENT_MARKER}
## 🤖 Claude Code Review

**Status:** ❌ Error
**Job:** [View workflow run](${JOB_URL})

---

### ⚠️ Review Failed

The automated code review encountered an error and could not complete.

**Next Steps:**
1. Check the [workflow logs](${JOB_URL}) for details
2. Verify the GitHub Actions configuration
3. Ensure the Anthropic API key is valid
4. Check for any permission issues

If the problem persists, please contact your repository administrator.

---

*You can manually re-trigger the review by pushing a new commit or re-running the workflow.*
EOF
}

# Main command router
main() {
  local command="${1:-}"

  if [ -z "$command" ]; then
    log_error "Missing command argument"
    echo "Usage: $0 <start|update|finish|error>" >&2
    exit 1
  fi

  log_info "Executing command: $command"

  case "$command" in
    start)
      local body
      body=$(generate_start_body)
      upsert_comment "$body"
      log_success "Review started, comment created/updated"
      ;;
    update)
      local body
      body=$(generate_update_body)
      upsert_comment "$body"
      log_success "Review progress updated"
      ;;
    finish)
      local body
      body=$(generate_finish_body)
      upsert_comment "$body"
      log_success "Review finished, final results posted"
      ;;
    error)
      local body
      body=$(generate_error_body)
      upsert_comment "$body"
      log_success "Error status posted"
      ;;
    *)
      log_error "Unknown command: $command"
      echo "Usage: $0 <start|update|finish|error>" >&2
      exit 1
      ;;
  esac
}

# Run main function
main "$@"
