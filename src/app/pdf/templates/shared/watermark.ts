import { sanitizeInput } from '@/lib/sanitize';

export type WatermarkType = 'draft' | 'preview' | 'confidential' | 'custom';

export interface WatermarkOptions {
  type?: WatermarkType;
  text?: string;
  opacity?: number;
  rotation?: number;
}

/**
 * Generate watermark HTML and CSS
 */
export function renderWatermark(options: WatermarkOptions = {}): { html: string; css: string } {
  const {
    type = 'draft',
    text,
    opacity = 0.1,
    rotation = -45,
  } = options;

  const watermarkText = text || getDefaultWatermarkText(type);
  const safeText = sanitizeInput(watermarkText);

  const html = `
    <div class="offer-watermark" aria-hidden="true" role="presentation">
      ${safeText}
    </div>
  `;

  const css = `
    .offer-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(${rotation}deg);
      font-size: 4rem;
      font-weight: 700;
      color: var(--brand-primary, #1c274c);
      opacity: ${opacity};
      pointer-events: none;
      z-index: 1;
      white-space: nowrap;
      user-select: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    
    @media print {
      .offer-watermark {
        position: fixed;
        opacity: ${opacity * 0.8};
      }
    }
  `;

  return { html, css };
}

function getDefaultWatermarkText(type: WatermarkType): string {
  switch (type) {
    case 'draft':
      return 'DRAFT';
    case 'preview':
      return 'PREVIEW';
    case 'confidential':
      return 'CONFIDENTIAL';
    case 'custom':
      return '';
    default:
      return 'DRAFT';
  }
}












