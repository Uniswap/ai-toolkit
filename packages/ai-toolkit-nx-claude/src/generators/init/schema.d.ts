export interface InitGeneratorSchema {
  installationType?: 'global' | 'local';
  confirmLocalPath?: boolean;
  commands?: string[];
  agents?: string[];
  dry?: boolean;
  nonInteractive?: boolean;
  force?: boolean;
  setupRegistryProxy?: boolean;
}
