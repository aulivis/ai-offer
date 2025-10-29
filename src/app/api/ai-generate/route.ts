import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
// Use shared pricing utilities and the pluggable PDF template engine.
// Pricing calculations remain in `app/lib/pricing.ts`, while templates
// live under `app/pdf/templates`.
import { PriceRow } from '@/app/lib/pricing';
import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { listTemplates, loadTemplate } from '@/app/pdf/templates/registry';
import { createThemeTokens, normalizeBranding } from '@/app/pdf/templates/theme';
import type { OfferTemplate, TemplateId, TemplateTier } from '@/app/pdf/templates/types';
import { type SubscriptionPlan } from '@/app/lib/offerTemplates';
import OpenAI from 'openai';
import type { ResponseFormatTextJSONSchemaConfig } from 'openai/resources/responses/responses';
import { v4 as uuid } from 'uuid';
import { envServer } from '@/env.server';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { formatOfferIssueDate } from '@/lib/datetime';
import { getUserProfile } from '@/lib/services/user';
import { currentMonthStart, getDeviceUsageSnapshot, getUsageSnapshot } from '@/lib/services/usage';
import {
  countPendingPdfJobs,
  dispatchPdfJob,
  enqueuePdfJob,
  type PdfJobInput,
} from '@/lib/queue/pdf';
import { PdfWebhookValidationError, validatePdfWebhookUrl } from '@/lib/pdfWebhook';
import { processPdfJobInline } from '@/lib/pdfInlineWorker';
import { resolveEffectivePlan } from '@/lib/subscription';
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
import { z } from 'zod';
import { renderSectionHeading } from '@/app/lib/offerSections';

export const runtime = 'nodejs';

const USER_LIMIT_RESPONSE = 'Elérted a havi ajánlatlimitálást a csomagban.';
const DEVICE_LIMIT_RESPONSE = 'Elérted a havi ajánlatlimitálást ezen az eszközön.';

const DEFAULT_TEMPLATE_ID: TemplateId = 'free.base@1.0.0';

function planToTemplateTier(plan: SubscriptionPlan): TemplateTier {
  return plan === 'pro' ? 'premium' : 'free';
}

function findTemplateIdByLegacyId(
  templates: Array<OfferTemplate & { legacyId?: string }>,
  legacyId: string | null | undefined,
): TemplateId | null {
  if (typeof legacyId !== 'string' || legacyId.trim().length === 0) {
    return null;
  }

  const normalized = legacyId.trim();
  const match = templates.find((template) => template.legacyId === normalized);
  return match ? match.id : null;
}

function normalizeUsageLimitError(message: string | undefined): string | null {
  if (!message) return null;
  const normalized = message.toLowerCase();

  if (normalized.includes('eszközön elérted a havi ajánlatlimitálást')) {
    return DEVICE_LIMIT_RESPONSE;
  }

  if (normalized.includes('havi ajánlatlimitálás')) {
    return USER_LIMIT_RESPONSE;
  }

  return null;
}

// System prompt for our OpenAI assistant.  The model should populate the
// JSON schema defined below using természetes, gördülékeny magyar üzleti
// nyelv.  HTML-t nem kell visszaadni, azt a szerver állítja elő a
// struktúrált mezőkből.
const SYSTEM_PROMPT = `
Te egy magyar üzleti ajánlatíró asszisztens vagy.
Használj természetes, gördülékeny magyar üzleti nyelvet (ne tükörfordítást)!
Kerüld az anglicizmusokat, helyette magyar kifejezéseket használj.
A megadott JSON sémát töltsd ki: minden mező magyar szöveg legyen, HTML jelölés nélkül.
A felsorolás típusú mezők rövid, lényegretörő pontokat tartalmazzanak.
Ne találj ki árakat; az árképzés külön jelenik meg az alkalmazásban.
`;

type OfferSections = {
  introduction: string;
  project_summary: string;
  scope: string[];
  deliverables: string[];
  schedule: string[];
  assumptions: string[];
  next_steps: string[];
  closing: string;
};

