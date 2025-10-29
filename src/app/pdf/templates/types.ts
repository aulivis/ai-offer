import type { OfferBrandingOptions } from '@/app/lib/offerDocument';
import type { PriceRow } from '@/app/lib/pricing';
import type { Translator } from '@/copy';

export type Branding = OfferBrandingOptions;
export interface ThemeTokens {
  color: {
    primary: string;
    secondary: string;
    text: string;
    muted: string;
    border: string;
    bg: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    body: string;
    h1: string;
    h2: string;
    h3: string;
    table: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
}

export type TemplateTier = 'free' | 'premium';
export type TemplateId = string; // e.g. "free.base@1.1.0" or "premium.elegant@1.1.0"
export interface OfferTemplate {
  id: TemplateId;
  tier: TemplateTier;
  label: string;
  version: string; // semver
  marketingHighlight?: string;
  renderHead(ctx: RenderCtx): string; // returns <head> meta/content (styles injected by engine)
  renderBody(ctx: RenderCtx): string; // returns <main>…</main>
  styles: {
    print: string;
    template: string;
  };
  tokens: ThemeTokens;
  capabilities?: Record<string, boolean>;
}
export interface OfferData {
  title: string;
  companyName: string;
  bodyHtml: string;
  templateId: TemplateId;
  locale?: string;
  legacyTemplateId?: string | null;
  issueDate?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  companyWebsite?: string | null;
  companyAddress?: string | null;
  companyTaxId?: string | null;
  images?: TemplateImageAsset[] | null;
}

export interface TemplateImageAsset {
  key: string;
  src: string;
  alt: string;
}

export interface RenderCtx {
  offer: OfferData;
  rows: PriceRow[];
  branding?: Branding;
  i18n: Translator;
  tokens: ThemeTokens;
  images?: TemplateImageAsset[];
}
