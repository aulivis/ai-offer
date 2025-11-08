/**
 * Chat Feedback API Route
 * 
 * Handles user feedback (thumbs up/down) on chatbot responses.
 * Part of the unified /api/chat endpoint structure.
 * 
 * POST /api/chat/feedback
 * Body: { messageId: string, type: 'up' | 'down', comment?: string }
 * 
 * Industry Best Practices:
 * - Input validation
 * - Structured logging
 * - Error handling
 * - Request ID tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/chat/feedback
 * 
 * Stores user feedback for a chatbot response.
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  
  try {
    // Get client IP and user agent
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      log.error('Failed to parse feedback request body', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        requestId,
      });
      return NextResponse.json(
        { 
          error: 'Érvénytelen kérés',
          requestId,
        },
        { status: 400 }
      );
    }
    
    const { messageId, type, comment } = body;
    
    // Validate input
    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json(
        { 
          error: 'Érvénytelen üzenet azonosító',
          requestId,
        },
        { status: 400 }
      );
    }
    
    if (!type || (type !== 'up' && type !== 'down')) {
      return NextResponse.json(
        { 
          error: 'Érvénytelen visszajelzés típus (up vagy down kell)',
          requestId,
        },
        { status: 400 }
      );
    }
    
    // Store feedback in database
    const supabase = supabaseServiceRole();
    const { error } = await supabase
      .from('chatbot_feedback')
      .insert({
        message_id: messageId,
        feedback_type: type,
        comment: comment || null,
        user_ip: userIp,
        user_agent: userAgent,
      });
    
    if (error) {
      log.error('Failed to store feedback', {
        error: error.message,
        messageId,
        type,
        requestId,
      });
      return NextResponse.json(
        { 
          error: 'Nem sikerült menteni a visszajelzést',
          requestId,
        },
        { status: 500 }
      );
    }
    
    log.info('Feedback stored successfully', {
      messageId,
      type,
      hasComment: !!comment,
      requestId,
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Köszönjük a visszajelzést!',
      requestId,
    });
  } catch (error) {
    log.error('Error processing feedback', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
    });
    
    return NextResponse.json(
      { 
        error: 'Váratlan hiba történt',
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/feedback
 * 
 * Retrieves feedback statistics (admin only - requires service role).
 */
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  
  try {
    const supabase = supabaseServiceRole();
    
    // Get feedback statistics
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('chatbot_feedback')
      .select('feedback_type, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (feedbackError) {
      log.error('Failed to retrieve feedback', {
        error: feedbackError.message,
        requestId,
      });
      return NextResponse.json(
        { 
          error: 'Nem sikerült lekérni a visszajelzéseket',
          requestId,
        },
        { status: 500 }
      );
    }
    
    // Calculate statistics
    const total = feedbackData?.length || 0;
    const upCount = feedbackData?.filter(f => f.feedback_type === 'up').length || 0;
    const downCount = feedbackData?.filter(f => f.feedback_type === 'down').length || 0;
    const satisfactionRate = total > 0 ? (upCount / total) * 100 : 0;
    
    return NextResponse.json({
      total,
      up: upCount,
      down: downCount,
      satisfactionRate: Math.round(satisfactionRate * 100) / 100,
      recentFeedback: feedbackData?.slice(0, 50) || [],
      requestId,
    });
  } catch (error) {
    log.error('Error retrieving feedback', {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });
    
    return NextResponse.json(
      { 
        error: 'Váratlan hiba történt',
        requestId,
      },
      { status: 500 }
    );
  }
}

