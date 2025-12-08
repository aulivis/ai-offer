import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { trackEmailCapture } from '@/lib/analytics';
import { withErrorHandling } from '@/lib/errorHandling';

const subscribeSchema = z.object({
  email: z.string().email('Érvénytelen email cím'),
  name: z.string().optional(),
  source: z.enum(['landing_page', 'footer', 'exit_intent', 'other']).default('other'),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  const body = await request.json();
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Érvénytelen adatok',
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { email, name, source } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = supabaseServiceRole();

  // Check if email already exists for this source
  const { data: existing } = await supabase
    .from('email_subscriptions')
    .select('id, unsubscribed_at')
    .eq('email', normalizedEmail)
    .eq('source', source)
    .single();

  if (existing) {
    // If already subscribed and not unsubscribed, return success
    if (!existing.unsubscribed_at) {
      log.info('Email already subscribed', { email: normalizedEmail, source });
      trackEmailCapture(source);
      return NextResponse.json(
        {
          success: true,
          message: 'Már fel vagy iratkozva a hírlevelünkre!',
          alreadySubscribed: true,
        },
        { status: 200 },
      );
    }

    // If previously unsubscribed, resubscribe
    const { error: updateError } = await supabase
      .from('email_subscriptions')
      .update({
        unsubscribed_at: null,
        subscribed_at: new Date().toISOString(),
        name: name || null,
      })
      .eq('id', existing.id);

    if (updateError) {
      log.error('Failed to resubscribe email', updateError);
      throw updateError;
    }

    log.info('Email resubscribed', { email: normalizedEmail, source });
    trackEmailCapture(source);
    return NextResponse.json(
      {
        success: true,
        message: 'Sikeresen újra feliratkoztál a hírlevelünkre!',
        resubscribed: true,
      },
      { status: 200 },
    );
  }

  // Insert new subscription
  const { error: insertError } = await supabase.from('email_subscriptions').insert({
    email: normalizedEmail,
    name: name || null,
    source,
    metadata: {
      requestId,
      userAgent: request.headers.get('user-agent') || null,
    },
  });

  if (insertError) {
    // Check if it's a unique constraint violation (race condition)
    if (insertError.code === '23505') {
      log.info('Email subscription race condition handled', {
        email: normalizedEmail,
        source,
      });
      trackEmailCapture(source);
      return NextResponse.json(
        {
          success: true,
          message: 'Sikeresen feliratkoztál a hírlevelünkre!',
        },
        { status: 200 },
      );
    }

    log.error('Failed to insert email subscription', insertError);
    throw insertError;
  }

  log.info('Email subscription created', { email: normalizedEmail, source });
  trackEmailCapture(source);

  return NextResponse.json(
    {
      success: true,
      message: 'Sikeresen feliratkoztál a hírlevelünkre!',
    },
    { status: 201 },
  );
});
