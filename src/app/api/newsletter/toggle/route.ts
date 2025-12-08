import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { envServer } from '@/env.server';
import { withErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  // Get user from access token
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('propono_at')?.value;

  if (!accessToken) {
    return createErrorResponse('Nincs bejelentkezve', HttpStatus.UNAUTHORIZED);
  }

  // Verify the access token and get user info
  const supabase = createClient(
    envServer.NEXT_PUBLIC_SUPABASE_URL,
    envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    log.warn('Failed to verify access token', { error: userError?.message });
    return createErrorResponse('Érvénytelen munkamenet', HttpStatus.UNAUTHORIZED);
  }

  const userId = user.id;
  const userEmail = user.email?.toLowerCase().trim();

  if (!userEmail) {
    return createErrorResponse('A felhasználói fióknak nincs email címe', HttpStatus.BAD_REQUEST);
  }

  const body = await request.json();
  const { subscribed } = body;

  if (typeof subscribed !== 'boolean') {
    return createErrorResponse('Érvénytelen kérés', HttpStatus.BAD_REQUEST);
  }

  const supabaseAdmin = supabaseServiceRole();

  // Find or create subscription for this user
  const { data: existingSubscriptions, error: findError } = await supabaseAdmin
    .from('email_subscriptions')
    .select('id, unsubscribed_at')
    .eq('email', userEmail)
    .eq('user_id', userId)
    .limit(1);

  if (findError) {
    log.error('Failed to find subscription', findError);
    throw findError;
  }

  const existing = existingSubscriptions?.[0];

  if (subscribed) {
    // Subscribe: create or update subscription
    if (existing) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from('email_subscriptions')
        .update({
          unsubscribed_at: null,
          subscribed_at: existing.unsubscribed_at ? new Date().toISOString() : undefined,
          user_id: userId, // Ensure user_id is set
        })
        .eq('id', existing.id);

      if (updateError) {
        log.error('Failed to update subscription', updateError);
        throw updateError;
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabaseAdmin.from('email_subscriptions').insert({
        email: userEmail,
        user_id: userId,
        source: 'settings',
        subscribed_at: new Date().toISOString(),
      });

      if (insertError) {
        // Check if it's a unique constraint violation (race condition)
        if (insertError.code === '23505') {
          log.info('Subscription race condition handled', { email: userEmail, userId });
          // Try to update instead
          const { error: updateError } = await supabaseAdmin
            .from('email_subscriptions')
            .update({
              user_id: userId,
              unsubscribed_at: null,
            })
            .eq('email', userEmail);

          if (updateError) {
            log.error('Failed to update subscription after race condition', updateError);
            throw updateError;
          }
        } else {
          log.error('Failed to insert subscription', insertError);
          throw insertError;
        }
      }
    }
  } else {
    // Unsubscribe: set unsubscribed_at
    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from('email_subscriptions')
        .update({
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        log.error('Failed to unsubscribe', updateError);
        throw updateError;
      }
    } else {
      // Create subscription record with unsubscribed_at set
      // This allows us to track that the user explicitly unsubscribed
      const { error: insertError } = await supabaseAdmin.from('email_subscriptions').insert({
        email: userEmail,
        user_id: userId,
        source: 'settings',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: new Date().toISOString(),
      });

      if (insertError && insertError.code !== '23505') {
        log.error('Failed to create unsubscribed record', insertError);
        throw insertError;
      }
    }
  }

  log.info('Email subscription toggled', { userId, email: userEmail, subscribed });

  return NextResponse.json(
    {
      success: true,
      subscribed,
      message: subscribed
        ? 'Sikeresen feliratkoztál a hírlevelünkre!'
        : 'Sikeresen leiratkoztál a hírlevelünkről.',
    },
    { status: 200 },
  );
});
