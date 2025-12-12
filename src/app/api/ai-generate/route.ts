import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
// Use shared pricing utilities and the unified HTML template system.
// Pricing calculations remain in `app/lib/pricing.ts`, while templates
// live under `lib/offers/templates`.
import { PriceRow } from '@/app/lib/pricing';
import type { TemplateId } from '@/lib/offers/templates/types';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import OpenAI, { APIError } from 'openai';
import type { ResponseFormatTextJSONSchemaConfig } from 'openai/resources/responses/responses';
import { envServer } from '@/env.server';
import { ensureSafeHtml, sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { convertSectionsToBlocks } from '@/lib/ai/blocks';
import { getUserProfile } from '@/lib/services/user';
import { moderateUserInput } from '@/lib/security/contentModeration';
import {
  currentMonthStart,
  getUsageSnapshot,
  syncUsageCounter,
  checkQuotaWithPending,
  checkDeviceQuotaWithPending,
} from '@/lib/services/usage';
import { resolveEffectivePlan, getMonthlyOfferLimit } from '@/lib/subscription';
import { t, createTranslator, resolveLocale, type Translator } from '@/copy';
import {
  emptyProjectDetails,
  formatProjectDetailsForPrompt,
  projectDetailFields,
  projectDetailsSchema,
  type ProjectDetails,
} from '@/lib/projectDetails';
import { allowCategory } from '@/lib/consent/server';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { checkRateLimitMiddleware, createRateLimitResponse } from '@/lib/rateLimitMiddleware';
import { RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimiting';
import { withRequestSizeLimit } from '@/lib/requestSizeLimit';
import { z } from 'zod';
import { renderSectionHeading } from '@/app/lib/offerSections';
import { createLogger } from '@/lib/logger';
import { handleValidationError } from '@/lib/errorHandling';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';

export const runtime = 'nodejs';

// These messages are now in translation files - use createTranslator() at call site

// Template resolution is now handled by shared utility

function _normalizeUsageLimitError(
  message: string | undefined,
  translator?: Translator,
): string | null {
  if (!message) return null;
  const normalized = message.toLowerCase();

  if (normalized.includes('eszközön elérted a havi ajánlatlimitálást')) {
    return (
      translator?.t('quotaWarningBar.message.device') ??
      'Elérted az eszközön a havi ajánlatlimitálást. Frissíts előfizetésedet, hogy továbbra is készíthess ajánlatokat.'
    );
  }

  if (normalized.includes('havi ajánlatlimitálás')) {
    return (
      translator?.t('quotaWarningBar.message.user') ??
      'Elérted a havi ajánlatlimitálást. Frissíts előfizetésedet, hogy továbbra is készíthess ajánlatokat.'
    );
  }

  return null;
}

// System prompt for our OpenAI assistant.  The model should populate the
// JSON schema defined below using természetes, gördülékeny magyar üzleti
// nyelv.  HTML-t nem kell visszaadni, azt a szerver állítja elő a
// struktúrált mezőkből.
const SYSTEM_PROMPT = `
Te egy tapasztalt magyar üzleti ajánlatíró asszisztens vagy, aki professzionális, 
magas színvonalú ajánlatokat készít magyar vállalkozások számára, amelyek magas konverziós arányt érnek el.

ÉRTÉKPROPOZÍCIÓ ÉS HASZNOK (2025 Best Practices):
- Mindig a hasznokra és előnyökre fókuszálj, ne a funkciókra vagy jellemzőkre!
- Mutasd be, hogyan oldja meg az ajánlat a vevő problémáját vagy igényét.
- Használj konkrét, mérhető eredményeket és előnyöket, ahol lehetséges:
  * Számokkal: "30% növekedés", "50% időmegtakarítás", "100+ ügyfél"
  * Időkeretekkel: "2 hét alatt", "1 hónapon belül", "3 napos válaszidő"
  * Minőségi javulásokkal: "professzionális megjelenés", "növelt megbízhatóság"
- A value_proposition mezőben (ha van) hangsúlyozd ki:
  * Mi az egyedi érték, amit ez az ajánlat nyújt?
  * Miért ez a megoldás jobb, mint más alternatívák?
  * Milyen konkrét előnyöket élvez a vevő?
- Használj "probléma-megoldás-eredmény" keretrendszert a projekt összefoglalóban.

NYELVI MINŐSÉG:
- Használj természetes, gördülékeny magyar üzleti nyelvet (ne tükörfordítást)!
- Kerüld az anglicizmusokat, helyette magyar kifejezéseket használj (pl. "feladat" helyett "task", "határidő" helyett "deadline").
- Használj üzleti szakszavakat és formális, de barátságos hangvételt.
- A szöveg legyen érthető, világos és logikusan felépített.
- Minden bekezdés legyen jól strukturált, 2-4 mondat hosszúságú.
- Használj történetmesélést és konkrét példákat a bizalom építéséhez, ahol releváns.

SZERKEZET ÉS TARTALOM:
- A bevezető mutassa be az ajánlat célját (2-3 mondat). Fontos: A címzés (pl. "Tisztelt Kovács Úr") külön blokkban jelenik meg a címzett neve és hangnem alapján - ne szerepeljen a bevezetőben!
- A projekt összefoglaló következzen a probléma-megoldás-eredmény keretrendszerben:
  * Mutasd be a problémát vagy igényt, amit a projekt megold
  * Ismertesd a javasolt megoldást
  * Vázold fel a várható eredményeket és előnyöket mérhető formában
- A felsorolásokban használj rövid, lényegretörő, konkrét pontokat.
- Minden szakasz legyen tartalmas és releváns a projekt kontextusához.
- A deliverables mezőben említsd meg a minőségi követelményeket vagy szabványokat, ahol releváns.
- Fontos: Az időbeosztás (schedule), garantia, testimonials és határidő külön blokkokban jelennek meg a beállításokból - ne generálj ezekre hivatkozásokat vagy tartalmat a szövegben!
- A zárás legyen udvarias, értékösszefoglaló és erősen cselekvésre ösztönző.

CSELEKVÉSRE ÖSZTÖNZÉS (CTA) - Optimalizálva 2025-re:
- A next_steps szakaszban használj konkrét, akcióorientált kifejezéseket:
  * Határidővel: "Kérjük, jelezze vissza a véleményét 2025. február 10-ig"
  * Időkerettel: "Várjuk a visszajelzését a következő 3 munkanapon belül"
  * Konkrét akcióval: "Kérjük, erősítse meg az elfogadást e-mailben"
  * Könnyű lépéssel: "Válaszoljon erre az e-mailre az elfogadáshoz"
- A zárásban szerepeljen egyértelmű következő lépés javaslat:
  * "Várjuk a visszajelzését" helyett "Kérjük, jelezze vissza véleményét [konkrét dátumig]"
  * Használj cselekvő igéket: "jelezze", "erősítse", "válaszoljon", "hívjon"
  * Kerüld a passzív vagy bizonytalan kifejezéseket: "lehet", "esetleg", "talán"
- Használj olyan kifejezéseket, amelyek konkrét cselekedetre ösztönöznek.

SZEMÉLYRE SZABÁS:
- Ha a vevő neve vagy cégneve elérhető, használd a bevezetőben (pl. "Tisztelt Kovács Úr" vagy "Tisztelt ABC Kft.").
- Ha a projekt részletekben van információ a vevő iparágáról vagy szektoráról, használd:
  * Releváns iparági példákat és referenciákat
  * Iparági specifikus terminológiát (de érthetően)

SZÓLÍTÁS KÖVETKEZETESSÉGE (KRITIKUS):
- A szólítás (tegeződés/magázódás) KÖVETKEZETESEN alkalmazandó a TELJES szövegben:
  * Minden bekezdésben, minden mondatban
  * A felsorolásokban, a next_steps-ben, a closing-ben
  * Nincs keverés: vagy teljesen tegeződés, vagy teljesen magázódás
- Példák tegeződésre: "te", "ti", "tiétek", "neked", "nektek", "kapsz", "kaptok"
- Példák magázódásra: "Ön", "Önök", "Önöké", "Önnek", "Önöknek", "kap", "kapnak"
- Figyelj a ragozásokra is: "készítettem neked" (tegeződés) vs "készítettem Önnek" (magázódás)
- A szólítás választása a felhasználó beállításai alapján történik - ezt KÖTELEZŐEN kövesd!

BIZALOM ÉS HITELESSÉG:
- Az expected_outcomes mezőben KÖTELEZŐEN használj mérhető, konkrét eredményeket (pl. "30% növekedés", "2 hét alatt")
- Használj bizalomépítő kifejezéseket: "biztosítjuk", "garantáljuk", "tapasztalatunk alapján"
- Fontos: A garantia, testimonials és időbeosztás (schedule) külön blokkokban jelennek meg, ne generálj ezekre hivatkozásokat a szövegben!

MÉRHETŐ EREDMÉNYEK ÉS METRIKÁK:
- Minden szakaszban, ahol lehetséges, használj konkrét, mérhető eredményeket:
  * Számokkal: "30% növekedés", "50% időmegtakarítás", "100+ ügyfél"
  * Időkeretekkel: "2 hét alatt", "1 hónapon belül", "3 napos válaszidő"
  * Minőségi javulásokkal: "professzionális megjelenés", "növelt megbízhatóság"
- Az expected_outcomes mezőben KÖTELEZŐEN használj mérhető eredményeket
- A value_proposition-ben említsd meg a konkrét előnyöket számokkal
- A project_summary-ben vázold fel a várható eredményeket mérhető formában
- Használj olyan metrikákat, amelyek a vevő számára érthetőek és relevánsak

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
  value_proposition: string; // Now required but can be empty string
  scope: string[];
  deliverables: string[];
  expected_outcomes?: string[];
  assumptions: string[];
  next_steps: string[];
  closing: string;
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
      'value_proposition',
      'scope',
      'deliverables',
      'expected_outcomes',
      'assumptions',
      'next_steps',
      'closing',
      'client_context',
    ],
    properties: {
      introduction: {
        type: 'string',
        description:
          'Rövid, udvarias bevezető bekezdés (2-3 mondat), amely bemutatja az ajánlat célját. Használj természetes, professzionális magyar nyelvet. Fontos: A címzés (pl. "Tisztelt Kovács Úr") külön blokkban jelenik meg - ne szerepeljen itt! A szólítást (tegeződés/magázódás) következetesen alkalmazd.',
        minLength: 50,
        maxLength: 300,
      },
      project_summary: {
        type: 'string',
        description:
          'A projekt céljának és hátterének részletes összefoglalása (3-5 mondat). Kövesse a probléma-megoldás-eredmény keretrendszert: mutassa be a problémát/igényt, a javasolt megoldást, és a várható eredményeket. Legyen informatív és meggyőző.',
        minLength: 100,
        maxLength: 500,
      },
      value_proposition: {
        type: 'string',
        description:
          'Az egyedi értékpropozíció és főbb előnyök rövid összefoglalása (2-3 mondat). Hangsúlyozd ki, hogyan oldja meg az ajánlat a vevő problémáját és milyen konkrét előnyöket nyújt. Használj mérhető eredményeket, ahol lehetséges. Ha nincs konkrét értékpropozíció, használj egy üres stringet.',
        minLength: 0,
        maxLength: 300,
      },
      scope: {
        type: 'array',
        minItems: 3,
        maxItems: 6,
        items: {
          type: 'string',
          description:
            'A projekt terjedelméhez tartozó kulcsfeladat vagy szolgáltatás. Minden pont legyen konkrét, mérhető és érthető (min. 20, max. 120 karakter).',
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
          description:
            'Egy konkrét, szállítandó eredmény vagy deliverable. Legyen specifikus és mérhető. Említsd meg a minőségi követelményeket vagy szabványokat, ahol releváns (min. 20, max. 120 karakter).',
          minLength: 20,
          maxLength: 120,
        },
      },
      expected_outcomes: {
        type: 'array',
        minItems: 0,
        maxItems: 5,
        items: {
          type: 'string',
          description:
            'Opcionális: Egy mérhető, konkrét várható eredmény vagy előny (pl. "30% növekedés", "2 hét alatt"). Legyen specifikus és kvantifikálható (min. 20, max. 100 karakter). Ha nincs releváns várható eredmény, adj vissza üres tömböt.',
          minLength: 20,
          maxLength: 100,
        },
      },
      assumptions: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'string',
          description:
            'Feltételezés vagy kizárás, amely fontos a projekt értékeléséhez. Legyen világos és konkrét (min. 20, max. 120 karakter).',
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
          description:
            'Következő lépés vagy teendő, amely cselekvésre ösztönzi a címzettet. Használj konkrét, akcióorientált kifejezéseket határidővel (pl. "Kérjük, jelezze vissza a véleményét 2025. február 10-ig"). Legyen konkrét és akcióorientált (min. 20, max. 100 karakter).',
          minLength: 20,
          maxLength: 100,
        },
      },
      closing: {
        type: 'string',
        description:
          'Udvarias, meggyőző záró bekezdés (2-3 mondat), amely összefoglalja az ajánlat értékét és erősen cselekvésre ösztönzi a címzettet. Tartalmazzon egyértelmű következő lépés javaslatot. Legyen pozitív és együttműködésre ösztönző.',
        minLength: 60,
        maxLength: 250,
      },
      client_context: {
        type: 'string',
        description:
          'Opcionális: Ügyfél-specifikus kontextus vagy kapcsolati információk, amelyek segíthetnek a személyre szabásban. Használd a bevezetőben vagy a projekt összefoglalóban, ha releváns. Ha nincs releváns kontextus, adj vissza üres stringet (max. 200 karakter).',
        minLength: 0,
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
    if (sections.value_proposition && sections.value_proposition.trim()) {
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
      ${
        sections.value_proposition && sections.value_proposition.trim()
          ? `<section class="offer-doc__section">
            ${renderSectionHeading(labels.valueProposition, 'valueProposition')}
            ${safeParagraphGroup([sections.value_proposition])}
          </section>`
          : ''
      }
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.scope, 'scope')}
        ${safeList(sections.scope)}
      </section>
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.deliverables, 'deliverables')}
        ${safeList(sections.deliverables)}
      </section>
      ${
        sections.expected_outcomes && sections.expected_outcomes.length > 0
          ? `<section class="offer-doc__section">
            ${renderSectionHeading(labels.expectedOutcomes, 'expectedOutcomes')}
            ${safeList(sections.expected_outcomes)}
          </section>`
          : ''
      }
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.assumptions, 'assumptions')}
        ${safeList(sections.assumptions)}
      </section>
      <section class="offer-doc__section">
        ${renderSectionHeading(labels.nextSteps, 'nextSteps')}
        ${safeList(sections.next_steps)}
        ${renderClosingNote(sections.closing)}
      </section>
    </div>
  `;

  return sanitizeHTML(html);
}

function _sanitizeSectionsOutput(sections: OfferSections): OfferSections {
  const sanitized: OfferSections = {
    introduction: sanitizeInput((sections.introduction || '').trim()),
    project_summary: sanitizeInput((sections.project_summary || '').trim()),
    value_proposition: sanitizeInput((sections.value_proposition || '').trim()),
    scope: (sections.scope || []).map((item) => sanitizeInput((item || '').trim())).filter(Boolean),
    deliverables: (sections.deliverables || [])
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean),
    assumptions: (sections.assumptions || [])
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean),
    next_steps: (sections.next_steps || [])
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean),
    closing: sanitizeInput((sections.closing || '').trim()),
  };

  // Conditionally add other optional properties only if they have values (for exactOptionalPropertyTypes)
  if (sections.expected_outcomes && sections.expected_outcomes.length > 0) {
    sanitized.expected_outcomes = sections.expected_outcomes
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean);
  }
  if (sections.client_context) {
    sanitized.client_context = sanitizeInput((sections.client_context || '').trim());
  }

  return sanitized;
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
    throw new ImageAssetError(translator.t('api.image.maxCount', { count: MAX_IMAGE_COUNT }), 400);
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
    imageAssets: z.preprocess(
      (value) => (value === null || value === undefined ? [] : value),
      z.array(imageAssetSchema).default([]),
    ),
    testimonials: z.preprocess(
      (value) => (value === null || value === undefined ? [] : value),
      z.array(z.string().trim()).default([]),
    ),
    schedule: z.preprocess(
      (value) => (value === null || value === undefined ? [] : value),
      z.array(z.string().trim()).default([]),
    ),
    guarantees: z.preprocess(
      (value) => (value === null || value === undefined ? [] : value),
      z.array(z.string().trim()).default([]),
    ),
    previewOnly: z.preprocess(
      (value) => value === true || value === 'true',
      z.boolean().default(false),
    ),
  })
  .strict();

