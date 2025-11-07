#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';

const name = process.argv.slice(2).join(' ').trim();
if (!name) {
  console.error('Usage: pnpm template:new "<Template Name>" [tier] [legacy-id]');
  console.error('  tier: free (default) or premium');
  console.error('  legacy-id: optional legacy template identifier');
  process.exit(1);
}

const args = process.argv.slice(3);
const tier = (args[0] === 'premium' ? 'premium' : 'free') as 'free' | 'premium';
const legacyId = args[1]?.trim() || undefined;

const id = name
  .toLowerCase()
  .replace(/\s+/g, '.')
  .replace(/[^a-z0-9\.]/g, '');

// Generate semantic version ID
const templateId = `${tier}.${id}@1.0.0`;

const baseDir = path.join(process.cwd(), 'src/app/pdf/templates', `${tier}.${id}`);
fs.mkdirSync(path.join(baseDir, 'partials'), { recursive: true });

// Generate tokens.ts
const tokensContent = `import type { ThemeTokens } from '../types';

export const ${id.replace(/\./g, '_')}Tokens: ThemeTokens = {
  color: {
    primary: '#1e40af',
    secondary: '#3b82f6',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    bg: '#ffffff',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  typography: {
    body: '400 11pt/1.5 "Inter", system-ui, sans-serif',
    h1: '600 2rem/1.2 "Inter", system-ui, sans-serif',
    h2: '600 1.5rem/1.3 "Inter", system-ui, sans-serif',
    h3: '600 1.25rem/1.4 "Inter", system-ui, sans-serif',
    table: '400 10pt/1.4 "Inter", system-ui, sans-serif',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  },
};
`;

fs.writeFileSync(path.join(baseDir, 'tokens.ts'), tokensContent, 'utf8');

// Generate styles.css.ts with common patterns
const cssClassName = id.replace(/\./g, '-');
const stylesContent = `import { PRINT_BASE_CSS } from '../../print.css';

export const pdfStyles = PRINT_BASE_CSS;

export const templateStyles = \`
  .offer-doc--${cssClassName} {
    background: var(--bg, #ffffff);
    color: var(--text, #0f172a);
  }

  .offer-doc__header--${cssClassName} {
    border-bottom: 2px solid var(--border, #e2e8f0);
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  .offer-doc__header-content--${cssClassName} {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .offer-doc__company--${cssClassName} {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--muted, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .offer-doc__title--${cssClassName} {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
    margin: 0;
    color: var(--text, #0f172a);
  }

  .offer-doc__meta--${cssClassName} {
    display: flex;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border, #e2e8f0);
  }

  .offer-doc__meta-item--${cssClassName} {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .offer-doc__meta-label--${cssClassName} {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #64748b);
  }

  .offer-doc__meta-value--${cssClassName} {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text, #0f172a);
  }

  .section-card--${cssClassName} {
    background: transparent;
    border: none;
    padding: 0;
    margin-bottom: 2rem;
  }

  .section-card__title--${cssClassName} {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--muted, #64748b);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border, #e2e8f0);
  }

  .offer-doc__content--${cssClassName} {
    line-height: 1.7;
    color: var(--text, #0f172a);
  }

  .offer-doc__content--${cssClassName} h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text, #0f172a);
    margin: 1.5rem 0 1rem 0;
  }

  .offer-doc__content--${cssClassName} h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text, #0f172a);
    margin: 1.25rem 0 0.75rem 0;
  }

  .offer-doc__content--${cssClassName} p {
    margin: 0 0 1rem 0;
  }

  .offer-doc__footer--${cssClassName} {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border, #e2e8f0);
  }

  .offer-doc__footer-grid--${cssClassName} {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
  }

  .offer-doc__footer-column--${cssClassName} {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .offer-doc__footer-label--${cssClassName} {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #64748b);
    margin-bottom: 0.25rem;
  }

  .offer-doc__footer-value--${cssClassName} {
    font-size: 0.85rem;
    color: var(--text, #0f172a);
  }

  .offer-doc__footer-value--${cssClassName}.offer-doc__footer-value--placeholder {
    color: var(--muted, #999999);
    font-style: italic;
  }

  @media print {
    .offer-doc--${cssClassName} {
      background: #ffffff;
    }
  }
\`;
`;

fs.writeFileSync(path.join(baseDir, 'styles.css.ts'), stylesContent, 'utf8');

