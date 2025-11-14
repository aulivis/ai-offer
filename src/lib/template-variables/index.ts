/**
 * Template Variables System
 *
 * Main entry point for the dynamic template variable system
 */

export * from './types';
export * from './validators';
export * from './registry';
export * from './resolver';
export * from './filters';
export * from './parser';

// Re-export for convenience
export { VariableResolver } from './resolver';
export { TemplateParser } from './parser';
export { VARIABLE_DEFINITIONS, getVariableDefinition } from './registry';
export { FILTERS, applyFilter } from './filters';
export { buildVariableRegistry } from './data-aggregator';
export type {
  BuildRegistryOptions,
  UserProfileData,
  CustomerData,
  SettingsData,
  AIResponseBlocks,
} from './data-aggregator';