const IMG_TAG_REGEX = /<img\b[^>]*>/gi;

async function applyImageAssetsToHtml(
  html: string,
  images: SanitizedImageAsset[],
): Promise<{
  pdfHtml: string;
  storedHtml: string;
}> {
  if (!images.length) {
    // No images - return HTML as-is for both PDF and storage
    return { pdfHtml: html, storedHtml: html };
  }

  // Optimize images before embedding (for PDF generation)
  const { optimizeImageDataUrlForPdf } = await import('@/lib/pdf/compression');
  const optimizedImages = await Promise.all(
    images.map(async (image) => {
      const optimizedDataUrl = await optimizeImageDataUrlForPdf(image.dataUrl, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 85,
      });
      return { ...image, dataUrl: optimizedDataUrl };
    }),
  );

  const imageMap = new Map(optimizedImages.map((image) => [image.key, image]));
  let pdfHtml = '';
  let storedHtml = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex for new execution
  IMG_TAG_REGEX.lastIndex = 0;

  while ((match = IMG_TAG_REGEX.exec(html)) !== null) {
    const [tag] = match;
    const beforeTag = html.slice(lastIndex, match.index);
    pdfHtml += beforeTag;
    storedHtml += beforeTag;

    const keyMatch =
      tag.match(/data-offer-image-key\s*=\s*"([^"]+)"/i) ||
      tag.match(/data-offer-image-key\s*=\s*'([^']+)'/i);
    if (keyMatch) {
      const key = keyMatch[1] ?? keyMatch[2];
      const asset = key ? imageMap.get(key) : undefined;
      if (asset) {
        const safeAlt = typeof asset.alt === 'string' ? sanitizeInput(asset.alt) : '';
        const altAttr = safeAlt ? ` alt="${safeAlt}"` : '';
        // Embed image as data URL in both PDF and stored HTML
        // This ensures images are always available when displaying offers
        const imgTag = `<img src="${asset.dataUrl}"${altAttr} />`;
        pdfHtml += imgTag;
        storedHtml += imgTag;
      } else {
        // Image key not found - remove the placeholder tag
        // Don't add anything to either HTML
      }
    } else {
      // No key attribute - keep original tag as-is
      pdfHtml += tag;
      storedHtml += tag;
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining HTML
  const remaining = html.slice(lastIndex);
  pdfHtml += remaining;
  storedHtml += remaining;

  ensureSafeHtml(pdfHtml, 'pdf html with embedded assets');
  ensureSafeHtml(storedHtml, 'stored html with embedded assets');

  return { pdfHtml, storedHtml };
}

