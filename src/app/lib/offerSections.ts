import { sanitizeInput } from '@/lib/sanitize';

const SECTION_ICON_SIZE = 16;

const ICON_BASE =
  `width="${SECTION_ICON_SIZE}" height="${SECTION_ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"` as const;

const overviewIcon = `<svg ${ICON_BASE}><path d="M5 6h14"/><path d="M5 12h8"/><path d="M5 18h6"/><circle cx="17" cy="12" r="3"/></svg>`;
const valuePropositionIcon = `<svg ${ICON_BASE}><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`;
const scopeIcon = `<svg ${ICON_BASE}><path d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M10 10h4v4h-4z"/></svg>`;
const deliverablesIcon = `<svg ${ICON_BASE}><path d="M5 6h5"/><path d="M5 12h5"/><path d="M5 18h5"/><path d="M14.5 5.5 19 10l-4.5 4.5"/></svg>`;
const expectedOutcomesIcon = `<svg ${ICON_BASE}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
const timelineIcon = `<svg ${ICON_BASE}><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2.5"/></svg>`;
const assumptionsIcon = `<svg ${ICON_BASE}><path d="M12 3 4 7v5c0 5 4 7.5 8 9 4-1.5 8-4 8-9V7Z"/><path d="M12 11v4"/><circle cx="12" cy="8" r="1"/></svg>`;
const nextStepsIcon = `<svg ${ICON_BASE}><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/><circle cx="12" cy="12" r="9"/></svg>`;
const testimonialsIcon = `<svg ${ICON_BASE}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const guaranteesIcon = `<svg ${ICON_BASE}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`;
const pricingIcon = `<svg ${ICON_BASE}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4M8 18h8"/><circle cx="12" cy="14" r="1"/></svg>`;
const galleryIcon = `<svg ${ICON_BASE}><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="9" cy="12" r="1.5"/><path d="M3 16l4.5-4.5 4 4 2.5-2.5L21 18"/></svg>`;
const referencePhotosIcon = `<svg ${ICON_BASE}><rect x="3" y="5" width="7" height="7" rx="1"/><rect x="14" y="5" width="7" height="7" rx="1"/><rect x="3" y="15" width="7" height="4" rx="1"/><rect x="14" y="15" width="7" height="4" rx="1"/><circle cx="6.5" cy="8.5" r="1"/><path d="m3 11 2.5-2.5 2 2"/></svg>`;

export const SECTION_ICONS = {
  overview: overviewIcon,
  valueProposition: valuePropositionIcon,
  scope: scopeIcon,
  deliverables: deliverablesIcon,
  expectedOutcomes: expectedOutcomesIcon,
  timeline: timelineIcon,
  assumptions: assumptionsIcon,
  nextSteps: nextStepsIcon,
  testimonials: testimonialsIcon,
  guarantees: guaranteesIcon,
  pricing: pricingIcon,
  gallery: galleryIcon,
  referencePhotos: referencePhotosIcon,
} as const;

export type OfferSectionId = keyof typeof SECTION_ICONS;

interface HeadingOptions {
  level?: 'h2' | 'h3';
  className?: string;
}

export function renderSectionHeading(
  title: string,
  section: OfferSectionId,
  options: HeadingOptions = {},
): string {
  const safeTitle = sanitizeInput(title);
  const icon = SECTION_ICONS[section];
  const level = options.level ?? 'h2';
  const extraClass = options.className ? ` ${options.className}` : '';
  const headingClass = `offer-doc__section-title section-heading${extraClass}`;
  return `<${level} class="${headingClass}" data-offer-section="${section}"><span class="offer-doc__section-icon section-heading__icon" aria-hidden="true">${icon}</span><span class="section-heading__label">${safeTitle}</span></${level}>`;
}
