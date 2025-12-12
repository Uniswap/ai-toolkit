export interface AddSkillGeneratorSchema {
  package?: string;
  createNewPackage?: boolean;
  newPackageName?: string;
  newPackageDescription?: string;
  name?: string;
  description?: string;
  allowedTools?: string;
}
