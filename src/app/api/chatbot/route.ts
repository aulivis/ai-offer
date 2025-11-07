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
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { checkRateLimitMiddleware, createRateLimitResponse } from '@/lib/rateLimitMiddleware';

const MAX_MESSAGES = 20; // Limit conversation history
const RETRIEVAL_LIMIT = 5; // Number of document chunks to retrieve
const SIMILARITY_THRESHOLD = 0.7; // Minimum similarity score

/**
 * POST /api/chatbot
 * 
 * Handles chatbot queries with RAG.
 * Public endpoint - no authentication required.
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  
  // Rate limiting (public endpoint, so stricter limits)
  const rateLimitResult = await checkRateLimitMiddleware(req, {
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
      'Too many requests. Please wait a moment before asking another question.',
    );
  }
  
  try {
    // Parse request body
    const body = await req.json();
    const { messages } = body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 },
      );
    }
    
    // Get the last user message
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastMessage = userMessages[userMessages.length - 1];
    
    if (!lastMessage || !lastMessage.content) {
      return NextResponse.json(
        { error: 'Invalid request: last message must have content' },
        { status: 400 },
      );
    }
    
    // Limit conversation history
    const limitedMessages = messages.slice(-MAX_MESSAGES);
    
    log.info('Processing chatbot query', {
      messageCount: messages.length,
      queryLength: lastMessage.content.length,
    });
    
    // Initialize clients
    const supabase = supabaseServiceRole();
    const openaiClient = createOpenAIClient();
    
    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(
      lastMessage.content,
      openaiClient,
    );
    
    // Retrieve relevant documents
    const documents = await retrieveSimilarDocuments(
      supabase,
      queryEmbedding,
      RETRIEVAL_LIMIT,
      SIMILARITY_THRESHOLD,
    );
    
    log.info('Retrieved documents', {
      count: documents.length,
      sources: documents.map((d) => d.sourcePath),
    });
    
    // Format context from retrieved documents
    const context = formatContext(documents);
    
    // Build system prompt
    const systemPrompt = `You are a helpful assistant for Propono, an AI-powered business offer generator platform.

Your role is to answer questions about:
- Propono's features and functionality
- API documentation
- Template system
- How to use the platform
- Architecture and technical details

Instructions:
- Answer questions based ONLY on the provided documentation context
- If the information is not in the context, politely say so
- Be concise and helpful
- Provide specific examples from the documentation when relevant
- Cite source documents when helpful (format: [Source: path/to/doc.md])
- If asked about something not in the documentation, suggest checking the documentation or contacting support

Documentation Context:
${context}`;
    
    // Stream response using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-3.5-turbo'), // Using GPT-3.5 for cost efficiency
      system: systemPrompt,
      messages: limitedMessages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      maxTokens: 1000, // Limit response length
      temperature: 0.7, // Balanced creativity
    });
    
    // Return streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    log.error('Error processing chatbot query', error);
    
    return NextResponse.json(
      {
        error: 'An error occurred while processing your query. Please try again.',
        requestId,
      },
      { status: 500 },
    );
  }
}

