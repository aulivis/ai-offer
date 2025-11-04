# Template Author Handbook

This guide walks new template authors through the core concepts, file layout, and release process for shipping an Offer template. Follow it end-to-end and you should be able to publish a compliant template in under an hour.

## Engine concepts

### OfferTemplate contract
Templates export an `OfferTemplate` object from their `index.ts`. The object declares:

- `id`: A unique identifier in the form `name@semver` (for example `premium.elegant@1.1.0`).
- `tier`: Either `free` or `premium`, which gates template visibility by customer plan.
- `label`, `marketingHighlight`, and optional `capabilities` flags used by the app for selection UI.
- `tokens`: A `ThemeTokens` record describing colors, typography, spacing, and radii consumed by the renderer.
- `renderHead(ctx)` and `renderBody(ctx)`: Functions that receive a `RenderCtx` and return HTML strings for the `<head>` and `<main>` of the PDF document respectively.

See [`src/app/pdf/templates/types.ts`](../src/app/pdf/templates/types.ts) for the full interface.

### RenderCtx
`RenderCtx` is the context object passed into `renderHead` and `renderBody`. It contains:

- `offer`: Metadata about the offer (title, company name, template id, and optional locale/legacy id).
- `rows`: An array of price rows ready to display.
- `branding`: Optional logo/color overrides selected by the customer.
- `i18n`: A typed translator, so you can localize labels via `ctx.i18n('key.path')`.
- `tokens`: The same theme token object declared on the template, already merged with user branding overrides when available.
- `images`: Up to three image assets (key, src, alt) that the customer attached to the offer. Use them to build optional galleries
  without mutating the main body HTML.

Because the renderer runs in a server context, avoid browser-only APIs and rely on the data passed in through `RenderCtx`.

### Tokens and theming
`tokens` is a strictly typed theme contract that keeps typography and colors consistent across templates. Define your token palette in `tokens.ts` and import it into `index.ts`. Stick to semantic names—`tokens.color.primary` drives CTA elements, `tokens.typography.h1` styles main headings, etc. Avoid hard-coding colors or fonts inside partials; use the token values instead.

### Internationalization helpers
All customer-facing strings must come from `ctx.i18n`. Existing copy keys cover headings like "Pricing" and "Next steps". If you need a new key, add it to the copy catalog before shipping. Do not inline English strings in templates, or they will fail localization QA.

## PDF markup audit

When we reviewed the legacy `partialHeader`, `partialSections`, and `partialPriceTable` implementations we found a few recurring layout issues:

- **Unstructured sections.** The body renderer simply injected raw HTML into `.offer-doc__content`, so headings, cards, and spacing varied wildly between templates and were hard to restyle in CSS.【F:docs/templates.md†L69-L74】
- **Metadata without semantics.** Header metadata relied on anonymous `<div>`/`<span>` pairs (`.offer-doc__meta`), which made it difficult to align labels, apply placeholder styling, or translate to assistive technologies.【F:docs/templates.md†L75-L78】
- **Pricing tables as monoliths.** All pricing layout lived in an inline `<style>` block and the markup could not express zebra striping, currency totals, or contextual notes without custom rewrites per template.【F:docs/templates.md†L79-L82】

These gaps drove the refactor below: we now wrap each major block in semantic `.section-card` containers, expose reusable `.key-metrics` and `.pricing-table` primitives, and move presentation into shared CSS utilities so templates stay consistent.

## Folder conventions

Each template lives in `src/app/pdf/templates/<template-name>/` and must follow this structure:

```
<template-name>/
├── index.ts          # exports the OfferTemplate object
├── tokens.ts         # defines the ThemeTokens for the template
├── styles.css.ts     # optional CSS-in-TypeScript helpers shared across partials
├── partials/
│   ├── head.ts       # renderHead implementation
│   └── body.ts       # renderBody implementation
└── assets/           # optional static assets (SVGs, images, etc.) served by the renderer
```

- Keep all rendering logic inside `partials/`. `index.ts` should only wire up tokens, metadata, and the partial exports.
- Store reusable markup fragments in additional files under `partials/` if the body grows large.
- Put any binary assets (logos, background textures) under `assets/` and import them via `new URL('./assets/foo.svg', import.meta.url)` so bundlers can track them.
- Expose any shared CSS primitives through `styles.css.ts`, using vanilla-extract or string helpers as needed.

## Versioning and lifecycle

### Naming and semantic versioning
Template IDs must follow `package-name@semver` so the renderer can resolve and compare versions. Increment the semver when you make visual or behavioral changes:

- **Patch** (`1.0.1`): Minor spacing tweaks, copy fixes, or asset optimization.
- **Minor** (`1.1.0`): New optional sections, additional capabilities flags, or token updates.
- **Major** (`2.0.0`): Breaking layout changes or required data changes.

Update both the `id` and `version` fields in `index.ts` when bumping.

### Plan tiers
Set `tier` to `free` for templates available on the free plan, or `premium` for paid tiers. Premium templates must provide a compelling `marketingHighlight` string to display in upsell modals. Free templates should avoid premium-only capabilities (for example, advanced branding options) unless explicitly approved.

### Testing and linting
Every template must pass the repository lint rules and golden tests:

1. `npm run lint` to ensure code style and template exports conform.
2. `npm run test:templates` to render templates against golden snapshots.
3. Optionally `npm run test` to run the full suite before submitting a PR.

If golden tests fail, update the snapshots intentionally (`npx vitest -u src/app/pdf/templates/__tests__/golden.test.ts`) and double-check the rendered HTML before committing.

## Add a new template in 10 steps

1. **Clone the repo & install deps** – `npm install` if you have not already.
2. **Copy the starter folder** – Duplicate `src/app/pdf/templates/free.base/` to a new folder named after your template (e.g. `premium.skyline`).
3. **Rename identifiers** – Update the exported constant, `id`, `label`, and `marketingHighlight` in the new `index.ts`.
4. **Set tokens** – Tailor `tokens.ts` to your palette, fonts, and spacing. Reference existing templates for guidance.
5. **Build the head partial** – Edit `partials/head.ts` to include fonts, CSS variables, and meta tags your layout requires.
6. **Compose the body partial** – Implement `renderBody` using `ctx.offer`, `ctx.rows`, `ctx.tokens`, and `ctx.i18n` for localized copy.
7. **Wire optional assets** – Add any supporting images or SVGs under `assets/` and import them from your partials.
8. **Declare capabilities** – Set the `capabilities` map in `index.ts` (e.g. `'branding.logo': true`) so the app can toggle features correctly.
9. **Verify plan tier** – Confirm `tier` matches the go-to-market plan and add a `marketingHighlight` for premium offerings.
10. **Run quality checks** – Execute `npm run lint` and `npm run test:templates`, review diffs, and submit your PR.

Following these steps keeps templates consistent with the rendering engine, meets localization requirements, and ensures QA can approve your work quickly.
