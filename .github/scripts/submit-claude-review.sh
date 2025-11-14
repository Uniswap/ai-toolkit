#!/usr/bin/env bash
#
# Submit Claude's PR review as a formal GitHub review
#
# This script reads Claude's review verdict and summary, then submits
# a formal GitHub review (APPROVE, REQUEST_CHANGES, or COMMENT) using
# the gh CLI tool.
#
# USAGE:
#   ./submit-claude-review.sh
#
# REQUIRED ENVIRONMENT VARIABLES:
#   PR_NUMBER       - Pull request number
#   GITHUB_TOKEN    - GitHub token with PR write permissions
#
# INPUTS (files created by Claude):
#   .claude-review-verdict.txt  - Contains verdict: APPROVE|REQUEST_CHANGES|COMMENT
#   .claude-review-summary.md   - Contains review summary for GitHub review body
#
# OUTPUTS:
#   - Submits formal GitHub review
#   - Cleans up verdict files
#   - Exits 0 on success, 1 on error
#
# EXAMPLES:
#   # Normal usage (called by workflow):
#   PR_NUMBER=123 ./submit-claude-review.sh
#
#   # Manual testing:
#   echo "APPROVE" > .claude-review-verdict.txt
#   echo "# Review Summary\nLooks good!" > .claude-review-summary.md
#   PR_NUMBER=123 GITHUB_TOKEN=ghp_xxx ./submit-claude-review.sh

set -euo pipefail

# Configuration
readonly PR_NUMBER="${PR_NUMBER:?Error: PR_NUMBER environment variable is required}"
readonly VERDICT_FILE=".claude-review-verdict.txt"
readonly SUMMARY_FILE=".claude-review-summary.md"
readonly DEFAULT_VERDICT="COMMENT"
readonly DEFAULT_SUMMARY="Claude AI completed the code review. See inline comments for detailed feedback."

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

# Read verdict from file or use default
read_verdict() {
  local verdict="$DEFAULT_VERDICT"

  if [ -f "$VERDICT_FILE" ]; then
    # Read, trim whitespace, convert to uppercase
    verdict=$(cat "$VERDICT_FILE" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')
    log_info "Read verdict from file: $verdict"
  else
    log_warning "No verdict file found at $VERDICT_FILE, using default: $DEFAULT_VERDICT"
  fi

  # Validate verdict
  case "$verdict" in
    APPROVE|REQUEST_CHANGES|COMMENT)
      log_success "Valid verdict: $verdict"
      echo "$verdict"
      ;;
    *)
      log_error "Invalid verdict '$verdict', must be APPROVE, REQUEST_CHANGES, or COMMENT"
      log_warning "Falling back to default: $DEFAULT_VERDICT"
      echo "$DEFAULT_VERDICT"
      ;;
  esac
}

# Read summary from file or use default
read_summary() {
  local summary="$DEFAULT_SUMMARY"

  if [ -f "$SUMMARY_FILE" ]; then
    summary=$(cat "$SUMMARY_FILE")
    local summary_length=${#summary}
    log_info "Read review summary from file ($summary_length chars)"
  else
    log_warning "No summary file found at $SUMMARY_FILE, using default message"
  fi

  echo "$summary"
}

# Submit GitHub review using gh CLI
submit_review() {
  local verdict="$1"
  local summary="$2"

  log_info "Submitting GitHub review for PR #$PR_NUMBER..."

  case "$verdict" in
    APPROVE)
      gh pr review "$PR_NUMBER" --approve --body "$summary"
      log_success "Submitted APPROVE review"
      echo "✨ PR approved - no blocking issues found"
      ;;
    REQUEST_CHANGES)
      gh pr review "$PR_NUMBER" --request-changes --body "$summary"
      log_success "Submitted REQUEST_CHANGES review (blocking)"
      echo "🔴 Changes requested - critical issues must be addressed before merge"
      ;;
    COMMENT)
      gh pr review "$PR_NUMBER" --comment --body "$summary"
      log_success "Submitted COMMENT review (non-blocking)"
      echo "💬 Review completed - see comments for feedback"
      ;;
  esac
}

# Cleanup temporary files
cleanup() {
  if [ -f "$VERDICT_FILE" ]; then
    rm -f "$VERDICT_FILE"
    log_info "Cleaned up $VERDICT_FILE"
  fi

  if [ -f "$SUMMARY_FILE" ]; then
    rm -f "$SUMMARY_FILE"
    log_info "Cleaned up $SUMMARY_FILE"
  fi
}

# Main execution
main() {
  log_info "Starting GitHub review submission for PR #$PR_NUMBER"

  # Read inputs
  local verdict
  verdict=$(read_verdict)

  local summary
  summary=$(read_summary)

  # Submit review
  submit_review "$verdict" "$summary"

  # Cleanup
  cleanup

  log_success "Review submission completed successfully"
}

# Run main function
main
