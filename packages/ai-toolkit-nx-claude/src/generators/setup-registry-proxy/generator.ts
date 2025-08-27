import { Tree, formatFiles } from '@nx/devkit';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { SetupRegistryProxyGeneratorSchema } from './schema';

function detectShell(): { shell: string; rcFile: string } {
  const homeDir = os.homedir();

  // Try to detect from current shell
  const currentShell = process.env.SHELL || '';

  if (currentShell.includes('zsh')) {
    return { shell: 'zsh', rcFile: path.join(homeDir, '.zshrc') };
  } else if (currentShell.includes('bash')) {
    // Check for different bash config files
    const bashrc = path.join(homeDir, '.bashrc');
    const bashProfile = path.join(homeDir, '.bash_profile');
    const profile = path.join(homeDir, '.profile');

    if (fs.existsSync(bashrc)) {
      return { shell: 'bash', rcFile: bashrc };
    } else if (fs.existsSync(bashProfile)) {
      return { shell: 'bash', rcFile: bashProfile };
    } else if (fs.existsSync(profile)) {
      return { shell: 'bash', rcFile: profile };
    }
    return { shell: 'bash', rcFile: bashrc };
  } else if (currentShell.includes('fish')) {
    return {
      shell: 'fish',
      rcFile: path.join(homeDir, '.config', 'fish', 'config.fish'),
    };
  }

  // Fallback detection based on existing files
  const configs = [
    { file: '.zshrc', shell: 'zsh' },
    { file: '.bashrc', shell: 'bash' },
    { file: '.bash_profile', shell: 'bash' },
    { file: '.profile', shell: 'bash' },
  ];

  for (const config of configs) {
    const configPath = path.join(homeDir, config.file);
    if (fs.existsSync(configPath)) {
      return { shell: config.shell, rcFile: configPath };
    }
  }

  // Default to bash
  return { shell: 'bash', rcFile: path.join(homeDir, '.bashrc') };
}

export async function setupRegistryProxyGenerator(
  tree: Tree,
  options: SetupRegistryProxyGeneratorSchema
) {
  const { shell, rcFile } = options.shellConfig || detectShell();
  const homeDir = os.homedir();
  const proxyFileName = `.uniswap-ai-toolkit.${shell}rc`;
  const proxyFilePath = path.join(homeDir, proxyFileName);

  console.log(`\n🔍 Detected shell: ${shell}`);
  console.log(`📄 Shell config file: ${rcFile}`);
  console.log(`📦 Proxy file will be created at: ${proxyFilePath}`);

  // Check if proxy file already exists
  if (fs.existsSync(proxyFilePath) && !options.force) {
    console.log('\n⚠️  Proxy file already exists. Use --force to overwrite.');

    // Check if it's already sourced
    if (fs.existsSync(rcFile)) {
      const rcContent = fs.readFileSync(rcFile, 'utf-8');
      const sourceCommand = `source ${proxyFilePath}`;
      if (rcContent.includes(sourceCommand)) {
        console.log('✅ Registry proxy is already configured and sourced.');
        return;
      }
    }
  }

  // Read and process the template file directly
  const templatePath = path.join(
    __dirname,
    'files',
    `uniswap-ai-toolkit.__shell__rc.template`
  );
  let templateContent = fs.readFileSync(templatePath, 'utf-8');

  // Replace template variables
  const substitutions = {
    shell,
    generatedDate: new Date().toISOString(),
  };

  // Simple template substitution
  for (const [key, value] of Object.entries(substitutions)) {
    const regex = new RegExp(`<%= ${key} %>`, 'g');
    templateContent = templateContent.replace(regex, value);
  }

  const isDryRun = process.argv.includes('--dry-run');

  if (!isDryRun) {
    // Backup existing file if it exists
    if (fs.existsSync(proxyFilePath) && options.backup !== false) {
      const backupPath = `${proxyFilePath}.backup.${Date.now()}`;
      fs.copyFileSync(proxyFilePath, backupPath);
      console.log(`📋 Backed up existing file to: ${backupPath}`);
    }

    // Write the proxy file directly to home directory
    fs.writeFileSync(proxyFilePath, templateContent);
    fs.chmodSync(proxyFilePath, '755');
    console.log(`✅ Created proxy file: ${proxyFilePath}`);
  } else {
    console.log(`✅ [DRY-RUN] Would create proxy file: ${proxyFilePath}`);
  }

  // Add source command to shell config if not already present

  if (fs.existsSync(rcFile)) {
    const rcContent = fs.readFileSync(rcFile, 'utf-8');
    const sourceCommand = `source ${proxyFilePath}`;

    if (!rcContent.includes(sourceCommand)) {
      // Add source command with a marker comment
      const addition = `\n# Uniswap AI Toolkit Registry Proxy (added by @uniswap/ai-toolkit-nx-claude)\n${sourceCommand}\n`;

      if (!isDryRun) {
        fs.appendFileSync(rcFile, addition);
        console.log(`✅ Added source command to: ${rcFile}`);
      } else {
        console.log(`✅ [DRY-RUN] Would add source command to: ${rcFile}`);
      }

      console.log('\n🔄 To activate the proxy in your current shell, run:');
      console.log(`   ${sourceCommand}`);
      console.log('\nOr start a new shell session.');
    } else {
      console.log(`✅ Source command already present in: ${rcFile}`);
    }
  } else {
    console.log(`\n⚠️  Shell config file not found: ${rcFile}`);
    console.log('Please add the following line to your shell configuration:');
    console.log(`   source ${proxyFilePath}`);
  }

  // Test the proxy if requested (only in non-dry-run mode)
  if (options.test && fs.existsSync(proxyFilePath)) {
    console.log('\n🧪 Testing proxy installation...');
    try {
      // Source the file and test a command
      const testCommand =
        shell === 'fish'
          ? `source ${proxyFilePath}; echo "✅ Proxy loaded successfully"`
          : `. ${proxyFilePath} && echo "✅ Proxy loaded successfully"`;

      execSync(testCommand, {
        stdio: 'inherit',
        shell: `/bin/${shell}`,
      });
    } catch (error) {
      console.error('❌ Error testing proxy:', error);
    }
  }

  console.log('\n✨ Registry proxy setup complete!');
  console.log(
    '\n📝 The proxy will automatically route these packages to GitHub registry:'
  );
  console.log('   - @uniswap/ai-toolkit*');
  console.log('   - @uniswap/spec-workflow-mcp');
  console.log('\n🔐 Make sure you have GitHub authentication configured:');
  console.log('   export NODE_AUTH_TOKEN=your_github_token');
  console.log('   OR add to ~/.npmrc:');
  console.log('   //npm.pkg.github.com/:_authToken=your_github_token');

  await formatFiles(tree);
}

export default setupRegistryProxyGenerator;
