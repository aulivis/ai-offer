import type { OfferBrandingOptions } from '@/app/lib/offerDocument';
import type { PriceRow } from '@/app/lib/pricing';

export type Branding = OfferBrandingOptions;
export type I18nDict = typeof import('@/copy/hu').hu;
export type ThemeTokens = Record<string, string>;

export type TemplateTier = 'free' | 'premium';
export type TemplateId = string; // e.g. "free.base@1.0.0" or "premium.elegant@1.0.0"
export interface OfferTemplate {
  id: TemplateId;
  tier: TemplateTier;
  label: string;
  version: string; // semver
  renderHead(ctx: RenderCtx): string; // returns <head> content (styles+meta)
  renderBody(ctx: RenderCtx): string; // returns <main>…</main>
  capabilities?: Record<string, boolean>;
}
export interface OfferData {
  title: string;
  companyName: string;
  bodyHtml: string;
  templateId: TemplateId;
  locale?: string;
  legacyTemplateId?: string | null;
}
export interface RenderCtx {
  offer: OfferData;
  rows: PriceRow[];
  branding?: Branding;
  i18n: I18nDict;
  tokens: ThemeTokens;
}
