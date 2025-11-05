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

// Generate styles.css.ts
const stylesContent = `import { PRINT_BASE_CSS } from '../print.css';

export const pdfStyles = PRINT_BASE_CSS;

export const templateStyles = \`
  /* Add your template-specific styles here */
  .offer-doc {
    /* Custom styles */
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

// Generate partials/body.ts
const bodyContent = `import { sanitizeInput } from '@/lib/sanitize';

import type { RenderCtx } from '../types';

export function renderBody(ctx: RenderCtx): string {
  const safeTitle = sanitizeInput(
    ctx.offer.title || ctx.i18n.t('pdf.templates.common.defaultTitle'),
  );
  const safeCompany = sanitizeInput(ctx.offer.companyName || '');

  return \`
    <div class="offer-doc">
      <div class="offer-doc__header">
        <h1>\${safeTitle}</h1>
        \${safeCompany ? \`<p>\${safeCompany}</p>\` : ''}
      </div>
      <div class="offer-doc__content">
        <!-- Add your template body content here -->
      </div>
    </div>
  \`;
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
