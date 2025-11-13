import { sanitizeInput } from '@/lib/sanitize';
import { renderSectionHeading } from '@/app/lib/offerSections';
import { validateImageAssets } from './urlValidation';
import type { Translator } from '@/copy';
import type { TemplateImageAsset } from '../types';

/**
 * Renders a reference photos section at the end of the offer
 * Filters images by key prefix "ref-img-" to identify reference images
 */
export function renderReferencePhotos(
  images: TemplateImageAsset[] | null | undefined,
  i18n: Translator,
): string {
  if (!Array.isArray(images) || images.length === 0) {
    return '';
  }

  // Filter reference images by key prefix
  const referenceImages = images.filter((img) => img.key?.startsWith('ref-img-'));

  if (referenceImages.length === 0) {
    return '';
  }

  // Validate image URLs
  const validatedImages = validateImageAssets(referenceImages);

  if (validatedImages.length === 0) {
    return '';
  }

  const heading = renderSectionHeading(
    i18n.t('pdf.templates.sections.referencePhotos') || 'Referenciafotók',
    'referencePhotos',
  );

  const items = validatedImages
    .map((image) => {
      const safeSrc = sanitizeInput(image.src);
      const safeAlt = sanitizeInput(image.alt || 'Referenciafotó');
      const safeKey = sanitizeInput(image.key);
      return `<figure class="offer-doc__reference-photo-item"><img class="offer-doc__reference-photo-image" src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async" data-offer-reference-photo-key="${safeKey}" /></figure>`;
    })
    .join('');

  return `
    <section class="section-card section-card--reference-photos">
      <h2 class="section-card__title">${heading}</h2>
      <div class="offer-doc__reference-photos-grid">
        ${items}
      </div>
    </section>
  `;
}
