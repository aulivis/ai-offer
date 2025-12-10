/**
 * Template Versions API
 *
 * Handles CRUD operations for template versions
 * Requires admin privileges for write operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { requireAdmin } from '@/lib/admin';
import type { TemplateId } from '@/lib/offers/templates/types';

/**
 * GET /api/template-versions
 * Get template versions (all users can read)
 */
export const GET = withAuthenticatedErrorHandling(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const templateId = searchParams.get('templateId');
  const activeOnly = searchParams.get('activeOnly') === 'true';

  let query = supabase
    .from('template_versions')
    .select('*')
    .order('created_at', { ascending: false });

  if (templateId) {
    query = query.eq('template_id', templateId);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return NextResponse.json({ versions: data });
});

/**
 * POST /api/template-versions
 * Create a new template version (admin only)
 */
export const POST = withAuthenticatedErrorHandling(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin privileges
  await requireAdmin(supabase, user.id);

  const body = await request.json();
  const {
    templateId,
    version,
    content,
    changelog,
    isActive,
  }: {
    templateId: TemplateId;
    version: string;
    content: string;
    changelog?: string;
    isActive?: boolean;
  } = body;

  if (!templateId || !version || !content) {
    return NextResponse.json(
      { error: 'templateId, version, and content are required' },
      { status: 400 },
    );
  }

  // Validate version format (semantic versioning)
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return NextResponse.json(
      { error: 'Version must be in semantic version format (major.minor.patch)' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('template_versions')
    .insert({
      template_id: templateId,
      version,
      content,
      changelog: changelog || null,
      is_active: isActive ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return NextResponse.json(
        { error: 'A version with this template ID and version number already exists' },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json({ version: data }, { status: 201 });
});

/**
 * PATCH /api/template-versions
 * Update a template version (admin only)
 */
export const PATCH = withAuthenticatedErrorHandling(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin privileges
  await requireAdmin(supabase, user.id);

  const body = await request.json();
  const { id, ...updates }: { id: string; [key: string]: unknown } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('template_versions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({ version: data });
});

/**
 * DELETE /api/template-versions
 * Delete a template version (admin only)
 */
export const DELETE = withAuthenticatedErrorHandling(async (request: NextRequest) => {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin privileges
  await requireAdmin(supabase, user.id);

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase.from('template_versions').delete().eq('id', id);

  if (error) throw error;

  return NextResponse.json({ success: true });
});
