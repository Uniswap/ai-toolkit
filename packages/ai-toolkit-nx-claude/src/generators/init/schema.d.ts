export interface InitGeneratorSchema {
  installMode?: 'default' | 'custom';
  installationType?: 'global' | 'local';
  confirmLocalPath?: boolean;
  installCommands?: boolean;
  commandSelectionMode?: 'all' | 'specific';
  installAgents?: boolean;
  agentSelectionMode?: 'all' | 'specific';
  installSkills?: boolean;
  skillSelectionMode?: 'all' | 'specific';
  installHooks?: boolean;
  hooksMode?: 'sound' | 'speech' | 'both';
  installAddons?: boolean;
  addonSelectionMode?: 'all' | 'specific';
  commands?: string[];
  agents?: string[];
  skills?: string[];
  dry?: boolean;
  nonInteractive?: boolean;
  force?: boolean;
}
