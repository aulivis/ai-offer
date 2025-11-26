import { NextResponse } from 'next/server';
import OpenAI, { APIError } from 'openai';
import { envServer } from '@/env.server';
import { sanitizeInput, sanitizeHTML } from '@/lib/sanitize';
import { t } from '@/copy';
import { STREAM_TIMEOUT_MESSAGE, STREAM_TIMEOUT_MS } from '@/lib/aiPreview';
import { detectPreviewIssues, extractPreviewSummaryHighlights } from '@/lib/previewInsights';
import { withAuth, type AuthenticatedNextRequest } from '../../../../middleware/auth';
import {
  emptyProjectDetails,
  formatProjectDetailsForPrompt,
  projectDetailFields,
  projectDetailsSchema,
  type ProjectDetails,
} from '@/lib/projectDetails';
import {
  checkRateLimitMiddleware,
  createRateLimitResponse,
  addRateLimitHeaders,
  createRateLimitHeaders,
} from '@/lib/rateLimitMiddleware';
import { RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimiting';
import { createLogger } from '@/lib/logger';
import { handleValidationError, handleUnexpectedError } from '@/lib/errorHandling';
import { withRequestSizeLimit } from '@/lib/requestSizeLimit';
import { z } from 'zod';
import { getRequestId } from '@/lib/requestId';

const BASE_SYSTEM_PROMPT = `
Te egy tapasztalt magyar üzleti ajánlatíró asszisztens vagy, aki professzionális, 
magas színvonalú ajánlatokat készít magyar vállalkozások számára.

NYELVI MINŐSÉG:
- Használj természetes, gördülékeny magyar üzleti nyelvet (ne tükörfordítást)!
- Kerüld az anglicizmusokat, helyette magyar kifejezéseket használj (pl. "feladat" helyett "task", "határidő" helyett "deadline").
- Használj üzleti szakszavakat és formális, de barátságos hangvételt.
- A szöveg legyen érthető, világos és logikusan felépített.
- Minden bekezdés legyen jól strukturált, 2-4 mondat hosszúságú.

SZERKEZET ÉS TARTALOM:
- A bevezető köszöntse a címzettet és mutassa be az ajánlat célját.
- A projekt összefoglaló világosan mutassa be a projekt hátterét és céljait.
- A felsorolásokban használj rövid, lényegretörő pontokat, amelyek konkrét információkat tartalmaznak.
- Minden szakasz legyen tartalmas és releváns a projekt kontextusához.
- A zárás legyen udvarias és cselekvésre ösztönző.

FORMÁZÁS:
- Adj vissza TISZTA HTML-RÉSZLETET (nincs <html>/<body>), csak címsorokat, bekezdéseket és felsorolásokat.
- Használj <h2>...</h2> szakaszcímeket a következő szerkezet szerint: Bevezető, Projekt összefoglaló, Terjedelem, Szállítandók, Ütemezés, Feltételezések & Kizárások, Következő lépések, Zárás.
- A bekezdéseket <p>...</p> taggel jelöld.
- A felsorolásokat <ul><li>...</li></ul> taggel jelöld.
- Ne találj ki árakat; az árképzés külön jelenik meg az alkalmazásban.
- A szöveg legyen professzionális, de nem túlzottan formális vagy száraz.
`;

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
  })
  .strict();

// Request deduplication cache - stores request hash -> promise mapping
// Prevents duplicate requests within short time window
// Uses LRU-style eviction to prevent memory leaks
const requestCache = new Map<string, { promise: Promise<NextResponse>; timestamp: number }>();
const REQUEST_CACHE_TTL_MS = 5000; // 5 seconds
const REQUEST_CACHE_MAX_SIZE = 1000; // Maximum cache entries
const REQUEST_CACHE_CLEANUP_INTERVAL_MS = 30000; // Cleanup every 30 seconds

// Store cleanup interval ID for potential cleanup on server shutdown
let cleanupIntervalId: NodeJS.Timeout | null = null;

