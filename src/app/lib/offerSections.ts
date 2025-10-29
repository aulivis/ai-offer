import { sanitizeInput } from '@/lib/sanitize';

const SECTION_ICON_SIZE = 16;

const ICON_BASE =
  `width="${SECTION_ICON_SIZE}" height="${SECTION_ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"` as const;

const overviewIcon = `<svg ${ICON_BASE}><path d="M5 6h14"/><path d="M5 12h8"/><path d="M5 18h6"/><circle cx="17" cy="12" r="3"/></svg>`;
const scopeIcon = `<svg ${ICON_BASE}><path d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M10 10h4v4h-4z"/></svg>`;
const deliverablesIcon = `<svg ${ICON_BASE}><path d="M5 6h5"/><path d="M5 12h5"/><path d="M5 18h5"/><path d="M14.5 5.5 19 10l-4.5 4.5"/></svg>`;
const timelineIcon = `<svg ${ICON_BASE}><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2.5"/></svg>`;
const assumptionsIcon = `<svg ${ICON_BASE}><path d="M12 3 4 7v5c0 5 4 7.5 8 9 4-1.5 8-4 8-9V7Z"/><path d="M12 11v4"/><circle cx="12" cy="8" r="1"/></svg>`;
const nextStepsIcon = `<svg ${ICON_BASE}><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/><circle cx="12" cy="12" r="9"/></svg>`;
const pricingIcon = `<svg ${ICON_BASE}><path d="M7 7h10l4 5-4 5H7l-4-5z"/><path d="M12 9v6"/><path d="M10 11h4"/></svg>`;
const galleryIcon = `<svg ${ICON_BASE}><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="9" cy="12" r="1.5"/><path d="M3 16l4.5-4.5 4 4 2.5-2.5L21 18"/></svg>`;

export const SECTION_ICONS = {
  overview: overviewIcon,
  scope: scopeIcon,
  deliverables: deliverablesIcon,
  timeline: timelineIcon,
  assumptions: assumptionsIcon,
  nextSteps: nextStepsIcon,
  pricing: pricingIcon,
  gallery: galleryIcon,
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
  return `<${level} class="offer-doc__section-title${extraClass}" data-offer-section="${section}"><span class="offer-doc__section-icon" aria-hidden="true">${icon}</span><span>${safeTitle}</span></${level}>`;
}
