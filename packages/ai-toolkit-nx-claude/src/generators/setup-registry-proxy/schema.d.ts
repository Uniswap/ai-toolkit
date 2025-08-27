export interface SetupRegistryProxyGeneratorSchema {
  shellConfig?: {
    shell: 'bash' | 'zsh' | 'fish';
    rcFile: string;
  };
  force?: boolean;
  backup?: boolean;
  test?: boolean;
}
