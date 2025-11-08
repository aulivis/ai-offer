/**
 * Chatbot Analytics API Route
 * 
 * Handles analytics tracking for chatbot usage and performance.
 * 
 * POST /api/chatbot/analytics
 * Body: { event: string, data: Record<string, unknown> }
 * 
 * GET /api/chatbot/analytics
 * Returns analytics statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/chatbot/analytics
 * 
 * Logs an analytics event.
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
      log.warn('Failed to parse analytics request body', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      // Don't fail the request if analytics logging fails
      return NextResponse.json({ success: true });
    }
    
    const { event, data } = body;
    
    // Validate input
    if (!event || typeof event !== 'string') {
      return NextResponse.json(
        { error: 'Érvénytelen esemény típus' },
        { status: 400 }
      );
    }
    
    // Store analytics event in database
    const supabase = supabaseServiceRole();
    const { error } = await supabase
      .from('chatbot_analytics')
      .insert({
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
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't fail the request if analytics logging fails
    log.warn('Error processing analytics event', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json({ success: true });
  }
}

/**
 * GET /api/chatbot/analytics
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
      });
      return NextResponse.json(
        { error: 'Nem sikerült lekérni az analitikát' },
        { status: 500 }
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
      avgResponseTime: avgResponseTime.length > 0
        ? Math.round(avgResponseTime.reduce((a, b) => a + b, 0) / avgResponseTime.length)
        : 0,
      avgTokenUsage: avgTokenUsage.length > 0
        ? Math.round(avgTokenUsage.reduce((a, b) => a + b, 0) / avgTokenUsage.length)
        : 0,
      recentEvents: data?.slice(0, 50) || [],
    });
  } catch (error) {
    log.error('Error retrieving analytics', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return NextResponse.json(
      { error: 'Váratlan hiba történt' },
      { status: 500 }
    );
  }
}

