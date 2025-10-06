// Re-export generators so runtime code can import from the package root
// Works in both dev (exports.development -> src) and dist (exports.import/default -> dist)
export { default as hooksGenerator } from './generators/hooks/generator';
export { default as addonsGenerator } from './generators/addons/generator';
export type { InitGeneratorSchema } from './generators/init/schema';