export const POST = withAuth(
  withRequestSizeLimit(
    withAuthenticatedErrorHandling(async (req: AuthenticatedNextRequest) => {
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
          imageAssets,
          testimonials,
          schedule,
          guarantees,
          previewOnly,
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
          const status = error instanceof ImageAssetError ? error.status : HttpStatus.BAD_REQUEST;
          const message =
            error instanceof ImageAssetError
              ? error.message
              : translator.t('api.error.invalidImageUpload');
          return createErrorResponse(message, status);
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
              message:
                clientLookupError instanceof Error
                  ? clientLookupError.message
                  : String(clientLookupError),
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
          // Use authenticated client for usage counter sync
          // RLS policies should allow users to update their own usage counters
          // If this fails, we log a warning but continue (non-blocking)
          try {
            await syncUsageCounter(
              sb, // Use authenticated client instead of service role
              user.id,
              usageSnapshot.offersGenerated,
              usagePeriodStart,
            );
          } catch (syncError) {
            log.warn('Failed to sync usage counter before offer generation', {
              error: syncError,
              message: syncError instanceof Error ? syncError.message : String(syncError),
              // Note: If this fails due to RLS, we may need to review RLS policies
              // or use service role as fallback (with proper logging)
            });
          }
        }

        // Check quota for offer generation (skip if previewOnly)
        if (!previewOnly) {
          if (typeof planLimit === 'number' && Number.isFinite(planLimit)) {
            const quotaCheck = await checkQuotaWithPending(
              sb,
              user.id,
              planLimit,
              usagePeriodStart,
            );
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
        }

        log.info('Usage quota snapshot', {
          plan,
          limit: planLimit,
          confirmed: usageSnapshot.offersGenerated,
          periodStart: usagePeriodStart,
        });

        const sanitizedDetails = projectDetailFields.reduce<ProjectDetails>(
          (acc, key) => {
            acc[key] = sanitizeInput(projectDetails[key]);
            return acc;
          },
          { ...emptyProjectDetails },
        );

        // Content moderation: Check for malicious content before sending to OpenAI
        const moderationInput: Parameters<typeof moderateUserInput>[0] = {
          title,
          projectDetails: {
            overview: sanitizedDetails.overview || undefined,
            deliverables: sanitizedDetails.deliverables || undefined,
            timeline: sanitizedDetails.timeline || undefined,
            constraints: sanitizedDetails.constraints || undefined,
          },
          deadline: deadline || undefined,
          testimonials: testimonials && testimonials.length > 0 ? testimonials : undefined,
          schedule: schedule && schedule.length > 0 ? schedule : undefined,
          guarantees: guarantees && guarantees.length > 0 ? guarantees : undefined,
        };
        const moderationResult = moderateUserInput(moderationInput);

        if (!moderationResult.allowed) {
          log.warn('Content moderation blocked request', {
            userId: user.id,
            category: moderationResult.category,
            reason: moderationResult.reason,
          });
          return NextResponse.json(
            {
              error:
                moderationResult.reason ||
                'A tartalom nem megfelelő formátumú. Kérjük, módosítsd a szöveget.',
            },
            { status: 400 },
          );
        }

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

          // Check cache for identical requests
          const { hashAiRequest, getCachedAiResponse, storeAiResponse, hashPrompt } = await import(
            '@/lib/ai/cache'
          );
          const requestPayload = {
            title: safeTitle,
            projectDetails: sanitizedDetails,
            deadline,
            language,
            brandVoice,
            style,
            formality,
            testimonials,
            schedule,
            guarantees,
          };
          const requestHash = hashAiRequest(requestPayload);

          // Try to get cached response
          const cachedResponse = await getCachedAiResponse(sb, user.id, requestHash, log);
          if (cachedResponse) {
            const cacheStartTime = Date.now();

            log.info('Using cached AI response', {
              requestHash,
              cachedAt: cachedResponse.cachedAt,
            });
            aiHtml = cachedResponse.responseHtml;
            if (cachedResponse.responseBlocks) {
              // Restore structured sections from cache if available
              structuredSections = cachedResponse.responseBlocks as OfferSections;
            }

            // Record cache hit metrics
            const { recordAiGeneration } = await import('@/lib/ai/metrics');
            const cacheMetrics: Parameters<typeof recordAiGeneration>[0] = {
              duration: Date.now() - cacheStartTime,
              model: 'gpt-4o-mini',
              cacheHit: true,
              retries: 0,
            };
            if (cachedResponse.tokenCount) {
              cacheMetrics.tokens = {
                prompt: 0,
                completion: 0,
                total: cachedResponse.tokenCount,
              };
            }
            recordAiGeneration(cacheMetrics, log);
          }

          // If no cached response, generate new one
          if (!cachedResponse) {
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
            const safeProjectDetails = formatProjectDetailsForPrompt(sanitizedDetails);

            const clientInfo = clientCompanyName
              ? `Ügyfél/Cég neve: ${sanitizeInput(clientCompanyName)}\n`
              : '';

            // Note: Testimonials, guarantees, schedule, and deadline are NOT included in the prompt
            // They are separate blocks that will be inserted from settings as-is
            // The AI should only generate the base text content

            const userPrompt = `
Feladat: Készíts egy professzionális magyar üzleti ajánlat ALAP SZÖVEGÉT az alábbi információk alapján. 
Fontos: Csak a szöveges tartalmat generáld - a garantia, testimonials, időbeosztás és határidő külön blokkokban jelennek meg a beállításokból.

Nyelv: ${normalizedLanguage}
${toneGuidance}
${formalityGuidance}
Ajánlat címe: ${safeTitle}
${clientInfo}Projekt részletek:
${safeProjectDetails || '—'}

${styleAddon}

Különös figyelmet fordít a következőkre (2025 conversion rate optimization best practices):
- Használj természetes, folyékony magyar nyelvet, kerülve az anglicizmusokat
- Minden szakasz legyen logikusan felépített és egymásra épülő
- A felsorolások pontjai legyenek konkrétak, mérhetők és érthetők
- Használj mérhető eredményeket mindenhol, ahol lehetséges (számok, időkeretek)
- A szöveg legyen meggyőző, de nem túlzottan marketinges
- Ne találj ki árakat, az árképzés külön jelenik meg az alkalmazásban
- Ha ügyfél/cég neve van megadva, használd a bevezetőben a személyre szabáshoz
- A szólítást (tegeződés/magázódás) KÖVETKEZETESEN alkalmazd a TELJES szövegben - minden mondatban, minden bekezdésben
- A value_proposition-ben hangsúlyozd ki az egyedi értéket és konkrét előnyöket
- Az expected_outcomes-ben KÖTELEZŐEN használj mérhető eredményeket
- A next_steps-ben használj konkrét, akcióorientált kifejezéseket
- Fontos: Ne hivatkozz garantia, testimonials vagy időbeosztás blokkokra - ezek külön jelennek meg!
`;

            try {
              // Import retry utility and metrics
              const { retryWithBackoff, DEFAULT_API_RETRY_CONFIG } = await import(
                '@/lib/api/retry'
              );
              const { recordAiGeneration, extractTokenUsage } = await import('@/lib/ai/metrics');

              // Track generation start time for metrics
              const generationStartTime = Date.now();
              let retryCount = 0;

              // Wrap OpenAI API call with retry logic
              const response = await retryWithBackoff(
                () =>
                  openai.responses.parse({
                    model: 'gpt-4o-mini',
                    temperature: 0.7, // Increased for more natural, creative but still professional output
                    input: [
                      { role: 'system', content: SYSTEM_PROMPT },
                      { role: 'user', content: userPrompt },
                    ],
                    text: { format: OFFER_SECTIONS_FORMAT },
                  }),
                DEFAULT_API_RETRY_CONFIG,
                (attempt, retryError, delayMs) => {
                  retryCount = attempt;
                  log.warn('OpenAI API call failed, retrying', {
                    attempt,
                    delayMs,
                    error: retryError instanceof Error ? retryError.message : String(retryError),
                  });
                },
              );

              structuredSections = response.output_parsed as OfferSections | null;
              if (!structuredSections) {
                throw new Error('Structured output missing');
              }

              aiHtml = sectionsToHtml(
                structuredSections,
                style === 'compact' ? 'compact' : 'detailed',
                translator,
              );

              // Record metrics
              const generationDuration = Date.now() - generationStartTime;
              const tokenUsage = extractTokenUsage(
                response as {
                  usage?: {
                    prompt_tokens?: number;
                    completion_tokens?: number;
                    total_tokens?: number;
                  };
                },
              );

              const generationMetrics: Parameters<typeof recordAiGeneration>[0] = {
                duration: generationDuration,
                model: 'gpt-4o-mini',
                cacheHit: false,
                retries: retryCount,
              };
              if (tokenUsage) {
                generationMetrics.tokens = tokenUsage;
              }
              recordAiGeneration(generationMetrics, log);

              // Store response in cache for future requests
              const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;
              const promptHash = hashPrompt(fullPrompt);

              // Store asynchronously to not block response
              storeAiResponse(
                sb,
                user.id,
                requestHash,
                promptHash,
                aiHtml,
                { ttlSeconds: 3600 }, // Cache for 1 hour
                {
                  responseBlocks: structuredSections,
                  model: 'gpt-4o-mini',
                },
                log,
              ).catch((cacheError) => {
                log.warn('Failed to cache AI response (non-blocking)', {
                  error: cacheError instanceof Error ? cacheError.message : String(cacheError),
                  requestHash,
                });
              });
            } catch (error) {
              log.error('OpenAI structured output error', error);

              // Handle specific API errors
              if (error instanceof APIError) {
                const status = typeof error.status === 'number' ? error.status : 500;
                const errorMessage =
                  typeof error.message === 'string' && error.message.trim().length > 0
                    ? error.message
                    : error.error && typeof error.error === 'object'
                      ? String((error.error as { message?: unknown }).message ?? 'OpenAI API hiba')
                      : 'OpenAI API hiba';

                // Handle 403 Forbidden errors specifically
                if (status === 403) {
                  log.error('OpenAI API 403 Forbidden error', {
                    status: error.status,
                    code: error.code,
                    message: error.message,
                    type: error.type,
                  });
                  return createErrorResponse(
                    'Az OpenAI API kulcs érvénytelen vagy nincs engedélyezve. Kérjük, ellenőrizd az API kulcsot és a fiók beállításait.',
                    HttpStatus.FORBIDDEN,
                  );
                }

                // Handle other API errors
                return createErrorResponse(
                  errorMessage || 'OpenAI API hiba történt. Próbáld újra később.',
                  status,
                );
              }

              // Handle non-API errors
              return createErrorResponse(
                'OpenAI struktúrált válasz sikertelen. Próbáld újra később.',
                HttpStatus.BAD_GATEWAY,
              );
            }
          }
        }

        // ---- Ár tábla adatok ----
        const rows: PriceRow[] = prices;

        // If we have image assets but the HTML doesn't contain image placeholders,
        // inject them into the HTML at strategic locations
        // This handles the case where reference images are uploaded but not yet inserted into the HTML
        let htmlWithImagePlaceholders = aiHtml;
        if (sanitizedImageAssets.length > 0) {
          // Check if HTML already has image placeholders with data-offer-image-key
          const hasImagePlaceholders = /data-offer-image-key/i.test(aiHtml);
          if (!hasImagePlaceholders) {
            // Inject image placeholders into the HTML
            // Insert after the first section (introduction/project summary area) for better visual placement
            const firstSectionEnd = aiHtml.indexOf('</section>');
            if (firstSectionEnd !== -1) {
              // Insert images after the first section
              const imagePlaceholders = sanitizedImageAssets
                .map(
                  (img, idx) =>
                    `<img data-offer-image-key="${sanitizeInput(img.key)}" alt="${sanitizeInput(img.alt || `Image ${idx + 1}`)}" />`,
                )
                .join('');
              htmlWithImagePlaceholders =
                aiHtml.slice(0, firstSectionEnd + '</section>'.length) +
                imagePlaceholders +
                aiHtml.slice(firstSectionEnd + '</section>'.length);
            } else {
              // If no sections found, insert at the beginning of the content
              const imagePlaceholders = sanitizedImageAssets
                .map(
                  (img, idx) =>
                    `<img data-offer-image-key="${sanitizeInput(img.key)}" alt="${sanitizeInput(img.alt || `Image ${idx + 1}`)}" />`,
                )
                .join('');
              htmlWithImagePlaceholders = imagePlaceholders + aiHtml;
            }
          }
        }

        const { storedHtml: aiHtmlForStorage } = await applyImageAssetsToHtml(
          htmlWithImagePlaceholders,
          sanitizedImageAssets,
        );

        // If previewOnly, return just the AI HTML without saving
        if (previewOnly) {
          log.info('Preview-only mode: returning AI HTML without saving', {
            userId: user.id,
            title: safeTitle,
          });

          const response = NextResponse.json({
            ok: true,
            previewHtml: aiHtmlForStorage,
            structuredSections: structuredSections || null,
          });

          // Add rate limit headers to response
          if (rateLimitResult) {
            const { addRateLimitHeaders } = await import('@/lib/rateLimitMiddleware');
            addRateLimitHeaders(response, rateLimitResult);
          }

          // Add request ID to response headers
          response.headers.set('x-request-id', requestId);

          return response;
        }

        // Prepare AI blocks for storage (if we have structured sections)
        let aiBlocksForStorage: unknown = {};
        if (structuredSections) {
          const blocks = convertSectionsToBlocks(structuredSections);
          // Convert to JSON-serializable format
          aiBlocksForStorage = JSON.parse(JSON.stringify(blocks));
        }

        // Sanitize user-provided content
        const sanitizedSchedule = Array.isArray(schedule)
          ? schedule.map((item) => sanitizeInput(item)).filter(Boolean)
          : [];
        const sanitizedTestimonials =
          Array.isArray(testimonials) && testimonials.length > 0
            ? testimonials.map((item) => sanitizeInput(item)).filter(Boolean)
            : null;
        const sanitizedGuarantees =
          Array.isArray(guarantees) && guarantees.length > 0
            ? guarantees.map((item) => sanitizeInput(item)).filter(Boolean)
            : null;

        // ---- Offer creation ----
        const offerId = randomUUID();

        // Resolve template ID for saving (used for PDF generation later from dashboard)
        const normalizedRequestedTemplateId =
          typeof templateId === 'string' && templateId.trim().length > 0
            ? (templateId.trim() as TemplateId)
            : null;

        // Use centralized template resolution
        let resolveOfferTemplate;
        try {
          const templateResolutionModule = await import('@/lib/offers/templateResolution');
          resolveOfferTemplate = templateResolutionModule.resolveOfferTemplate;
          if (!resolveOfferTemplate || typeof resolveOfferTemplate !== 'function') {
            throw new Error('resolveOfferTemplate is not a function');
          }
        } catch (importError) {
          log.error('Failed to import template resolution module', importError, {
            offerId,
            userId: user.id,
          });
          return NextResponse.json(
            {
              error: t('errors.offer.saveFailed'),
              details: 'Template resolution module failed to load',
            },
            { status: 500 },
          );
        }

        let templateResolution;
        try {
          templateResolution = resolveOfferTemplate({
            requestedTemplateId: normalizedRequestedTemplateId,
            profileTemplateId:
              typeof profile?.offer_template === 'string' ? profile.offer_template : null,
            plan,
            offerId,
            userId: user.id,
          });
        } catch (resolutionError) {
          log.error('Template resolution failed', resolutionError, {
            offerId,
            userId: user.id,
            requestedTemplateId: normalizedRequestedTemplateId,
          });
          return NextResponse.json(
            {
              error: t('errors.offer.saveFailed'),
              details: 'Template resolution failed',
            },
            { status: 500 },
          );
        }

        // Validate requested template exists (if one was requested)
        if (normalizedRequestedTemplateId && templateResolution.wasFallback) {
          return NextResponse.json(
            {
              error: 'A kért sablon nem található. Kérlek válassz egy elérhető sablont.',
            },
            { status: 400 },
          );
        }

        const resolvedTemplateId = templateResolution.templateId;

        // ---- Ajánlat mentése ----
        // Use authenticated client to respect RLS policies (security best practice)
        // Manually validate user_id matches authenticated user (defense in depth)
        log.info('Attempting to insert offer', {
          offerId,
          userId: user.id,
          title: safeTitle,
        });

        // Security: Ensure user_id matches authenticated user
        if (user.id !== req.user.id) {
          log.error('User ID mismatch - potential security issue', {
            authenticatedUserId: req.user.id,
            providedUserId: user.id,
            offerId,
          });
          return NextResponse.json(
            {
              error: t('errors.offer.saveFailed'),
              details: 'Authentication mismatch',
            },
            { status: 403 },
          );
        }

        const { data: insertedOffer, error: offerInsertError } = await sb
          .from('offers')
          .insert({
            id: offerId,
            user_id: user.id,
            created_by: user.id,
            title: safeTitle,
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
            ai_blocks: aiBlocksForStorage,
            schedule: sanitizedSchedule,
            testimonials: sanitizedTestimonials,
            guarantees: sanitizedGuarantees,
            price_json: rows,
            pdf_url: null,
            status: 'draft',
          })
          .select('id, user_id, title, created_at')
          .single();

        if (offerInsertError) {
          log.error('Offer insert error', offerInsertError, {
            offerId,
            userId: user.id,
            errorMessage: offerInsertError.message,
            errorCode: offerInsertError.code,
            errorDetails: offerInsertError.details,
            errorHint: offerInsertError.hint,
          });
          return NextResponse.json(
            {
              error: t('errors.offer.saveFailed'),
              details: offerInsertError.message,
            },
            { status: 500 },
          );
        }

        if (!insertedOffer) {
          log.error('Offer insert returned no data and no error - possible RLS issue', {
            offerId,
            userId: user.id,
          });
          return NextResponse.json(
            {
              error: t('errors.offer.saveFailed'),
              details: 'Offer insert returned no data',
            },
            { status: 500 },
          );
        }

        // Security: Verify the inserted offer belongs to the authenticated user
        if (insertedOffer.user_id !== user.id) {
          log.error('CRITICAL: Inserted offer user_id does not match authenticated user', {
            offerId: insertedOffer.id,
            insertedUserId: insertedOffer.user_id,
            authenticatedUserId: user.id,
          });
          return NextResponse.json(
            {
              error: t('errors.offer.saveFailed'),
              details: 'Security validation failed',
            },
            { status: 500 },
          );
        }

        // Verify the offer was actually saved by querying it back
        // Use authenticated client first (respects RLS)
        // Use a small delay to ensure trigger has completed
        await new Promise((resolve) => setTimeout(resolve, 100));

        const { data: verifyOffer, error: verifyError } = await sb
          .from('offers')
          .select('id, user_id, title, created_at')
          .eq('id', offerId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (verifyError) {
          log.error('Failed to verify offer after insert (authenticated client)', {
            error: verifyError,
            offerId,
            userId: user.id,
            errorMessage: verifyError.message,
            errorCode: verifyError.code,
            errorDetails: verifyError.details,
            errorHint: verifyError.hint,
          });

          // Fallback: Try with service role client to diagnose RLS issues
          const sbService = supabaseServiceRole();
          const { data: serviceVerifyOffer, error: serviceVerifyError } = await sbService
            .from('offers')
            .select('id, user_id, title, created_at')
            .eq('id', offerId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (serviceVerifyError || !serviceVerifyOffer) {
            log.error(
              'CRITICAL: Offer not found even with service role - transaction rollback or trigger failure',
              {
                offerId,
                userId: user.id,
                authenticatedError: verifyError.message,
                serviceRoleError: serviceVerifyError?.message,
              },
            );
            return NextResponse.json(
              {
                error: t('errors.offer.saveFailed'),
                details: 'Offer was not saved to database',
              },
              { status: 500 },
            );
          } else {
            log.warn(
              'Offer found with service role but not authenticated client - possible RLS policy issue',
              {
                offerId,
                userId: user.id,
                authenticatedError: verifyError.message,
              },
            );
            // Offer exists, continue (but log the RLS issue for investigation)
          }
        } else if (!verifyOffer) {
          log.error(
            'CRITICAL: Offer not found after insert - transaction rollback or trigger failure',
            {
              offerId,
              userId: user.id,
              insertedOffer,
            },
          );
          return NextResponse.json(
            {
              error: t('errors.offer.saveFailed'),
              details: 'Offer was not saved to database',
            },
            { status: 500 },
          );
        } else {
          log.info('Offer successfully inserted and verified', {
            offerId: verifyOffer.id,
            userId: verifyOffer.user_id,
            title: verifyOffer.title,
            created_at: verifyOffer.created_at,
          });
        }

        // Ensure default share link exists (fallback if trigger failed)
        // The trigger should create it automatically, but we verify and create if missing
        // Try authenticated client first, fall back to service role only if needed
        try {
          // First try with authenticated client (respects RLS)
          const { data: existingShare, error: shareCheckError } = await sb
            .from('offer_shares')
            .select('id, token')
            .eq('offer_id', offerId)
            .eq('is_active', true)
            .maybeSingle();

          let shareToUse = existingShare;

          // If authenticated client fails, try service role as fallback (for diagnosis)
          if (shareCheckError || !existingShare) {
            if (shareCheckError) {
              log.warn('Error checking for existing share link with authenticated client', {
                offerId,
                userId: user.id,
                error: shareCheckError.message,
                errorCode: shareCheckError.code,
              });
            }

            // Fallback: Check with service role to see if share exists but RLS is blocking
            const sbService = supabaseServiceRole();
            const { data: serviceShare, error: serviceShareError } = await sbService
              .from('offer_shares')
              .select('id, token')
              .eq('offer_id', offerId)
              .eq('is_active', true)
              .maybeSingle();

            if (serviceShareError) {
              log.warn('Error checking for existing share link with service role', {
                offerId,
                userId: user.id,
                error: serviceShareError.message,
                errorCode: serviceShareError.code,
              });
            } else if (serviceShare && !existingShare) {
              log.warn(
                'Share found with service role but not authenticated client - possible RLS issue',
                {
                  offerId,
                  userId: user.id,
                },
              );
              shareToUse = serviceShare;
            }
          }

          if (!shareToUse) {
            log.warn('Default share not found after offer creation, creating fallback share', {
              offerId,
              userId: user.id,
              requestId,
            });

            // Use authenticated client first for share creation (respects RLS)
            const { randomBytes } = await import('crypto');
            const token = randomBytes(32).toString('base64url');

            const { data: insertedShare, error: shareError } = await sb
              .from('offer_shares')
              .insert({
                offer_id: offerId,
                user_id: user.id,
                token,
                expires_at: null,
                is_active: true,
              })
              .select('id, token')
              .single();

            if (shareError) {
              // Check if the error is a foreign key constraint violation
              // This would indicate the offer doesn't actually exist in the database
              const isForeignKeyError =
                shareError.code === '23503' ||
                (typeof shareError.message === 'string' &&
                  shareError.message.includes('foreign key constraint'));

              if (isForeignKeyError) {
                log.error(
                  'CRITICAL: Failed to create fallback share - offer does not exist in database',
                  {
                    offerId,
                    userId: user.id,
                    error: shareError,
                    errorMessage: shareError.message,
                    errorCode: shareError.code,
                    errorDetails: shareError.details,
                    errorHint: shareError.hint,
                  },
                );
                // This is a critical error - the offer was not actually saved
                return NextResponse.json(
                  {
                    error: t('errors.offer.saveFailed'),
                    details: 'Offer was not saved to database (foreign key constraint failed)',
                  },
                  { status: 500 },
                );
              } else {
                // Non-foreign-key error (likely RLS or permissions) - try service role as fallback
                log.warn(
                  'Failed to create fallback share link with authenticated client, trying service role',
                  {
                    offerId,
                    userId: user.id,
                    error: shareError.message,
                    errorCode: shareError.code,
                  },
                );

                // Fallback: Try with service role (only for share creation, not offer creation)
                const sbService = supabaseServiceRole();
                const { data: fallbackShare, error: fallbackError } = await sbService
                  .from('offer_shares')
                  .insert({
                    offer_id: offerId,
                    user_id: user.id,
                    token,
                    expires_at: null,
                    is_active: true,
                  })
                  .select('id, token')
                  .single();

                if (fallbackError) {
                  log.error('Failed to create fallback share link even with service role', {
                    offerId,
                    userId: user.id,
                    error: fallbackError.message,
                    errorCode: fallbackError.code,
                  });
                  // Don't fail the request - offer is created, share can be created later
                } else if (fallbackShare) {
                  log.info('Fallback share link created successfully with service role', {
                    offerId,
                    shareId: fallbackShare.id,
                    token: fallbackShare.token.substring(0, 8) + '...',
                  });
                  shareToUse = fallbackShare;
                }
              }
            } else if (!insertedShare) {
              log.error('Fallback share insert returned no data and no error', {
                offerId,
                userId: user.id,
              });
            } else {
              log.info('Fallback share link created successfully', {
                offerId,
                shareId: insertedShare.id,
                token: insertedShare.token.substring(0, 8) + '...',
              });
              shareToUse = insertedShare;
            }
          } else {
            log.info('Default share link found after offer creation', {
              offerId,
              shareId: shareToUse.id,
              token: shareToUse.token.substring(0, 8) + '...',
            });
          }
        } catch (shareCheckError) {
          log.error('Error checking/creating default share link', {
            offerId,
            userId: user.id,
            error:
              shareCheckError instanceof Error ? shareCheckError.message : String(shareCheckError),
            stack: shareCheckError instanceof Error ? shareCheckError.stack : undefined,
          });
          // Don't fail the request - offer is created, share can be created later
        }

        // Offer saved successfully - return success response
        log.info('Offer created successfully', {
          offerId,
          userId: user.id,
          title: safeTitle,
        });

        const response = NextResponse.json({
          ok: true,
          id: offerId,
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
        // Re-throw to be handled by withAuthenticatedErrorHandling
        throw error;
      }
    }),
  ),
);
