import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { envServer } from '@/env.server';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';

export const runtime = 'nodejs';

const BASE_SYSTEM_PROMPT = `
Te egy magyar üzleti ajánlatíró asszisztens vagy.
Használj természetes, gördülékeny magyar üzleti nyelvet (ne tükörfordítást)!
Kerüld az anglicizmusokat, helyette magyar kifejezéseket használj.
Adj vissza TISZTA HTML-RÉSZLETET (nincs <html>/<body>), csak címsorokat, bekezdéseket és felsorolásokat.
Szerkezet: Bevezető, Projekt összefoglaló, Terjedelem, Szállítandók, Ütemezés, Feltételezések & Kizárások, Következő lépések, Zárás.
`;

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    const token = auth.split(' ')[1];

    const sb = supabaseServer();
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: 'Invalid user' }, { status: 401 });

    const { industry, title, description, deadline, language = 'hu', brandVoice = 'friendly', style = 'detailed' } = await req.json();

    if (!envServer.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey: envServer.OPENAI_API_KEY });

    const styleAddon =
      style === 'compact'
        ? 'Stílus: rövid, lényegretörő, 3–5 bekezdés és néhány felsorolás, sallang nélkül.'
        : 'Stílus: részletes, mégis jól tagolt; tömör bekezdések és áttekinthető felsorolások.';

    const safeLanguage = sanitizeInput(language);
    const safeBrand = sanitizeInput(brandVoice);
    const safeIndustry = sanitizeInput(industry);
    const safeTitle = sanitizeInput(title);
    const safeDescription = sanitizeInput(description);
    const safeDeadline = sanitizeInput(deadline || '—');

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

    const encoder = new TextEncoder();
    const stream = await openai.responses.stream({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      input: [
        { role: 'system', content: BASE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        let accumulated = '';

        const push = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        stream.on('response.output_text.delta', (event) => {
          if (!event.delta) return;
          accumulated += event.delta;
          push({ type: 'delta', html: sanitizeHTML(accumulated) });
        });

        stream.on('end', () => {
          const finalHtml = sanitizeHTML(accumulated || '<p>(nincs előnézet)</p>');
          push({ type: 'done', html: finalHtml });
          controller.close();
        });

        stream.on('abort', (error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          push({ type: 'error', message });
          controller.close();
        });

        stream.on('error', (error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          push({ type: 'error', message });
          controller.close();
        });
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('ai-preview error:', message);
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 });
  }
}