// Generate partials/head.ts
const headContent = `import { sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../types';

export function renderHead(ctx: RenderCtx): string {
  const safeTitle = sanitizeInput(
    ctx.offer.title || ctx.i18n.t('pdf.templates.common.defaultTitle'),
  );

  return \`
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>\${safeTitle}</title>
  \`;
}
`;

fs.writeFileSync(path.join(baseDir, 'partials/head.ts'), headContent, 'utf8');

// Generate partials/body.ts with common patterns
const bodyContent = `import { countRenderablePricingRows, priceTableHtml } from '@/app/lib/pricing';
import { renderSectionHeading } from '@/app/lib/offerSections';
import { ensureSafeHtml, sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../../types';
import { buildHeaderFooterCtx } from '../../shared/headerFooter';
import { renderSlimHeader, renderSlimFooter } from '../../shared/slimHeaderFooter';

function partialHeader(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const { company, title, companyPlaceholder, issueDate, labels } = safeCtx;

  return \`
    <header class="offer-doc__header--${id.replace(/\./g, '-')} first-page-only" style="margin-top: 0; padding-top: 0;">
      <div class="offer-doc__header-content--${id.replace(/\./g, '-')}">
        <div class="offer-doc__company--${id.replace(/\./g, '-')}">\${company.value || companyPlaceholder}</div>
        <h1 class="offer-doc__title--${id.replace(/\./g, '-')}">\${title}</h1>
      </div>
      <div class="offer-doc__meta--${id.replace(/\./g, '-')}">
        <div class="offer-doc__meta-item--${id.replace(/\./g, '-')}">
          <span class="offer-doc__meta-label--${id.replace(/\./g, '-')}">\${labels.date}</span>
          <span class="offer-doc__meta-value--${id.replace(/\./g, '-')}">\${issueDate.value}</span>
        </div>
      </div>
    </header>
  \`;
}

function partialSections(ctx: RenderCtx): string {
  if (!ctx.offer.bodyHtml || ctx.offer.bodyHtml.trim().length === 0) {
    return '';
  }

  return \`
    <section class="section-card--${id.replace(/\./g, '-')}">
      <div class="offer-doc__content--${id.replace(/\./g, '-')}">
        \${ctx.offer.bodyHtml}
      </div>
    </section>
  \`;
}

function partialPriceTable(ctx: RenderCtx): string {
  const priceTable = priceTableHtml(ctx.rows, ctx.i18n, {
    footnote: ctx.offer.pricingFootnote,
  });
  const rowCount = countRenderablePricingRows(ctx.rows);

  if (rowCount === 0) {
    return '';
  }

  const pricingHeading = renderSectionHeading(
    ctx.i18n.t('pdf.templates.sections.pricing'),
    'pricing',
  );

  return \`
    <section class="section-card--${id.replace(/\./g, '-')}">
      <h2 class="section-card__title--${id.replace(/\./g, '-')}">\${pricingHeading}</h2>
      \${priceTable}
    </section>
  \`;
}

function partialFooter(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const {
    labels,
    contactName,
    contactEmail,
    contactPhone,
    companyWebsite,
    companyAddress,
    companyTaxId,
  } = safeCtx;

  const contactClass = contactName.isPlaceholder
    ? \`offer-doc__footer-value--${id.replace(/\./g, '-')} offer-doc__footer-value--placeholder\`
    : \`offer-doc__footer-value--${id.replace(/\./g, '-')}\`;
  const emailClass = contactEmail.isPlaceholder
    ? \`offer-doc__footer-value--${id.replace(/\./g, '-')} offer-doc__footer-value--placeholder\`
    : \`offer-doc__footer-value--${id.replace(/\./g, '-')}\`;
  const phoneClass = contactPhone.isPlaceholder
    ? \`offer-doc__footer-value--${id.replace(/\./g, '-')} offer-doc__footer-value--placeholder\`
    : \`offer-doc__footer-value--${id.replace(/\./g, '-')}\`;

  return \`
    <footer class="offer-doc__footer--${id.replace(/\./g, '-')}">
      <div class="offer-doc__footer-grid--${id.replace(/\./g, '-')}">
        <div class="offer-doc__footer-column--${id.replace(/\./g, '-')}">
          <span class="offer-doc__footer-label--${id.replace(/\./g, '-')}">\${labels.contact}</span>
          <span class="\${contactClass}">\${contactName.value}</span>
        </div>
        <div class="offer-doc__footer-column--${id.replace(/\./g, '-')}">
          <span class="offer-doc__footer-label--${id.replace(/\./g, '-')}">\${labels.email}</span>
          <span class="\${emailClass}">\${contactEmail.value}</span>
          <span class="offer-doc__footer-label--${id.replace(/\./g, '-')}" style="margin-top: 0.75rem;">\${labels.phone}</span>
          <span class="\${phoneClass}">\${contactPhone.value}</span>
        </div>
        <div class="offer-doc__footer-column--${id.replace(/\./g, '-')}">
          <span class="offer-doc__footer-label--${id.replace(/\./g, '-')}">\${labels.website}</span>
          <span class="offer-doc__footer-value--${id.replace(/\./g, '-')}">\${companyWebsite.value}</span>
        </div>
        <div class="offer-doc__footer-column--${id.replace(/\./g, '-')}">
          <span class="offer-doc__footer-label--${id.replace(/\./g, '-')}">\${labels.company}</span>
          <span class="offer-doc__footer-label--${id.replace(/\./g, '-')}" style="margin-top: 0.75rem;">\${labels.address}</span>
          <span class="offer-doc__footer-value--${id.replace(/\./g, '-')}">\${companyAddress.value}</span>
          <span class="offer-doc__footer-label--${id.replace(/\./g, '-')}" style="margin-top: 0.75rem;">\${labels.taxId}</span>
          <span class="offer-doc__footer-value--${id.replace(/\./g, '-')}">\${companyTaxId.value}</span>
        </div>
      </div>
    </footer>
  \`;
}

export function renderBody(ctx: RenderCtx): string {
  const safeCtx = buildHeaderFooterCtx(ctx);
  const slimHeader = renderSlimHeader(safeCtx);
  const slimFooter = renderSlimFooter(safeCtx);
  const header = partialHeader(ctx);
  const sections = partialSections(ctx);
  const priceTable = partialPriceTable(ctx);
  const footer = partialFooter(ctx);

  const content = [slimHeader, slimFooter, header, sections, priceTable, footer]
    .filter(Boolean)
    .join('\\n');

  const html = \`
    <main class="offer-template offer-template--${id.replace(/\./g, '-')}">
      <article class="offer-doc offer-doc--${id.replace(/\./g, '-')}">
\${content}
      </article>
    </main>
  \`;
  ensureSafeHtml(html, '${id} template body');
  return html;
}
`;

