import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { supabaseServer } from '@/app/lib/supabaseServer';
// Use shared pricing utilities and HTML template helpers.  The
// summarization and table HTML generation are centralised in
// `app/lib/pricing.ts`, and the full document template lives in
// `app/lib/htmlTemplate.ts`.
import { PriceRow, priceTableHtml } from '@/app/lib/pricing';
import { offerHtml } from '@/app/lib/htmlTemplate';
import { enforceTemplateForPlan, type SubscriptionPlan } from '@/app/lib/offerTemplates';
import OpenAI from 'openai';
import type { ResponseFormatTextJSONSchemaConfig } from 'openai/resources/responses/responses';
import { v4 as uuid } from 'uuid';
import { envServer } from '@/env.server';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { getCurrentUser, getUserProfile } from '@/lib/services/user';
import {
  currentMonthStart,
  getDeviceUsageSnapshot,
  getUsageSnapshot,
} from '@/lib/services/usage';
import { countPendingPdfJobs, enqueuePdfJob } from '@/lib/queue/pdf';
import { resolveEffectivePlan } from '@/lib/subscription';

export const runtime = 'nodejs';

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

function safeParagraph(value: string | undefined): string {
  const trimmed = (value || '').trim();
  return trimmed ? `<p>${sanitizeInput(trimmed)}</p>` : '<p>-</p>';
}

function safeList(items: string[] | undefined): string {
  const normalized = (items || []).map((item) => sanitizeInput((item || '').trim())).filter(Boolean);
  if (!normalized.length) return '<p>-</p>';
  return `<ul>${normalized.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function limitList(items: string[] | undefined, max: number): string[] {
  const normalized = Array.isArray(items) ? items.filter((item) => typeof item === 'string') : [];
  if (!normalized.length) return [];
  return normalized.slice(0, Math.max(0, max));
}

function sectionsToHtml(sections: OfferSections, style: 'compact' | 'detailed'): string {
  if (style === 'compact') {
    const intro = sanitizeInput((sections.introduction || '').trim());
    const summary = sanitizeInput((sections.project_summary || '').trim());
    const combinedIntro = [intro, summary].filter(Boolean).join(' ');

    const html = `
      <div class="offer-doc__compact">
        <section class="offer-doc__compact-intro">
          <div class="offer-doc__compact-block">
            <h2>Gyors áttekintés</h2>
            ${safeParagraph(combinedIntro)}
          </div>
          <div class="offer-doc__compact-block offer-doc__compact-block--highlights">
            <h3>Kiemelt fókuszok</h3>
            ${safeList(limitList(sections.scope, 3))}
          </div>
        </section>
        <section class="offer-doc__compact-grid">
          <div class="offer-doc__compact-card">
            <h3>Szállítandók</h3>
            ${safeList(limitList(sections.deliverables, 3))}
          </div>
          <div class="offer-doc__compact-card">
            <h3>Menetrend</h3>
            ${safeList(limitList(sections.schedule, 3))}
          </div>
          <div class="offer-doc__compact-card">
            <h3>Lényeges feltételek</h3>
            ${safeList(limitList(sections.assumptions, 3))}
          </div>
        </section>
        <section class="offer-doc__compact-bottom">
          <div class="offer-doc__compact-card offer-doc__compact-card--accent">
            <h3>Következő lépések</h3>
            ${safeList(limitList(sections.next_steps, 3))}
          </div>
          <div class="offer-doc__compact-card offer-doc__compact-card--closing">
            <h3>Zárás</h3>
            ${safeParagraph(sections.closing)}
          </div>
        </section>
      </div>
    `;

    return sanitizeHTML(html);
  }

  const html = `
    <h2>Bevezető</h2>
    ${safeParagraph(sections.introduction)}
    <h2>Projekt összefoglaló</h2>
    ${safeParagraph(sections.project_summary)}
    <h2>Terjedelem</h2>
    ${safeList(sections.scope)}
    <h2>Szállítandók</h2>
    ${safeList(sections.deliverables)}
    <h2>Ütemezés</h2>
    ${safeList(sections.schedule)}
    <h2>Feltételezések &amp; Kizárások</h2>
    ${safeList(sections.assumptions)}
    <h2>Következő lépések</h2>
    ${safeList(sections.next_steps)}
    <h2>Zárás</h2>
    ${safeParagraph(sections.closing)}
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
    schedule: (sections.schedule || []).map((item) => sanitizeInput((item || '').trim())).filter(Boolean),
    assumptions: (sections.assumptions || []).map((item) => sanitizeInput((item || '').trim())).filter(Boolean),
    next_steps: (sections.next_steps || []).map((item) => sanitizeInput((item || '').trim())).filter(Boolean),
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
  plan: 'free' | 'standard' | 'pro'
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

    const key = typeof (raw as { key?: unknown }).key === 'string' ? (raw as { key: string }).key.trim() : '';
    if (!key || key.length > 80) {
      throw new ImageAssetError('Érvénytelen képazonosító érkezett.');
    }
    if (seenKeys.has(key)) {
      continue;
    }

    const dataUrl = typeof (raw as { dataUrl?: unknown }).dataUrl === 'string' ? (raw as { dataUrl: string }).dataUrl.trim() : '';
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

    const altRaw = typeof (raw as { alt?: unknown }).alt === 'string' ? (raw as { alt: string }).alt : '';
    const alt = sanitizeInput(altRaw).slice(0, 160);

    sanitized.push({ key, dataUrl: `data:${mime};base64,${base64}`, alt });
    seenKeys.add(key);
  }

  return sanitized;
}

