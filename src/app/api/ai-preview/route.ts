import { NextResponse } from 'next/server';
import OpenAI, { APIError } from 'openai';
import { envServer } from '@/env.server';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { t } from '@/copy';
import { STREAM_TIMEOUT_MESSAGE, STREAM_TIMEOUT_MS } from '@/lib/aiPreview';
import { withAuth, type AuthenticatedNextRequest } from '../../../../middleware/auth';
import { z } from 'zod';
export const runtime = 'nodejs';

const BASE_SYSTEM_PROMPT = `
Te egy magyar üzleti ajánlatíró asszisztens vagy.
Használj természetes, gördülékeny magyar üzleti nyelvet (ne tükörfordítást)!
Kerüld az anglicizmusokat, helyette magyar kifejezéseket használj.
Adj vissza TISZTA HTML-RÉSZLETET (nincs <html>/<body>), csak címsorokat, bekezdéseket és felsorolásokat.
Szerkezet: Bevezető, Projekt összefoglaló, Terjedelem, Szállítandók, Ütemezés, Feltételezések & Kizárások, Következő lépések, Zárás.
`;

const PREVIEW_ABORT_RETRY_ATTEMPTS = 2;
const PREVIEW_ABORT_RETRY_DELAY_MS = 250;

function isAbortLikeError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('request was aborted') || message.includes('aborted')) {
      return true;
    }
    if (error.name === 'AbortError') {
      return true;
    }
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const rawMessage = (error as { message?: unknown }).message;
    if (
      typeof rawMessage === 'string' &&
      rawMessage.toLowerCase().includes('request was aborted')
    ) {
      return true;
    }
  }

  return false;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const optionalTrimmedString = z.preprocess(
  (value) => (value === null || value === undefined ? undefined : value),
  z.string().trim().optional(),
);

const previewRequestSchema = z
  .object({
    industry: z.string().trim().min(1, t('validation.required')),
    title: z.string().trim().min(1, t('validation.required')),
    description: z.string().trim().min(1, t('validation.required')),
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
  })
  .strict();

