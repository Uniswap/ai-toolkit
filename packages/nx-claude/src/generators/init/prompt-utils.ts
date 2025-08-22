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
}

export interface Schema {
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export async function promptForMissingOptions<T extends Record<string, any>>(
  options: T,
  schemaPath: string,
  context: {
    availableCommands?: string[];
    availableAgents?: string[];
    commandDescriptions?: Record<string, string>;
    agentDescriptions?: Record<string, string>;
    existingCommands?: Set<string>;
    existingAgents?: Set<string>;
    otherLocationCommands?: Set<string>;
    otherLocationAgents?: Set<string>;
    installationType?: 'global' | 'local';
  } = {}
): Promise<T> {
  // Load schema
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schema: Schema = JSON.parse(schemaContent);

  const result: any = { ...options };

  // Skip all prompts if non-interactive
  if (result.nonInteractive) {
    return result;
  }

  // Process each property in order
  for (const [key, property] of Object.entries(schema.properties)) {
    if (result[key] !== undefined && result[key] !== null) {
      // Skip if value already provided
      continue;
    }

    // Special handling for certain fields
    if (key === 'confirmLocalPath') {
      // Skip confirmation if not local installation
      if (result.installationType !== 'local') {
        continue;
      }
    }

    if (key === 'nonInteractive') {
      // Never prompt for nonInteractive
      continue;
    }

    if (key === 'force') {
      // Force is handled separately in the main logic
      continue;
    }

    // Generate prompt based on property type
    const promptResult = await promptForProperty(key, property, context);
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
    existingCommands?: Set<string>;
    existingAgents?: Set<string>;
    otherLocationCommands?: Set<string>;
    otherLocationAgents?: Set<string>;
    installationType?: 'global' | 'local';
  }
): Promise<any> {
  const promptMessage = getPromptMessage(key, property);

  // Handle different property types
  if (property.type === 'boolean') {
    const { value } = await prompt<{ value: boolean }>({
      type: 'confirm',
      name: 'value',
      message: promptMessage,
      initial: property.default ?? false,
    });
    return value;
  }

  if (property.enum) {
    // Enum selection
    const { value } = await prompt<{ value: string }>({
      type: 'select',
      name: 'value',
      message: promptMessage,
      choices: property.enum.map((e) => ({ name: e, value: e })),
    } as any);
    return value;
  }

  if (property.type === 'array') {
    // Multi-select for arrays
    if (key === 'commands' && context.availableCommands) {
      return await promptMultiSelectWithAll(
        promptMessage,
        context.availableCommands,
        'commands',
        context.commandDescriptions,
        context.existingCommands,
        context.otherLocationCommands,
        context.installationType
      );
    }

    if (key === 'agents' && context.availableAgents) {
      return await promptMultiSelectWithAll(
        promptMessage,
        context.availableAgents,
        'agents',
        context.agentDescriptions,
        context.existingAgents,
        context.otherLocationAgents,
        context.installationType
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
  // Use x-prompt if available
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
    case 'allCommands':
      return 'Install all available commands?';
    case 'allAgents':
      return 'Install all available agents?';
    case 'dryRun':
      return 'Preview installation without making changes (dry run)?';
    case 'force':
      return 'Overwrite existing installation?';
    default:
      return description || `Enter value for ${key}:`;
  }
}
