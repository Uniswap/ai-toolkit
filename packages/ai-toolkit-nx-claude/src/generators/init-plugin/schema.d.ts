export interface InitPluginGeneratorSchema {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  directory?: string;
  includeSkills?: boolean;
  includeCommands?: boolean;
  includeAgents?: boolean;
}
