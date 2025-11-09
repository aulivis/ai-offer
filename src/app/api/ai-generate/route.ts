import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
// Use shared pricing utilities and the pluggable PDF template engine.
// Pricing calculations remain in `app/lib/pricing.ts`, while templates
// live under `app/pdf/templates`.
import { PriceRow } from '@/app/lib/pricing';
import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { listTemplates, loadTemplate } from '@/app/pdf/templates/engineRegistry';
import { normalizeBranding } from '@/app/pdf/templates/theme';
import { getBrandLogoUrl } from '@/lib/branding';
import type { OfferTemplate, TemplateId, TemplateTier } from '@/app/pdf/templates/types';
import { normalizeTemplateId, type SubscriptionPlan } from '@/app/lib/offerTemplates';
import OpenAI from 'openai';
import type { ResponseFormatTextJSONSchemaConfig } from 'openai/resources/responses/responses';
import { v4 as uuid } from 'uuid';
import { envServer } from '@/env.server';
import { ensureSafeHtml, sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { formatOfferIssueDate } from '@/lib/datetime';
import { getUserProfile } from '@/lib/services/user';
import {
  currentMonthStart,
  getDeviceUsageSnapshot,
  getUsageSnapshot,
  syncUsageCounter,
  checkQuotaWithPending,
  checkDeviceQuotaWithPending,
} from '@/lib/services/usage';
import {
  countPendingPdfJobs,
  dispatchPdfJob,
  enqueuePdfJob,
  type PdfJobInput,
} from '@/lib/queue/pdf';
import { PdfWebhookValidationError, validatePdfWebhookUrl } from '@/lib/pdfWebhook';
import { processPdfJobInline } from '@/lib/pdfInlineWorker';
import { resolveEffectivePlan, getMonthlyOfferLimit } from '@/lib/subscription';
import { t, createTranslator, resolveLocale, type Translator } from '@/copy';
import {
  recordTemplateRenderTelemetry,
  resolveTemplateRenderErrorCode,
} from '@/lib/observability/templateTelemetry';
import {
  emptyProjectDetails,
  formatProjectDetailsForPrompt,
  projectDetailFields,
  projectDetailsSchema,
  type ProjectDetails,
} from '@/lib/projectDetails';
import { allowCategory } from '../../../../lib/consent/server';
import { withAuth, type AuthenticatedNextRequest } from '../../../../middleware/auth';
import {
  checkRateLimitMiddleware,
  createRateLimitResponse,
} from '@/lib/rateLimitMiddleware';
import { RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimiting';
import { withRequestSizeLimit } from '@/lib/requestSizeLimit';
import { z } from 'zod';
import { renderSectionHeading } from '@/app/lib/offerSections';
import { createLogger } from '@/lib/logger';
import { handleValidationError, handleUnexpectedError } from '@/lib/errorHandling';

export const runtime = 'nodejs';

// These messages are now in translation files - use createTranslator() at call site

const DEFAULT_TEMPLATE_ID: TemplateId = 'free.minimal@1.0.0';

function planToTemplateTier(plan: SubscriptionPlan): TemplateTier {
  return plan === 'pro' ? 'premium' : 'free';
}


function normalizeUsageLimitError(message: string | undefined, translator?: Translator): string | null {
  if (!message) return null;
  const normalized = message.toLowerCase();

  if (normalized.includes('eszközön elérted a havi ajánlatlimitálást')) {
    return translator?.t('quotaWarningBar.message.device') ?? 'Elérted az eszközön a havi ajánlatlimitálást. Frissíts előfizetésedet, hogy továbbra is készíthess ajánlatokat.';
  }

  if (normalized.includes('havi ajánlatlimitálás')) {
    return translator?.t('quotaWarningBar.message.user') ?? 'Elérted a havi ajánlatlimitálást. Frissíts előfizetésedet, hogy továbbra is készíthess ajánlatokat.';
  }

  return null;
}

const FALLBACK_CUSTOMER_NAME = 'Ismeretlen ugyfel';
const FALLBACK_TITLE = 'Ajanlat';
const MAX_FILENAME_PART_LENGTH = 80;

function sanitizeFileNamePart(value: string | null | undefined, fallback: string): string {
  const base = typeof value === 'string' ? value : '';
  const normalise = (input: string) =>
    input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 _-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const sanitizedFallback = normalise(fallback) || FALLBACK_TITLE;
  const sanitized = normalise(base);
  const candidate = sanitized || sanitizedFallback;
  return candidate.slice(0, MAX_FILENAME_PART_LENGTH);
}

function createOfferStoragePath(params: {
  userId: string;
  offerId: string;
  customerName?: string | null;
  offerTitle?: string | null;
  fallbackCompany?: string | null;
  date?: Date;
}): string {
  const { userId, offerId, customerName, offerTitle, fallbackCompany, date } = params;
  const issuedAt = (date ?? new Date()).toISOString().slice(0, 10);
  const customerPart = sanitizeFileNamePart(
    customerName ?? fallbackCompany ?? FALLBACK_CUSTOMER_NAME,
    FALLBACK_CUSTOMER_NAME,
  );
  const titlePart = sanitizeFileNamePart(offerTitle ?? FALLBACK_TITLE, FALLBACK_TITLE);
  const fileName = `${customerPart} - ${titlePart} - ${issuedAt}.pdf`;
  return `${userId}/${offerId}/${fileName}`;
}

// System prompt for our OpenAI assistant.  The model should populate the
// JSON schema defined below using természetes, gördülékeny magyar üzleti
// nyelv.  HTML-t nem kell visszaadni, azt a szerver állítja elő a
// struktúrált mezőkből.
const SYSTEM_PROMPT = `
Te egy tapasztalt magyar üzleti ajánlatíró asszisztens vagy, aki professzionális, 
magas színvonalú ajánlatokat készít magyar vállalkozások számára.

ÉRTÉKPROPOZÍCIÓ ÉS HASZNOK:
- Mindig a hasznokra és előnyökre fókuszálj, ne a funkciókra vagy jellemzőkre!
- Mutasd be, hogyan oldja meg az ajánlat a vevő problémáját vagy igényét.
- Használj konkrét, mérhető eredményeket és előnyöket, ahol lehetséges.
- A value_proposition mezőben (ha van) hangsúlyozd ki az egyedi értéket.

NYELVI MINŐSÉG:
- Használj természetes, gördülékeny magyar üzleti nyelvet (ne tükörfordítást)!
- Kerüld az anglicizmusokat, helyette magyar kifejezéseket használj (pl. "feladat" helyett "task", "határidő" helyett "deadline").
- Használj üzleti szakszavakat és formális, de barátságos hangvételt.
- A szöveg legyen érthető, világos és logikusan felépített.
- Minden bekezdés legyen jól strukturált, 2-4 mondat hosszúságú.
- Használj történetmesélést és konkrét példákat a bizalom építéséhez, ahol releváns.

SZERKEZET ÉS TARTALOM:
- A bevezető köszöntse a címzettet (névvel, ha elérhető) és mutassa be az ajánlat célját.
- A projekt összefoglaló következzen a probléma-megoldás-eredmény keretrendszerben:
  * Mutasd be a problémát vagy igényt, amit a projekt megold
  * Ismertesd a javasolt megoldást
  * Vázold fel a várható eredményeket és előnyöket
- A felsorolásokban használj rövid, lényegretörő, konkrét pontokat.
- Minden szakasz legyen tartalmas és releváns a projekt kontextusához.
- A deliverables mezőben említsd meg a minőségi követelményeket vagy szabványokat, ahol releváns.
- A schedule mezőben használj konkrét dátumokat vagy időkereteket (pl. "2025. február 15-ig", "2 hét alatt").
- A zárás legyen udvarias, értékösszefoglaló és erősen cselekvésre ösztönző.

CSELEKVÉSRE ÖSZTÖNZÉS (CTA):
- A next_steps szakaszban használj konkrét, akcióorientált kifejezéseket:
  * "Kérjük, jelezze vissza a véleményét 2025. február 10-ig"
  * "Várjuk a visszajelzését a következő 3 munkanapon belül"
  * "Kérjük, erősítse meg az elfogadást e-mailben"
- A zárásban szerepeljen egyértelmű következő lépés javaslat.
- Használj olyan kifejezéseket, amelyek konkrét cselekedetre ösztönöznek.

SZEMÉLYRE SZABÁS ÉS URGENS:
- Ha a vevő neve vagy cégneve elérhető, használd a bevezetőben (pl. "Tisztelt Kovács Úr" vagy "Tisztelt ABC Kft.").
- Ha határidő van megadva, természetesen építsd be az urgensséget a szövegbe (de ne legyél tolakodó vagy agresszív).
- A határidőt említsd meg a schedule és next_steps szakaszokban is, ahol releváns.

BIZALOM ÉS HITELESSÉG:
- Ha testimonials mező van megadva, használd őket a bizalom építéséhez.
- Ha guarantees mező van megadva, említsd meg őket a zárásban vagy külön szakaszban.
- Az expected_outcomes mezőben használj mérhető, konkrét eredményeket (pl. "30% növekedés", "2 hét alatt").

FORMÁZÁS:
- A megadott JSON sémát töltsd ki: minden mező magyar szöveg legyen, HTML jelölés nélkül.
- A felsorolás típusú mezők mintegy 3-5, jól formázott pontot tartalmazzanak.
- Ne találj ki árakat; az árképzés külön jelenik meg az alkalmazásban.
- A szöveg legyen professzionális, de nem túlzottan formális vagy száraz.
- Az opcionális mezőket csak akkor töltsd ki, ha releváns információ áll rendelkezésre.
`;

type OfferSections = {
  introduction: string;
  project_summary: string;
  value_proposition?: string;
  scope: string[];
  deliverables: string[];
  expected_outcomes?: string[];
  schedule: string[];
  assumptions: string[];
  next_steps: string[];
  closing: string;
  testimonials?: string[];
  guarantees?: string[];
  client_context?: string;
};

const OFFER_SECTIONS_FORMAT: ResponseFormatTextJSONSchemaConfig = {
  type: 'json_schema',
  name: 'offer_sections',
  description: 'Strukturált magyar ajánlati szekciók - professzionális üzleti ajánlat',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'introduction',
      'project_summary',
      'scope',
      'deliverables',
      'schedule',
      'assumptions',
      'next_steps',
      'closing',
    ],
    properties: {
      introduction: {
        type: 'string',
        description: 'Rövid, udvarias bevezető bekezdés (2-3 mondat), amely köszönti a címzettet (névvel vagy cégnévvel, ha elérhető) és bemutatja az ajánlat célját. Használj természetes, professzionális magyar nyelvet.',
        minLength: 50,
        maxLength: 300,
      },
      project_summary: {
        type: 'string',
        description: 'A projekt céljának és hátterének részletes összefoglalása (3-5 mondat). Kövesse a probléma-megoldás-eredmény keretrendszert: mutassa be a problémát/igényt, a javasolt megoldást, és a várható eredményeket. Legyen informatív és meggyőző.',
        minLength: 100,
        maxLength: 500,
      },
      value_proposition: {
        type: 'string',
        description: 'Opcionális: Az egyedi értékpropozíció és főbb előnyök rövid összefoglalása (2-3 mondat). Hangsúlyozd ki, hogyan oldja meg az ajánlat a vevő problémáját és milyen konkrét előnyöket nyújt. Használj mérhető eredményeket, ahol lehetséges.',
        minLength: 80,
        maxLength: 300,
      },
      scope: {
        type: 'array',
        minItems: 3,
        maxItems: 6,
        items: {
          type: 'string',
          description: 'A projekt terjedelméhez tartozó kulcsfeladat vagy szolgáltatás. Minden pont legyen konkrét, mérhető és érthető (min. 20, max. 120 karakter).',
          minLength: 20,
          maxLength: 120,
        },
      },
      deliverables: {
        type: 'array',
        minItems: 3,
        maxItems: 6,
        items: {
          type: 'string',
          description: 'Egy konkrét, szállítandó eredmény vagy deliverable. Legyen specifikus és mérhető. Említsd meg a minőségi követelményeket vagy szabványokat, ahol releváns (min. 20, max. 120 karakter).',
          minLength: 20,
          maxLength: 120,
        },
      },
      expected_outcomes: {
        type: 'array',
        minItems: 2,
        maxItems: 5,
        items: {
          type: 'string',
          description: 'Opcionális: Egy mérhető, konkrét várható eredmény vagy előny (pl. "30% növekedés", "2 hét alatt"). Legyen specifikus és kvantifikálható (min. 20, max. 100 karakter).',
          minLength: 20,
          maxLength: 100,
        },
      },
      schedule: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'string',
          description: 'Kulcs mérföldkő vagy ütemezési pont konkrét dátumokkal vagy időkerettel (pl. "2025. február 15-ig", "2 hét alatt"). Legyen konkrét és érthető (min. 25, max. 100 karakter).',
          minLength: 25,
          maxLength: 100,
        },
      },
      assumptions: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'string',
          description: 'Feltételezés vagy kizárás, amely fontos a projekt értékeléséhez. Legyen világos és konkrét (min. 20, max. 120 karakter).',
          minLength: 20,
          maxLength: 120,
        },
      },
      next_steps: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'string',
          description: 'Következő lépés vagy teendő, amely cselekvésre ösztönzi a címzettet. Használj konkrét, akcióorientált kifejezéseket határidővel (pl. "Kérjük, jelezze vissza a véleményét 2025. február 10-ig"). Legyen konkrét és akcióorientált (min. 20, max. 100 karakter).',
          minLength: 20,
          maxLength: 100,
        },
      },
      closing: {
        type: 'string',
        description: 'Udvarias, meggyőző záró bekezdés (2-3 mondat), amely összefoglalja az ajánlat értékét és erősen cselekvésre ösztönzi a címzettet. Tartalmazzon egyértelmű következő lépés javaslatot. Legyen pozitív és együttműködésre ösztönző.',
        minLength: 60,
        maxLength: 250,
      },
      testimonials: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: {
          type: 'string',
          description: 'Opcionális: Ügyfél vélemény vagy tesztimonál a bizalom építéséhez. Legyen rövid és meggyőző (min. 40, max. 200 karakter).',
          minLength: 40,
          maxLength: 200,
        },
      },
      guarantees: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: {
          type: 'string',
          description: 'Opcionális: Garancia vagy biztonsági jelző, amely csökkenti a vevő kockázatérzetét (pl. "100% elégedettségi garancia", "30 napos pénzvisszafizetési garancia"). Legyen rövid és meggyőző (min. 30, max. 120 karakter).',
          minLength: 30,
          maxLength: 120,
        },
      },
      client_context: {
        type: 'string',
        description: 'Opcionális: Ügyfél-specifikus kontextus vagy kapcsolati információk, amelyek segíthetnek a személyre szabásban. Használd a bevezetőben vagy a projekt összefoglalóban, ha releváns (min. 30, max. 200 karakter).',
        minLength: 30,
        maxLength: 200,
      },
    },
  },
};