const IMG_TAG_REGEX = /<img\b[^>]*>/gi;

function applyImageAssetsToHtml(html: string, images: SanitizedImageAsset[]): {
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
      tag.match(/data-offer-image-key\s*=\s*"([^"]+)"/i) || tag.match(/data-offer-image-key\s*=\s*'([^']+)'/i);
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

export async function POST(req: NextRequest) {
  try {
    // Parse and sanitize the incoming JSON body.  Sanitizing early
    // prevents any malicious scripts or HTML fragments from reaching
    // our AI prompts or being persisted in the database.
    const body = await req.json();
    const {
      title,
      industry,
      description,
      deadline,
      language = 'hu',
      brandVoice = 'friendly',
      style = 'detailed',
      prices = [],
      aiOverrideHtml,
      clientId,
      pdfWebhookUrl,
      imageAssets,
    } = body as {
      title: string;
      industry: string;
      description: string;
      deadline?: string;
      language?: 'hu' | 'en';
      brandVoice?: 'friendly' | 'formal';
      style?: 'compact' | 'detailed';
      prices: PriceRow[];
      aiOverrideHtml?: string;
      clientId?: string;
      pdfWebhookUrl?: string;
      imageAssets?: { key: string; dataUrl: string; alt?: string | null }[];
    };

    // ---- Auth ----
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Auth required: hiányzik az Authorization: Bearer <token> fejléc' },
        { status: 401 }
      );
    }
    const access_token = authHeader.split(' ')[1];

    const sb = supabaseServer();
    // Use service helper to fetch current user or throw
    let user;
    try {
      user = await getCurrentUser(sb, access_token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid user';
      return NextResponse.json({ error: message }, { status: 401 });
    }

    // ---- Limit (havi) ----

    const profile = await getUserProfile(sb, user.id);
    const plan: SubscriptionPlan = resolveEffectivePlan(profile?.plan ?? null, user.email ?? null);

    let sanitizedImageAssets: SanitizedImageAsset[] = [];
    try {
      sanitizedImageAssets = normalizeImageAssets(imageAssets, plan);
    } catch (error) {
      const status = error instanceof ImageAssetError ? error.status : 400;
      const message = error instanceof ImageAssetError ? error.message : 'Érvénytelen képfeltöltés.';
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
      deviceId = randomUUID();
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

    const { iso: usagePeriodStart } = currentMonthStart();
    const usageSnapshot = await getUsageSnapshot(sb, user.id, usagePeriodStart);

    let pendingCount = 0;
    if (typeof planLimit === 'number' && Number.isFinite(planLimit)) {
      pendingCount = await countPendingPdfJobs(sb, { userId: user.id, periodStart: usagePeriodStart });
      const projectedUsage = usageSnapshot.offersGenerated + pendingCount;
      if (projectedUsage >= planLimit) {
        return NextResponse.json(
          { error: 'Elérted a havi ajánlatlimitálást a csomagban.' },
          { status: 402 }
        );
      }
    }

    const deviceLimit = plan === 'free' && typeof planLimit === 'number' ? 3 : null;
    if (deviceLimit !== null) {
      const deviceSnapshot = await getDeviceUsageSnapshot(sb, deviceId, usagePeriodStart);
      const devicePending = await countPendingPdfJobs(sb, {
        userId: user.id,
        periodStart: usagePeriodStart,
        deviceId,
      });
      const projectedDeviceUsage = deviceSnapshot.offersGenerated + devicePending;
      if (projectedDeviceUsage >= deviceLimit) {
        return NextResponse.json(
          { error: 'Elérted a havi ajánlatlimitálást ezen az eszközön.' },
          { status: 402 }
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
          { status: 500 }
        );
      }
      const openai = new OpenAI({ apiKey: envServer.OPENAI_API_KEY });

      const styleAddon =
        style === 'compact'
          ? 'Stílus: nagyon tömör, 1-2 rövid bekezdés és legfeljebb 3 pontos felsorolások szakaszonként. A hangsúly a lényegi feladatokon legyen, kerülve a töltelékszöveget.'
          : 'Stílus: részletes és indokolt; adj 2-3 mondatos bekezdéseket és tartalmas felsorolásokat, amelyek megmagyarázzák a javasolt lépéseket.';

      // Sanitize user inputs before passing to OpenAI
      const safeIndustry = sanitizeInput(industry);
      const safeDescription = sanitizeInput(description);
      const safeDeadline = sanitizeInput(deadline || '—');
      const safeLanguage = sanitizeInput(language);
      const safeBrand = sanitizeInput(brandVoice);

      const userPrompt = `
Nyelv: ${safeLanguage}
Hangnem: ${safeBrand}
Iparág: ${safeIndustry}
Ajánlat címe: ${safeTitle}
Projekt leírás: ${safeDescription}
Határidő: ${safeDeadline}
${styleAddon}
Ne találj ki árakat, az árképzés külön jelenik meg.
`;

      try {
        const response = await openai.responses.parse<OfferSections>({
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

        aiHtml = sectionsToHtml(structuredSections, style === 'compact' ? 'compact' : 'detailed');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('OpenAI structured output error:', message);
        return NextResponse.json(
          { error: 'OpenAI struktúrált válasz sikertelen. Próbáld újra később.' },
          { status: 502 }
        );
      }
    }

    // ---- Ár tábla HTML ----
    const rows: PriceRow[] = prices || [];
    // Use shared price table HTML builder.  This returns a complete
    // `<table>` element including header, body and footer with totals.
    const priceTable = priceTableHtml(rows);

    const { pdfHtml: aiHtmlForPdf, storedHtml: aiHtmlForStorage } = applyImageAssetsToHtml(aiHtml, sanitizedImageAssets);

    // ---- PDF queueing ----
    const offerId = uuid();
    const storagePath = `${user.id}/${offerId}.pdf`;
    const brandingOptions = {
      primaryColor: typeof profile?.brand_color_primary === 'string' ? profile.brand_color_primary : null,
      secondaryColor: typeof profile?.brand_color_secondary === 'string' ? profile.brand_color_secondary : null,
      logoUrl: typeof profile?.brand_logo_url === 'string' ? profile.brand_logo_url : null,
    };

    const templateId = enforceTemplateForPlan(
      typeof profile?.offer_template === 'string' ? profile.offer_template : null,
      plan
    );

    const html = offerHtml({
      title: safeTitle || 'Árajánlat',
      companyName: sanitizeInput(profile?.company_name || ''),
      aiBodyHtml: aiHtmlForPdf,
      priceTableHtml: priceTable,
      branding: brandingOptions,
      templateId,
    });

    const downloadToken = uuid();

    // ---- Ajánlat mentése ----
    const { error: offerInsertError } = await sb.from('offers').insert({
      id: offerId,
      user_id: user.id,
      title: safeTitle,
      industry: sanitizeInput(industry),
      recipient_id: clientId || null,
      inputs: { description: sanitizeInput(description), deadline, language, brandVoice, style },
      ai_text: aiHtmlForStorage,
      price_json: rows,
      pdf_url: null,
      status: 'draft',
    });

    if (offerInsertError) {
      console.error('Offer insert error:', offerInsertError.message);
      return NextResponse.json({
        error: 'Nem sikerült elmenteni az ajánlatot.',
      }, { status: 500 });
    }

    try {
      await enqueuePdfJob(sb, {
        jobId: downloadToken,
        offerId,
        userId: user.id,
        storagePath,
        html,
        callbackUrl: typeof pdfWebhookUrl === 'string' ? pdfWebhookUrl : undefined,
        usagePeriodStart,
        userLimit: typeof planLimit === 'number' && Number.isFinite(planLimit) ? planLimit : null,
        deviceId: deviceLimit !== null ? deviceId : null,
        deviceLimit,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('PDF queue error:', message);
      return NextResponse.json({
        error: 'Nem sikerült sorba állítani a PDF generálási feladatot.',
        offerId,
      }, { status: 502 });
    }

    const sectionsPayload = structuredSections ? sanitizeSectionsOutput(structuredSections) : null;

    return NextResponse.json({
      ok: true,
      id: offerId,
      pdfUrl: null,
      downloadToken,
      status: 'pending',
      note: 'A PDF generálása folyamatban van. Frissíts később.',
      sections: sectionsPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Server error:', message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}