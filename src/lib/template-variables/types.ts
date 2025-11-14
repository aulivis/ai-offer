/**
 * Type definitions for the dynamic template variable system
 *
 * This module defines the core types for the Shopify-style variable system,
 * including the variable registry structure and type definitions.
 */

import type { PriceRow } from '@/app/lib/pricing';

/**
 * Supported variable types for validation
 */
export type VariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'url'
  | 'email'
  | 'color'
  | 'array'
  | 'object';

/**
 * Variable definition with validation and sanitization rules
 */
export interface VariableDefinition {
  /** Variable path (e.g., "user.company_name") */
  path: string;
  /** Variable type for validation */
  type: VariableType;
  /** Whether this variable is required */
  required: boolean;
  /** Default value if variable is missing */
  defaultValue?: unknown;
  /** Validation function */
  validator?: (value: unknown) => boolean;
  /** Sanitization function */
  sanitizer?: (value: unknown) => unknown;
  /** Human-readable description */
  description: string;
}

/**
 * Complete variable registry structure
 * This defines all available variables in the system
 */
export interface VariableRegistry {
  // User profile data
  user: {
    company_name: string;
    email: string;
    brand_color_primary: string;
    brand_color_secondary: string;
    brand_logo_url: string | null;
    brand_logo_path: string | null;
  };

  // Customer/Client data
  customer: {
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    tax_id: string | null;
  };

  // Offer data
  offer: {
    title: string;
    issue_date: string | null;
    locale: string;
    template_id: string;
    schedule: string[];
    testimonials: string[] | null;
    guarantees: string[] | null;
  };

  // AI-generated content blocks
  ai: {
    introduction: string;
    project_summary: string;
    value_proposition: string | null;
    scope: string[];
    deliverables: string[];
    expected_outcomes: string[] | null;
    assumptions: string[];
    next_steps: string[];
    closing: string;
    client_context: string | null;
  };

  // Pricing data
  pricing: {
    rows: PriceRow[];
    total: number;
    subtotal: number;
    vat_total: number;
    currency: string;
  };

  // Branding
  branding: {
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    monogram: string;
  };

  // Settings
  settings: {
    enable_reference_photos: boolean;
    enable_testimonials: boolean;
    default_activity_id: string | null;
  };

  // Metadata
  meta: {
    current_date: string;
    current_year: number;
    locale: string;
    language: string;
  };
}

/**
 * Type helper to extract variable paths
 */
export type VariablePath = {
  [K in keyof VariableRegistry]: {
    [P in keyof VariableRegistry[K]]: `${K & string}.${P & string}`;
  }[keyof VariableRegistry[K]];
}[keyof VariableRegistry];

/**
 * Resolved variable value (after validation and sanitization)
 */
export type ResolvedVariable = unknown;