function safeParagraphGroup(values: Array<string | undefined>): string {
  const normalized = values
    .map((value) => (value || '').trim())
    .filter(Boolean)
    .map((value) => `<p>${sanitizeInput(value)}</p>`);
  if (!normalized.length) {
    return '<p>-</p>';
  }
  return normalized.join('');
}

function safeList(items: string[] | undefined): string {
  const normalized = (items || [])
    .map((item) => sanitizeInput((item || '').trim()))
    .filter(Boolean);
  if (!normalized.length) return '<p>-</p>';
  return `<ul>${normalized.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function limitList(items: string[] | undefined, max: number): string[] {
  const normalized = Array.isArray(items) ? items.filter((item) => typeof item === 'string') : [];
  if (!normalized.length) return [];
  return normalized.slice(0, Math.max(0, max));
}

function renderClosingNote(value: string | undefined, extraClass?: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return '';
  }
  const classNames = ['offer-doc__section-note'];
  if (extraClass) {
    classNames.push(extraClass);
  }
  return `<p class="${classNames.join(' ')}">${sanitizeInput(trimmed)}</p>`;
}

function sectionsToHtml(
  sections: OfferSections,
  style: 'compact' | 'detailed',
  i18n: Translator,
): string {
  const labels = {
    overview: i18n.t('pdf.templates.sections.overview'),
    valueProposition: i18n.t('pdf.templates.sections.valueProposition'),
    scope: i18n.t('pdf.templates.sections.scope'),
    deliverables: i18n.t('pdf.templates.sections.deliverables'),
    expectedOutcomes: i18n.t('pdf.templates.sections.expectedOutcomes'),
    timeline: i18n.t('pdf.templates.sections.timeline'),
    assumptions: i18n.t('pdf.templates.sections.assumptions'),
    nextSteps: i18n.t('pdf.templates.sections.nextSteps'),
    testimonials: i18n.t('pdf.templates.sections.testimonials'),
    guarantees: i18n.t('pdf.templates.sections.guarantees'),
  } as const;

  if (style === 'compact') {
    const overviewParts: string[] = [sections.introduction, sections.project_summary];
    if (sections.value_proposition) {
      overviewParts.push(sections.value_proposition);
    }
    const overviewContent = safeParagraphGroup(overviewParts);
    const nextSteps = safeList(limitList(sections.next_steps, 3));
    const closingNote = renderClosingNote(sections.closing, 'offer-doc__section-note--compact');

    const html = `
      <div class="offer-doc__compact">
        <section class="offer-doc__compact-intro">
          <div class="offer-doc__compact-block">
            ${renderSectionHeading(labels.overview, 'overview')}
            ${overviewContent}
          </div>
          <div class="offer-doc__compact-block offer-doc__compact-block--highlights">
            ${renderSectionHeading(labels.scope, 'scope', { level: 'h3' })}
            ${safeList(limitList(sections.scope, 3))}
          </div>
        </section>
        <section class="offer-doc__compact-grid">
          <div class="offer-doc__compact-card">
            ${renderSectionHeading(labels.deliverables, 'deliverables', { level: 'h3' })}
            ${safeList(limitList(sections.deliverables, 3))}
          </div>
          <div class="offer-doc__compact-card">
            ${renderSectionHeading(labels.timeline, 'timeline', { level: 'h3' })}
            ${safeList(limitList(sections.schedule, 3))}
          </div>
          <div class="offer-doc__compact-card">
            ${renderSectionHeading(labels.assumptions, 'assumptions', { level: 'h3' })}
            ${safeList(limitList(sections.assumptions, 3))}
          </div>
        </section>
        <section class="offer-doc__compact-bottom">
          <div class="offer-doc__compact-card offer-doc__compact-card--accent">
            ${renderSectionHeading(labels.nextSteps, 'nextSteps', { level: 'h3' })}
            ${nextSteps}
            ${closingNote}
          </div>
          ${sections.guarantees && sections.guarantees.length > 0
            ? `<div class="offer-doc__compact-card offer-doc__compact-card--closing">
                ${renderSectionHeading(labels.guarantees, 'guarantees', { level: 'h3' })}
                ${safeList(limitList(sections.guarantees, 3))}
              </div>`
            : ''}
        </section>
      </div>
    `;

    return sanitizeHTML(html);
  }

  // Detailed style: better spacing and structure for professional PDF
  const overviewParts: string[] = [sections.introduction, sections.project_summary];
  const html = `
    <div class="offer-doc__sections">
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.overview, 'overview')}
        ${safeParagraphGroup(overviewParts)}
      </section>
      ${sections.value_proposition
        ? `<section class="offer-doc__section">
            ${renderSectionHeading(labels.valueProposition, 'valueProposition')}
            ${safeParagraphGroup([sections.value_proposition])}
          </section>`
        : ''}
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.scope, 'scope')}
        ${safeList(sections.scope)}
      </section>
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.deliverables, 'deliverables')}
        ${safeList(sections.deliverables)}
      </section>
      ${sections.expected_outcomes && sections.expected_outcomes.length > 0
        ? `<section class="offer-doc__section">
            ${renderSectionHeading(labels.expectedOutcomes, 'expectedOutcomes')}
            ${safeList(sections.expected_outcomes)}
          </section>`
        : ''}
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.timeline, 'timeline')}
        ${safeList(sections.schedule)}
      </section>
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.assumptions, 'assumptions')}
        ${safeList(sections.assumptions)}
      </section>
      ${sections.testimonials && sections.testimonials.length > 0
        ? `<section class="offer-doc__section">
            ${renderSectionHeading(labels.testimonials, 'testimonials')}
            ${safeList(sections.testimonials)}
          </section>`
        : ''}
      ${sections.guarantees && sections.guarantees.length > 0
        ? `<section class="offer-doc__section">
            ${renderSectionHeading(labels.guarantees, 'guarantees')}
            ${safeList(sections.guarantees)}
          </section>`
        : ''}
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.nextSteps, 'nextSteps')}
        ${safeList(sections.next_steps)}
        ${renderClosingNote(sections.closing)}
      </section>
    </div>
  `;

  return sanitizeHTML(html);
}

function sanitizeSectionsOutput(sections: OfferSections): OfferSections {
  return {
    introduction: sanitizeInput((sections.introduction || '').trim()),
    project_summary: sanitizeInput((sections.project_summary || '').trim()),
    value_proposition: sections.value_proposition
      ? sanitizeInput((sections.value_proposition || '').trim())
      : undefined,
    scope: (sections.scope || []).map((item) => sanitizeInput((item || '').trim())).filter(Boolean),
    deliverables: (sections.deliverables || [])
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean),
    expected_outcomes: sections.expected_outcomes
      ? (sections.expected_outcomes || [])
          .map((item) => sanitizeInput((item || '').trim()))
          .filter(Boolean)
      : undefined,
    schedule: (sections.schedule || [])
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean),
    assumptions: (sections.assumptions || [])
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean),
    next_steps: (sections.next_steps || [])
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean),
    closing: sanitizeInput((sections.closing || '').trim()),
    testimonials: sections.testimonials
      ? (sections.testimonials || [])
          .map((item) => sanitizeInput((item || '').trim()))
          .filter(Boolean)
      : undefined,
    guarantees: sections.guarantees
      ? (sections.guarantees || [])
          .map((item) => sanitizeInput((item || '').trim()))
          .filter(Boolean)
      : undefined,
    client_context: sections.client_context
      ? sanitizeInput((sections.client_context || '').trim())
      : undefined,
  };
}

const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

class ImageAssetError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type SanitizedImageAsset = {
  key: string;
  dataUrl: string;
  alt: string;
};

function normalizeImageAssets(
  input: unknown,
  plan: 'free' | 'standard' | 'pro',
): SanitizedImageAsset[] {
  if (!input) {
    return [];
  }

  if (!Array.isArray(input)) {
    const translator = createTranslator(undefined);
    throw new ImageAssetError(translator.t('api.error.invalidImageUpload'));
  }

  if (!input.length) {
    return [];
  }

  if (plan !== 'pro') {
    const translator = createTranslator(undefined);
    throw new ImageAssetError(translator.t('api.pdf.imageUploadProOnly'), 403);
  }

  if (input.length > MAX_IMAGE_COUNT) {
    const translator = createTranslator(undefined);
    throw new ImageAssetError(
      translator.t('api.image.maxCount', { count: MAX_IMAGE_COUNT }),
      400,
    );
  }

  const seenKeys = new Set<string>();
  const sanitized: SanitizedImageAsset[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') {
      const translator = createTranslator(undefined);
      throw new ImageAssetError(translator.t('api.error.incompleteImageData'));
    }

    const key =
      typeof (raw as { key?: unknown }).key === 'string' ? (raw as { key: string }).key.trim() : '';
    if (!key || key.length > 80) {
      const translator = createTranslator(undefined);
      throw new ImageAssetError(translator.t('api.error.invalidImageUpload'));
    }
    if (seenKeys.has(key)) {
      continue;
    }

    const dataUrl =
      typeof (raw as { dataUrl?: unknown }).dataUrl === 'string'
        ? (raw as { dataUrl: string }).dataUrl.trim()
        : '';
    if (!dataUrl) {
      throw new ImageAssetError(t('errors.offer.imageMissing'));
    }

    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
    if (!match) {
      throw new ImageAssetError(t('errors.offer.imageBase64Only'));
    }

    const mime = match[1].toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
      throw new ImageAssetError(t('errors.offer.imageFormatUnsupported'));
    }

    const base64 = dataUrl.slice(match[0].length);
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      throw new ImageAssetError(t('errors.offer.imageDataCorrupted'));
    }

    if (!buffer.length || buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new ImageAssetError('A kép mérete meghaladja a 2 MB-ot.');
    }

    const altRaw =
      typeof (raw as { alt?: unknown }).alt === 'string' ? (raw as { alt: string }).alt : '';
    const alt = sanitizeInput(altRaw).slice(0, 160);

    sanitized.push({ key, dataUrl: `data:${mime};base64,${base64}`, alt });
    seenKeys.add(key);
  }

  return sanitized;
}

const optionalTrimmedString = z.preprocess(
  (value) => (value === null || value === undefined ? undefined : value),
  z.string().trim().optional(),
);

const optionalNonNegativeNumber = z.preprocess(
  (value) => (value === null || value === undefined ? undefined : value),
  z
    .number({ error: t('validation.number') })
    .finite()
    .min(0)
    .optional(),
);

const priceRowSchema = z
  .object({
    name: optionalTrimmedString,
    qty: optionalNonNegativeNumber,
    unit: optionalTrimmedString,
    unitPrice: optionalNonNegativeNumber,
    vat: optionalNonNegativeNumber,
  })
  .strict();

const imageAssetSchema = z
  .object({
    key: z.string().trim().min(1, t('validation.required')).max(80),
    dataUrl: z.string().trim().min(1, t('validation.required')),
    alt: z.preprocess(
      (value) => (value === null || value === undefined ? null : value),
      z.string().trim().max(160).nullable().optional(),
    ),
  })
  .strict();

const aiGenerateRequestSchema = z
  .object({
    title: z.string().trim().min(1, t('validation.required')),
    industry: z.string().trim().min(1, t('validation.required')),
    projectDetails: projectDetailsSchema,
    deadline: optionalTrimmedString,
    language: z.preprocess(
      (value) => (value === null || value === undefined ? undefined : value),
      z.enum(['hu', 'en']).default('hu'),
    ),
    brandVoice: z.preprocess(
      (value) => (value === null || value === undefined ? undefined : value),
      z.enum(['friendly', 'formal']).default('friendly'),
    ),
    style: z.preprocess(
      (value) => (value === null || value === undefined ? undefined : value),
      z.enum(['compact', 'detailed']).default('detailed'),
    ),
    formality: z.preprocess(
      (value) => (value === null || value === undefined ? undefined : value),
      z.enum(['tegeződés', 'magázódás']).default('tegeződés'),
    ),
    prices: z.preprocess(
      (value) => (value === null || value === undefined ? [] : value),
      z.array(priceRowSchema).default([]),
    ),
    aiOverrideHtml: z.preprocess(
      (value) => (value === null || value === undefined ? undefined : value),
      z.string().optional(),
    ),
    clientId: z.preprocess(
      (value) => (value === null || value === undefined || value === '' ? undefined : value),
      z.string().trim().optional(),
    ),
    templateId: z.preprocess(
      (value) => (value === null || value === undefined || value === '' ? undefined : value),
      z.string().trim().optional(),
    ),
    pdfWebhookUrl: z.preprocess(
      (value) => (value === null || value === undefined || value === '' ? undefined : value),
      z.string().url(t('validation.urlInvalid')).optional(),
    ),
    imageAssets: z.preprocess(
      (value) => (value === null || value === undefined ? [] : value),
      z.array(imageAssetSchema).default([]),
    ),
    testimonials: z.preprocess(
      (value) => (value === null || value === undefined ? [] : value),
      z.array(z.string().trim()).default([]),
    ),
  })
  .strict();

function mapPdfWebhookError(error: PdfWebhookValidationError): string {
  switch (error.reason) {
    case 'invalid_url':
      return t('validation.webhook.invalidUrl');
    case 'protocol_not_allowed':
      return t('validation.webhook.protocolNotAllowed');
    case 'credentials_not_allowed':
      return t('validation.webhook.credentialsNotAllowed');
    case 'host_not_allowlisted':
      return t('validation.webhook.hostNotAllowlisted');
    case 'allowlist_empty':
      return t('validation.webhook.allowlistEmpty');
    default:
      return t('validation.webhook.invalidUrl');
  }
}

const IMG_TAG_REGEX = /<img\b[^>]*>/gi;

function applyImageAssetsToHtml(
  html: string,
  images: SanitizedImageAsset[],
): {
  pdfHtml: string;
  storedHtml: string;
} {
  if (!images.length) {
    return { pdfHtml: html, storedHtml: html.replace(IMG_TAG_REGEX, '') };
  }

  const imageMap = new Map(images.map((image) => [image.key, image]));
  let pdfHtml = '';
  let storedHtml = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = IMG_TAG_REGEX.exec(html)) !== null) {
    const [tag] = match;
    pdfHtml += html.slice(lastIndex, match.index);
    storedHtml += html.slice(lastIndex, match.index);

    const keyMatch =
      tag.match(/data-offer-image-key\s*=\s*"([^"]+)"/i) ||
      tag.match(/data-offer-image-key\s*=\s*'([^']+)'/i);
    if (keyMatch) {
      const key = keyMatch[1] ?? keyMatch[2];
      const asset = key ? imageMap.get(key) : undefined;
      if (asset) {
        const safeAlt = typeof asset.alt === 'string' ? asset.alt : '';
        const altAttr = safeAlt ? ` alt="${safeAlt}"` : '';
        pdfHtml += `<img src="${asset.dataUrl}"${altAttr} />`;
      }
    }

    lastIndex = match.index + match[0].length;
  }

  pdfHtml += html.slice(lastIndex);
  storedHtml += html.slice(lastIndex);

  ensureSafeHtml(pdfHtml, 'pdf html with embedded assets');
  ensureSafeHtml(storedHtml, 'pdf html for storage');

  return { pdfHtml, storedHtml };
}

export const POST = withAuth(
  withRequestSizeLimit(async (req: AuthenticatedNextRequest) => {
  const requestId = randomUUID();
  const log = createLogger(requestId);
  log.setContext({ userId: req.user.id });
  
  // Rate limiting for AI generation endpoint
  const rateLimitResult = await checkRateLimitMiddleware(req, {
    maxRequests: 20, // Higher limit for authenticated users
    windowMs: RATE_LIMIT_WINDOW_MS * 5, // 5 minute window
    keyPrefix: 'ai-generate',
  });

  if (rateLimitResult && !rateLimitResult.allowed) {
    log.warn('AI generate rate limit exceeded', {
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
    });
    const translator = createTranslator(req.headers.get('accept-language'));
    return createRateLimitResponse(
      rateLimitResult,
      translator.t('quotaWarningBar.message.user'),
    );
  }

  try {
    // Parse and sanitize the incoming JSON body.  Sanitizing early
    // prevents any malicious scripts or HTML fragments from reaching
    // our AI prompts or being persisted in the database.
    const parsed = aiGenerateRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleValidationError(parsed.error, requestId);
    }

    const {
      title,
      industry,
      projectDetails,
      deadline,
      language,
      brandVoice,
      style,
      formality,
      prices,
      aiOverrideHtml,
      clientId,
      templateId,
      pdfWebhookUrl,
      imageAssets,
      testimonials,
    } = parsed.data;

    const sb = await supabaseServer();
    const user = req.user;

    // ---- Limit (havi) ----

    const profile = await getUserProfile(sb, user.id);
    const plan: SubscriptionPlan = resolveEffectivePlan(profile?.plan ?? null);

    let sanitizedImageAssets: SanitizedImageAsset[] = [];
    try {
      sanitizedImageAssets = normalizeImageAssets(imageAssets, plan);
    } catch (error) {
      const translator = createTranslator(req.headers.get('accept-language'));
      const status = error instanceof ImageAssetError ? error.status : 400;
      const message =
        error instanceof ImageAssetError
          ? error.message
          : translator.t('api.error.invalidImageUpload');
      return NextResponse.json({ error: message }, { status });
    }

    const planLimit = getMonthlyOfferLimit(plan);

    let clientCompanyName: string | null = null;
    if (clientId) {
      try {
        const { data: clientRow, error: clientError } = await sb
          .from('clients')
          .select('company_name')
          .eq('id', clientId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (clientError) {
          log.warn('Failed to load client for offer generation (non-blocking)', {
            clientId,
            error: clientError.message,
          });
        } else if (clientRow?.company_name && typeof clientRow.company_name === 'string') {
          clientCompanyName = clientRow.company_name;
        }
      } catch (clientLookupError) {
        log.warn('Unexpected client lookup error during offer generation', {
          error: clientLookupError,
          message: clientLookupError instanceof Error ? clientLookupError.message : String(clientLookupError),
        });
      }
    }

    const cookieStore = await cookies();
    let deviceId = cookieStore.get('propono_device_id')?.value;
    if (!deviceId) {
      const analyticsAllowed = allowCategory(req, 'analytics');
      deviceId = randomUUID();
      if (analyticsAllowed) {
        cookieStore.set({
          name: 'propono_device_id',
          value: deviceId,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 365,
          path: '/',
        });
      }
    }

    const { iso: usagePeriodStart } = currentMonthStart();
    const usageSnapshot = await getUsageSnapshot(sb, user.id, usagePeriodStart);

    if (typeof planLimit === 'number' && Number.isFinite(planLimit)) {
      try {
        await syncUsageCounter(
          supabaseServiceRole(),
          user.id,
          usageSnapshot.offersGenerated,
          usagePeriodStart,
        );
      } catch (syncError) {
        log.warn('Failed to sync usage counter before PDF generation', {
          error: syncError,
          message: syncError instanceof Error ? syncError.message : String(syncError),
        });
      }
    }

    let normalizedWebhookUrl: string | null = null;
    try {
      normalizedWebhookUrl = validatePdfWebhookUrl(pdfWebhookUrl);
    } catch (error) {
      if (error instanceof PdfWebhookValidationError) {
        const message = mapPdfWebhookError(error);
        return NextResponse.json({ error: message }, { status: 400 });
      }
      throw error;
    }

    // Atomically check quota including pending jobs to prevent race conditions
    // This ensures accurate quota checking even under concurrent load
    if (typeof planLimit === 'number' && Number.isFinite(planLimit)) {
      const quotaCheck = await checkQuotaWithPending(sb, user.id, planLimit, usagePeriodStart);
      if (!quotaCheck.allowed) {
        log.warn('Quota limit exceeded', {
          userId: user.id,
          plan,
          limit: planLimit,
          confirmed: quotaCheck.confirmedCount,
          pending: quotaCheck.pendingCount,
          total: quotaCheck.totalCount,
          periodStart: usagePeriodStart,
        });
        const translator = createTranslator(req.headers.get('accept-language'));
        return NextResponse.json(
          { error: translator.t('quotaWarningBar.message.user') },
          { status: 402 },
        );
      }
      // Update usageSnapshot with atomic values for logging
      usageSnapshot.offersGenerated = quotaCheck.confirmedCount;
    }

    const deviceLimit = plan === 'free' && typeof planLimit === 'number' ? 3 : null;
    if (deviceLimit !== null && deviceId) {
      // Recalculate device usage from actual successful PDFs before checking
      try {
        const { recalculateDeviceUsageFromPdfs } = await import('@/lib/services/usage');
        await recalculateDeviceUsageFromPdfs(sb, user.id, deviceId, usagePeriodStart).catch(
          (err) => {
            log.warn('Failed to recalculate device usage from PDFs, continuing with counter value', {
              error: err,
            });
          },
        );
      } catch (recalcError) {
        log.warn('Failed to recalculate device usage from PDFs, continuing with counter value', {
          error: recalcError,
        });
      }

      const deviceQuotaCheck = await checkDeviceQuotaWithPending(
        sb,
        user.id,
        deviceId,
        deviceLimit,
        usagePeriodStart,
      );
      if (!deviceQuotaCheck.allowed) {
        log.warn('Device quota limit exceeded', {
          userId: user.id,
          deviceId,
          plan,
          limit: deviceLimit,
          confirmed: deviceQuotaCheck.confirmedCount,
          pending: deviceQuotaCheck.pendingCount,
          total: deviceQuotaCheck.totalCount,
          periodStart: usagePeriodStart,
        });
        const deviceTranslator = createTranslator(req.headers.get('accept-language'));
        return NextResponse.json(
          { error: deviceTranslator.t('quotaWarningBar.message.device') },
          { status: 402 },
        );
      }
    }

    // Get pending count for logging (non-atomic, but only for logging)
    const pendingCount = await countPendingPdfJobs(sb, {
      userId: user.id,
      periodStart: usagePeriodStart,
    });
    log.info('Usage quota snapshot', {
      plan,
      limit: planLimit,
      confirmed: usageSnapshot.offersGenerated,
      pendingCount,
      periodStart: usagePeriodStart,
    });

    const sanitizedDetails = projectDetailFields.reduce<ProjectDetails>(
      (acc, key) => {
        acc[key] = sanitizeInput(projectDetails[key]);
        return acc;
      },
      { ...emptyProjectDetails },
    );

    const normalizedLanguage = sanitizeInput(language);
    const resolvedLocale = resolveLocale(normalizedLanguage);
    const translator = createTranslator(resolvedLocale);

    // ---- AI szöveg (override elsőbbség) ----
    const safeTitle = sanitizeInput(title);
    let aiHtml = '';
    let structuredSections: OfferSections | null = null;
    if (aiOverrideHtml && aiOverrideHtml.trim().length > 0) {
      // Sanitize override HTML to strip scripts
      aiHtml = sanitizeHTML(aiOverrideHtml.trim());
    } else {
      // Check for OpenAI API key via typed env helper
      if (!envServer.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OPENAI_API_KEY hiányzik az .env.local fájlból.' },
          { status: 500 },
        );
      }
      const openai = new OpenAI({ apiKey: envServer.OPENAI_API_KEY });

      const styleAddon =
        style === 'compact'
          ? 'Stílus: nagyon tömör és lényegre törő. A bevezető és projekt összefoglaló legyen 1-2 rövid bekezdés. A felsorolások legfeljebb 3-4 pontot tartalmazzanak, amelyek a legfontosabb információkat összegzik. A hangsúly a lényegi feladatokon és eredményeken legyen, kerülve a töltelékszöveget.'
          : 'Stílus: részletes és indokolt. A bevezető és projekt összefoglaló legyen 2-4 mondatos, informatív bekezdés. A felsorolások 4-6 tartalmas pontot tartalmaznak, amelyek részletesen megmagyarázzák a javasolt lépéseket, szolgáltatásokat és eredményeket. A szöveg legyen átgondolt és meggyőző.';

      const toneGuidance =
        brandVoice === 'formal'
          ? 'Hangnem: formális és professzionális. Használj udvarias, tiszteletteljes kifejezéseket és üzleti terminológiát.'
          : 'Hangnem: barátságos és együttműködő. Használj meleg, de mégis professzionális hangvételt, amely bizalmat kelt.';

      const formalityGuidance =
        formality === 'magázódás'
          ? 'Szólítás: magázódás használata (Ön, Önök, Önöké, stb.). A teljes szövegben következetesen magázódj a címzettel.'
          : 'Szólítás: tegeződés használata (te, ti, tiétek, stb.). A teljes szövegben következetesen tegezd a címzettet.';

      // Sanitize user inputs before passing to OpenAI
      const safeIndustry = sanitizeInput(industry);
      const safeProjectDetails = formatProjectDetailsForPrompt(sanitizedDetails);
      const safeDeadline = sanitizeInput(deadline || '—');
      const safeBrand = sanitizeInput(brandVoice);

      const clientInfo = clientCompanyName
        ? `Ügyfél/Cég neve: ${sanitizeInput(clientCompanyName)}\n`
        : '';
      const deadlineGuidance = safeDeadline && safeDeadline !== '—'
        ? `\nFontos: A határidő (${safeDeadline}) természetesen építsd be a schedule és next_steps szakaszokba, és használd az urgensség kifejezésére, de ne legyél tolakodó.`
        : '';

      // Include testimonials in prompt if provided
      const testimonialsSection = testimonials && testimonials.length > 0
        ? `\n\nVásárlói visszajelzések (kötelezően használd fel a testimonials szakaszban, maximum ${testimonials.length} darab):\n${testimonials.map((t, i) => `${i + 1}. ${sanitizeInput(t)}`).join('\n')}\n\nFontos: A testimonials mezőben helyezd el ezeket a visszajelzéseket, de formázd őket úgy, hogy természetesek és meggyőzőek legyenek. Ne változtass a szövegükön, csak az elrendezést és formázást alakítsd ki.`
        : '';

      const userPrompt = `