export const POST = withAuth(async (req: AuthenticatedNextRequest) => {
  try {
    const parsed = previewRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Érvénytelen kérés.',
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { industry, title, description, deadline, language, brandVoice, style } = parsed.data;

    if (!envServer.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey: envServer.OPENAI_API_KEY });

    const styleAddon =
      style === 'compact'
        ? 'Stílus: nagyon tömör és kártyás felépítésű. Használj <div class="offer-doc__compact"> gyökérelemet, benne <section class="offer-doc__compact-intro">, <section class="offer-doc__compact-grid"> és <section class="offer-doc__compact-bottom"> blokkokat. Minden felsorolás legfeljebb 3 rövid pontból álljon.'
        : 'Stílus: részletes és indokolt; adj 2-3 mondatos bekezdéseket, a HTML-ben használj <h2>...</h2> szakaszcímeket a megadott szerkezet szerint és tartalmas felsorolásokat.';

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
    const previewModels = ['o4-mini', 'gpt-4o-mini'] as const;

    let stream: Awaited<ReturnType<typeof openai.responses.stream>> | null = null;
    let lastError: unknown = null;

    for (const model of previewModels) {
      for (let attempt = 0; attempt < PREVIEW_ABORT_RETRY_ATTEMPTS; attempt += 1) {
        try {
          const requestOptions: Parameters<typeof openai.responses.stream>[0] = {
            model,
            input: [
              { role: 'system', content: BASE_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          };

          if (!model.startsWith('o4')) {
            requestOptions.temperature = 0.4;
          }

          stream = await openai.responses.stream(requestOptions);
          if (model !== previewModels[0] || attempt > 0) {
            console.warn('ai-preview: using fallback model', model, lastError);
          }
          break;
        } catch (error) {
          lastError = error;
          const isModelMissing =
            error instanceof APIError &&
            (error.status === 404 ||
              error.code === 'model_not_found' ||
              error.code === 'model_not_found_error');

          if (isAbortLikeError(error) && attempt < PREVIEW_ABORT_RETRY_ATTEMPTS - 1) {
            await wait(PREVIEW_ABORT_RETRY_DELAY_MS);
            continue;
          }

          if (isModelMissing) {
            break;
          }

          if (isAbortLikeError(error) && model !== previewModels[previewModels.length - 1]) {
            console.warn('ai-preview: aborted stream, retrying with fallback model', model, error);
            break;
          }

          throw error;
        }
      }

      if (stream) {
        break;
      }
    }

    if (!stream) {
      throw lastError instanceof Error ? lastError : new Error('Failed to start preview stream');
    }

    let removeStreamListeners: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let closeStreamRef: (() => void) | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (removeStreamListeners) {
        removeStreamListeners();
        removeStreamListeners = null;
      }
    };

    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        let accumulated = '';
        let closed = false;

        const closeStream = () => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch (closeError) {
            if (!(closeError instanceof TypeError && closeError.message.includes('closed'))) {
              throw closeError;
            }
          } finally {
            cleanup();
            closeStreamRef = null;
          }
        };

        closeStreamRef = closeStream;

        const push = (payload: Record<string, unknown>) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch (enqueueError) {
            if (enqueueError instanceof TypeError && enqueueError.message.includes('closed')) {
              closeStream();
            } else {
              throw enqueueError;
            }
          }
        };

        const handleDelta = (event: { delta?: string }) => {
          if (!event.delta) return;
          accumulated += event.delta;
          push({ type: 'delta', html: sanitizeHTML(accumulated) });
        };

        const handleEnd = () => {
          const finalHtml = sanitizeHTML(accumulated || '<p>(nincs előnézet)</p>');
          push({ type: 'done', html: finalHtml });
          closeStream();
        };

        const handleAbort = (error: unknown) => {
          console.warn('Preview stream aborted:', error);
          const message = 'Az előnézet kérése megszakadt. Próbáld újra néhány másodperc múlva.';
          push({ type: 'error', message });
          closeStream();
        };

        const handleError = (error: unknown) => {
          console.error('Preview stream error:', error);
          const message =
            'Váratlan hiba történt az előnézet készítése közben. Kérjük, próbáld meg újra.';
          push({ type: 'error', message });
          closeStream();
        };

        const handleTimeout = () => {
          if (closed) return;
          try {
            push({ type: 'error', message: STREAM_TIMEOUT_MESSAGE });
          } finally {
            closeStream();
            try {
              stream.abort();
            } catch (abortError) {
              if (!(abortError instanceof Error && abortError.name === 'AbortError')) {
                console.error('Failed to abort preview stream after timeout:', abortError);
              }
            }
          }
        };

        removeStreamListeners = () => {
          stream.off('response.output_text.delta', handleDelta);
          stream.off('end', handleEnd);
          stream.off('abort', handleAbort);
          stream.off('error', handleError);
        };

        stream.on('response.output_text.delta', handleDelta);
        stream.on('end', handleEnd);
        stream.on('abort', handleAbort);
        stream.on('error', handleError);

        timeoutId = setTimeout(handleTimeout, STREAM_TIMEOUT_MS);
      },
      cancel() {
        try {
          stream.abort();
        } catch (abortError) {
          if (!(abortError instanceof Error && abortError.name === 'AbortError')) {
            console.error('Failed to abort preview stream on cancel:', abortError);
          }
        } finally {
          closeStreamRef?.();
          cleanup();
          closeStreamRef = null;
        }
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
    if (isAbortLikeError(error)) {
      console.error('ai-preview aborted before streaming could start:', message);
      return NextResponse.json(
        { error: 'Az OpenAI kapcsolat megszakadt. Próbáld újra néhány másodperc múlva.' },
        { status: 503 },
      );
    }
    if (error instanceof APIError) {
      console.error('ai-preview API error:', message);
      const status = typeof error.status === 'number' ? error.status : 500;
      const errorMessage =
        (typeof error.message === 'string' && error.message.trim().length > 0
          ? error.message
          : error.error && typeof error.error === 'object'
            ? String((error.error as { message?: unknown }).message ?? 'Preview failed')
            : 'Preview failed') || 'Preview failed';
      return NextResponse.json({ error: errorMessage }, { status });
    }

    console.error('ai-preview error:', message);
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 });
  }
});
