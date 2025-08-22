/**
 * Parse CLI arguments to determine which options were explicitly provided by the user
 * Returns a Map with option names as keys and their values
 * This helps distinguish between user-provided values and Nx-applied defaults
 */
export function getExplicitlyProvidedOptions(): Map<string, any> {
  const providedOptions = new Map<string, any>();
  const args = process.argv;

  // Parse command line arguments to find explicitly provided options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Check for flag-style arguments
    if (arg.startsWith('--')) {
      // Handle --flag=value format
      if (arg.includes('=')) {
        const [flagPart, ...valueParts] = arg.split('=');
        const flagName = flagPart.slice(2);
        const value = valueParts.join('='); // Handle values with = in them

        // Convert kebab-case to camelCase for consistency
        const camelCaseName = flagName.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );

        // Parse the value
        const parsedValue = parseValue(value);

        // Store both formats
        providedOptions.set(flagName, parsedValue);
        providedOptions.set(camelCaseName, parsedValue);
      }
      // Handle --flag value format
      else {
        const flagName = arg.slice(2);

        // Convert kebab-case to camelCase for consistency
        const camelCaseName = flagName.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );

        // Check if the next argument is a value for this flag
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          // Next arg is the value
          const value = args[i + 1];
          const parsedValue = parseValue(value);

          providedOptions.set(flagName, parsedValue);
          providedOptions.set(camelCaseName, parsedValue);

          i++; // Skip the next arg since we've consumed it as a value
        } else {
          // Boolean flag without explicit value (implicitly true)
          providedOptions.set(flagName, true);
          providedOptions.set(camelCaseName, true);
        }
      }
    }
    // Handle single-dash flags (e.g., -d for dry-run)
    else if (arg.startsWith('-') && !arg.startsWith('--') && arg.length === 2) {
      // Map common short flags to their long equivalents
      const shortFlagMap: Record<string, string> = {
        d: 'dry-run',
        v: 'verbose',
        f: 'force',
        h: 'help',
      };

      const shortFlag = arg.slice(1);
      if (shortFlagMap[shortFlag]) {
        const longFlag = shortFlagMap[shortFlag];
        const camelCaseName = longFlag.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );

        providedOptions.set(longFlag, true);
        providedOptions.set(camelCaseName, true);
      }
    }
  }

  return providedOptions;
}

/**
 * Parse a string value to its appropriate type
 */
function parseValue(value: string): any {
  // Handle boolean values
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Handle numeric values
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d*\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // Handle null/undefined
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;

  // Return as string
  return value;
}

/**
 * Check if Nx's dry-run flag was provided in any form
 */
export function isNxDryRunProvided(): boolean {
  const args = process.argv;

  return (
    // Check for --dry-run
    args.some((a) => a === '--dry-run') ||
    args.some((a) => a.startsWith('--dry-run=') && !a.endsWith('=false')) ||
    // Check for --dryRun
    args.some((a) => a === '--dryRun') ||
    args.some((a) => a.startsWith('--dryRun=') && !a.endsWith('=false')) ||
    // Check for short form -d
    args.some((a) => a === '-d')
  );
}

/**
 * Check if Nx's no-interactive flag was provided in any form
 */
export function isNxNoInteractiveProvided(): boolean {
  const args = process.argv;

  return (
    // Check for --no-interactive
    args.some((a) => a === '--no-interactive') ||
    args.some(
      (a) => a.startsWith('--no-interactive=') && !a.endsWith('=false')
    ) ||
    // Check for --noInteractive
    args.some((a) => a === '--noInteractive') ||
    args.some((a) => a.startsWith('--noInteractive=') && !a.endsWith('=false'))
  );
}
