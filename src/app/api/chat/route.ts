/**
 * Chat API Route - Primary Chatbot Endpoint
 * 
 * Single, well-defined endpoint for chatbot functionality following 2025 industry best practices.
 * Implements RAG (Retrieval Augmented Generation) with streaming responses.
 * 
 * POST /api/chat
 * Body: { messages: Array<{ role: string; content: string }> }
 * 
 * Industry Best Practices Implemented:
 * - Single endpoint per resource (simplifies maintenance, enhances security)
 * - Comprehensive error handling with structured logging
 * - Rate limiting for abuse prevention
 * - Request validation and sanitization
 * - Analytics tracking for continuous improvement
 * - Secure API integrations
 * - API-first design approach
 */

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { generateQueryEmbedding, createOpenAIClient } from '@/lib/chatbot/embeddings';
import { retrieveSimilarDocuments, formatContext } from '@/lib/chatbot/retrieval';
import { rerankDocuments } from '@/lib/chatbot/reranking';
import { generateQueryVariations } from '@/lib/chatbot/multi-query';
import { summarizeConversation, shouldSummarize } from '@/lib/chatbot/summarization';
import { matchPresetQuestion } from '@/lib/chatbot/preset-questions';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { checkRateLimitMiddleware, createRateLimitResponse } from '@/lib/rateLimitMiddleware';

// Configuration constants
const MAX_MESSAGES = 20; // Limit conversation history
const RETRIEVAL_LIMIT = 5; // Number of document chunks to retrieve after re-ranking
const RETRIEVAL_LIMIT_BEFORE_RERANK = 10; // Retrieve more documents before re-ranking
const SIMILARITY_THRESHOLD = 0.7; // Minimum similarity score
const ENABLE_MULTI_QUERY = true; // Enable multi-query retrieval
const ENABLE_RERANKING = true; // Enable query re-ranking
const ENABLE_SUMMARIZATION = true; // Enable conversation summarization
const MAX_REQUEST_SIZE = 1024 * 100; // 100KB max request size

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/chat
 * 
 * Health check endpoint for chatbot API.
 * Follows best practice: provide health check endpoints for monitoring.
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Chat API is running',
    version: '1.0.0',
    features: {
      rag: true,
      multiQuery: ENABLE_MULTI_QUERY,
      reranking: ENABLE_RERANKING,
      summarization: ENABLE_SUMMARIZATION,
    },
  });
}

