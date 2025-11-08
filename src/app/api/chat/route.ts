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
      .filter((m: any) => m !== null);
    
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
    let messagesToUse = convertedMessages;
    if (ENABLE_SUMMARIZATION && shouldSummarize(convertedMessages)) {
      log.info('Summarizing conversation', {
        originalLength: convertedMessages.length,
        requestId,
      });
      try {
        messagesToUse = await summarizeConversation(convertedMessages, openaiClient);
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
    
    // Format context from retrieved documents (with markdown links)
    const context = formatContext(documents, true);
    
    // Build system prompt - Hungarian language, Vyndi branding
    const systemPrompt = `Te egy segítőkész asszisztens vagy a Vyndi számára, egy AI-alapú üzleti ajánlatkészítő platform számára.

Válaszolj KIZÁRÓLAG magyar nyelven.

Számodra a következőkről kell válaszolnod:
- Vyndi funkciói és működése
- API dokumentáció
- Sablon rendszer
- Platform használata
- Architektúra és technikai részletek

Utasítások:
- Válaszolj KIZÁRÓLAG a megadott dokumentációs kontextus alapján
- Ha az információ nincs a kontextusban, udvariasan jelezd
- Legyél tömör és segítőkész
- Adj konkrét példákat a dokumentációból, amikor releváns
- Hivatkozz forrásdokumentumokra, amikor hasznos (formátum: [Forrás: path/to/doc.md])
- Ha olyanról kérdeznek, ami nincs a dokumentációban, javasold a dokumentáció ellenőrzését vagy a támogatással való kapcsolatfelvételt
- Mindig magyar nyelven válaszolj

Dokumentációs Kontextus:
${context}`;
    
    // Stream response using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-3.5-turbo'), // Using GPT-3.5 for cost efficiency
      system: systemPrompt,
      messages: messagesToUse,
      maxTokens: 1000, // Limit response length
      temperature: 0.7, // Balanced creativity
    });
    
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
    
    // Return data stream response compatible with @ai-sdk/react useChat hook
    return result.toDataStreamResponse();
  } catch (error) {
    const log = createLogger(requestId);
    
    // Best Practice: Comprehensive error logging
    log.error('Chat API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
    });
    
    // Best Practice: Track error analytics
    fetch(`${req.nextUrl.origin}/api/chat/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'error',
        data: {
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          requestId,
        },
      }),
    }).catch((analyticsError) => {
      // Don't log analytics errors to avoid recursion
      console.error('Failed to track error analytics:', analyticsError);
    });
    
    // Best Practice: Secure error messages (no sensitive data exposure)
    let errorMessage = 'Váratlan hiba történt a kérés feldolgozása során. Kérjük, próbáld meg újra.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Túl sok kérés. Kérjük, várj egy pillanatot, mielőtt újra kérdeznél.';
        statusCode = 429;
      } else if (error.message.includes('embedding') || error.message.includes('OpenAI')) {
        errorMessage = 'Hiba történt a kérdés feldolgozása során. Kérjük, próbáld újra.';
        statusCode = 500;
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = 'A kérés túl sokáig tartott. Kérjük, próbáld újra.';
        statusCode = 504;
      }
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        requestId,
      },
      { status: statusCode },
    );
  }
}
