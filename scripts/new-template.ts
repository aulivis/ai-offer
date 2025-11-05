#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';

const name = process.argv.slice(2).join(' ').trim();
if (!name) {
  console.error('Usage: pnpm template:new "<Template Name>"');
  process.exit(1);
}

const id = name
  .toLowerCase()
  .replace(/\s+/g, '.')
  .replace(/[^a-z0-9\.]/g, '');
const baseDir = path.join(process.cwd(), 'src/app/pdf/templates', id);
fs.mkdirSync(path.join(baseDir, 'partials'), { recursive: true });

const index = `
import type { OfferTemplate, RenderContext } from '@/app/pdf/sdk/types';

export const Template_${id.replace(/\./g, '_')}: OfferTemplate = {
  id: '${id}',
  name: '${name}',
  version: '1.0.0',
  renderHead(ctx: RenderContext) {
    return \`<header class="doc-header">
    \${ctx.slots.brand.logoUrl ? \`<img class="brand-logo" src="\${ctx.slots.brand.logoUrl}" alt="\${ctx.slots.brand.name}" />\` : \`<div class="brand-fallback">\${ctx.slots.brand.name}</div>\`}
    <div class="doc-meta">
      <h1>\${ctx.slots.doc.title}</h1>
      \${ctx.slots.doc.subtitle ? \`<p>\${ctx.slots.doc.subtitle}</p>\` : ''}
      <span>\${ctx.slots.doc.date}</span>
    </div>
  </header>\`;
  },
  renderBody(ctx: RenderContext) {
    return \`<main>
    <section class="section card"><table class="table">
      <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
      <tbody>\${ctx.slots.items.map(i => \`<tr><td>\${i.name}</td><td>\${i.qty}</td><td>\${i.unitPrice.toFixed(2)}</td><td>\${i.total.toFixed(2)}</td></tr>\`).join('')}</tbody>
    </table></section>
    <section class="section card" style="margin-top:12px"><strong>Total: \${ctx.slots.totals.gross.toFixed(2)} \${ctx.slots.totals.currency}</strong></section>
    \${ctx.slots.notes ? \`<section class="section" style="margin-top:12px">\${ctx.slots.notes}</section>\` : ''}
  </main>\`;
  },
};
`.trim();

fs.writeFileSync(path.join(baseDir, 'index.ts'), `${index}\n`, 'utf8');

console.log(`Created template ${id} at ${baseDir}. Remember to add it to registry.ts.`);