/**
 * POST /api/chat
 * 
 * Handles chatbot queries with RAG (Retrieval Augmented Generation).
 * Public endpoint - no authentication required (for now).
 * 
 * Industry Best Practices:
 * - Comprehensive input validation
 * - Rate limiting
 * - Structured error handling
 * - Request logging
 * - Analytics tracking
 * - Secure error messages (no sensitive data exposure)
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  const startTime = Date.now();
  
  try {
    log.info('Chat API route called', {
      method: req.method,
      url: req.url,
      requestId,
    });
    
    // Best Practice: Rate limiting (prevent abuse and DoS)
    let rateLimitResult;
    try {
      rateLimitResult = await checkRateLimitMiddleware(req, {
        maxRequests: 10, // 10 requests per window
        windowMs: 60 * 1000, // 1 minute window
        keyPrefix: 'chat',
      });
      
      if (rateLimitResult && !rateLimitResult.allowed) {
        log.warn('Chat rate limit exceeded', {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          requestId,
        });
        return createRateLimitResponse(
          rateLimitResult,
          'Túl sok kérés. Kérjük, várj egy pillanatot, mielőtt újra kérdeznél.',
        );
      }
    } catch (rateLimitError) {
      // If rate limiting fails, log but continue (don't block the request)
      log.warn('Rate limit check failed', { 
        error: rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError),
        requestId,
      });
    }
    
    // Best Practice: Request size validation
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      log.warn('Request too large', {
        size: contentLength,
        maxSize: MAX_REQUEST_SIZE,
        requestId,
      });
      return NextResponse.json(
        { error: 'A kérés túl nagy. Kérjük, próbáld újra rövidebb üzenettel.' },
        { status: 413 },
      );
    }
    
    // Best Practice: Input validation and parsing
    let body;
    try {
      body = await req.json();
      log.info('Request body parsed', { 
        bodyKeys: Object.keys(body || {}),
        requestId,
      });
    } catch (parseError) {
      log.error('Failed to parse request body', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        requestId,
      });
      return NextResponse.json(
        { 
          error: 'Érvénytelen kérés: nem sikerült feldolgozni a kérést',
          requestId,
        },
        { status: 400 },
      );
    }
    
    // Best Practice: Validate message format
    const messages = body?.messages || (Array.isArray(body) ? body : []);
    
    if (!Array.isArray(messages) || messages.length === 0) {
      log.warn('Invalid request: messages array missing or empty', {
        bodyKeys: Object.keys(body || {}),
        bodyType: typeof body,
        isArray: Array.isArray(body),
        requestId,
      });
      return NextResponse.json(
        { 
          error: 'Érvénytelen kérés: üzenetek tömbje szükséges',
          requestId,
        },
        { status: 400 },
      );
    }
    
    // Best Practice: Validate message count (prevent abuse)
    if (messages.length > MAX_MESSAGES * 2) {
      log.warn('Too many messages in request', {
        messageCount: messages.length,
        maxAllowed: MAX_MESSAGES * 2,
        requestId,
      });
      return NextResponse.json(
        { 
          error: 'Túl sok üzenet a kérésben. Kérjük, kezdj új beszélgetést.',
          requestId,
        },
        { status: 400 },
      );
    }
    
    // Helper to extract text content from message (handles multiple formats from useChat)
    const getMessageContent = (message: any): string => {
      // Format 1: { role: 'user', content: 'text' } - standard format
      if (typeof message?.content === 'string') {
        return message.content.trim();
      }
      // Format 2: { role: 'user', parts: [{ type: 'text', text: '...' }] } - parts array format
      if (message?.parts && Array.isArray(message.parts)) {
        return message.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => (part.text || '').trim())
          .join(' ')
          .trim();
      }
      // Format 3: { role: 'user', text: 'text' } - alternative format
      if (message?.text) {
        return message.text.trim();
      }
      // Format 4: Direct string (shouldn't happen but handle gracefully)
      if (typeof message === 'string') {
        return message.trim();
      }
      log.warn('Could not extract message content', { message, requestId });
      return '';
    };
    
    // Convert messages to format expected by streamText
    const convertedMessages = messages
      .map((m: any) => {
        const content = getMessageContent(m);
        if (!content) return null;
        
        // Best Practice: Sanitize content (basic validation)
        if (content.length > 10000) {
          log.warn('Message content too long', {
            length: content.length,
            requestId,
          });
          return null;
        }
        
        return {
          role: m.role === 'user' ? 'user' : 'assistant',
          content,
        };
      })
      .filter((m: any): m is { role: 'user' | 'assistant'; content: string } => m !== null);
    
    if (convertedMessages.length === 0) {
      log.warn('Invalid request: no valid messages found after conversion', { requestId });
      return NextResponse.json(
        { 
          error: 'Érvénytelen kérés: nem találhatók érvényes üzenetek',
          requestId,
        },
        { status: 400 },
      );
    }
    
    // Get the last user message for RAG
    const userMessages = convertedMessages.filter((m: any) => m.role === 'user');
    const lastMessage = userMessages[userMessages.length - 1];
    
    if (!lastMessage || !lastMessage.content) {
      log.warn('Invalid request: last message missing content', { requestId });
      return NextResponse.json(
        { 
          error: 'Érvénytelen kérés: az utolsó üzenetnek tartalmaznia kell tartalmat',
          requestId,
        },
        { status: 400 },
      );
    }
    
    // Initialize clients
    const supabase = supabaseServiceRole();
    const openaiClient = createOpenAIClient();
    
    // Best Practice: Conversation summarization for long conversations
    let messagesToUse: Array<{ role: 'user' | 'assistant'; content: string }> = convertedMessages;
    if (ENABLE_SUMMARIZATION && shouldSummarize(convertedMessages)) {
      log.info('Summarizing conversation', {
        originalLength: convertedMessages.length,
        requestId,
      });
      try {
        const summarized = await summarizeConversation(convertedMessages, openaiClient);
        // Ensure type safety - summarizeConversation should return properly typed messages
        messagesToUse = summarized.map((m) => ({
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        }));
        log.info('Conversation summarized', {
          newLength: messagesToUse.length,
          requestId,
        });
      } catch (summarizeError) {
        log.warn('Conversation summarization failed, using original messages', {
          error: summarizeError instanceof Error ? summarizeError.message : String(summarizeError),
          requestId,
        });
        // Fallback to original messages with limit
        messagesToUse = convertedMessages.slice(-MAX_MESSAGES);
      }
    } else {
      // Limit conversation history
      messagesToUse = convertedMessages.slice(-MAX_MESSAGES);
    }
    
    log.info('Processing chat query', {
      messageCount: messages.length,
      messagesUsed: messagesToUse.length,
      queryLength: lastMessage.content.length,
      requestId,
    });
    
    // Check for preset questions first (before vector search)
    // First try exact match (threshold 1.0 = exact match only, no similarity)
    // This handles clicked predefined questions instantly
    let presetMatch = matchPresetQuestion(lastMessage.content, 1.0);
    
    // If no exact match, try similarity matching for free-text that might match predefined questions
    // Use a threshold of 0.75 for free-text matching (higher than before for better quality)
    if (!presetMatch) {
      presetMatch = matchPresetQuestion(lastMessage.content, 0.75);
    }
    if (presetMatch) {
      log.info('Matched preset question', {
        question: presetMatch.question,
        query: lastMessage.content,
        requestId,
      });
      
      // For preset questions, use streamText with the actual user question
      // but provide the answer in the system prompt to guide the response
      try {
        const presetAnswer = presetMatch.answer;
        
        // Use streamText with the user's actual question and provide the answer
        // in the system prompt. The model should return the preset answer.
        // We use a very explicit instruction to return the exact answer.
        const result = streamText({
          model: openai('gpt-3.5-turbo'), // Use gpt-3.5-turbo for cost efficiency
          system: `You are Vanda, a helpful assistant for Vyndi.

The user has asked: "${presetMatch.question}"

You MUST respond with the following answer EXACTLY as written. Do not modify, add, or remove any text. Return the answer verbatim:

${presetAnswer}`,
          messages: [
            {
              role: 'user',
              content: lastMessage.content,
            },
          ],
          temperature: 0, // Use temperature 0 for deterministic output
        });
        
        const responseTime = Date.now() - startTime;
        
        // Track analytics (async, don't await)
        fetch(`${req.nextUrl.origin}/api/chat/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'query_processed',
            data: {
              queryLength: lastMessage.content.length,
              documentCount: 0,
              responseTime,
              cacheHit: false,
              multiQuery: false,
              reranked: false,
              presetQuestion: true,
              requestId,
            },
          }),
        }).catch((error) => {
          log.warn('Failed to track analytics', {
            error: error instanceof Error ? error.message : String(error),
            requestId,
          });
        });
        
        log.info('Returning preset answer via AI SDK stream', {
          answerLength: presetAnswer.length,
          requestId,
        });
        
        // Return the stream response using AI SDK's format
        return result.toTextStreamResponse();
      } catch (error) {
        log.error('Failed to create stream response for preset question', error instanceof Error ? error : undefined, {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestId,
        });
        
        // If streaming fails, fall through to regular RAG processing as backup
        log.warn('Streaming failed for preset question, falling through to RAG processing', {
          requestId,
        });
        // Don't return here - let it fall through to regular processing
      }
    }
    
    // Best Practice: Multi-query retrieval (improves recall)
    let allDocuments: Awaited<ReturnType<typeof retrieveSimilarDocuments>> = [];
    
    if (ENABLE_MULTI_QUERY) {
      try {
        // Generate query variations
        const queryVariations = await generateQueryVariations(
          lastMessage.content,
          openaiClient,
        );
        
        log.info('Generated query variations', {
          count: queryVariations.length,
          requestId,
        });
        
        // Retrieve documents for each variation
        const retrievalPromises = queryVariations.map(async (query) => {
          const queryEmbedding = await generateQueryEmbedding(query, openaiClient);
          return retrieveSimilarDocuments(
            supabase,
            queryEmbedding,
            RETRIEVAL_LIMIT_BEFORE_RERANK,
            SIMILARITY_THRESHOLD,
          );
        });
        
        const documentsArrays = await Promise.all(retrievalPromises);
        allDocuments = documentsArrays.flat();
        
        // Deduplicate by document ID
        const uniqueDocs = Array.from(
          new Map(allDocuments.map(doc => [doc.id, doc])).values()
        );
        allDocuments = uniqueDocs;
      } catch (error) {
        log.warn('Multi-query retrieval failed, falling back to single query', {
          error: error instanceof Error ? error.message : String(error),
          requestId,
        });
        // Fallback to single query
        try {
          const queryEmbedding = await generateQueryEmbedding(
            lastMessage.content,
            openaiClient,
          );
          allDocuments = await retrieveSimilarDocuments(
            supabase,
            queryEmbedding,
            RETRIEVAL_LIMIT_BEFORE_RERANK,
            SIMILARITY_THRESHOLD,
          );
        } catch (fallbackError) {
          log.error('Single query retrieval also failed', {
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
            requestId,
          });
          // Return error response
          return NextResponse.json(
            {
              error: 'Hiba történt a dokumentumok lekérésében. Kérjük, próbáld újra.',
              requestId,
            },
            { status: 500 },
          );
        }
      }
    } else {
      // Single query retrieval
      try {
        const queryEmbedding = await generateQueryEmbedding(
          lastMessage.content,
          openaiClient,
        );
        allDocuments = await retrieveSimilarDocuments(
          supabase,
          queryEmbedding,
          RETRIEVAL_LIMIT_BEFORE_RERANK,
          SIMILARITY_THRESHOLD,
        );
      } catch (error) {
        log.error('Document retrieval failed', {
          error: error instanceof Error ? error.message : String(error),
          requestId,
        });
        return NextResponse.json(
          {
            error: 'Hiba történt a dokumentumok lekérésében. Kérjük, próbáld újra.',
            requestId,
          },
          { status: 500 },
        );
      }
    }
    
    // Best Practice: Re-ranking documents (improves precision)
    let documents = allDocuments;
    if (ENABLE_RERANKING && documents.length > RETRIEVAL_LIMIT) {
      try {
        log.info('Re-ranking documents', {
          before: documents.length,
          after: RETRIEVAL_LIMIT,
          requestId,
        });
        documents = await rerankDocuments(
          lastMessage.content,
          documents,
          RETRIEVAL_LIMIT,
        );
        log.info('Documents re-ranked', {
          count: documents.length,
          requestId,
        });
      } catch (error) {
        log.warn('Re-ranking failed, using original results', {
          error: error instanceof Error ? error.message : String(error),
          requestId,
        });
        // Fallback: just take top N by similarity
        documents = documents
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, RETRIEVAL_LIMIT);
      }
    } else {
      // Sort by similarity and take top N
      documents = documents
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, RETRIEVAL_LIMIT);
    }
    
    log.info('Retrieved documents', {
      count: documents.length,
      sources: documents.map((d) => d.sourcePath),
      multiQuery: ENABLE_MULTI_QUERY,
      reranked: ENABLE_RERANKING,
      requestId,
    });
    
    // Handle case when no documents are found
    // Best Practice: Provide helpful response even when no documents match
    let context: string;
    let systemPrompt: string;
    
    if (documents.length === 0) {
      log.warn('No documents found for query', {
        query: lastMessage.content,
        requestId,
      });
      
      // Still provide a response, but inform the user that no documentation was found
      context = 'No relevant documentation found for this query.';
      systemPrompt = `Te Vanda vagy, a Vyndi segítőasszisztense. Barátságos, segítőkész emberként válaszolsz, aki szívesen segít a felhasználóknak megérteni a Vyndi platformot.

Válaszolj KIZÁRÓLAG magyar nyelven, barátságos, közvetlen hangvételben, mintha egy kolléga lennél, aki segít. Használj "te" szólítást, és legyél természetes, meleg.

Számodra a következőkről kell válaszolnod:
- Vyndi funkciói és működése
- Előfizetési csomagok és árazás
- Sablon rendszer
- Platform használata
- Ajánlat készítés lépésről lépésre

Fontos: Nem található releváns dokumentáció erre a kérdésre a jelenlegi adatbázisban.

Utasítások:
- Barátságosan jelezd, hogy sajnos erre a konkrét kérdésre jelenleg nem találok információt a dokumentációban
- Javasold, hogy nézzen szét a dokumentációban vagy írjon a támogatásnak
- Ha lehetséges, adj általános választ a Vyndi funkcióiról, amit tudsz
- Válaszolj, mintha egy segítőkész kolléga lennél - természetes, barátságos, de professzionális
- Használj rövid mondatokat, és ha lehet, példákkal illusztráld a válaszodat
- Ha nem vagy biztos valamiben, azt is mondd el őszintén`;
    } else {
      // Format context from retrieved documents (with markdown links)
      context = formatContext(documents, true);
      
      // Build system prompt - Vanda as a person, friendly and helpful
      systemPrompt = `Te Vanda vagy, a Vyndi segítőasszisztense. Barátságos, segítőkész emberként válaszolsz, aki szívesen segít a felhasználóknak megérteni a Vyndi platformot.

Válaszolj KIZÁRÓLAG magyar nyelven, barátságos, közvetlen hangvételben, mintha egy kolléga lennél, aki segít. Használj "te" szólítást, és legyél természetes, meleg. Válaszaid legyenek informatívak, de közvetlenek és könnyen érthetők.

Számodra a következőkről kell válaszolnod:
- Vyndi funkciói és működése
- Előfizetési csomagok és árazás
- Sablon rendszer
- Platform használata
- Ajánlat készítés lépésről lépésre

Utasítások:
- Válaszolj KIZÁRÓLAG a megadott dokumentációs kontextus alapján
- Ha az információ nincs a kontextusban, barátságosan jelezd, hogy erre nem találsz információt
- Legyél segítőkész és informatív, de ne legyél túl hosszadalmas
- Adj konkrét példákat a dokumentációból, amikor releváns - ez segít megérteni a dolgokat
- Hivatkozz forrásdokumentumokra, amikor hasznos (formátum: [Forrás: path/to/doc.md])
- Ha olyanról kérdeznek, ami nincs a dokumentációban, barátságosan javasold, hogy nézzen szét vagy írjon a támogatásnak
- Válaszolj, mintha egy segítőkész kolléga lennél - természetes, barátságos, de professzionális
- Használj rövid mondatokat és bekezdéseket, hogy könnyen olvasható legyen
- Ha valami összetett, próbáld lépésről lépésre elmagyarázni
- Ne használj túl technikai kifejezéseket, vagy ha igen, magyarázd el röviden

Dokumentációs Kontextus:
${context}`;
    }
    
    // Stream response using Vercel AI SDK
    let result;
    try {
      result = streamText({
        model: openai('gpt-3.5-turbo'), // Using GPT-3.5 for cost efficiency
        system: systemPrompt,
        messages: messagesToUse,
        temperature: 0.7, // Balanced creativity
        // Note: maxTokens removed as it's not supported in this AI SDK version
        // The model will use its default max token limit
      });
    } catch (streamError) {
      log.error('Failed to create stream response', streamError instanceof Error ? streamError : undefined, {
        errorType: streamError instanceof Error ? streamError.constructor.name : typeof streamError,
        requestId,
      });
      throw streamError;
    }
    
    // Best Practice: Analytics tracking (async, don't await)
    const responseTime = Date.now() - startTime;
    fetch(`${req.nextUrl.origin}/api/chat/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'query_processed',
        data: {
          queryLength: lastMessage.content.length,
          documentCount: documents.length,
          responseTime,
          cacheHit: false,
          multiQuery: ENABLE_MULTI_QUERY,
          reranked: ENABLE_RERANKING,
          requestId,
        },
      }),
    }).catch((error) => {
      log.warn('Failed to track analytics', {
        error: error instanceof Error ? error.message : String(error),
        requestId,
      });
    });
    
    // Return text stream response compatible with @ai-sdk/react useChat hook
    // Use toTextStreamResponse() for useChat hook compatibility
    try {
      // Check if result has the toTextStreamResponse method
      if (!result || typeof result.toTextStreamResponse !== 'function') {
        log.error('Invalid stream result: toTextStreamResponse method not found', undefined, {
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : [],
          requestId,
        });
        throw new Error('Invalid stream result: toTextStreamResponse method not found');
      }
      
      return result.toTextStreamResponse();
    } catch (responseError) {
      const errorMessage = responseError instanceof Error 
        ? responseError.message 
        : String(responseError);
      const errorStack = responseError instanceof Error 
        ? responseError.stack 
        : undefined;
      const errorName = responseError instanceof Error 
        ? responseError.name 
        : typeof responseError;
      
      log.error('Failed to convert stream to response', responseError instanceof Error ? responseError : undefined, {
        errorMessage,
        errorType: errorName,
        errorStack,
        resultType: typeof result,
        resultExists: !!result,
        requestId,
      });
      
      // Return a proper error response instead of throwing
      return NextResponse.json(
        {
          error: 'Hiba történt a válasz generálása során. Kérjük, próbáld újra.',
          requestId,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const log = createLogger(requestId);
    
    // Best Practice: Comprehensive error logging with proper serialization
    // Handle all error types, not just Error instances
    let errorMessage = 'Unknown error';
    let errorStack: string | undefined;
    let errorType = 'Unknown';
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
      errorType = error.constructor.name;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === 'string') {
      errorMessage = error;
      errorType = 'String';
    } else if (error && typeof error === 'object') {
      // Try to extract meaningful information from error object
      try {
        errorMessage = (error as any).message || (error as any).error || JSON.stringify(error);
        errorType = (error as any).constructor?.name || 'Object';
        errorDetails = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
      } catch (serializeError) {
        errorMessage = String(error);
        errorType = 'Object (serialization failed)';
      }
    } else {
      errorMessage = String(error);
      errorType = typeof error;
    }
    
    log.error('Chat API error', error instanceof Error ? error : undefined, {
      errorMessage,
      errorType,
      errorStack,
      errorDetails,
      requestId,
    });
    
    // Best Practice: Track error analytics (non-blocking)
    fetch(`${req.nextUrl.origin}/api/chat/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'error',
        data: {
          error: errorMessage,
          errorType,
          requestId,
        },
      }),
    }).catch((analyticsError) => {
      // Don't log analytics errors to avoid recursion - analytics failures are non-blocking
      // Silently fail - analytics table might not exist yet
    });
    
    // Best Practice: Secure error messages (no sensitive data exposure)
    let userErrorMessage = 'Váratlan hiba történt a kérés feldolgozása során. Kérjük, próbáld meg újra.';
    let statusCode = 500;
    
    const errorMsgLower = errorMessage.toLowerCase();
    if (errorMsgLower.includes('rate limit') || errorMsgLower.includes('429')) {
      userErrorMessage = 'Túl sok kérés. Kérjük, várj egy pillanatot, mielőtt újra kérdeznél.';
      statusCode = 429;
    } else if (errorMsgLower.includes('embedding') || errorMsgLower.includes('openai')) {
      userErrorMessage = 'Hiba történt a kérdés feldolgozása során. Kérjük, próbáld újra.';
      statusCode = 500;
    } else if (errorMsgLower.includes('timeout') || errorMsgLower.includes('timed out')) {
      userErrorMessage = 'A kérés túl sokáig tartott. Kérjük, próbáld újra.';
      statusCode = 504;
    } else if (errorMsgLower.includes('no documents') || errorMsgLower.includes('no relevant')) {
      // This shouldn't happen as we handle it above, but just in case
      userErrorMessage = 'Nem található releváns dokumentáció erre a kérdésre. Kérjük, próbáld más megfogalmazásban.';
      statusCode = 200; // Still return 200, but with a helpful message
    }
    
    return NextResponse.json(
      {
        error: userErrorMessage,
        requestId,
      },
      { status: statusCode },
    );
  }
}