fs.writeFileSync(path.join(baseDir, 'partials/body.ts'), bodyContent, 'utf8');

// Generate index.ts
const indexContent = `import type { OfferTemplate } from '../types';
${legacyId ? `import type { OfferTemplateId as LegacyOfferTemplateId } from '@/app/lib/offerTemplates';` : ''}

import { renderBody } from './partials/body';
import { renderHead } from './partials/head';
import { pdfStyles, templateStyles } from './styles.css';
import { ${id.replace(/\./g, '_')}Tokens } from './tokens';

export const ${id.replace(/\./g, '_')}Template${legacyId ? ': OfferTemplate & { legacyId: LegacyOfferTemplateId }' : ': OfferTemplate'} = {
  id: '${templateId}',
  ${legacyId ? `legacyId: '${legacyId}',` : ''}
  tier: '${tier}',
  label: '${name}',
  version: '1.0.0',
  ${tier === 'premium' ? `marketingHighlight: 'Professional ${name} template for premium offers.',` : ''}
  styles: {
    print: pdfStyles,
    template: templateStyles,
  },
  tokens: ${id.replace(/\./g, '_')}Tokens,
  capabilities: {
    'branding.logo': ${tier === 'premium' ? 'true' : 'false'},
    'branding.colors': true,
    'pricing.table': true,
  },
  renderHead,
  renderBody,
};
`;

fs.writeFileSync(path.join(baseDir, 'index.ts'), indexContent, 'utf8');

console.log(`\n✅ Created template "${name}" (${templateId})`);
console.log(`📁 Location: ${baseDir}`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Customize tokens.ts with your design tokens`);
console.log(`   2. Update styles.css.ts with your template styles`);
console.log(`   3. Implement renderHead() in partials/head.ts`);
console.log(`   4. Implement renderBody() in partials/body.ts`);
console.log(`   5. Register template in engineRegistry.ts:`);
console.log(`      import { ${id.replace(/\./g, '_')}Template } from './${tier}.${id}';`);
console.log(`      registerTemplate(${id.replace(/\./g, '_')}Template);`);
console.log(`\n💡 See docs/templates.md for detailed instructions.\n`);
