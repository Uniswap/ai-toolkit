export interface AddAgentGeneratorSchema {
  package?: string;
  createNewPackage?: boolean;
  newPackageName?: string;
  newPackageDescription?: string;
  name: string;
  description?: string;
  model?: 'sonnet-4' | 'opus-4.1';
}
