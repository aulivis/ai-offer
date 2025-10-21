import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseServer } from '@/app/lib/supabaseServer';

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

    const { industry, title, description, deadline, language='hu', brandVoice='friendly', style='detailed' } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const styleAddon = style === 'compact'
      ? 'Stílus: rövid, lényegretörő, 3–5 bekezdés és néhány felsorolás, sallang nélkül.'
      : 'Stílus: részletes, mégis jól tagolt; tömör bekezdések és áttekinthető felsorolások.';

    const userPrompt = `
Nyelv: ${language}
Hangnem: ${brandVoice}
Iparág: ${industry}
Ajánlat címe: ${title}
Projekt leírás: ${description}
Határidő: ${deadline || '—'}
${styleAddon}
Ne találj ki árakat, az árképzés külön jelenik meg.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: BASE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4
    });

    const html = completion.choices?.[0]?.message?.content?.trim() || '<p>(nincs előnézet)</p>';
    return NextResponse.json({ html });
  } catch (e:any) {
    console.error('ai-preview error:', e?.message || e);
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 });
  }
}
