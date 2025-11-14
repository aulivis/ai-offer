/**
 * Variable definitions registry
 *
 * Defines all available template variables with their types, validators, and defaults
 */

import { sanitizeInput } from '@/lib/sanitize';
import type { VariableDefinition } from './types';
import {
  isValidHexColor,
  isValidUrl,
  isValidEmail,
  isValidDate,
  isStringArray,
} from './validators';

/**
 * Complete registry of all variable definitions
 */
export const VARIABLE_DEFINITIONS: Record<string, VariableDefinition> = {
  // User data
  'user.company_name': {
    path: 'user.company_name',
    type: 'string',
    required: true,
    defaultValue: 'Your Company',
    sanitizer: sanitizeInput,
    description: 'User company name from profile',
  },
  'user.email': {
    path: 'user.email',
    type: 'email',
    required: true,
    defaultValue: '',
    validator: isValidEmail,
    sanitizer: sanitizeInput,
    description: 'User email address',
  },
  'user.brand_color_primary': {
    path: 'user.brand_color_primary',
    type: 'color',
    required: false,
    defaultValue: '#1c274c',
    validator: isValidHexColor,
    description: 'Primary brand color',
  },
  'user.brand_color_secondary': {
    path: 'user.brand_color_secondary',
    type: 'color',
    required: false,
    defaultValue: '#e2e8f0',
    validator: isValidHexColor,
    description: 'Secondary brand color',
  },
  'user.brand_logo_url': {
    path: 'user.brand_logo_url',
    type: 'url',
    required: false,
    defaultValue: null,
    validator: isValidUrl,
    description: 'Brand logo URL',
  },
  'user.brand_logo_path': {
    path: 'user.brand_logo_path',
    type: 'string',
    required: false,
    defaultValue: null,
    description: 'Brand logo storage path',
  },

  // Customer data
  'customer.company_name': {
    path: 'customer.company_name',
    type: 'string',
    required: false,
    defaultValue: null,
    sanitizer: sanitizeInput,
    description: 'Customer company name',
  },
  'customer.email': {
    path: 'customer.email',
    type: 'email',
    required: false,
    defaultValue: null,
    validator: isValidEmail,
    sanitizer: sanitizeInput,
    description: 'Customer email address',
  },
  'customer.phone': {
    path: 'customer.phone',
    type: 'string',
    required: false,
    defaultValue: null,
    sanitizer: sanitizeInput,
    description: 'Customer phone number',
  },
  'customer.address': {
    path: 'customer.address',
    type: 'string',
    required: false,
    defaultValue: null,
    sanitizer: sanitizeInput,
    description: 'Customer address',
  },
  'customer.tax_id': {
    path: 'customer.tax_id',
    type: 'string',
    required: false,
    defaultValue: null,
    sanitizer: sanitizeInput,
    description: 'Customer tax ID',
  },

  // Offer data
  'offer.title': {
    path: 'offer.title',
    type: 'string',
    required: true,
    defaultValue: 'Offer',
    sanitizer: sanitizeInput,
    description: 'Offer title',
  },
  'offer.issue_date': {
    path: 'offer.issue_date',
    type: 'date',
    required: false,
    defaultValue: null,
    validator: isValidDate,
    description: 'Offer issue date',
  },
  'offer.locale': {
    path: 'offer.locale',
    type: 'string',
    required: true,
    defaultValue: 'hu',
    description: 'Offer locale',
  },
  'offer.template_id': {
    path: 'offer.template_id',
    type: 'string',
    required: true,
    defaultValue: '',
    description: 'Template ID',
  },
  'offer.schedule': {
    path: 'offer.schedule',
    type: 'array',
    required: true,
    defaultValue: [],
    validator: isStringArray,
    description: 'User-provided schedule items',
  },
  'offer.testimonials': {
    path: 'offer.testimonials',
    type: 'array',
    required: false,
    defaultValue: null,
    validator: isStringArray,
    description: 'User-provided testimonials',
  },
  'offer.guarantees': {
    path: 'offer.guarantees',
    type: 'array',
    required: false,
    defaultValue: null,
    validator: isStringArray,
    description: 'User-provided guarantees',
  },

  // AI-generated content
  'ai.introduction': {
    path: 'ai.introduction',
    type: 'string',
    required: true,
    defaultValue: '',
    sanitizer: sanitizeInput,
    description: 'AI-generated introduction',
  },
  'ai.project_summary': {
    path: 'ai.project_summary',
    type: 'string',
    required: true,
    defaultValue: '',
    sanitizer: sanitizeInput,
    description: 'AI-generated project summary',
  },
  'ai.value_proposition': {
    path: 'ai.value_proposition',
    type: 'string',
    required: false,
    defaultValue: null,
    sanitizer: sanitizeInput,
    description: 'AI-generated value proposition',
  },
  'ai.scope': {
    path: 'ai.scope',
    type: 'array',
    required: true,
    defaultValue: [],
    validator: isStringArray,
    description: 'AI-generated scope items',
  },
  'ai.deliverables': {
    path: 'ai.deliverables',
    type: 'array',
    required: true,
    defaultValue: [],
    validator: isStringArray,
    description: 'AI-generated deliverables',
  },
  'ai.expected_outcomes': {
    path: 'ai.expected_outcomes',
    type: 'array',
    required: false,
    defaultValue: null,
    validator: isStringArray,
    description: 'AI-generated expected outcomes',
  },
  'ai.assumptions': {
    path: 'ai.assumptions',
    type: 'array',
    required: true,
    defaultValue: [],
    validator: isStringArray,
    description: 'AI-generated assumptions',
  },
  'ai.next_steps': {
    path: 'ai.next_steps',
    type: 'array',
    required: true,
    defaultValue: [],
    validator: isStringArray,
    description: 'AI-generated next steps',
  },
  'ai.closing': {
    path: 'ai.closing',
    type: 'string',
    required: true,
    defaultValue: '',
    sanitizer: sanitizeInput,
    description: 'AI-generated closing',
  },
  'ai.client_context': {
    path: 'ai.client_context',
    type: 'string',
    required: false,
    defaultValue: null,
    sanitizer: sanitizeInput,
    description: 'AI-generated client context',
  },

  // Pricing
  'pricing.rows': {
    path: 'pricing.rows',
    type: 'array',
    required: true,
    defaultValue: [],
    description: 'Pricing rows',
  },
  'pricing.total': {
    path: 'pricing.total',
    type: 'number',
    required: true,
    defaultValue: 0,
    description: 'Total price',
  },
  'pricing.subtotal': {
    path: 'pricing.subtotal',
    type: 'number',
    required: true,
    defaultValue: 0,
    description: 'Subtotal price',
  },
  'pricing.vat_total': {
    path: 'pricing.vat_total',
    type: 'number',
    required: true,
    defaultValue: 0,
    description: 'VAT total',
  },
  'pricing.currency': {
    path: 'pricing.currency',
    type: 'string',
    required: true,
    defaultValue: 'HUF',
    description: 'Currency code',
  },

  // Branding
  'branding.logo_url': {
    path: 'branding.logo_url',
    type: 'url',
    required: false,
    defaultValue: null,
    validator: isValidUrl,
    description: 'Brand logo URL',
  },
  'branding.primary_color': {
    path: 'branding.primary_color',
    type: 'color',
    required: true,
    defaultValue: '#1c274c',
    validator: isValidHexColor,
    description: 'Primary brand color',
  },
  'branding.secondary_color': {
    path: 'branding.secondary_color',
    type: 'color',
    required: true,
    defaultValue: '#e2e8f0',
    validator: isValidHexColor,
    description: 'Secondary brand color',
  },
  'branding.monogram': {
    path: 'branding.monogram',
    type: 'string',
    required: true,
    defaultValue: 'AI',
    sanitizer: sanitizeInput,
    description: 'Brand monogram (initials)',
  },

  // Settings
  'settings.enable_reference_photos': {
    path: 'settings.enable_reference_photos',
    type: 'boolean',
    required: true,
    defaultValue: false,
    description: 'Enable reference photos',
  },
  'settings.enable_testimonials': {
    path: 'settings.enable_testimonials',
    type: 'boolean',
    required: true,
    defaultValue: false,
    description: 'Enable testimonials',
  },
  'settings.default_activity_id': {
    path: 'settings.default_activity_id',
    type: 'string',
    required: false,
    defaultValue: null,
    description: 'Default activity ID',
  },

  // Metadata
  'meta.current_date': {
    path: 'meta.current_date',
    type: 'date',
    required: true,
    defaultValue: new Date().toISOString(),
    validator: isValidDate,
    description: 'Current date (ISO format)',
  },
  'meta.current_year': {
    path: 'meta.current_year',
    type: 'number',
    required: true,
    defaultValue: new Date().getFullYear(),
    description: 'Current year',
  },
  'meta.locale': {
    path: 'meta.locale',
    type: 'string',
    required: true,
    defaultValue: 'hu',
    description: 'Current locale',
  },
  'meta.language': {
    path: 'meta.language',
    type: 'string',
    required: true,
    defaultValue: 'hu',
    description: 'Current language',
  },
};

/**
 * Get variable definition by path
 */
export function getVariableDefinition(path: string): VariableDefinition | undefined {
  return VARIABLE_DEFINITIONS[path];
}

/**
 * Get all variable definitions
 */
export function getAllVariableDefinitions(): Record<string, VariableDefinition> {
  return VARIABLE_DEFINITIONS;
}
