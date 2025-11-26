/**
 * Variable Resolver
 *
 * Resolves template variables from the registry with validation and sanitization
 */

import type { VariableRegistry, VariableDefinition, ResolvedVariable } from './types';
import { getVariableDefinition, getAllVariableDefinitions } from './registry';
import { logger } from '@/lib/logger';

export class VariableResolver {
  private registry: VariableRegistry;
  private definitions: Map<string, VariableDefinition>;
  private cache: Map<string, { value: ResolvedVariable; timestamp: number }>;
  private readonly TTL = 1000; // 1 second cache TTL

  constructor(data: VariableRegistry) {
    this.registry = data;
    this.definitions = new Map();
    this.cache = new Map();
    this.loadDefinitions();
  }

  /**
   * Load all variable definitions into a map for fast lookup
   */
  private loadDefinitions(): void {
    // Definitions are loaded from registry module
    // This method can be extended to load from external sources if needed
  }

  /**
   * Resolve a variable path (e.g., "user.company_name")
   * Returns the resolved value after validation and sanitization
   */
  resolve(path: string): ResolvedVariable {
    // Check cache first
    const cached = this.cache.get(path);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.value;
    }

    // Get raw value from registry
    const rawValue = this.getRawValue(path);

    // Validate and sanitize
    const resolved = this.validateAndSanitize(path, rawValue);

    // Cache the result
    this.cache.set(path, { value: resolved, timestamp: Date.now() });

    return resolved;
  }

  /**
   * Get raw value from registry without validation
   */
  private getRawValue(path: string): unknown {
    const parts = path.split('.');
    let value: unknown = this.registry;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        // Path not found, return undefined
        return undefined;
      }
    }

    return value;
  }

  /**
   * Validate and sanitize a value based on its definition
   */
  private validateAndSanitize(path: string, value: unknown): ResolvedVariable {
    const definition = getVariableDefinition(path);

    // If no definition exists, return value as-is (with basic sanitization)
    if (!definition) {
      logger.warn(`No definition found for variable: ${path}`, { path });
      return this.sanitizeUnknown(value);
    }

    // Handle null/undefined values
    if (value === null || value === undefined) {
      if (definition.required && definition.defaultValue === undefined) {
        logger.warn(`Required variable ${path} is missing and has no default`, { path });
        return null;
      }
      return definition.defaultValue ?? null;
    }

    // Apply sanitizer if available
    let sanitized: ResolvedVariable = value as ResolvedVariable;
    if (definition.sanitizer) {
      try {
        sanitized = definition.sanitizer(value) as ResolvedVariable;
      } catch (error) {
        logger.warn(`Sanitization failed for ${path}`, { error, path });
        sanitized = value;
      }
    }

    // Apply validator if available
    if (definition.validator) {
      if (!definition.validator(sanitized)) {
        logger.warn(`Validation failed for ${path}, using default`, {
          path,
          valueType: typeof sanitized,
        });
        return definition.defaultValue ?? null;
      }
    } else {
      // Use type-based validator if no custom validator
      const typeValidator = this.getTypeValidator(definition.type);
      if (typeValidator && !typeValidator(sanitized)) {
        logger.warn(`Type validation failed for ${path}, using default`, {
          path,
          expectedType: definition.type,
          valueType: typeof sanitized,
        });
        return definition.defaultValue ?? null;
      }
    }

    return sanitized;
  }

  /**
   * Get type-based validator
   */
  private getTypeValidator(type: string): ((value: unknown) => boolean) | undefined {
    switch (type) {
      case 'string':
        return (v) => typeof v === 'string';
      case 'number':
        return (v) => typeof v === 'number' && !isNaN(v);
      case 'boolean':
        return (v) => typeof v === 'boolean';
      case 'array':
        return (v) => Array.isArray(v);
      case 'object':
        return (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
      default:
        return undefined;
    }
  }

  /**
   * Sanitize unknown value (fallback)
   */
  private sanitizeUnknown(value: unknown): ResolvedVariable {
    if (typeof value === 'string') {
      // Basic HTML escaping for strings
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    return value;
  }

  /**
   * Get default value for a path
   */
  getDefault(path: string): ResolvedVariable {
    const definition = getVariableDefinition(path);
    return definition?.defaultValue ?? null;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if a variable path exists in the registry
   */
  has(path: string): boolean {
    const parts = path.split('.');
    let current: unknown = this.registry;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all available variable paths
   */
  getAllPaths(): string[] {
    return Object.keys(getAllVariableDefinitions());
  }
}