// Cleanup function to remove expired entries and enforce size limit
function cleanupRequestCache(): void {
  const now = Date.now();

  // Remove expired entries
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > REQUEST_CACHE_TTL_MS) {
      requestCache.delete(key);
    }
  }

  // If still over limit, remove oldest entries (LRU eviction)
  if (requestCache.size > REQUEST_CACHE_MAX_SIZE) {
    const entries = Array.from(requestCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, requestCache.size - REQUEST_CACHE_MAX_SIZE);
    for (const [key] of toRemove) {
      requestCache.delete(key);
    }
  }
}

// Cleanup old cache entries periodically and enforce size limit
// Store interval ID so it can be cleaned up if needed
if (typeof setInterval !== 'undefined') {
  cleanupIntervalId = setInterval(cleanupRequestCache, REQUEST_CACHE_CLEANUP_INTERVAL_MS);

  // Cleanup on process termination (Next.js serverless handles this automatically,
  // but this provides safety for long-running processes)
  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    const cleanup = () => {
      if (cleanupIntervalId) {
        clearInterval(cleanupIntervalId);
        cleanupIntervalId = null;
      }
      // Final cleanup pass
      requestCache.clear();
    };

    // Handle graceful shutdown signals
    process.once('SIGTERM', cleanup);
    process.once('SIGINT', cleanup);
    // Note: In Next.js serverless/edge environments, these may not fire,
    // but the cleanup interval and TTL-based eviction prevent memory leaks
  }
}

