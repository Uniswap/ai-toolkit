#!/usr/bin/env bash
# =============================================================================
# notify-publish-errors.sh — Sends Slack error notifications for publish failures
# =============================================================================
#
# Purpose:
#   Builds a Slack Block Kit payload describing which packages failed to
#   publish, then POSTs it to a Slack incoming webhook URL.
#
# Usage:
#   ./.github/scripts/notify-publish-errors.sh
#
# Required environment variables:
#   SLACK_WEBHOOK_URL  — Slack incoming webhook URL
#   FAILED_PACKAGES    — JSON array of failed package names (e.g. '["@scope/pkg"]')
#   SUCCESSFUL_COUNT   — Number of packages that published successfully
#   FAILED_COUNT       — Number of packages that failed to publish
#   BRANCH_NAME        — Git branch name
#   COMMIT_SHA         — Full commit SHA (truncated to 7 chars internally)
#   RUN_URL            — URL to the GitHub Actions workflow run
#   EVENT_NAME         — GitHub event name that triggered the workflow
#   PUBLISH_RESULT     — Result of the publish job ("failure" or other)
#
# Outputs:
#   Writes to GITHUB_STEP_SUMMARY if the variable is set.
#
# Examples:
#   SLACK_WEBHOOK_URL="https://hooks.slack.com/..." \
#   FAILED_PACKAGES='["@ai-toolkit/core"]' \
#   SUCCESSFUL_COUNT=3 FAILED_COUNT=1 \
#   BRANCH_NAME=main COMMIT_SHA=abc1234... \
#   RUN_URL="https://github.com/..." EVENT_NAME=push \
#   PUBLISH_RESULT=success \
#     ./.github/scripts/notify-publish-errors.sh
# =============================================================================
set -euo pipefail

echo "⚠️ Sending Slack error notification for publish failures..."

# Build the failed packages list
if [ "$PUBLISH_RESULT" = "failure" ]; then
  FAILED_LIST="Job failed — check workflow logs for details"
  SUMMARY="Publish job failed"
else
  FAILED_LIST=$(echo "$FAILED_PACKAGES" | jq -r '.[] | "• `" + . + "`"' 2>/dev/null || echo "• Unknown packages")
  SUMMARY="$FAILED_COUNT package(s) failed, $SUCCESSFUL_COUNT succeeded"
fi

# Create the Slack message payload
PAYLOAD=$(jq -n \
  --arg branch "$BRANCH_NAME" \
  --arg sha "${COMMIT_SHA:0:7}" \
  --arg run_url "$RUN_URL" \
  --arg event "$EVENT_NAME" \
  --arg summary "$SUMMARY" \
  --arg failed "$FAILED_LIST" \
  '{
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "⚠️ Package Publishing Failed",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ("*Branch:* `" + $branch + "`\n*Summary:* " + $summary)
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ("*Failed Packages:*\n" + $failed)
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": ("Triggered by: `" + $event + "` | Commit: `" + $sha + "` | <" + $run_url + "|View Workflow Run>")
          }
        ]
      }
    ]
  }')

# Send to Slack
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --fail-with-body \
    --data "$PAYLOAD" \
    "$SLACK_WEBHOOK_URL"
  echo ""
  echo "✅ Slack error notification sent"
else
  echo "⚠️ SLACK_WEBHOOK_URL not configured, skipping notification"
fi

# Generate step summary
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "## ⚠️ Package Publishing Failed" >> "$GITHUB_STEP_SUMMARY"
  echo "" >> "$GITHUB_STEP_SUMMARY"
  echo "**Branch:** \`$BRANCH_NAME\`" >> "$GITHUB_STEP_SUMMARY"
  echo "**Summary:** $SUMMARY" >> "$GITHUB_STEP_SUMMARY"
  echo "" >> "$GITHUB_STEP_SUMMARY"
  echo "### Failed Packages" >> "$GITHUB_STEP_SUMMARY"
  echo "$FAILED_LIST" >> "$GITHUB_STEP_SUMMARY"
  echo "" >> "$GITHUB_STEP_SUMMARY"
  echo "[View Workflow Run]($RUN_URL)" >> "$GITHUB_STEP_SUMMARY"
fi
