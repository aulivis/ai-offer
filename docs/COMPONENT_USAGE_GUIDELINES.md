# Component Usage Guidelines

This document provides guidelines for using components from the UI component library. It includes best practices, examples, and common patterns.

## Table of Contents

1. [Button Component](#button-component)
2. [Input Component](#input-component)
3. [Select Component](#select-component)
4. [Card Component](#card-component)
5. [Modal Component](#modal-component)
6. [Heading Component](#heading-component)
7. [Link Component](#link-component)
8. [Loading States](#loading-states)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Design Tokens](#design-tokens)

## Button Component

### Basic Usage

```tsx
import { Button } from '@/components/ui/Button';

// Primary button
<Button variant="primary" size="md">
  Submit
</Button>

// Secondary button
<Button variant="secondary" size="sm">
  Cancel
</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>

// Ghost button
<Button variant="ghost" onClick={handleCancel}>
  Cancel
</Button>
```

### With Loading State

```tsx
<Button variant="primary" loading={isSubmitting} onClick={handleSubmit}>
  Submit
</Button>
```

### Sizes

- `sm`: Small button (44x44px minimum for accessibility)
- `md`: Medium button (default, 44x44px minimum)
- `lg`: Large button (48px minimum, for primary CTAs)

### Variants

- `primary`: Primary action button (default)
- `secondary`: Secondary action button
- `ghost`: Minimal button with no background
- `danger`: Destructive action button

### Best Practices

- Use `primary` for the main action on a page
- Use `secondary` for alternative actions
- Use `danger` for destructive actions (delete, remove)
- Always provide loading state for async actions
- Ensure buttons meet minimum touch target size (44x44px)

## Input Component

### Basic Usage

```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>;
```

### With Error State

```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  help="We'll never share your email"
/>
```

### With Loading State

```tsx
<Input
  label="Search"
  type="text"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  loading={isSearching}
  placeholder="Search..."
/>
```

### Props

- `label`: Label text (optional)
- `error`: Error message (optional)
- `help`: Help text (optional)
- `loading`: Show loading spinner (optional)
- `required`: Mark as required (optional)
- All standard HTML input props are supported

### Best Practices

- Always provide a label for accessibility
- Use `help` prop for additional context
- Show errors with the `error` prop
- Use loading state when fetching data (e.g., autocomplete)

## Select Component

### Basic Usage

```tsx
import { Select } from '@/components/ui/Select';

<Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)}>
  <option value="">Select a country</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</Select>;
```

### With Error State

```tsx
<Select
  label="Country"
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  error={errors.country}
  help="Select your country"
>
  <option value="">Select...</option>
  <option value="us">United States</option>
</Select>
```

### With Loading State

```tsx
<Select
  label="Country"
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  loading={isLoadingCountries}
>
  <option value="">Loading...</option>
  {countries.map((country) => (
    <option key={country.id} value={country.id}>
      {country.name}
    </option>
  ))}
</Select>
```

### Best Practices

- Always provide a label
- Include a placeholder option (empty value)
- Show loading state when fetching options
- Use help text for additional context

## Card Component

### Basic Usage

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

<Card size="md" variant="default">
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>Card content goes here</CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

### Sizes

- `sm`: Small card (p-4, rounded-xl)
- `md`: Medium card (default, p-6, rounded-2xl)
- `lg`: Large card (p-8, rounded-3xl)

### Variants

- `default`: Standard card with border and shadow
- `elevated`: Elevated card with stronger shadow
- `outlined`: Outlined card with no background
- `flat`: Flat card with no shadow or border

### Compound Components

```tsx
// Using compound components
<Card>
  <CardHeader>
    <h3>Title</h3>
    <p className="text-sm text-fg-muted">Subtitle</p>
  </CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>
    <Button variant="primary">Save</Button>
    <Button variant="secondary">Cancel</Button>
  </CardFooter>
</Card>
```

### Best Practices

- Use `CardHeader` for titles and metadata
- Use `CardBody` for main content
- Use `CardFooter` for actions
- Choose appropriate size and variant based on context
- Use `elevated` variant for important cards

## Modal Component

### Basic Usage

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

const [isOpen, setIsOpen] = useState(false);

<Modal open={isOpen} onClose={() => setIsOpen(false)} size="lg">
  <ModalHeader>
    <h2>Modal Title</h2>
  </ModalHeader>
  <ModalBody>Modal content goes here</ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSave}>
      Save
    </Button>
  </ModalFooter>
</Modal>;
```

### Sizes

- `sm`: Small modal (max-w-md)
- `md`: Medium modal (default, max-w-lg)
- `lg`: Large modal (max-w-2xl)
- `xl`: Extra large modal (max-w-4xl)
- `full`: Full width modal (max-w-full)

### Props

- `open`: Whether modal is open
- `onClose`: Callback when modal should close
- `size`: Modal size (optional, default: 'md')
- `showCloseButton`: Show close button (optional, default: true)
- `preventBodyScroll`: Prevent body scroll when open (optional, default: true)
- `labelledBy`: ID of element that labels the modal (optional)
- `describedBy`: ID of element that describes the modal (optional)

### Compound Components

```tsx
<Modal open={isOpen} onClose={handleClose} size="lg">
  <ModalHeader>
    <h2 id="modal-title">Confirm Action</h2>
    <p className="text-sm text-fg-muted">This action cannot be undone</p>
  </ModalHeader>
  <ModalBody>
    <p>Are you sure you want to proceed?</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={handleClose}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

### Best Practices

- Always provide a title in `ModalHeader`
- Use appropriate size for content
- Include close button for user-friendly UX
- Use `labelledBy` and `describedBy` for accessibility
- Prevent body scroll to avoid layout shifts

## Heading Component

### Basic Usage

```tsx
import { Heading, H1, H2, H3 } from '@/components/ui/Heading';

// Using convenience components
<H1>Page Title</H1>
<H2>Section Title</H2>
<H3>Subsection Title</H3>

// Using Heading component with custom styling
<Heading level="h2" size="h1">
  Large Section Title
</Heading>
```

### Props

- `level`: HTML heading level (h1-h6)
- `size`: Visual size (display, h1-h6)
- `scale`: Typography scale key (overrides level/size)

### Best Practices

- Use semantic heading levels (h1-h6)
- Maintain heading hierarchy (h1 → h2 → h3)
- Use `size` prop to adjust visual size without changing semantics
- Only one h1 per page

## Link Component

### Basic Usage

```tsx
import { Link } from '@/components/ui/Link';

// Internal link
<Link href="/dashboard" variant="primary">
  Go to Dashboard
</Link>

// External link
<Link href="https://example.com" external>
  Visit Example
</Link>

// With loading state
<Link href="/dashboard" loading={isNavigating}>
  Loading...
</Link>
```

### Variants

- `default`: Default link style
- `primary`: Primary link style
- `muted`: Muted link style
- `underline`: Underlined link style

### Sizes

- `sm`: Small link (text-sm)
- `md`: Medium link (default, text-base)
- `lg`: Large link (text-lg)

### Best Practices

- Use `external` prop for external links
- Use loading state during navigation
- Choose appropriate variant based on context
- Use `primary` variant for important links

## Loading States

### Button Loading State

```tsx
<Button loading={isSubmitting} onClick={handleSubmit}>
  Submit
</Button>
```

### Input Loading State

```tsx
<Input
  label="Search"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  loading={isSearching}
/>
```

### Select Loading State

```tsx
<Select
  label="Country"
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  loading={isLoadingCountries}
>
  <option value="">Loading...</option>
</Select>
```

### Link Loading State

```tsx
<Link href="/dashboard" loading={isNavigating}>
  Go to Dashboard
</Link>
```

### Best Practices

- Always show loading state for async operations
- Disable interactive elements during loading
- Provide visual feedback (spinner, disabled state)
- Use `aria-busy` attribute (automatically handled by components)

## Accessibility Guidelines

### ARIA Attributes

All components include proper ARIA attributes:

- `aria-busy`: Set automatically when loading
- `aria-invalid`: Set automatically when error state
- `aria-describedby`: Links to help text and error messages
- `aria-labelledby`: Links to labels
- `aria-label`: Provided for icon-only buttons

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus management in modals and dialogs
- Escape key closes modals
- Tab key navigates through focusable elements

### Screen Readers

- Use `sr-only` class for screen reader only content
- Provide descriptive labels for all interactive elements
- Use semantic HTML elements
- Provide alternative text for images

### Best Practices

- Always provide labels for form inputs
- Use semantic HTML elements
- Test with keyboard navigation
- Test with screen readers
- Ensure sufficient color contrast (WCAG AA)

## Design Tokens

### Spacing

```tsx
import { SPACING_SCALE, getSpacing } from '@/styles/spacing';

// Use spacing values
const padding = getSpacing('md'); // '1rem'
const gap = SPACING_SCALE.lg; // '1.5rem'

// In Tailwind (aligns with spacing scale)
<div className="p-4 gap-6 mb-8">{/* p-4 = 1rem, gap-6 = 1.5rem, mb-8 = 2rem */}</div>;
```

### Typography

```tsx
import { TYPOGRAPHY_SCALE, getTypography } from '@/styles/typography';
import { Heading } from '@/components/ui/Heading';

// Use Heading component (recommended)
<Heading level="h1">Title</Heading>;

// Use typography values directly
const h1Style = getTypography('h1');
```

### Animations

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getAnimationDuration } from '@/styles/animations';

function MyComponent() {
  const reducedMotion = useReducedMotion();
  const duration = getAnimationDuration('smooth', true);

  return <div style={{ transitionDuration: `${duration}ms` }}>Content</div>;
}
```

## Common Patterns

### Form with Validation

```tsx
function MyForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        help="We'll never share your email"
        required
      />
      <Button type="submit" loading={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
```

### Modal with Form

```tsx
function EditModal({ open, onClose, item }) {
  const [formData, setFormData] = useState(item);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader>
        <h2>Edit Item</h2>
      </ModalHeader>
      <ModalBody>
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" loading={isSaving} onClick={handleSave}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

### Card with Actions

```tsx
<Card size="md" variant="elevated">
  <CardHeader>
    <h3>Card Title</h3>
    <p className="text-sm text-fg-muted">Card subtitle</p>
  </CardHeader>
  <CardBody>
    <p>Card content</p>
  </CardBody>
  <CardFooter>
    <Button variant="primary">Primary Action</Button>
    <Button variant="secondary">Secondary Action</Button>
  </CardFooter>
</Card>
```

## Error Handling

### Form Errors

```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  help="Enter a valid email address"
/>
```

### Loading Errors

```tsx
{
  error && (
    <div className="rounded-lg border border-danger bg-danger/10 p-4">
      <p className="text-sm text-danger">{error.message}</p>
      <Button variant="secondary" size="sm" onClick={handleRetry}>
        Retry
      </Button>
    </div>
  );
}
```

## Performance Considerations

### Lazy Loading

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### Code Splitting

Components are already optimized for code splitting. Use dynamic imports for heavy components.

## Testing

### Component Testing

- Test all interactive states (loading, error, disabled)
- Test keyboard navigation
- Test accessibility with screen readers
- Test responsive behavior

### Best Practices

- Write tests for user interactions
- Test error states
- Test loading states
- Test accessibility

## Migration Guide

### Migrating from HTML Elements

**Before:**

```tsx
<button onClick={handleClick}>Click me</button>
```

**After:**

```tsx
<Button onClick={handleClick}>Click me</Button>
```

**Before:**

```tsx
<input type="text" value={value} onChange={handleChange} />
```

**After:**

```tsx
<Input type="text" value={value} onChange={handleChange} label="Label" />
```

## View Transitions API

### Overview

The application uses the View Transitions API for smooth page transitions. This provides a native browser API for animating between page states without JavaScript.

### Usage

View transitions are automatically enabled for Next.js Link navigation. For programmatic navigation, use the `useViewTransition` hook:

```tsx
import { useViewTransition } from '@/hooks/useViewTransition';
import { useRouter } from 'next/navigation';

function MyComponent() {
  const router = useRouter();
  const startTransition = useViewTransition();

  const handleNavigate = () => {
    startTransition(() => {
      router.push('/dashboard');
    });
  };

  return <button onClick={handleNavigate}>Navigate</button>;
}
```

### View Transition Names

Key elements have view transition names applied:

- `header` - Page header
- `main-content` - Main content area
- `footer` - Page footer

### Reduced Motion

View transitions automatically respect `prefers-reduced-motion` and are disabled for users who prefer reduced motion.

## Container Queries

### Overview

Container queries allow components to respond to their container's size rather than the viewport size, enabling more flexible responsive design.

### Usage

Use the `Container` component to create a container context:

```tsx
import { Container } from '@/components/ui/Container';

<Container type="inline-size" name="card">
  <div className="container-responsive">Content that adapts to container size</div>
</Container>;
```

### Container Query Classes

Use container query classes in CSS:

```css
@container card (min-width: 400px) {
  .card-title {
    font-size: 1.25rem;
  }
}
```

### Card Component

The `Card` component automatically enables container queries:

```tsx
<Card>
  <h3 className="card-title-responsive">Title</h3>
  {/* Content adapts to card width */}
</Card>
```

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Performance Monitoring](./PERFORMANCE_MONITORING.md)

## Support

For questions or issues, please refer to:

- Component JSDoc comments
- Design tokens documentation
- Design system documentation
- Accessibility guidelines
