/**
 * Data Aggregator
 *
 * Aggregates data from various sources into a VariableRegistry
 */

import type { VariableRegistry } from './types';
import type { PriceRow } from '@/app/lib/pricing';
import type { OfferData } from '@/app/pdf/templates/types';
import type { OfferBrandingOptions } from '@/app/lib/offerDocument';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * User profile data structure (from Supabase profiles table)
 */
export interface UserProfileData {
  company_name?: string | null;
  email?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_logo_url?: string | null;
  brand_logo_path?: string | null;
}

/**
 * Customer/Client data structure
 */
export interface CustomerData {
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_id?: string | null;
}

/**
 * Settings data structure
 */
export interface SettingsData {
  enable_reference_photos?: boolean | null;
  enable_testimonials?: boolean | null;
  default_activity_id?: string | null;
}

/**
 * AI response blocks structure
 */
export interface AIResponseBlocks {
  introduction: string;
  project_summary: string;
  value_proposition?: string | null;
  scope: string[];
  deliverables: string[];
  expected_outcomes?: string[] | null;
  assumptions: string[];
  next_steps: string[];
  closing: string;
  client_context?: string | null;
}

/**
 * Options for building variable registry
 */
export interface BuildRegistryOptions {
  userProfile?: UserProfileData | null;
  customer?: CustomerData | null;
  offer: OfferData;
  aiBlocks?: AIResponseBlocks | null;
  pricingRows?: PriceRow[];
  branding?: OfferBrandingOptions | null;
  settings?: SettingsData | null;
  locale?: string;
}

/**
 * Derive monogram from company name or title
 */
function deriveMonogram(source: string | null | undefined): string {
  if (!source || typeof source !== 'string') {
    return 'AI';
  }

  const tokens = source
    .trim()
    .split(/[\s,.;:/\\-]+/)
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return 'AI';
  }

  const initials = tokens
    .slice(0, 2)
    .map((token) => token[0]!.toUpperCase())
    .join('');

  return initials || 'AI';
}

/**
 * Calculate pricing totals
 */
function calculatePricingTotals(rows: PriceRow[]): {
  subtotal: number;
  vat_total: number;
  total: number;
} {
  let subtotal = 0;
  let vat_total = 0;

  for (const row of rows) {
    const rowTotal = (row.unitPrice || 0) * (row.qty || 0);
    subtotal += rowTotal;
    const vat = rowTotal * ((row.vat || 0) / 100);
    vat_total += vat;
  }

  return {
    subtotal,
    vat_total,
    total: subtotal + vat_total,
  };
}

/**
 * Build a complete VariableRegistry from various data sources
 */
export function buildVariableRegistry(options: BuildRegistryOptions): VariableRegistry {
  const {
    userProfile,
    customer,
    offer,
    aiBlocks,
    pricingRows = [],
    branding,
    settings,
    locale = 'hu',
  } = options;

  // Calculate pricing
  const pricing = calculatePricingTotals(pricingRows);

  // Get current date
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0] || '';
  const currentYear = now.getFullYear();

  // Build user data
  const user = {
    company_name: sanitizeInput(userProfile?.company_name || 'Your Company'),
    email: sanitizeInput(userProfile?.email || ''),
    brand_color_primary: userProfile?.brand_color_primary || '#1c274c',
    brand_color_secondary: userProfile?.brand_color_secondary || '#e2e8f0',
    brand_logo_url: userProfile?.brand_logo_url || null,
    brand_logo_path: userProfile?.brand_logo_path || null,
  };

  // Build customer data
  const customerData: VariableRegistry['customer'] = {
    company_name: customer?.company_name ? sanitizeInput(customer.company_name) : null,
    email: customer?.email ? sanitizeInput(customer.email) : null,
    phone: customer?.phone ? sanitizeInput(customer.phone) : null,
    address: customer?.address ? sanitizeInput(customer.address) : null,
    tax_id: customer?.tax_id ? sanitizeInput(customer.tax_id) : null,
  };

  const sanitizeStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => sanitizeInput(item))
      : [];

  const scheduleItems = sanitizeStringArray(offer.schedule ?? []);
  const testimonialsList = sanitizeStringArray(offer.testimonials ?? []);
  const guaranteesList = sanitizeStringArray(offer.guarantees ?? []);

  // Build offer data
  const offerData: VariableRegistry['offer'] = {
    title: sanitizeInput(offer.title || 'Offer'),
    issue_date: offer.issueDate || currentDate,
    locale: offer.locale || locale,
    template_id: offer.templateId || '',
    schedule: scheduleItems,
    testimonials: testimonialsList.length ? testimonialsList : null,
    guarantees: guaranteesList.length ? guaranteesList : null,
  };

  // Build AI blocks
  const ai: VariableRegistry['ai'] = aiBlocks
    ? {
        introduction: sanitizeInput(aiBlocks.introduction || ''),
        project_summary: sanitizeInput(aiBlocks.project_summary || ''),
        value_proposition: aiBlocks.value_proposition
          ? sanitizeInput(aiBlocks.value_proposition)
          : null,
        scope: (aiBlocks.scope || []).map(sanitizeInput),
        deliverables: (aiBlocks.deliverables || []).map(sanitizeInput),
        expected_outcomes: aiBlocks.expected_outcomes
          ? aiBlocks.expected_outcomes.map(sanitizeInput)
          : null,
        assumptions: (aiBlocks.assumptions || []).map(sanitizeInput),
        next_steps: (aiBlocks.next_steps || []).map(sanitizeInput),
        closing: sanitizeInput(aiBlocks.closing || ''),
        client_context: aiBlocks.client_context ? sanitizeInput(aiBlocks.client_context) : null,
      }
    : {
        introduction: '',
        project_summary: '',
        value_proposition: null,
        scope: [],
        deliverables: [],
        expected_outcomes: null,
        assumptions: [],
        next_steps: [],
        closing: '',
        client_context: null,
      };

  // Build pricing data
  const pricingData: VariableRegistry['pricing'] = {
    rows: pricingRows,
    total: pricing.total,
    subtotal: pricing.subtotal,
    vat_total: pricing.vat_total,
    currency: 'HUF', // Default currency
  };

  // Build branding data
  const monogramSource = user.company_name || offerData.title;
  const brandingData: VariableRegistry['branding'] = {
    logo_url: branding?.logoUrl || user.brand_logo_url || null,
    primary_color: branding?.primaryColor || user.brand_color_primary,
    secondary_color: branding?.secondaryColor || user.brand_color_secondary,
    monogram: deriveMonogram(monogramSource),
  };

  // Build settings data
  const settingsData: VariableRegistry['settings'] = {
    enable_reference_photos: settings?.enable_reference_photos ?? false,
    enable_testimonials: settings?.enable_testimonials ?? false,
    default_activity_id: settings?.default_activity_id || null,
  };

  // Build metadata
  const meta: VariableRegistry['meta'] = {
    current_date: currentDate,
    current_year: currentYear,
    locale: locale,
    language: locale,
  };

  // Assemble complete registry
  return {
    user,
    customer: customerData,
    offer: offerData,
    ai,
    pricing: pricingData,
    branding: brandingData,
    settings: settingsData,
    meta,
  };
}
