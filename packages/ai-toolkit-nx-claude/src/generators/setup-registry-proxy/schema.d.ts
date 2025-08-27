export interface SetupRegistryProxyGeneratorSchema {
  shellConfig?: {
    shell: 'bash' | 'zsh' | 'fish';
    rcFile: string;
    envFile: string;
  };
  force?: boolean;
  backup?: boolean;
  test?: boolean;
}
