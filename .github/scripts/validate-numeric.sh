#!/usr/bin/env bash
# Defense-in-depth: Validate version components are numeric before arithmetic
# Prevents potential command injection via bash arithmetic expansion
#
# Usage: source this file, then call validate_numeric "value" "field_name"
# Returns: Echoes the value if valid, returns 1 if invalid
#
# Example:
#   source .github/scripts/validate-numeric.sh
#   major=$(validate_numeric "$major" "major") || exit 1

validate_numeric() {
  local value="$1"
  local name="$2"
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "❌ SECURITY: Invalid $name value '$value' - must be numeric only" >&2
    return 1
  fi
  echo "$value"
}
