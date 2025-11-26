/**
 * Template Parser
 *
 * Parses templates with variable substitution and filter support
 * Supports Shopify-style syntax: {{ variable | filter:arg }}
 */

import { VariableResolver } from './resolver';
import { applyFilter } from './filters';
import { logger } from '@/lib/logger';

export class TemplateParser {
  private resolver: VariableResolver;

  constructor(resolver: VariableResolver) {
    this.resolver = resolver;
  }

  /**
   * Parse and render template with variable substitution
   */
  render(template: string): string {
    // Match {{ variable }} patterns
    const variablePattern = /\{\{\s*([^}]+)\s*\}\}/g;

    return template.replace(variablePattern, (match, expression) => {
      try {
        return this.evaluateExpression(expression);
      } catch (error) {
        logger.warn(`Failed to evaluate expression "${expression}"`, error);
        return match; // Return original if evaluation fails
      }
    });
  }

  /**
   * Evaluate a variable expression (supports filters)
   * Examples:
   * - "user.company_name"
   * - "user.company_name | capitalize"
   * - "offer.issue_date | date: %Y-%m-%d"
   */
  private evaluateExpression(expr: string): string {
    // Trim whitespace
    expr = expr.trim();

    // Parse filters: "variable | filter1 | filter2:arg"
    const parts = expr.split('|').map((s) => s.trim());
    const variable = parts[0] || '';
    const filters = parts.slice(1);

    // Resolve variable
    let value = this.resolver.resolve(variable);

    // Apply filters in sequence
    for (const filterExpr of filters) {
      value = this.applyFilterExpression(value, filterExpr);
    }

    // Format final value
    return this.formatValue(value);
  }

  /**
   * Apply a filter expression to a value
   * Examples: "capitalize", "date: %Y-%m-%d", "truncate: 50"
   */
  private applyFilterExpression(value: unknown, filterExpr: string): unknown {
    // Parse filter name and arguments
    const match = filterExpr.match(/^(\w+)(?::\s*(.+))?$/);
    if (!match) {
      logger.warn(`Invalid filter expression: ${filterExpr}`, { filterExpr });
      return value;
    }

    const [, filterName, argsStr] = match;
    const args = argsStr ? argsStr.split(',').map((s) => s.trim()) : [];

    return applyFilter(filterName, value, ...args);
  }

  /**
   * Format a value for output
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.map(String).join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Check if template contains variables
   */
  hasVariables(template: string): boolean {
    const variablePattern = /\{\{\s*[^}]+\s*\}\}/;
    return variablePattern.test(template);
  }

  /**
   * Extract all variable paths from template
   */
  extractVariables(template: string): string[] {
    const variablePattern = /\{\{\s*([^}|]+)\s*[|}]/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variable = match[1]?.trim();
      if (variable) {
        variables.push(variable);
      }
    }

    return [...new Set(variables)]; // Remove duplicates
  }
}
