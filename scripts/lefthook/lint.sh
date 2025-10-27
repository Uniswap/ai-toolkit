# Get list of staged files (only .ts, .tsx, .js, .jsx files that can be linted)
STAGED_LINTABLE=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
# Only lint if there are staged lintable files
if [ -n "$STAGED_LINTABLE" ]; then
  npx nx affected --target=lint --base=HEAD~1 --fix
fi
