/**
 * Chat Analytics API Route
 *
 * Handles analytics tracking for chatbot usage and performance.
 * Part of the unified /api/chat endpoint structure.
 *
 * POST /api/chat/analytics
 * Body: { event: string, data: Record<string, unknown> }
 *
 * GET /api/chat/analytics
 * Returns analytics statistics
 *
 * Industry Best Practices:
 * - Non-blocking analytics (don't fail main request)
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
 * POST /api/chat/analytics
 *
 * Logs an analytics event.
 * Best Practice: Non-blocking - never fails the main request.
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);

  try {
    // Get client IP and user agent
    const userIp =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      log.warn('Failed to parse analytics request body', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        requestId,
      });
      // Don't fail the request if analytics logging fails
      return NextResponse.json({ success: true, requestId });
    }

    const { event, data } = body;

    // Validate input
    if (!event || typeof event !== 'string') {
      return NextResponse.json(
        {
          error: 'Ă‰rvĂ©nytelen esemĂ©ny tĂ­pus',
          requestId,
        },
        { status: 400 },
      );
    }

    // Store analytics event in database
    const supabase = supabaseServiceRole();
    const { error } = await supabase.from('chatbot_analytics').insert({
      event_type: event,
      event_data: data || {},
      user_ip: userIp,
      user_agent: userAgent,
      request_id: requestId,
    });

    if (error) {
      // Log error but don't fail the request
      log.warn('Failed to store analytics event', {
        error: error.message,
        event,
        requestId,
      });
    }

    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    // Don't fail the request if analytics logging fails
    log.warn('Error processing analytics event', {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json({ success: true, requestId });
  }
}

/**
 * GET /api/chat/analytics
 *
 * Retrieves analytics statistics.
 */
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);

  try {
    const supabase = supabaseServiceRole();
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('event');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('chatbot_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      log.error('Failed to retrieve analytics', {
        error: error.message,
        requestId,
      });
      return NextResponse.json(
        {
          error: 'Nem sikerĂĽlt lekĂ©rni az analitikĂˇt',
          requestId,
        },
        { status: 500 },
      );
    }

    // Calculate statistics
    const totalEvents = data?.length || 0;
    const eventCounts: Record<string, number> = {};
    const avgResponseTime: number[] = [];
    const avgTokenUsage: number[] = [];

    data?.forEach((event) => {
      // Count events by type
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;

      // Extract metrics
      if (event.event_type === 'query_processed') {
        const responseTime = event.event_data?.responseTime as number;
        const tokenUsage = event.event_data?.tokenUsage as number;

        if (typeof responseTime === 'number') {
          avgResponseTime.push(responseTime);
        }
        if (typeof tokenUsage === 'number') {
          avgTokenUsage.push(tokenUsage);
        }
      }
    });

    return NextResponse.json({
      totalEvents,
      eventCounts,
      avgResponseTime:
        avgResponseTime.length > 0
          ? Math.round(avgResponseTime.reduce((a, b) => a + b, 0) / avgResponseTime.length)
          : 0,
      avgTokenUsage:
        avgTokenUsage.length > 0
          ? Math.round(avgTokenUsage.reduce((a, b) => a + b, 0) / avgTokenUsage.length)
          : 0,
      recentEvents: data?.slice(0, 50) || [],
      requestId,
    });
  } catch (error) {
    log.error('Error retrieving analytics', {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json(
      {
        error: 'VĂˇratlan hiba tĂ¶rtĂ©nt',
        requestId,
      },
      { status: 500 },
    );
  }
}