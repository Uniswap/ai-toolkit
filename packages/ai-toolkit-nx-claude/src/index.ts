// Re-export all generators so runtime code can import from the package root
// Works in both dev (exports.development -> src) and dist (exports.import/default -> dist)
export { default as hooksGenerator } from './generators/hooks/generator';
export { default as addonsGenerator } from './generators/addons/generator';
export { default as skillsGenerator } from './generators/skills/generator';
export type { InitGeneratorSchema } from './generators/init/schema';
export type { SkillsGeneratorSchema } from './generators/skills/schema';