Feladat: Készíts egy professzionális magyar üzleti ajánlatot az alábbi információk alapján.

Nyelv: ${normalizedLanguage}
${toneGuidance}
${formalityGuidance}
Iparág: ${safeIndustry}
Ajánlat címe: ${safeTitle}
${clientInfo}Projekt részletek:
${safeProjectDetails || '—'}

Határidő: ${safeDeadline}${deadlineGuidance}
${testimonialsSection}

${styleAddon}

Különös figyelmet fordít a következőkre:
- Használj természetes, folyékony magyar nyelvet, kerülve az anglicizmusokat
- Minden szakasz legyen logikusan felépített és egymásra épülő
- A felsorolások pontjai legyenek konkrétak, mérhetők és érthetők
- A szöveg legyen meggyőző, de nem túlzottan marketinges
- Ne találj ki árakat, az árképzés külön jelenik meg az alkalmazásban
- Ha ügyfél/cég neve van megadva, használd a bevezetőben a személyre szabáshoz
- A szólítást következetesen alkalmazd a teljes szövegben
${testimonials && testimonials.length > 0 ? '- Ha vannak vásárlói visszajelzések, használd fel őket a testimonials szakaszban' : ''}
`;

      try {
        const response = await openai.responses.parse({
          model: 'gpt-4o-mini',
          temperature: 0.7, // Increased for more natural, creative but still professional output
          input: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          text: { format: OFFER_SECTIONS_FORMAT },
        });

        structuredSections = response.output_parsed as OfferSections | null;
        if (!structuredSections) {
          throw new Error('Structured output missing');
        }

        aiHtml = sectionsToHtml(
          structuredSections,
          style === 'compact' ? 'compact' : 'detailed',
          translator,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.error('OpenAI structured output error', error);
        return NextResponse.json(
          { error: 'OpenAI struktúrált válasz sikertelen. Próbáld újra később.' },
          { status: 502 },
        );
      }
    }

    // ---- Ár tábla adatok ----
    const rows: PriceRow[] = prices;

    const { pdfHtml: aiHtmlForPdf, storedHtml: aiHtmlForStorage } = applyImageAssetsToHtml(
      aiHtml,
      sanitizedImageAssets,
    );

    // ---- PDF queueing ----
    const offerId = uuid();
    const storagePath = createOfferStoragePath({
      userId: user.id,
      offerId,
      customerName: clientCompanyName,
      offerTitle: safeTitle,
      fallbackCompany: typeof profile?.company_name === 'string' ? profile.company_name : null,
    });
    const brandingOptions = normalizeBranding({
      primaryColor:
        typeof profile?.brand_color_primary === 'string' ? profile.brand_color_primary : null,
      secondaryColor:
        typeof profile?.brand_color_secondary === 'string' ? profile.brand_color_secondary : null,
      logoUrl: await getBrandLogoUrl(
        sb,
        typeof profile?.brand_logo_path === 'string' ? profile.brand_logo_path : null,
        typeof profile?.brand_logo_url === 'string' ? profile.brand_logo_url : null,
      ),
    });

    const planTier = planToTemplateTier(plan);
    const allTemplates = listTemplates() as Array<OfferTemplate>;
    const fallbackTemplate =
      allTemplates.find((tpl) => tpl.id === DEFAULT_TEMPLATE_ID) ||
      loadTemplate(DEFAULT_TEMPLATE_ID);

    const freeTemplates = allTemplates.filter((tpl) => tpl.tier === 'free');
    const defaultTemplateForPlan =
      planTier === 'premium'
        ? allTemplates[0] || fallbackTemplate
        : freeTemplates[0] || fallbackTemplate;

    const normalizedRequestedTemplateId =
      typeof templateId === 'string' && templateId.trim().length > 0
        ? (templateId.trim() as TemplateId)
        : null;

    const requestedTemplate = normalizedRequestedTemplateId
      ? allTemplates.find((tpl) => tpl.id === normalizedRequestedTemplateId) || null
      : null;

    if (normalizedRequestedTemplateId && !requestedTemplate) {
      return NextResponse.json(
        {
          error: 'A kért sablon nem található. Kérlek válassz egy elérhető sablont.',
        },
        { status: 400 },
      );
    }

    const profileTemplateId = normalizeTemplateId(
      typeof profile?.offer_template === 'string' ? profile.offer_template : null,
    );
    const profileTemplate = profileTemplateId
      ? allTemplates.find((tpl) => tpl.id === profileTemplateId) || null
      : null;

    const isTemplateAllowed = (tpl: OfferTemplate) => planTier === 'premium' || tpl.tier === 'free';

    let template = defaultTemplateForPlan;
    let resolvedRequestedTemplateId: TemplateId;

    if (requestedTemplate) {
      resolvedRequestedTemplateId = requestedTemplate.id;
      template = isTemplateAllowed(requestedTemplate) ? requestedTemplate : fallbackTemplate;
    } else if (profileTemplate && isTemplateAllowed(profileTemplate)) {
      template = profileTemplate;
      resolvedRequestedTemplateId = template.id;
    } else {
      template = defaultTemplateForPlan;
      resolvedRequestedTemplateId = template.id;
    }

    const resolvedTemplateId = template.id;
    // Use template ID directly (no legacy ID needed)
    const resolvedLegacyTemplateId = template.id.includes('@') 
      ? template.id.split('@')[0] 
      : template.id;

    const defaultTitle = sanitizeInput(translator.t('pdf.templates.common.defaultTitle'));

    const galleryImages = sanitizedImageAssets
      .slice(0, MAX_IMAGE_COUNT)
      .map((asset) => ({ key: asset.key, src: asset.dataUrl, alt: asset.alt }));

    const renderStartedAt = performance.now();
    let renderDuration: number | null = null;
    let html: string;

    try {
      html = buildOfferHtml({
        offer: {
          title: safeTitle || defaultTitle,
          companyName: sanitizeInput(profile?.company_name || ''),
          bodyHtml: aiHtmlForPdf,
          templateId: resolvedTemplateId,
          legacyTemplateId: resolvedLegacyTemplateId,
          locale: resolvedLocale,
          issueDate: sanitizeInput(formatOfferIssueDate(new Date(), resolvedLocale)),
          contactName: sanitizeInput(
            (typeof profile?.company_contact_name === 'string'
              ? profile.company_contact_name
              : typeof profile?.representative === 'string'
                ? profile.representative
                : profile?.company_name) || '',
          ),
          contactEmail: sanitizeInput(
            (typeof profile?.company_email === 'string'
              ? profile.company_email
              : req.user.email) || '',
          ),
          contactPhone: sanitizeInput(
            (typeof profile?.company_phone === 'string' ? profile.company_phone : '') || '',
          ),
          companyWebsite: sanitizeInput(
            (typeof profile?.company_website === 'string'
              ? profile.company_website
              : typeof profile?.website === 'string'
                ? profile.website
                : '') || '',
          ),
          companyAddress: sanitizeInput(
            (typeof profile?.company_address === 'string' ? profile.company_address : '') || '',
          ),
          companyTaxId: sanitizeInput(
            (typeof profile?.company_tax_id === 'string' ? profile.company_tax_id : '') || '',
          ),
        },
        rows,
        branding: brandingOptions,
        i18n: translator,
        templateId: resolvedTemplateId,
        images: galleryImages,
      });
      renderDuration = performance.now() - renderStartedAt;
    } catch (error) {
      renderDuration = performance.now() - renderStartedAt;
      await recordTemplateRenderTelemetry({
        templateId: resolvedTemplateId,
        renderer: 'api.ai_generate.render',
        outcome: 'failure',
        renderMs: renderDuration,
        errorCode: resolveTemplateRenderErrorCode(error),
      });
      throw error;
    }

    await recordTemplateRenderTelemetry({
      templateId: resolvedTemplateId,
      renderer: 'api.ai_generate.render',
      outcome: 'success',
      renderMs: renderDuration,
    });

    const downloadToken = uuid();

    // ---- Ajánlat mentése ----
    const { error: offerInsertError } = await sb.from('offers').insert({
      id: offerId,
      user_id: user.id,
      title: safeTitle,
      industry: sanitizeInput(industry),
      recipient_id: clientId || null,
      inputs: {
        projectDetails: sanitizedDetails,
        deadline,
        language,
        brandVoice,
        style,
        templateId: resolvedTemplateId,
      },
      ai_text: aiHtmlForStorage,
      price_json: rows,
      pdf_url: null,
      status: 'draft',
    });

    if (offerInsertError) {
      log.error('Offer insert error', offerInsertError);
      return NextResponse.json(
        {
          error: t('errors.offer.saveFailed'),
        },
        { status: 500 },
      );
    }

    const pdfJobInput: PdfJobInput = {
      jobId: downloadToken,
      offerId,
      userId: user.id,
      storagePath,
      html,
      callbackUrl: normalizedWebhookUrl ?? null,
      usagePeriodStart,
      userLimit: typeof planLimit === 'number' && Number.isFinite(planLimit) ? planLimit : null,
      deviceId: deviceLimit !== null ? deviceId : null,
      deviceLimit,
      templateId: resolvedTemplateId,
      requestedTemplateId: resolvedRequestedTemplateId,
    };

    try {
      await enqueuePdfJob(sb, pdfJobInput);
    } catch (error) {
      log.error('PDF queue error (enqueue)', error);
      // Offer text is already saved, return success with PDF failure indication
      return NextResponse.json({
        ok: true,
        id: offerId,
        pdfUrl: null,
        downloadToken,
        status: 'failed' as const,
        note: translator.t('errors.offer.savePdfFailed'),
        sections: structuredSections ? sanitizeSectionsOutput(structuredSections) : null,
        textSaved: true, // Indicate that the text was saved even though PDF failed
      });
    }

    let immediatePdfUrl: string | null = null;
    let responseStatus: 'pending' | 'completed' = 'pending';
    let responseNote = translator.t('api.pdf.generating');

    try {
      await dispatchPdfJob(sb, downloadToken);
    } catch (dispatchError) {
      const message =
        dispatchError instanceof Error ? dispatchError.message : String(dispatchError);
      log.warn('PDF queue error (dispatch)', {
        error: dispatchError,
        message,
        errorName: dispatchError instanceof Error ? dispatchError.name : undefined,
        stack: dispatchError instanceof Error ? dispatchError.stack : undefined,
      });

      const dispatchLimitMessage = normalizeUsageLimitError(message, translator);
      if (dispatchLimitMessage) {
        return NextResponse.json({ error: dispatchLimitMessage }, { status: 402 });
      }

      // Before falling back to inline processing, check if edge worker already claimed the job
      // This prevents double processing and quota double-increment
      const { data: jobStatus } = await sb
        .from('pdf_jobs')
        .select('status, pdf_url')
        .eq('id', downloadToken)
        .maybeSingle();

      if (jobStatus?.status === 'completed' && jobStatus.pdf_url) {
        // Edge worker already completed the job successfully
        log.info('PDF job already completed by edge worker', { jobId: downloadToken });
        immediatePdfUrl = jobStatus.pdf_url;
        responseStatus = 'completed';
        responseNote = translator.t('api.pdf.completed');
      } else if (jobStatus?.status === 'processing') {
        // Edge worker is currently processing - don't start inline fallback
        // The edge worker will complete or fail, and the user can check status later
        log.info('PDF job already being processed by edge worker', { jobId: downloadToken });
        responseStatus = 'pending';
        responseNote = translator.t('api.pdf.processing');
      } else if (jobStatus?.status === 'failed') {
        // Job already failed - try inline fallback as last resort
        log.warn('PDF job failed in edge worker, attempting inline fallback', {
          jobId: downloadToken,
        });
        // Continue to inline fallback below
      } else {
        // Job is still pending or status unknown - safe to try inline fallback
        log.info('Attempting inline PDF fallback after dispatch failure', {
          jobId: downloadToken,
          currentStatus: jobStatus?.status,
        });
      }

      // Only attempt inline fallback if job is not already completed or being processed
      // On Vercel, use Vercel-native Puppeteer (industry best practice)
      // In other environments, use inline Puppeteer fallback
      if (!immediatePdfUrl && jobStatus?.status !== 'processing') {
        // Check if we're in a Vercel environment
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
        const useVercelNative = isVercel && process.env.USE_VERCEL_NATIVE_PDF !== 'false';
        
        if (useVercelNative) {
          // Use Vercel-native PDF processing (industry best practice)
          try {
            const { processPdfJobVercelNative } = await import('@/lib/pdfVercelWorker');
            // Process asynchronously - don't await so we can return immediately
            processPdfJobVercelNative(sb, pdfJobInput).catch((error) => {
              log.error('Vercel-native PDF generation failed', { error, jobId: downloadToken });
            });
            responseStatus = 'pending';
            responseNote = translator.t('api.pdf.processing');
          } catch (error) {
            log.error('Failed to start Vercel-native PDF processing', { error, jobId: downloadToken });
            responseStatus = 'pending';
            responseNote = translator.t('api.pdf.processing');
          }
        } else if (isVercel) {
          // Vercel but Vercel-native disabled - use Supabase Edge Function (already dispatched)
          responseStatus = 'pending';
          responseNote = translator.t('api.pdf.processing');
        } else {
          // Not Vercel - use inline Puppeteer fallback
          try {
            const inlineJob: PdfJobInput = {
              jobId: pdfJobInput.jobId,
              offerId: pdfJobInput.offerId,
              userId: pdfJobInput.userId,
              storagePath: pdfJobInput.storagePath,
              html: pdfJobInput.html,
              usagePeriodStart: pdfJobInput.usagePeriodStart,
              userLimit: pdfJobInput.userLimit,
              ...(pdfJobInput.callbackUrl !== undefined
                ? { callbackUrl: pdfJobInput.callbackUrl }
                : {}),
              ...(pdfJobInput.deviceId !== undefined ? { deviceId: pdfJobInput.deviceId } : {}),
              ...(pdfJobInput.deviceLimit !== undefined
                ? { deviceLimit: pdfJobInput.deviceLimit }
                : {}),
              ...(pdfJobInput.templateId !== undefined ? { templateId: pdfJobInput.templateId } : {}),
              ...(pdfJobInput.requestedTemplateId !== undefined
                ? { requestedTemplateId: pdfJobInput.requestedTemplateId }
                : {}),
              ...(pdfJobInput.metadata !== undefined ? { metadata: pdfJobInput.metadata } : {}),
            };

            const serviceClient = supabaseServiceRole();
            immediatePdfUrl = await processPdfJobInline(serviceClient, inlineJob);
            if (immediatePdfUrl) {
              responseStatus = 'completed';
              responseNote = translator.t('api.pdf.inlineCompleted');
              log.info('Inline PDF fallback completed successfully', {
                jobId: downloadToken,
                pdfUrl: immediatePdfUrl,
              });
            } else {
              log.error('Inline PDF fallback returned null PDF URL', {
                jobId: downloadToken,
              });
              throw new Error('PDF generation completed but no PDF URL was returned');
            }
          } catch (inlineError) {
            const inlineMessage =
              inlineError instanceof Error ? inlineError.message : String(inlineError);
            log.error('Inline PDF fallback error', inlineError);

            const limitMessage = normalizeUsageLimitError(inlineMessage, translator);
            if (limitMessage) {
              return NextResponse.json({ error: limitMessage }, { status: 402 });
            }

            // Offer text is already saved, return success with PDF failure indication
            const sectionsPayload = structuredSections ? sanitizeSectionsOutput(structuredSections) : null;
            return NextResponse.json({
              ok: true,
              id: offerId,
              pdfUrl: null,
              downloadToken,
              status: 'failed' as const,
              note: translator.t('errors.offer.savePdfFailed'),
              sections: sectionsPayload,
              textSaved: true, // Indicate that the text was saved even though PDF failed
            });
          }
        }
      }
    }

    const sectionsPayload = structuredSections ? sanitizeSectionsOutput(structuredSections) : null;

    // Verify offer exists with PDF URL in database (using service role)
    if (immediatePdfUrl) {
      const { data: verifyOffer, error: verifyError } = await sb
        .from('offers')
        .select('id, title, pdf_url, created_at')
        .eq('id', offerId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (verifyError) {
        log.warn('Failed to verify offer after PDF generation', { error: verifyError });
      } else if (verifyOffer) {
        log.info('Offer verification after PDF generation', {
          offerId: verifyOffer.id,
          title: verifyOffer.title,
          pdfUrl: verifyOffer.pdf_url,
          created_at: verifyOffer.created_at,
          matchesExpected: verifyOffer.pdf_url === immediatePdfUrl,
        });
        
        // Also verify it's queryable by checking if it appears in a list query (service role)
        const { data: listCheck, error: listError, count } = await sb
          .from('offers')
          .select('id, pdf_url', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('id', offerId)
          .maybeSingle();
        
        if (listError) {
          log.warn('Failed to verify offer in list query', { error: listError });
        } else if (listCheck) {
          log.info('Offer is queryable in list query (service role)', {
            offerId: listCheck.id,
            pdfUrl: listCheck.pdf_url,
          });
        } else {
          log.error('Offer not found in list query - possible RLS issue', { offerId });
        }
        
        // Also verify using authenticated user's context (simulate dashboard query)
        // Create a client with the user's access token to test RLS
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('propono_at')?.value;
        
        if (accessToken) {
          const { createClient } = await import('@supabase/supabase-js');
          const { envServer } = await import('@/env.server');
          const userClient = createClient(
            envServer.NEXT_PUBLIC_SUPABASE_URL,
            envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
              auth: { persistSession: false, autoRefreshToken: false },
              global: {
                headers: {
                  apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            },
          );
          
          const { data: userListCheck, error: userListError } = await userClient
            .from('offers')
            .select('id, pdf_url')
            .eq('user_id', user.id)
            .eq('id', offerId)
            .maybeSingle();
          
          if (userListError) {
            log.error('Offer NOT queryable with authenticated user context - RLS issue!', {
              offerId,
              error: userListError,
              errorMessage: userListError.message,
              errorCode: userListError.code,
            });
          } else if (userListCheck) {
            log.info('Offer is queryable with authenticated user context', {
              offerId: userListCheck.id,
              pdfUrl: userListCheck.pdf_url,
            });
          } else {
            log.error('Offer not found with authenticated user context - RLS blocking!', { offerId });
          }
        } else {
          log.warn('No access token found in cookies, skipping authenticated user context verification');
        }
      } else {
        log.error('Offer not found after PDF generation', { offerId });
      }
    }

    // Log final response state for debugging
    log.info('PDF generation response', {
      offerId,
      pdfUrl: immediatePdfUrl,
      status: responseStatus,
      note: responseNote,
      hasPdfUrl: !!immediatePdfUrl,
    });

    const response = NextResponse.json({
      ok: true,
      id: offerId,
      pdfUrl: immediatePdfUrl,
      downloadToken,
      status: responseStatus,
      note: responseNote,
      sections: sectionsPayload,
    });
    
    // Add rate limit headers to response
    if (rateLimitResult) {
      const { addRateLimitHeaders } = await import('@/lib/rateLimitMiddleware');
      addRateLimitHeaders(response, rateLimitResult);
    }
    
    // Add request ID to response headers
    response.headers.set('x-request-id', requestId);
    
    return response;
  } catch (error) {
    return handleUnexpectedError(error, requestId, log);
  }
  }),
);
