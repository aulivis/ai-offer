/**
 * Block Customization API
 *
 * Handles CRUD operations for block customization preferences
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import type { OfferBlockSettings } from '@/lib/offers/blockCustomization';

/**
 * GET /api/block-customization
 * Get block customization preferences for user or offer
 */
export const GET = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const supabase = await supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offerId');

    let query = supabase
      .from('block_customization_preferences')
      .select('*')
      .eq('user_id', request.user.id);

    if (offerId) {
      query = query.eq('offer_id', offerId);
    } else {
      query = query.is('offer_id', null); // Get default preferences
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return default
        return NextResponse.json({
          preferences: null,
          default: true,
        });
      }
      throw error;
    }

    return NextResponse.json({
      preferences: data,
      default: false,
    });
  }),
);

/**
 * POST /api/block-customization
 * Create or update block customization preferences
 */
export const POST = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const supabase = await supabaseServer();
    const body = await request.json();
    const { offerId, blockSettings }: { offerId?: string; blockSettings: OfferBlockSettings } =
      body;

    if (!blockSettings) {
      return NextResponse.json({ error: 'blockSettings is required' }, { status: 400 });
    }

    // Check if preferences already exist
    let query = supabase
      .from('block_customization_preferences')
      .select('id')
      .eq('user_id', request.user.id);

    if (offerId) {
      query = query.eq('offer_id', offerId);
    } else {
      query = query.is('offer_id', null);
    }

    const { data: existing } = await query.single();

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('block_customization_preferences')
        .update({
          block_settings: blockSettings,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ preferences: data });
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('block_customization_preferences')
        .insert({
          user_id: request.user.id,
          offer_id: offerId || null,
          block_settings: blockSettings,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ preferences: data }, { status: 201 });
    }
  }),
);

/**
 * DELETE /api/block-customization
 * Delete block customization preferences
 */
export const DELETE = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const supabase = await supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offerId');

    let query = supabase
      .from('block_customization_preferences')
      .delete()
      .eq('user_id', request.user.id);

    if (offerId) {
      query = query.eq('offer_id', offerId);
    } else {
      query = query.is('offer_id', null);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true });
  }),
);
