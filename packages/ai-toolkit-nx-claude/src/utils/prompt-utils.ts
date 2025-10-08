import { prompt } from 'enquirer';
import * as fs from 'fs';

export interface SchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: { type: string };
  default?: any;
  'x-prompt'?:
    | string
    | {
        message: string;
        type?: string;
        items?: Array<{ value: string; label: string }>;
      };
  'x-skip-prompt'?: boolean;
  'always-prompt'?: boolean;
  'prompt-message'?: string;
  'prompt-type'?: string;
  'prompt-items'?: Array<{ value: string; label: string }>;
  'prompt-when'?: string;
}

export interface Schema {
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export async function promptForMissingOptions<T extends Record<string, any>>(
  options: T,
  schemaPath: string | Schema,
  context: {
    availableCommands?: string[];
    availableAgents?: string[];
    commandDescriptions?: Record<string, string>;
    agentDescriptions?: Record<string, string>;
    // Explicit global/local format
    globalExistingCommands?: Set<string>;
    globalExistingAgents?: Set<string>;
    localExistingCommands?: Set<string>;
    localExistingAgents?: Set<string>;
    // Dynamic packages support
    availablePackages?: string[];
  } = {},
  explicitlyProvidedOptions?: Map<string, any> | Set<string>
): Promise<T> {
  // Load schema - support both file path and direct schema object
  let schema: Schema;
  if (typeof schemaPath === 'string') {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    schema = JSON.parse(schemaContent);
  } else {
    schema = schemaPath;
  }

  const result: any = { ...options };

  // Skip all prompts if no-interactive (check various formats Nx might provide)
  if (
    result['no-interactive'] ||
    result.noInteractive ||
    result['non-interactive'] ||
    result.nonInteractive
  ) {
    // Apply defaults for any missing values
    for (const [key, property] of Object.entries(schema.properties)) {
      if (result[key] === undefined && property.default !== undefined) {
        result[key] = property.default;
      }
    }
    return result;
  }

  // Process each property in order
  for (const [key, property] of Object.entries(schema.properties)) {
    // Check if value was explicitly provided via CLI
    let wasExplicitlyProvided = false;
    if (explicitlyProvidedOptions) {
      // Handle both Map and Set for backward compatibility
      if (explicitlyProvidedOptions instanceof Map) {
        wasExplicitlyProvided =
          explicitlyProvidedOptions.has(key) ||
          explicitlyProvidedOptions.has(key.replace(/-/g, ''));
      } else {
        // Legacy Set support
        wasExplicitlyProvided =
          explicitlyProvidedOptions.has(key) ||
          explicitlyProvidedOptions.has(key.replace(/-/g, ''));
      }
    }

    // Check if this property should skip prompting entirely
    if (property['x-skip-prompt']) {
      // Apply default if value is missing
      if (result[key] === undefined && property.default !== undefined) {
        result[key] = property.default;
      }
      continue;
    }

    // Determine if we should prompt for this property
    const shouldPrompt = property['always-prompt']
      ? // For always-prompt fields, only skip if value was explicitly provided
        !wasExplicitlyProvided
      : // For regular fields (backward compatibility with x-prompt),
        // skip if value exists at all (provided or defaulted)
        (result[key] === undefined || result[key] === null) &&
        !wasExplicitlyProvided;

    if (!shouldPrompt) {
      continue;
    }

    // Special handling for certain fields
    if (key === 'confirmLocalPath') {
      // Skip confirmation if not local installation
      if (result.installationType !== 'local') {
        continue;
      }
    }

    if (
      key === 'nonInteractive' ||
      key === 'non-interactive' ||
      key === 'no-interactive' ||
      key === 'noInteractive'
    ) {
      // Never prompt for no-interactive flag
      continue;
    }

    if (key === 'force') {
      // Force is handled separately in the main logic
      continue;
    }

    // Check for conditional prompting (prompt-when)
    if (property['prompt-when']) {
      const shouldShow = evaluatePromptCondition(
        property['prompt-when'],
        result
      );
      if (!shouldShow) {
        continue;
      }
    }

    // Generate prompt based on property type
    const promptResult = await promptForProperty(
      key,
      property,
      context,
      result
    );
    if (promptResult !== undefined) {
      result[key] = promptResult;

      // Special case: if local installation and user says they're not at project root, throw immediately
      if (
        key === 'confirmLocalPath' &&
        result.installationType === 'local' &&
        promptResult === false
      ) {
        throw new Error(
          'Installation cancelled - please run from your project root'
        );
      }
    }
  }

  return result as T;
}

async function promptForProperty(
  key: string,
  property: SchemaProperty,
  context: {
    availableCommands?: string[];
    availableAgents?: string[];
    commandDescriptions?: Record<string, string>;
    agentDescriptions?: Record<string, string>;
    // Explicit global/local format
    globalExistingCommands?: Set<string>;
    globalExistingAgents?: Set<string>;
    localExistingCommands?: Set<string>;
    localExistingAgents?: Set<string>;
    // Dynamic packages support
    availablePackages?: string[];
  },
  currentValues?: Record<string, any>
): Promise<any> {
  const promptMessage = getPromptMessage(key, property);

  // Handle different property types based on prompt-type or inferred type
  const promptType =
    property['prompt-type'] ||
    (property.type === 'boolean'
      ? 'confirm'
      : property.enum
      ? 'select'
      : property.type === 'string'
      ? 'input'
      : null);

  if (promptType === 'confirm' || property.type === 'boolean') {
    const { value } = await prompt<{ value: boolean }>({
      type: 'confirm',
      name: 'value',
      message: promptMessage,
      initial: property.default ?? false,
    });
    return value;
  }

  if (promptType === 'list' && property['prompt-items']) {
    // List selection with custom items
    const { value } = await prompt<{ value: string }>({
      type: 'select',
      name: 'value',
      message: promptMessage,
      choices: property['prompt-items'].map((item) => ({
        name: item.value,
        value: item.value,
        message: item.label,
      })),
    } as any);
    return value;
  }

  if (property.enum || (key === 'package' && context.availablePackages)) {
    // Enum selection or dynamic package selection
    const choices = property.enum || context.availablePackages || [];
    const { value } = await prompt<{ value: string }>({
      type: 'select',
      name: 'value',
      message: promptMessage,
      choices: choices.map((choice: string) => {
        if (key === 'package' && choice === '__create_new__') {
          return {
            name: '__create_new__',
            value: '__create_new__',
            message: '➕ Create new package',
          };
        }
        if (key === 'package') {
          return { name: choice, value: choice, message: `📦 ${choice}` };
        }
        return { name: choice, value: choice };
      }),
    } as any);
    return value;
  }

  if (property.type === 'array') {
    // Multi-select for arrays
    if (key === 'commands' && context.availableCommands) {
      // Determine which file sets to use based on installation type
      const installationType = currentValues?.installationType;

      let existingSet: Set<string> | undefined;
      let otherLocationSet: Set<string> | undefined;

      if (installationType === 'global') {
        existingSet = context.globalExistingCommands;
        otherLocationSet = context.localExistingCommands;
      } else if (installationType === 'local') {
        existingSet = context.localExistingCommands;
        otherLocationSet = context.globalExistingCommands;
      }

      return await promptMultiSelectWithAll(
        promptMessage,
        context.availableCommands,
        'commands',
        context.commandDescriptions,
        existingSet,
        otherLocationSet,
        installationType
      );
    }

    if (key === 'agents' && context.availableAgents) {
      // Determine which file sets to use based on installation type
      const installationType = currentValues?.installationType;

      let existingSet: Set<string> | undefined;
      let otherLocationSet: Set<string> | undefined;

      if (installationType === 'global') {
        existingSet = context.globalExistingAgents;
        otherLocationSet = context.localExistingAgents;
      } else if (installationType === 'local') {
        existingSet = context.localExistingAgents;
        otherLocationSet = context.globalExistingAgents;
      }

      return await promptMultiSelectWithAll(
        promptMessage,
        context.availableAgents,
        'agents',
        context.agentDescriptions,
        existingSet,
        otherLocationSet,
        installationType
      );
    }

    // Generic array input (shouldn't happen in practice)
    return [];
  }

  if (property.type === 'string') {
    if (key === 'targetPath') {
      const { value } = await prompt<{ value: string }>({
        type: 'input',
        name: 'value',
        message: promptMessage,
        initial: process.cwd(),
      });
      return value;
    }

    // Generic string input
    const { value } = await prompt<{ value: string }>({
      type: 'input',
      name: 'value',
      message: promptMessage,
      initial: property.default ?? '',
    });
    return value;
  }

  return undefined;
}

async function promptMultiSelectWithAll(
  message: string,
  choices: string[],
  type: 'commands' | 'agents',
  descriptions?: Record<string, string>,
  existingItems?: Set<string>,
  otherLocationItems?: Set<string>,
  installationType?: 'global' | 'local'
): Promise<string[] | undefined> {
  // Create choices with descriptions and existence indicators
  const displayChoices = choices.map((choice) => {
    let display = descriptions?.[choice]
      ? `${choice}: ${descriptions[choice]}`
      : choice;

    // Add indicators for existing files
    const indicators: string[] = [];

    // Check if exists in current target location (will overwrite)
    if (existingItems?.has(choice)) {
      indicators.push('will overwrite');
    }

    // Check if exists in other location
    if (otherLocationItems?.has(choice)) {
      const otherLocation =
        installationType === 'global' ? 'locally' : 'globally';
      indicators.push(`exists ${otherLocation}`);
    }

    // Add indicators to display
    if (indicators.length > 0) {
      display += ` (${indicators.join(', ')})`;
    }

    return display;
  });

  const response = await prompt<{ selected: string[] }>({
    type: 'multiselect',
    name: 'selected',
    message,
    choices: displayChoices,
    initial: displayChoices.map((_, index) => index), // Select all by default
    hint: 'Use <space> to select, <a> to toggle all, <return> to submit',
    validate: (value: string[]) => {
      if (value.length === 0) {
        return `Please select at least one ${type.slice(0, -1)}`;
      }
      return true;
    },
  } as any);

  // Process the selected items
  const selected = response.selected || [];

  // Extract the actual command/agent names from the display strings
  const actualSelections: string[] = [];
  for (const selection of selected) {
    // Extract the command/agent name (everything before the colon or parenthesis)
    const colonIndex = selection.indexOf(':');
    const parenIndex = selection.indexOf('(');

    let endIndex = selection.length;
    if (colonIndex > -1 && (parenIndex === -1 || colonIndex < parenIndex)) {
      endIndex = colonIndex;
    } else if (
      parenIndex > -1 &&
      (colonIndex === -1 || parenIndex < colonIndex)
    ) {
      endIndex = parenIndex;
    }

    const name = selection.substring(0, endIndex).trim();
    if (name && !actualSelections.includes(name)) {
      actualSelections.push(name);
    }
  }

  return actualSelections;
}

function getPromptMessage(key: string, property: SchemaProperty): string {
  // Use prompt-message if available (new format)
  if (property['prompt-message']) {
    return property['prompt-message'];
  }

  // Use x-prompt if available (backward compatibility)
  if (property['x-prompt']) {
    if (typeof property['x-prompt'] === 'string') {
      return property['x-prompt'];
    }
    if (property['x-prompt'].message) {
      return property['x-prompt'].message;
    }
  }

  // Generate default message based on key and description
  const description = property.description || '';

  switch (key) {
    case 'installationType':
      return 'Would you like to install agents and commands globally or locally?';
    case 'confirmLocalPath':
      return 'Are you running this from the root of your project?';
    case 'commands':
      return 'Select commands to install (use <space> to select, <a> to toggle all):';
    case 'agents':
      return 'Select agents to install (use <space> to select, <a> to toggle all):';
    case 'force':
      return 'Overwrite existing installation?';
    default:
      return description || `Enter value for ${key}:`;
  }
}

/**
 * Evaluates a prompt-when condition string
 * Supports simple conditions like "field === 'value'" and compound conditions with &&
 *
 * Examples:
 * - "installMode === 'custom'"
 * - "installCommands === true"
 * - "installMode === 'custom' && installationType === 'local'"
 */
function evaluatePromptCondition(condition: string, context: any): boolean {
  // Handle compound conditions with &&
  if (condition.includes(' && ')) {
    const parts = condition.split(' && ');
    return parts.every((part) => evaluateSingleCondition(part.trim(), context));
  }

  // Handle compound conditions with ||
  if (condition.includes(' || ')) {
    const parts = condition.split(' || ');
    return parts.some((part) => evaluateSingleCondition(part.trim(), context));
  }

  // Single condition
  return evaluateSingleCondition(condition, context);
}

/**
 * Evaluates a single condition like "field === 'value'"
 */
function evaluateSingleCondition(condition: string, context: any): boolean {
  const parts = condition.split(' ');
  if (parts.length < 3) {
    return false;
  }

  const field = parts[0];
  const operator = parts[1];
  const value = parts.slice(2).join(' ').replace(/['"]/g, '');

  const fieldValue = context[field];

  switch (operator) {
    case '===':
      // Handle boolean values
      if (value === 'true') {
        return fieldValue === true;
      }
      if (value === 'false') {
        return fieldValue === false;
      }
      // Handle string comparison
      return String(fieldValue) === value;

    case '!==':
      if (value === 'true') {
        return fieldValue !== true;
      }
      if (value === 'false') {
        return fieldValue !== false;
      }
      return String(fieldValue) !== value;

    default:
      return false;
  }
}
