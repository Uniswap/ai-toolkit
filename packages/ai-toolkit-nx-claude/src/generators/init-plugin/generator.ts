import type { Tree } from '@nx/devkit';
import { formatFiles, joinPathFragments, logger } from '@nx/devkit';
import * as path from 'path';
import type { InitPluginGeneratorSchema } from './schema';
import { promptForMissingOptions } from '../../utils/prompt-utils';

export async function initPluginGenerator(
  tree: Tree,
  options: InitPluginGeneratorSchema
) {
  logger.info('🔌 Initialize Claude Code Plugin');
  logger.info('   Creates a plugin structure compatible with Claude Code\'s plugin system');

  // Get the schema path
  const schemaPath = path.join(__dirname, 'schema.json');

  // Prompt for missing options
  const normalizedOptions = await promptForMissingOptions(
    options,
    schemaPath,
    {}
  );

  const pluginName = normalizedOptions.name!;
  const baseDir = normalizedOptions.directory || 'plugins';
  const pluginDir = joinPathFragments(baseDir, pluginName);

  // Create plugin manifest
  const manifest = {
    name: pluginName,
    description: normalizedOptions.description || `${pluginName} plugin for Claude Code`,
    version: normalizedOptions.version || '1.0.0',
    author: normalizedOptions.author || '',
  };

  // Create .claude-plugin/plugin.json
  tree.write(
    joinPathFragments(pluginDir, '.claude-plugin', 'plugin.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Create directory structure based on options
  if (normalizedOptions.includeSkills !== false) {
    // Create skills directory with a placeholder SKILL.md
    const skillContent = `---
name: example-skill
description: Example skill - replace with your skill description. Claude uses this to decide when to activate the skill.
---

# Example Skill

This is a placeholder skill. Replace this with your actual skill content.

## When to Use

Describe when Claude should activate this skill.

## Instructions

Provide step-by-step guidance for Claude to follow.
`;
    tree.write(
      joinPathFragments(pluginDir, 'skills', 'example', 'SKILL.md'),
      skillContent
    );
  }

  if (normalizedOptions.includeCommands !== false) {
    // Create commands directory with a placeholder command
    const commandContent = `---
description: Example command - replace with your command description
argument-hint: <your arguments here>
---

# Example Command

This is a placeholder command. Replace this with your actual command content.

## Inputs

Describe expected inputs.

## Task

Describe what the command does.

## Output

Describe expected output format.
`;
    tree.write(
      joinPathFragments(pluginDir, 'commands', 'example.md'),
      commandContent
    );
  }

  if (normalizedOptions.includeAgents !== false) {
    // Create agents directory with a placeholder agent
    const agentContent = `---
name: example-agent
description: Example agent - replace with your agent description
---

# Example Agent

This is a placeholder agent. Replace this with your actual agent content.

## Mission

Describe the agent's specialized purpose.

## Inputs

Describe expected inputs.

## Process

Describe the agent's methodology.

## Output

Describe expected output format.
`;
    tree.write(
      joinPathFragments(pluginDir, 'agents', 'example.md'),
      agentContent
    );
  }

  // Create README for the plugin
  const readme = `# ${pluginName}

${normalizedOptions.description || `A Claude Code plugin`}

## Installation

### Via Plugin Marketplace

1. Add this plugin's marketplace to Claude Code:
   \`\`\`
   /plugin marketplace add <path-to-marketplace>
   \`\`\`

2. Install the plugin:
   \`\`\`
   /plugin install ${pluginName}
   \`\`\`

### Via Direct Installation

Copy this directory to your Claude Code plugins location or use the \`/plugin\` command.

## Contents

${normalizedOptions.includeSkills !== false ? '### Skills\n\nModel-invoked capabilities that Claude uses autonomously.\n\n- See \`skills/\` directory\n' : ''}
${normalizedOptions.includeCommands !== false ? '### Commands\n\nUser-invoked slash commands.\n\n- See \`commands/\` directory\n' : ''}
${normalizedOptions.includeAgents !== false ? '### Agents\n\nSpecialized agents for complex tasks.\n\n- See \`agents/\` directory\n' : ''}

## Development

### Adding Skills

1. Create a new directory under \`skills/\`
2. Add a \`SKILL.md\` file with:
   - \`name\`: Lowercase, hyphens allowed (max 64 chars)
   - \`description\`: When Claude should use this skill (max 1024 chars)

### Adding Commands

1. Create a new \`.md\` file under \`commands/\`
2. Include \`description\` in the frontmatter

### Adding Agents

1. Create a new \`.md\` file under \`agents/\`
2. Include \`name\` and \`description\` in the frontmatter

## Plugin Structure

\`\`\`
${pluginName}/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
${normalizedOptions.includeSkills !== false ? '├── skills/                   # Model-invoked skills\n│   └── example/\n│       └── SKILL.md\n' : ''}${normalizedOptions.includeCommands !== false ? '├── commands/                 # User-invoked commands\n│   └── example.md\n' : ''}${normalizedOptions.includeAgents !== false ? '├── agents/                   # Specialized agents\n│   └── example.md\n' : ''}└── README.md
\`\`\`

## Resources

- [Claude Code Plugins Documentation](https://docs.anthropic.com/claude-code/plugins)
- [AI Toolkit Repository](https://github.com/Uniswap/ai-toolkit)
`;

  tree.write(joinPathFragments(pluginDir, 'README.md'), readme);

  await formatFiles(tree);

  logger.info(`\n✅ Plugin created at: ${pluginDir}`);
  logger.info('\n📝 Next steps:');
  logger.info('1. Review and customize the example files');
  logger.info('2. Add your skills, commands, and agents');
  logger.info('3. Test locally by installing the plugin');
  logger.info(`\n🔌 To install locally: /plugin install ${pluginDir}`);
  logger.info('\n📚 Documentation: https://docs.anthropic.com/claude-code/plugins');
}

export default initPluginGenerator;
