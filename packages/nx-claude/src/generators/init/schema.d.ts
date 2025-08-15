export interface InitGeneratorSchema {
  installationType?: 'global' | 'local';
  confirmLocalPath?: boolean;
  commands?: string[];
  allCommands?: boolean;
  agents?: string[];
  allAgents?: boolean;
  dryRun?: boolean;
  nonInteractive?: boolean;
  force?: boolean;
}
