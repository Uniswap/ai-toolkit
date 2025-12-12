# Get list of staged files (excluding deleted files) as comma-separated
# --diff-filter=d excludes deleted files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=d | paste -sd "," -)
# Only format if there are staged files
if [ -n "$STAGED_FILES" ]; then
  # Format only the staged files using Nx --files flag
  npx nx format:write --files="$STAGED_FILES"
  # Re-stage the formatted files (excluding deleted files)
  git diff --cached --name-only --diff-filter=d | xargs git add
fi
