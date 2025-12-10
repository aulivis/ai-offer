/**
 * Welcome Line Generator
 *
 * Generates the greeting/welcome line based on customer name and formality
 * This is a separate block from the AI-generated introduction
 */

import { sanitizeInput } from '@/lib/sanitize';

export type Formality = 'tegeződés' | 'magázódás';
export type Tone = 'friendly' | 'formal';

/**
 * Generate welcome line based on customer name, formality, and tone
 *
 * @param customerName - Customer name or company name
 * @param formality - Formality level (tegeződés or magázódás)
 * @param tone - Tone (friendly or formal)
 * @returns Welcome line HTML
 */
export function generateWelcomeLine(
  customerName: string | null | undefined,
  formality: Formality,
  tone: Tone,
): string {
  const safeName = customerName ? sanitizeInput(customerName.trim()) : null;

  // If no name, use generic greeting
  if (!safeName || safeName.length === 0) {
    if (formality === 'magázódás') {
      return tone === 'formal'
        ? '<p class="welcome-line">Tisztelt Ügyfelünk!</p>'
        : '<p class="welcome-line">Kedves Ügyfelünk!</p>';
    } else {
      return tone === 'formal'
        ? '<p class="welcome-line">Kedves Ügyfelünk!</p>'
        : '<p class="welcome-line">Szia!</p>';
    }
  }

  // Determine if it's a company name (contains Kft, Zrt, Bt, etc.) or person name
  const isCompanyName = /(Kft|Zrt|Bt|Kkt|Nyrt|Kv|EV|Kft\.|Zrt\.|Bt\.|Kkt\.|Nyrt\.|Kv\.|EV\.)/i.test(
    safeName,
  );

  if (isCompanyName) {
    // Company name
    if (formality === 'magázódás') {
      return tone === 'formal'
        ? `<p class="welcome-line">Tisztelt ${safeName}!</p>`
        : `<p class="welcome-line">Kedves ${safeName}!</p>`;
    } else {
      return tone === 'formal'
        ? `<p class="welcome-line">Kedves ${safeName}!</p>`
        : `<p class="welcome-line">Szia ${safeName}!</p>`;
    }
  } else {
    // Person name - try to extract first name or use full name
    const nameParts = safeName.split(/\s+/);
    const firstName = nameParts[0] || safeName;
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;

    if (formality === 'magázódás') {
      if (lastName) {
        return tone === 'formal'
          ? `<p class="welcome-line">Tisztelt ${lastName} ${firstName.includes('Úr') || firstName.includes('Asszony') || firstName.includes('Kisasszony') ? '' : 'Úr'}!</p>`
          : `<p class="welcome-line">Kedves ${lastName} ${firstName.includes('Úr') || firstName.includes('Asszony') || firstName.includes('Kisasszony') ? '' : 'Úr'}!</p>`;
      } else {
        return tone === 'formal'
          ? `<p class="welcome-line">Tisztelt ${firstName}!</p>`
          : `<p class="welcome-line">Kedves ${firstName}!</p>`;
      }
    } else {
      return tone === 'formal'
        ? `<p class="welcome-line">Kedves ${firstName}!</p>`
        : `<p class="welcome-line">Szia ${firstName}!</p>`;
    }
  }
}

