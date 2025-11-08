/**
 * Chat API Route - Compatibility Route
 * 
 * This route exists for compatibility with the useChat hook which may default to /api/chat.
 * It forwards all requests to /api/chatbot to maintain functionality.
 * 
 * NOTE: This is a compatibility layer. The primary endpoint is /api/chatbot.
 * 
 * POST /api/chat
 * Body: { messages: Array<{ role: string; content: string }> }
 */

import { NextRequest } from 'next/server';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/chat
 * Health check endpoint
 */
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    message: 'Chat API is available. This route forwards to /api/chatbot.',
    primaryEndpoint: '/api/chatbot'
  });
}

/**
 * POST /api/chat
 * Forwards requests to /api/chatbot
 * 
 * This route exists as a compatibility layer for the useChat hook.
 * It directly imports and calls the chatbot handler to avoid HTTP overhead.
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  
  log.info('Chat API route called (compatibility layer), forwarding to /api/chatbot', {
    method: req.method,
    url: req.url,
    forwarded: true,
  });
  
  try {
    // Import and call the chatbot handler directly to avoid HTTP overhead
    // This is more efficient than making an internal HTTP request and preserves streaming
    // The request body will be read by the chatbot handler
    const { POST as chatbotPOST } = await import('../chatbot/route');
    
    // Call the chatbot handler with the same request
    // The handler will process it as if it came directly to /api/chatbot
    return await chatbotPOST(req);
  } catch (error) {
    log.error('Error forwarding request to chatbot API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return error response
    return Response.json(
      {
        error: 'Hiba történt a kérés feldolgozása során. Kérjük, próbáld meg újra.',
        requestId,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 },
    );
  }
}

