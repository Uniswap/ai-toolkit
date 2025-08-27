export interface AddCommandGeneratorSchema {
  package?: string;
  createNewPackage?: boolean;
  newPackageName?: string;
  newPackageDescription?: string;
  name: string;
  description?: string;
}
