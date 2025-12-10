/**
 * Template System Types
 *
 * Shared types for the modern template system
 */

import type { PriceRow } from '@/app/lib/pricing';

export interface TemplateContext {
  title: string;
  companyName: string;
  bodyHtml: string;
  locale: string;
  issueDate: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  companyWebsite?: string | null;
  companyAddress?: string | null;
  companyTaxId?: string | null;
  schedule?: string[];
  testimonials?: string[] | null;
  guarantees?: string[] | null;
  pricingRows: PriceRow[];
  images: Array<{ src: string; alt: string }>;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
  };
  // Formality and tone for welcome line generation
  formality?: 'tegeződés' | 'magázódás';
  tone?: 'friendly' | 'formal';
  // Customer name for welcome line (can be different from contactName)
  customerName?: string | null;
}

export type TemplateId =
  | 'free.minimal'
  | 'free.classic'
  | 'free.minimalist'
  | 'premium.professional'
  | 'premium.luxury'
  | 'premium.brutalist';

export interface Template {
  id: TemplateId;
  name: string;
  tier: 'free' | 'premium';
  render: (ctx: TemplateContext) => string;
  preview?: string;
  description?: string;
  label?: string;
}