function hashRequest(data: unknown): string {
  // Simple hash function for request deduplication
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

export const POST = withAuth(
  withRequestSizeLimit(async (req: AuthenticatedNextRequest) => {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);
    log.setContext({ userId: req.user.id });

    // Rate limiting for AI preview endpoint
    const rateLimitResult = await checkRateLimitMiddleware(req, {
      maxRequests: 30, // Higher limit for previews as they're less expensive
      windowMs: RATE_LIMIT_WINDOW_MS * 5, // 5 minute window
      keyPrefix: 'ai-preview',
    });

    if (rateLimitResult && !rateLimitResult.allowed) {
      log.warn('AI preview rate limit exceeded', {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
      });
      return createRateLimitResponse(
        rateLimitResult,
        'Elérted az AI előnézeti limitet. Próbáld újra később.',
      );
    }

    let requestBody: unknown;
    let requestHash: string | undefined;

    try {
      requestBody = await req.json();
      requestHash = hashRequest(requestBody);

      // Request deduplication - check if identical request is already in progress
      const cachedRequest = requestCache.get(requestHash);
      if (cachedRequest && Date.now() - cachedRequest.timestamp < REQUEST_CACHE_TTL_MS) {
        log.info('Deduplicating AI preview request', { requestHash });
        return cachedRequest.promise;
      }

      const parsed = previewRequestSchema.safeParse(requestBody);
      if (!parsed.success) {
        return handleValidationError(parsed.error, requestId);
      }

      const { industry, title, projectDetails, deadline, language, brandVoice, style, formality } =
        parsed.data;

      if (!envServer.OPENAI_API_KEY) {
        const errorResponse = NextResponse.json(
          { error: 'OPENAI_API_KEY missing' },
          { status: 500 },
        );
        errorResponse.headers.set('x-request-id', requestId);
        if (rateLimitResult) {
          addRateLimitHeaders(errorResponse, rateLimitResult);
        }
        return errorResponse;
      }
      const openai = new OpenAI({ apiKey: envServer.OPENAI_API_KEY });

      const styleAddon =
        style === 'compact'
          ? 'Stílus: nagyon tömör és kártyás felépítésű. Használj <div class="offer-doc__compact"> gyökérelemet, benne <section class="offer-doc__compact-intro">, <section class="offer-doc__compact-grid"> és <section class="offer-doc__compact-bottom"> blokkokat. A bevezető és projekt összefoglaló legyen 1-2 rövid bekezdés. Minden felsorolás legfeljebb 3 rövid pontból álljon, amelyek a legfontosabb információkat összegzik.'
          : 'Stílus: részletes és indokolt. A bevezető és projekt összefoglaló legyen 2-4 mondatos, informatív bekezdés. A HTML-ben használj <h2>...</h2> szakaszcímeket a megadott szerkezet szerint és tartalmas felsorolásokat (4-6 pont), amelyek részletesen megmagyarázzák a javasolt lépéseket, szolgáltatásokat és eredményeket.';

      const safeLanguage = sanitizeInput(language);
      const safeIndustry = sanitizeInput(industry);
      const safeTitle = sanitizeInput(title);
      const sanitizedDetails = projectDetailFields.reduce<ProjectDetails>(
        (acc, key) => {
          acc[key] = sanitizeInput(projectDetails[key]);
          return acc;
        },
        { ...emptyProjectDetails },
      );
      const safeDescription = formatProjectDetailsForPrompt(sanitizedDetails);
      const safeDeadline = sanitizeInput(deadline || '—');

      const toneGuidance =
        brandVoice === 'formal'
          ? 'Hangnem: formális és professzionális. Használj udvarias, tiszteletteljes kifejezéseket és üzleti terminológiát.'
          : 'Hangnem: barátságos és együttműködő. Használj meleg, de mégis professzionális hangvételt, amely bizalmat kelt.';

      const formalityGuidance =
        formality === 'magázódás'
          ? 'Szólítás: magázódás használata (Ön, Önök, Önöké, stb.). A teljes szövegben következetesen magázódj a címzettel.'
          : 'Szólítás: tegeződés használata (te, ti, tiétek, stb.). A teljes szövegben következetesen tegezd a címzettet.';

      const userPrompt = `
Feladat: Készíts egy professzionális magyar üzleti ajánlatot az alábbi információk alapján.

Nyelv: ${safeLanguage}
${toneGuidance}
${formalityGuidance}
Iparág: ${safeIndustry}
Ajánlat címe: ${safeTitle}

Projekt leírás: ${safeDescription}
Határidő: ${safeDeadline}

${styleAddon}

Különös figyelmet fordít a következőkre:
- Használj természetes, folyékony magyar nyelvet, kerülve az anglicizmusokat
- Minden szakasz legyen logikusan felépített és egymásra épülő
- A felsorolások pontjai legyenek konkrétak, mérhetők és érthetők
- A szöveg legyen meggyőző, de nem túlzottan marketinges
- Ne találj ki árakat, az árképzés külön jelenik meg az alkalmazásban
- A szólítást következetesen alkalmazd a teljes szövegben
`;

      const encoder = new TextEncoder();
      const previewModels = ['o4-mini', 'gpt-4o-mini'] as const;
      const MAX_RETRIES = 3; // Increased retries for better error recovery
      const RETRY_DELAY_BASE_MS = 500; // Base delay for exponential backoff

      // Check if request was aborted before starting
      if (req.signal?.aborted) {
        return new NextResponse(null, { status: 499 }); // Client Closed Request
      }

      let stream: Awaited<ReturnType<typeof openai.responses.stream>> | null = null;
      let lastError: unknown = null;

      // Improved error recovery with retries and better fallback logic
      for (const model of previewModels) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
          // Check abort signal before each attempt
          if (req.signal?.aborted) {
            return new NextResponse(null, { status: 499 });
          }

          try {
            const requestOptions: Parameters<typeof openai.responses.stream>[0] = {
              model,
              input: [
                { role: 'system', content: BASE_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
              ],
            };

            if (!model.startsWith('o4')) {
              requestOptions.temperature = 0.7;
            }

            stream = await openai.responses.stream(requestOptions);
            if (model !== previewModels[0] || attempt > 0) {
              log.warn('Using fallback model for preview', { model, attempt, lastError });
            }
            break;
          } catch (error) {
            lastError = error;

            // Check if request was aborted
            if (req.signal?.aborted || isAbortLikeError(error)) {
              if (req.signal?.aborted) {
                return new NextResponse(null, { status: 499 });
              }
              // Retry abort errors with exponential backoff
              if (attempt < MAX_RETRIES - 1) {
                const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt);
                await wait(delay);
                continue;
              }
              // If last attempt and not last model, try next model
              if (model !== previewModels[previewModels.length - 1]) {
                log.warn('Aborted stream, retrying with fallback model', { model, error });
                break;
              }
              throw error;
            }

            // Handle API errors - retry on transient errors, fallback on model errors
            if (error instanceof APIError) {
              const isModelMissing =
                error.status === 404 ||
                error.code === 'model_not_found' ||
                error.code === 'model_not_found_error';

              if (isModelMissing) {
                // Try next model
                break;
              }

              // Retry on rate limit or server errors (5xx)
              const isRetryable =
                error.status === 429 || // Rate limit
                error.status === 500 || // Server error
                error.status === 502 || // Bad gateway
                error.status === 503 || // Service unavailable
                error.status === 504; // Gateway timeout

              if (isRetryable && attempt < MAX_RETRIES - 1) {
                const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt);
                log.warn('Retrying AI preview request after error', {
                  status: error.status,
                  attempt: attempt + 1,
                  delay,
                });
                await wait(delay);
                continue;
              }

              // If last model and last attempt, throw error
              if (
                model === previewModels[previewModels.length - 1] &&
                attempt === MAX_RETRIES - 1
              ) {
                throw error;
              }

              // Try next model on non-retryable errors
              if (!isRetryable && model !== previewModels[previewModels.length - 1]) {
                log.warn('API error, trying fallback model', {
                  status: error.status,
                  model,
                  error,
                });
                break;
              }
            }

            // For other errors, retry with exponential backoff
            if (attempt < MAX_RETRIES - 1) {
              const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt);
              await wait(delay);
              continue;
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

      // Check abort signal after stream creation
      if (req.signal?.aborted) {
        try {
          stream.abort();
        } catch {
          // ignore abort errors
        }
        return new NextResponse(null, { status: 499 });
      }

      let removeStreamListeners: (() => void) | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let closeStreamRef: (() => void) | null = null;
      let isCleanedUp = false;

      const cleanup = () => {
        if (isCleanedUp) return; // Prevent double cleanup
        isCleanedUp = true;

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
          const MAX_ACCUMULATED_SIZE = 10 * 1024 * 1024; // 10MB limit to prevent memory issues

          // Set up abort signal listener
          const abortHandler = () => {
            if (!closed) {
              try {
                stream.abort();
              } catch {
                // ignore abort errors
              }
              closeStream();
            }
          };
          req.signal?.addEventListener('abort', abortHandler);

          const closeStream = () => {
            if (closed) return;
            closed = true;
            req.signal?.removeEventListener('abort', abortHandler);
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

          // Queue for backpressure handling
          const payloadQueue: Array<Record<string, unknown>> = [];
          let isProcessingQueue = false;
          let isPaused = false;

          const processQueue = () => {
            if (isProcessingQueue || closed || payloadQueue.length === 0) {
              return;
            }

            isProcessingQueue = true;
            while (payloadQueue.length > 0 && !closed) {
              const desiredSize = controller.desiredSize;
              // If buffer is full, stop processing and wait
              if (desiredSize !== null && desiredSize <= 0) {
                isPaused = true;
                isProcessingQueue = false;
                // Resume processing after a short delay
                setTimeout(() => {
                  if (!closed) {
                    processQueue();
                  }
                }, 50);
                return;
              }

              if (isPaused) {
                isPaused = false;
              }

              const payload = payloadQueue.shift();
              if (!payload) break;

              try {
                const data = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
                controller.enqueue(data);
              } catch (enqueueError) {
                if (enqueueError instanceof TypeError && enqueueError.message.includes('closed')) {
                  closeStream();
                  return;
                }
                // If enqueue fails due to backpressure, re-queue and retry
                payloadQueue.unshift(payload);
                isProcessingQueue = false;
                setTimeout(() => {
                  if (!closed) {
                    processQueue();
                  }
                }, 50);
                return;
              }
            }
            isProcessingQueue = false;
          };

          const push = (payload: Record<string, unknown>) => {
            if (closed) return;

            payloadQueue.push(payload);
            processQueue();
          };

          const handleDelta = (event: { delta?: string }) => {
            if (!event.delta) return;

            // Prevent unbounded memory growth
            if (accumulated.length + event.delta.length > MAX_ACCUMULATED_SIZE) {
              log.warn('Accumulated HTML size limit reached, truncating', {
                currentSize: accumulated.length,
                deltaSize: event.delta.length,
                maxSize: MAX_ACCUMULATED_SIZE,
              });
              // Truncate accumulated to make room, keeping last portion
              const keepSize = Math.floor(MAX_ACCUMULATED_SIZE * 0.9); // Keep 90%
              accumulated = accumulated.slice(-keepSize);
            }

            accumulated += event.delta;
            push({ type: 'delta', html: sanitizeHTML(accumulated) });
          };

          const handleEnd = () => {
            const finalHtml = sanitizeHTML(accumulated || '<p>(nincs előnézet)</p>');
            const summary = extractPreviewSummaryHighlights(finalHtml);
            const issues = detectPreviewIssues(finalHtml);
            push({ type: 'done', html: finalHtml, summary, issues });
            closeStream();
          };

          const handleAbort = (error: unknown) => {
            log.warn('Preview stream aborted', {
              error: error instanceof Error ? error.message : String(error),
            });
            const message = 'Az előnézet kérése megszakadt. Próbáld újra néhány másodperc múlva.';
            push({ type: 'error', message });
            closeStream();
          };

          const handleError = (error: unknown) => {
            log.error('Preview stream error', error);
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
                  log.error('Failed to abort preview stream after timeout', abortError);
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
              log.error('Failed to abort preview stream on cancel', abortError);
            }
          } finally {
            closeStreamRef?.();
            cleanup();
            closeStreamRef = null;
          }
        },
      });

      // Create response promise and cache it for deduplication
      const responseHeaders: Record<string, string> = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'x-request-id': requestId,
      };

      // Add rate limit headers if available
      if (rateLimitResult) {
        const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);
        Object.assign(responseHeaders, rateLimitHeaders);
      }

      const responsePromise = Promise.resolve(
        new NextResponse(readable, {
          headers: responseHeaders,
        }),
      );

      // Cache the request for deduplication (only cache for short time)
      // Note: Cleanup is handled by the periodic cleanup interval, so we don't need
      // individual setTimeout calls that could leak memory
      if (requestHash) {
        requestCache.set(requestHash, {
          promise: responsePromise,
          timestamp: Date.now(),
        });
        // No need for individual setTimeout - the cleanup interval will remove expired entries
      }

      return responsePromise;
    } catch (error) {
      // Remove from cache on error
      if (requestHash) {
        requestCache.delete(requestHash);
      }
      if (isAbortLikeError(error)) {
        log.error('AI preview aborted before streaming could start', error);
        const abortResponse = NextResponse.json(
          { error: 'Az OpenAI kapcsolat megszakadt. Próbáld újra néhány másodperc múlva.' },
          { status: 503 },
        );
        abortResponse.headers.set('x-request-id', requestId);
        if (rateLimitResult) {
          addRateLimitHeaders(abortResponse, rateLimitResult);
        }
        return abortResponse;
      }
      if (error instanceof APIError) {
        log.error('AI preview API error', error);
        const status = typeof error.status === 'number' ? error.status : 500;
        const errorMessage =
          (typeof error.message === 'string' && error.message.trim().length > 0
            ? error.message
            : error.error && typeof error.error === 'object'
              ? String((error.error as { message?: unknown }).message ?? 'Preview failed')
              : 'Preview failed') || 'Preview failed';

        // Handle 403 Forbidden errors specifically
        if (status === 403) {
          log.error('OpenAI API 403 Forbidden error in preview', {
            status: error.status,
            code: error.code,
            message: error.message,
            type: error.type,
          });
          const errorResponse = NextResponse.json(
            {
              error:
                'Az OpenAI API kulcs érvénytelen vagy nincs engedélyezve. Kérjük, ellenőrizd az API kulcsot és a fiók beállításait.',
            },
            { status: 403 },
          );
          errorResponse.headers.set('x-request-id', requestId);
          if (rateLimitResult) {
            addRateLimitHeaders(errorResponse, rateLimitResult);
          }
          return errorResponse;
        }

        const errorResponse = NextResponse.json({ error: errorMessage }, { status });
        errorResponse.headers.set('x-request-id', requestId);
        if (rateLimitResult) {
          addRateLimitHeaders(errorResponse, rateLimitResult);
        }
        return errorResponse;
      }

      const errorResponse = handleUnexpectedError(error, requestId, log);
      if (rateLimitResult) {
        addRateLimitHeaders(errorResponse, rateLimitResult);
      }
      return errorResponse;
    }
  }),
);
