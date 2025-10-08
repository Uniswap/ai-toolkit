export interface InitGeneratorSchema {
  installMode?: 'default' | 'custom';
  installationType?: 'global' | 'local';
  confirmLocalPath?: boolean;
  installCommands?: boolean;
  installAgents?: boolean;
  installHooks?: boolean;
  hooksMode?: 'sound' | 'speech' | 'both';
  installAddons?: boolean;
  commands?: string[];
  agents?: string[];
  dry?: boolean;
  nonInteractive?: boolean;
  force?: boolean;
}