const OFFER_SECTIONS_FORMAT: ResponseFormatTextJSONSchemaConfig = {
  type: 'json_schema',
  name: 'offer_sections',
  description: 'Strukturált magyar ajánlati szekciók',
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
        description: 'Rövid bevezető bekezdés a címzett köszöntésével.',
      },
      project_summary: {
        type: 'string',
        description: 'A projekt céljának és hátterének összefoglalása.',
      },
      scope: {
        type: 'array',
        minItems: 3,
        items: {
          type: 'string',
          description: 'Terjedelemhez tartozó kulcsfeladat.',
        },
      },
      deliverables: {
        type: 'array',
        minItems: 3,
        items: {
          type: 'string',
          description: 'A szállítandó eredmények felsorolása.',
        },
      },
      schedule: {
        type: 'array',
        minItems: 3,
        items: {
          type: 'string',
          description: 'Kulcs mérföldkövek és céldátumok.',
        },
      },
      assumptions: {
        type: 'array',
        minItems: 3,
        items: {
          type: 'string',
          description: 'Feltételezések és kizárások.',
        },
      },
      next_steps: {
        type: 'array',
        minItems: 2,
        items: {
          type: 'string',
          description: 'Következő lépések, teendők.',
        },
      },
      closing: {
        type: 'string',
        description: 'Udvarias záró bekezdés cselekvésre ösztönzéssel.',
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
    scope: i18n.t('pdf.templates.sections.scope'),
    deliverables: i18n.t('pdf.templates.sections.deliverables'),
    timeline: i18n.t('pdf.templates.sections.timeline'),
    assumptions: i18n.t('pdf.templates.sections.assumptions'),
    nextSteps: i18n.t('pdf.templates.sections.nextSteps'),
  } as const;

  if (style === 'compact') {
    const overviewContent = safeParagraphGroup([sections.introduction, sections.project_summary]);
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
        </section>
      </div>
    `;

    return sanitizeHTML(html);
  }

  const html = `
    ${renderSectionHeading(labels.overview, 'overview')}
    ${safeParagraphGroup([sections.introduction, sections.project_summary])}
    ${renderSectionHeading(labels.scope, 'scope')}
    ${safeList(sections.scope)}
    ${renderSectionHeading(labels.deliverables, 'deliverables')}
    ${safeList(sections.deliverables)}
    ${renderSectionHeading(labels.timeline, 'timeline')}
    ${safeList(sections.schedule)}
    ${renderSectionHeading(labels.assumptions, 'assumptions')}
    ${safeList(sections.assumptions)}
    ${renderSectionHeading(labels.nextSteps, 'nextSteps')}
    ${safeList(sections.next_steps)}
    ${renderClosingNote(sections.closing)}
  `;

  return sanitizeHTML(html);
}

function sanitizeSectionsOutput(sections: OfferSections): OfferSections {
  return {
    introduction: sanitizeInput((sections.introduction || '').trim()),
    project_summary: sanitizeInput((sections.project_summary || '').trim()),
    scope: (sections.scope || []).map((item) => sanitizeInput((item || '').trim())).filter(Boolean),
    deliverables: (sections.deliverables || [])
      .map((item) => sanitizeInput((item || '').trim()))
      .filter(Boolean),
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
    throw new ImageAssetError('Érvénytelen képadatok érkeztek.');
  }

  if (!input.length) {
    return [];
  }

  if (plan !== 'pro') {
    throw new ImageAssetError('Képfeltöltés csak Pro előfizetéssel érhető el.', 403);
  }

  if (input.length > MAX_IMAGE_COUNT) {
    throw new ImageAssetError(`Legfeljebb ${MAX_IMAGE_COUNT} kép tölthető fel.`, 400);
  }

  const seenKeys = new Set<string>();
  const sanitized: SanitizedImageAsset[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') {
      throw new ImageAssetError('Hiányos képadatok érkeztek.');
    }

    const key =
      typeof (raw as { key?: unknown }).key === 'string' ? (raw as { key: string }).key.trim() : '';
    if (!key || key.length > 80) {
      throw new ImageAssetError('Érvénytelen képazonosító érkezett.');
    }
    if (seenKeys.has(key)) {
      continue;
    }

    const dataUrl =
      typeof (raw as { dataUrl?: unknown }).dataUrl === 'string'
        ? (raw as { dataUrl: string }).dataUrl.trim()
        : '';
    if (!dataUrl) {
      throw new ImageAssetError('Hiányzik a kép tartalma.');
    }

    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl);
    if (!match) {
      throw new ImageAssetError('Csak base64-es képek tölthetők fel.');
    }

    const mime = match[1].toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
      throw new ImageAssetError('A kép formátuma nem támogatott (PNG, JPEG vagy WEBP szükséges).');
    }

    const base64 = dataUrl.slice(match[0].length);
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      throw new ImageAssetError('A kép base64 adat sérült.');
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
        const altAttr = asset.alt ? ` alt="${asset.alt}"` : '';
        pdfHtml += `<img src="${asset.dataUrl}"${altAttr} />`;
      }
    }

    lastIndex = match.index + match[0].length;
  }

  pdfHtml += html.slice(lastIndex);
  storedHtml += html.slice(lastIndex);

  return { pdfHtml, storedHtml };
}

export const POST = withAuth(async (req: AuthenticatedNextRequest) => {
  try {
    // Parse and sanitize the incoming JSON body.  Sanitizing early
    // prevents any malicious scripts or HTML fragments from reaching
    // our AI prompts or being persisted in the database.
    const parsed = aiGenerateRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Érvénytelen kérés.',
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      title,
      industry,
      projectDetails,
      deadline,
      language,
      brandVoice,
      style,
      prices,
      aiOverrideHtml,
      clientId,
      templateId,
      pdfWebhookUrl,
      imageAssets,
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
      const status = error instanceof ImageAssetError ? error.status : 400;
      const message =
        error instanceof ImageAssetError ? error.message : 'Érvénytelen képfeltöltés.';
      return NextResponse.json({ error: message }, { status });
    }

    let planLimit: number | null;
    if (plan === 'pro') {
      planLimit = null;
    } else if (plan === 'standard') {
      planLimit = 10;
    } else {
      planLimit = 3;
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

    let pendingCount = 0;
    if (typeof planLimit === 'number' && Number.isFinite(planLimit)) {
      pendingCount = await countPendingPdfJobs(sb, {
        userId: user.id,
        periodStart: usagePeriodStart,
      });
      const projectedUsage = usageSnapshot.offersGenerated + pendingCount;
      if (projectedUsage >= planLimit) {
        return NextResponse.json(
          { error: 'Elérted a havi ajánlatlimitálást a csomagban.' },
          { status: 402 },
        );
      }
    }

    const deviceLimit = plan === 'free' && typeof planLimit === 'number' ? 3 : null;
    if (deviceLimit !== null) {
      const deviceSnapshot = await getDeviceUsageSnapshot(sb, user.id, deviceId, usagePeriodStart);
      const devicePending = await countPendingPdfJobs(sb, {
        userId: user.id,
        periodStart: usagePeriodStart,
        deviceId,
      });
      const projectedDeviceUsage = deviceSnapshot.offersGenerated + devicePending;
      if (projectedDeviceUsage >= deviceLimit) {
        return NextResponse.json(
          { error: 'Elérted a havi ajánlatlimitálást ezen az eszközön.' },
          { status: 402 },
        );
      }
    }

    console.info('Usage quota snapshot', {
      userId: user.id,
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
          ? 'Stílus: nagyon tömör, 1-2 rövid bekezdés és legfeljebb 3 pontos felsorolások szakaszonként. A hangsúly a lényegi feladatokon legyen, kerülve a töltelékszöveget.'
          : 'Stílus: részletes és indokolt; adj 2-3 mondatos bekezdéseket és tartalmas felsorolásokat, amelyek megmagyarázzák a javasolt lépéseket.';

      // Sanitize user inputs before passing to OpenAI
      const safeIndustry = sanitizeInput(industry);
      const safeProjectDetails = formatProjectDetailsForPrompt(sanitizedDetails);
      const safeDeadline = sanitizeInput(deadline || '—');
      const safeBrand = sanitizeInput(brandVoice);

      const userPrompt = `
Nyelv: ${normalizedLanguage}
Hangnem: ${safeBrand}
Iparág: ${safeIndustry}
Ajánlat címe: ${safeTitle}
Projekt részletek:
${safeProjectDetails || '—'}
Határidő: ${safeDeadline}
${styleAddon}
Ne találj ki árakat, az árképzés külön jelenik meg.
`;

      try {
        const response = await openai.responses.parse({
          model: 'gpt-4o-mini',
          temperature: 0.4,
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
        console.error('OpenAI structured output error:', message);
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
    const storagePath = `${user.id}/${offerId}.pdf`;
    const brandingOptions = normalizeBranding({
      primaryColor:
        typeof profile?.brand_color_primary === 'string' ? profile.brand_color_primary : null,
      secondaryColor:
        typeof profile?.brand_color_secondary === 'string' ? profile.brand_color_secondary : null,
      logoUrl: typeof profile?.brand_logo_url === 'string' ? profile.brand_logo_url : null,
    });

    const planTier = planToTemplateTier(plan);
    const allTemplates = listTemplates() as Array<OfferTemplate & { legacyId?: string }>;
    const fallbackTemplate =
      allTemplates.find((tpl) => tpl.id === DEFAULT_TEMPLATE_ID) ||
      (loadTemplate(DEFAULT_TEMPLATE_ID) as OfferTemplate & { legacyId?: string });

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

    const profileTemplateId = findTemplateIdByLegacyId(
      allTemplates,
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
    const resolvedLegacyTemplateId = (template as { legacyId?: string }).legacyId ?? 'modern';

    const defaultTitle = sanitizeInput(translator.t('pdf.templates.common.defaultTitle'));

    const renderStartedAt = performance.now();
    let renderDuration: number | null = null;
    let html: string;

    try {
      html = buildOfferHtml(
        {
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
          tokens: createThemeTokens(template.tokens, brandingOptions),
        },
        template,
      );
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
      console.error('Offer insert error:', offerInsertError.message);
      return NextResponse.json(
        {
          error: 'Nem sikerült elmenteni az ajánlatot.',
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
      const message = error instanceof Error ? error.message : String(error);
      console.error('PDF queue error (enqueue):', message);
      return NextResponse.json(
        {
          error: 'Nem sikerült elindítani a PDF generálását.',
          offerId,
        },
        { status: 502 },
      );
    }

    let immediatePdfUrl: string | null = null;
    let responseStatus: 'pending' | 'completed' = 'pending';
    let responseNote = 'A PDF generálása folyamatban van. Frissíts később.';

    try {
      await dispatchPdfJob(sb, downloadToken);
    } catch (dispatchError) {
      const message =
        dispatchError instanceof Error ? dispatchError.message : String(dispatchError);
      console.error('PDF queue error (dispatch):', message);

      const dispatchLimitMessage = normalizeUsageLimitError(message);
      if (dispatchLimitMessage) {
        return NextResponse.json({ error: dispatchLimitMessage }, { status: 402 });
      }

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
        responseStatus = 'completed';
        responseNote = 'A PDF generálása helyben készült el, azonnal letölthető.';
      } catch (inlineError) {
        const inlineMessage =
          inlineError instanceof Error ? inlineError.message : String(inlineError);
        console.error('Inline PDF fallback error:', inlineMessage);

        const limitMessage = normalizeUsageLimitError(inlineMessage);
        if (limitMessage) {
          return NextResponse.json({ error: limitMessage }, { status: 402 });
        }

        return NextResponse.json(
          {
            error: 'Nem sikerült elindítani a PDF generálását.',
            offerId,
          },
          { status: 502 },
        );
      }
    }

    const sectionsPayload = structuredSections ? sanitizeSectionsOutput(structuredSections) : null;

    return NextResponse.json({
      ok: true,
      id: offerId,
      pdfUrl: immediatePdfUrl,
      downloadToken,
      status: responseStatus,
      note: responseNote,
      sections: sectionsPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Server error:', message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
});
