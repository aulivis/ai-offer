/**
 * Chatbot API Route
 * 
 * Public endpoint for chatbot queries with RAG (Retrieval Augmented Generation).
 * Uses Vercel AI SDK for streaming responses.
 * 
 * POST /api/chatbot
 * Body: { messages: Array<{ role: string; content: string }> }
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

const MAX_MESSAGES = 20; // Limit conversation history
const RETRIEVAL_LIMIT = 5; // Number of document chunks to retrieve after re-ranking
const RETRIEVAL_LIMIT_BEFORE_RERANK = 10; // Retrieve more documents before re-ranking
const SIMILARITY_THRESHOLD = 0.7; // Minimum similarity score
const ENABLE_MULTI_QUERY = true; // Enable multi-query retrieval
const ENABLE_RERANKING = true; // Enable query re-ranking
const ENABLE_CACHING = false; // Enable response caching (disabled for streaming responses)
const ENABLE_SUMMARIZATION = true; // Enable conversation summarization

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Explicitly set runtime (may help with route recognition)
export const runtime = 'nodejs';

/**
 * GET /api/chatbot
 * 
 * Health check endpoint for chatbot API.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Chatbot API is running' });
}

/**
 * POST /api/chatbot
 * 
 * Handles chatbot queries with RAG.
 * Public endpoint - no authentication required.
 */
export async function POST(req: NextRequest) {
  try {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);
    
    log.info('Chatbot API route called', {
      method: req.method,
      url: req.url,
    });
    
    // Rate limiting (public endpoint, so stricter limits)
    let rateLimitResult;
    try {
      rateLimitResult = await checkRateLimitMiddleware(req, {
        maxRequests: 10, // 10 requests per window
        windowMs: 60 * 1000, // 1 minute window
        keyPrefix: 'chatbot',
      });
      
      if (rateLimitResult && !rateLimitResult.allowed) {
        log.warn('Chatbot rate limit exceeded', {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
        });
        return createRateLimitResponse(
          rateLimitResult,
          'Túl sok kérés. Kérjük, várj egy pillanatot, mielőtt újra kérdeznél.',
        );
      }
    } catch (rateLimitError) {
      // If rate limiting fails, log but continue (don't block the request)
      log.warn('Rate limit check failed', { 
        error: rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError) 
      });
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      log.info('Request body parsed', { bodyKeys: Object.keys(body || {}) });
    } catch (parseError) {
      log.error('Failed to parse request body', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return NextResponse.json(
        { error: 'Érvénytelen kérés: nem sikerült feldolgozni a kérést' },
        { status: 400 },
      );
    }
    
    // Handle different message formats from useChat
    // useChat can send: { messages: [...] } or the messages might be at root level
    const messages = body?.messages || (Array.isArray(body) ? body : []);
    
    if (!Array.isArray(messages) || messages.length === 0) {
      log.warn('Invalid request: messages array missing or empty', {
        bodyKeys: Object.keys(body || {}),
        bodyType: typeof body,
        isArray: Array.isArray(body),
      });
      return NextResponse.json(
        { error: 'Érvénytelen kérés: üzenetek tömbje szükséges' },
        { status: 400 },
      );
    }
    
    // Helper to extract text content from message (handles multiple formats from useChat)
    const getMessageContent = (message: any): string => {
      // Format 1: { role: 'user', content: 'text' } - standard format
      if (typeof message?.content === 'string') {
        return message.content;
      }
      // Format 2: { role: 'user', parts: [{ type: 'text', text: '...' }] } - parts array format
      if (message?.parts && Array.isArray(message.parts)) {
        return message.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text || '')
          .join('');
      }
      // Format 3: { role: 'user', text: 'text' } - alternative format
      if (message?.text) {
        return message.text;
      }
      // Format 4: Direct string (shouldn't happen but handle gracefully)
      if (typeof message === 'string') {
        return message;
      }
      log.warn('Could not extract message content', { message });
      return '';
    };
    
    // Convert messages to format expected by streamText
    const convertedMessages = messages
      .map((m: any) => {
        const content = getMessageContent(m);
        if (!content) return null;
        return {
          role: m.role === 'user' ? 'user' : 'assistant',
          content,
        };
      })
      .filter((m: any) => m !== null);
    
    if (convertedMessages.length === 0) {
      log.warn('Invalid request: no valid messages found after conversion');
      return NextResponse.json(
        { error: 'Érvénytelen kérés: nem találhatók érvényes üzenetek' },
        { status: 400 },
      );
    }
    
    // Get the last user message for RAG
    const userMessages = convertedMessages.filter((m: any) => m.role === 'user');
    const lastMessage = userMessages[userMessages.length - 1];
    
    if (!lastMessage || !lastMessage.content) {
      log.warn('Invalid request: last message missing content');
      return NextResponse.json(
        { error: 'Érvénytelen kérés: az utolsó üzenetnek tartalmaznia kell tartalmat' },
        { status: 400 },
      );
    }
    
    // Track start time for analytics
    const startTime = Date.now();
    
    // Initialize clients
    const supabase = supabaseServiceRole();
    const openaiClient = createOpenAIClient();
    
    // Note: Caching is disabled for streaming responses
    // To implement caching, you would need to collect the full streamed response
    // and cache it after streaming completes, then replay on cache hit
    
    // Summarize conversation if needed (if enabled)
    let messagesToUse = convertedMessages;
    if (ENABLE_SUMMARIZATION && shouldSummarize(convertedMessages)) {
      log.info('Summarizing conversation', {
        originalLength: convertedMessages.length,
      });
      messagesToUse = await summarizeConversation(convertedMessages, openaiClient);
      log.info('Conversation summarized', {
        newLength: messagesToUse.length,
      });
    } else {
      // Limit conversation history
      messagesToUse = convertedMessages.slice(-MAX_MESSAGES);
    }
    
    log.info('Processing chatbot query', {
      messageCount: messages.length,
      messagesUsed: messagesToUse.length,
      queryLength: lastMessage.content.length,
    });
    
    // Multi-query retrieval (if enabled)
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
          variations: queryVariations,
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
        });
        // Fallback to single query
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
      }
    } else {
      // Single query retrieval
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
    }
    
    // Re-rank documents (if enabled)
    let documents = allDocuments;
    if (ENABLE_RERANKING && documents.length > RETRIEVAL_LIMIT) {
      try {
        log.info('Re-ranking documents', {
          before: documents.length,
          after: RETRIEVAL_LIMIT,
        });
        documents = await rerankDocuments(
          lastMessage.content,
          documents,
          RETRIEVAL_LIMIT,
        );
        log.info('Documents re-ranked', {
          count: documents.length,
        });
      } catch (error) {
        log.warn('Re-ranking failed, using original results', {
          error: error instanceof Error ? error.message : String(error),
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
    
    // Track analytics (async, don't await)
    const responseTime = Date.now() - startTime;
    fetch(`${req.nextUrl.origin}/api/chatbot/analytics`, {
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
        },
      }),
    }).catch(console.error);
    
    // Cache response (if enabled) - Note: We can't easily cache streaming responses
    // In production, you might want to collect the full response and cache it
    // For now, we'll skip caching streaming responses
    
    // Return data stream response compatible with @ai-sdk/react useChat hook
    return result.toDataStreamResponse();
  } catch (error) {
    const requestId = getRequestId(req);
    const log = createLogger(requestId);
    
    // Log the full error for debugging
    log.error('Chatbot API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Track error analytics
    fetch(`${req.nextUrl.origin}/api/chatbot/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'error',
        data: {
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      }),
    }).catch(console.error);
    
    // Determine error type and return appropriate message
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
