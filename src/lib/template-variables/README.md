# Template Variables System

A Shopify-style dynamic template variable system for the AI offer generation platform.

## Overview

This system enables dynamic data binding in templates using variable syntax like `{{ user.company_name }}` and `{{ ai.deliverables }}`.

## Quick Start

### 1. Build Variable Registry

```typescript
import { buildVariableRegistry } from '@/lib/template-variables';

const registry = buildVariableRegistry({
  userProfile: {
    company_name: 'My Company',
    email: 'user@example.com',
    brand_color_primary: '#1c274c',
  },
  offer: {
    title: 'Website Development Offer',
    issue_date: '2025-11-15',
    locale: 'hu',
    template_id: 'premium.executive',
    schedule: ['Phase 1: Design (2 weeks)', 'Phase 2: Development (4 weeks)'],
    testimonials: ['Great service!', 'Highly recommended.'],
    guarantees: ['30-day money-back guarantee'],
  },
  aiBlocks: {
    introduction: 'Thank you for your interest...',
    project_summary: 'We propose to develop...',
    scope: ['Frontend development', 'Backend API', 'Database design'],
    deliverables: ['Responsive website', 'Admin panel', 'Documentation'],
    assumptions: ['Client provides content', 'Hosting arranged separately'],
    next_steps: ['Review and approve proposal', 'Sign contract'],
    closing: 'We look forward to working with you.',
  },
  pricingRows: [{ name: 'Development', qty: 40, unit: 'hours', unitPrice: 15000, vat: 27 }],
  locale: 'hu',
});
```

### 2. Create Resolver and Parser

```typescript
import { VariableResolver, TemplateParser } from '@/lib/template-variables';

const resolver = new VariableResolver(registry);
const parser = new TemplateParser(resolver);
```

### 3. Render Template

```typescript
const template = `
  <h1>{{ offer.title }}</h1>
  <p>Company: {{ user.company_name }}</p>
  <p>Date: {{ offer.issue_date | date: %Y-%m-%d }}</p>
  <p>Total: {{ pricing.total | money: HUF }}</p>
  
  <h2>Deliverables</h2>
  <ul>
    {% for item in ai.deliverables %}
      <li>{{ item }}</li>
    {% endfor %}
  </ul>
`;

const rendered = parser.render(template);
```

## Available Variables

### User Data

- `{{ user.company_name }}`
- `{{ user.email }}`
- `{{ user.brand_color_primary }}`
- `{{ user.brand_color_secondary }}`
- `{{ user.brand_logo_url }}`

### Offer Data

- `{{ offer.title }}`
- `{{ offer.issue_date }}`
- `{{ offer.locale }}`
- `{{ offer.schedule }}` (array)
- `{{ offer.testimonials }}` (array)
- `{{ offer.guarantees }}` (array)

### AI Content

- `{{ ai.introduction }}`
- `{{ ai.project_summary }}`
- `{{ ai.value_proposition }}`
- `{{ ai.scope }}` (array)
- `{{ ai.deliverables }}` (array)
- `{{ ai.expected_outcomes }}` (array)
- `{{ ai.assumptions }}` (array)
- `{{ ai.next_steps }}` (array)
- `{{ ai.closing }}`
- `{{ ai.client_context }}`

### Pricing

- `{{ pricing.rows }}` (array)
- `{{ pricing.total }}`
- `{{ pricing.subtotal }}`
- `{{ pricing.vat_total }}`
- `{{ pricing.currency }}`

### Branding

- `{{ branding.logo_url }}`
- `{{ branding.primary_color }}`
- `{{ branding.secondary_color }}`
- `{{ branding.monogram }}`

### Metadata

- `{{ meta.current_date }}`
- `{{ meta.current_year }}`
- `{{ meta.locale }}`
- `{{ meta.language }}`

## Filters

### Date Formatting

```typescript
{{ offer.issue_date | date: %Y-%m-%d }}
{{ meta.current_date | date: %Y-%m-%d }}
```

### Money Formatting

```typescript
{{ pricing.total | money: HUF }}
{{ pricing.total | money: EUR }}
```

### String Manipulation

```typescript
{{ user.company_name | capitalize }}
{{ user.company_name | upcase }}
{{ ai.introduction | truncate: 100 }}
```

### Array Operations

```typescript
{{ ai.deliverables | join: ", " }}
{{ ai.deliverables | first }}
{{ ai.deliverables | last }}
{{ ai.deliverables | size }}
```

## Type Safety

All variables are type-checked and validated:

```typescript
import type { VariableRegistry } from '@/lib/template-variables';

// TypeScript will enforce correct variable paths
const value = resolver.resolve('user.company_name'); // ✅
const invalid = resolver.resolve('user.invalid'); // ⚠️ Warning logged
```

## Validation

Variables are automatically validated and sanitized:

- **Type validation**: Ensures values match expected types
- **Sanitization**: HTML escaping for strings
- **Default values**: Fallback values for missing variables
- **Error handling**: Graceful degradation on errors

## Performance

- **Caching**: Resolved variables are cached (1 second TTL)
- **Lazy evaluation**: Variables only resolved when used
- **Efficient parsing**: Regex-based template parsing

## Security

- **Input sanitization**: All user inputs are sanitized
- **Path validation**: Variable paths are validated
- **XSS prevention**: HTML escaping by default
- **Type checking**: Runtime type validation

## Examples

See the implementation guide for more examples and best practices.
