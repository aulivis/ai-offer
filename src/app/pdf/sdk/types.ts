export type BrandInput = {
  name: string;
  logoUrl?: string | null;
  primaryHex: string; // user provided
  secondaryHex: string; // user provided
};

export type DocSlots = {
  brand: { name: string; logoUrl?: string | null };
  doc: { title: string; subtitle?: string; date: string };
  customer: { name: string; address?: string; taxId?: string };
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
    note?: string;
  }>;
  totals: { net: number; vat: number; gross: number; currency: string };
  notes?: string;
};

export type TokenScale = Record<
  '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
  string
>;

export type TemplateTokens = {
  brand: { primary: string; secondary: string };
  primary: TokenScale;
  secondary: TokenScale;
  text: { default: string; onPrimary: string; onSecondary: string };
  bg: { canvas: string; section: string };
  border: { muted: string };
  font: { family: string; weight: { regular: number; medium: number; bold: number } };
};

export type RenderContext = {
  slots: DocSlots;
  tokens: TemplateTokens;
};

export type OfferTemplate = {
  id: string; // unique
  name: string; // for registry
  version: string; // semver
  capabilities?: string[]; // e.g. ["gallery","long-items"]
  renderHead(ctx: RenderContext): string;
  renderBody(ctx: RenderContext): string;
};
