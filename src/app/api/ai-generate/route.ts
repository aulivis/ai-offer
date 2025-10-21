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
import OpenAI from 'openai';
import type { ResponseFormatTextJSONSchemaConfig } from 'openai/resources/responses/responses';
import { v4 as uuid } from 'uuid';
import { envServer } from '@/env.server';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { getCurrentUser, getUserProfile } from '@/lib/services/user';
import { checkAndIncrementUsage, checkAndIncrementDeviceUsage, rollbackUsageIncrement } from '@/lib/services/usage';
import { enqueuePdfJob } from '@/lib/queue/pdf';

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

function sectionsToHtml(sections: OfferSections): string {
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
    const rawPlan = (profile?.plan as 'free' | 'standard' | 'starter' | 'pro' | undefined) ?? 'free';
    const plan: 'free' | 'standard' | 'pro' = rawPlan === 'starter' ? 'standard' : rawPlan;

    const privilegedEmail = 'tiens.robert@hotmail.com';
    const normalizedEmail = typeof user.email === 'string' ? user.email.toLowerCase() : '';

    let planLimit: number | null;
    if (plan === 'pro') {
      planLimit = null;
    } else if (plan === 'standard') {
      planLimit = 10;
    } else {
      planLimit = 3;
    }

    const hasUnlimitedEmail = normalizedEmail === privilegedEmail;
    if (hasUnlimitedEmail) {
      planLimit = null;
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

    const quota = await checkAndIncrementUsage(sb, user.id, planLimit);

    console.info('Usage quota check', {
      userId: user.id,
      plan,
      limit: planLimit,
      allowed: quota.allowed,
      offersGenerated: quota.offersGenerated,
    });

    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'Elérted a havi ajánlatlimitálást a csomagban.' },
        { status: 402 }
      );
    }

    if (plan === 'free' && !hasUnlimitedEmail && planLimit !== null) {
      const deviceQuota = await checkAndIncrementDeviceUsage(sb, deviceId, 3);
      console.info('Device quota check', {
        deviceId,
        limit: 3,
        allowed: deviceQuota.allowed,
        offersGenerated: deviceQuota.offersGenerated,
      });
      if (!deviceQuota.allowed) {
        await rollbackUsageIncrement(sb, user.id, quota.periodStart);
        return NextResponse.json(
          { error: 'Elérted a havi ajánlatlimitálást ezen az eszközön.' },
          { status: 402 }
        );
      }
    }

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
          ? 'Stílus: rövid, lényegretörő, 3–5 bekezdés és néhány felsorolás, sallang nélkül.'
          : 'Stílus: részletes, mégis jól tagolt; tömör bekezdések és áttekinthető felsorolások.';

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

        aiHtml = sectionsToHtml(structuredSections);
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

    // ---- PDF queueing ----
    const offerId = uuid();
    const storagePath = `${user.id}/${offerId}.pdf`;
    const brandingOptions = {
      primaryColor: typeof profile?.brand_color_primary === 'string' ? profile.brand_color_primary : null,
      secondaryColor: typeof profile?.brand_color_secondary === 'string' ? profile.brand_color_secondary : null,
      logoUrl: typeof profile?.brand_logo_url === 'string' ? profile.brand_logo_url : null,
    };

    const html = offerHtml({
      title: safeTitle || 'Árajánlat',
      companyName: sanitizeInput(profile?.company_name || ''),
      aiBodyHtml: aiHtml,
      priceTableHtml: priceTable,
      branding: brandingOptions,
    });

    const downloadToken = uuid();

    try {
      await enqueuePdfJob(sb, {
        jobId: downloadToken,
        offerId,
        userId: user.id,
        storagePath,
        html,
        callbackUrl: typeof pdfWebhookUrl === 'string' ? pdfWebhookUrl : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('PDF queue error:', message);
      return NextResponse.json({
        error: 'Nem sikerült sorba állítani a PDF generálási feladatot.',
      }, { status: 502 });
    }

    // ---- Ajánlat mentése ----
    await sb.from('offers').insert({
      id: offerId,
      user_id: user.id,
      title: safeTitle,
      industry: sanitizeInput(industry),
      recipient_id: clientId || null,
      inputs: { description: sanitizeInput(description), deadline, language, brandVoice, style },
      ai_text: aiHtml,
      price_json: rows,
      pdf_url: null,
      status: 'draft',
    });

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