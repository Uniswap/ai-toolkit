// Re-export all generators so runtime code can import from the package root
// Works in both dev (exports.development -> src) and dist (exports.import/default -> dist)
export { default as hooksGenerator } from './generators/hooks/generator';
export { default as addonsGenerator } from './generators/addons/generator';
export { default as addSkillGenerator } from './generators/add-skill/generator';
export { default as initPluginGenerator } from './generators/init-plugin/generator';
export type { InitGeneratorSchema } from './generators/init/schema';
export type { AddSkillGeneratorSchema } from './generators/add-skill/schema';
export type { InitPluginGeneratorSchema } from './generators/init-plugin/schema';
