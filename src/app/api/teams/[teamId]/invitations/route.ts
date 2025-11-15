import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../../../middleware/auth';
import {
  HttpStatus,
  createErrorResponse,
  withAuthenticatedErrorHandling,
} from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { verifyProUser, isTeamMember } from '@/lib/services/teams';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';
import { randomBytes } from 'crypto';

const teamIdParamsSchema = z.object({
  teamId: uuidSchema,
});

const createInvitationSchema = z.object({
  email: z.string().email(),
  expires_in_days: z.number().int().min(1).max(30).optional().default(7),
});

type RouteParams = {
  params: Promise<{
    teamId?: string;
  }>;
};

export const GET = withAuth(
  withAuthenticatedErrorHandling(
    async (request: AuthenticatedNextRequest, context: RouteParams) => {
      const requestId = getRequestId(request);
      const log = createLogger(requestId);
      log.setContext({ userId: request.user.id });

      const resolvedParams = await context.params;
      const parsed = teamIdParamsSchema.safeParse(resolvedParams);
      if (!parsed.success) {
        throw parsed.error;
      }

      const teamId = parsed.data.teamId;

      const sb = await supabaseServer();

      // Verify user is a team member
      const member = await isTeamMember(sb, request.user.id, teamId);
      if (!member) {
        return createErrorResponse('Nem található a csapat.', HttpStatus.NOT_FOUND);
      }

      // Get pending invitations
      const { data, error } = await sb
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Failed to fetch invitations', error);
        return createErrorResponse(
          'Nem sikerült betölteni a meghívókat.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return NextResponse.json({ invitations: data || [] });
    },
  ),
);

export const POST = withAuth(
  withAuthenticatedErrorHandling(
    async (request: AuthenticatedNextRequest, context: RouteParams) => {
      const requestId = getRequestId(request);
      const log = createLogger(requestId);
      log.setContext({ userId: request.user.id });

      const resolvedParams = await context.params;
      const parsed = teamIdParamsSchema.safeParse(resolvedParams);
      if (!parsed.success) {
        throw parsed.error;
      }

      const teamId = parsed.data.teamId;

      const body = await request.json();
      const bodyParsed = createInvitationSchema.safeParse(body);
      if (!bodyParsed.success) {
        return createErrorResponse('Érvénytelen kérés.', HttpStatus.BAD_REQUEST);
      }

      const { email, expires_in_days } = bodyParsed.data;

      const sb = await supabaseServer();

      // Verify Pro user
      const isPro = await verifyProUser(sb, request.user.id);
      if (!isPro) {
        return createErrorResponse(
          'Csak Pro felhasználók hívhatnak meg másokat.',
          HttpStatus.FORBIDDEN,
        );
      }

      // Verify user is a team member
      const member = await isTeamMember(sb, request.user.id, teamId);
      if (!member) {
        return createErrorResponse('Nem található a csapat.', HttpStatus.NOT_FOUND);
      }

      // Verify invited user has Pro plan (check by email)
      // Note: This check is best-effort since we can't query users by email without admin access
      // The actual Pro check will happen when they accept the invitation
      const sbService = supabaseServiceRole();
      const { data: invitedUsers } = await sbService.auth.admin.listUsers();
      const invitedUser = invitedUsers?.users.find((u) => u.email === email);

      if (invitedUser) {
        const invitedIsPro = await verifyProUser(sbService, invitedUser.id);
        if (!invitedIsPro) {
          return createErrorResponse(
            'Csak Pro felhasználók lehetnek meghívva.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Generate token
      const token = randomBytes(32).toString('base64url');

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);

      // Create invitation
      const { data, error } = await sb
        .from('team_invitations')
        .insert({
          team_id: teamId,
          invited_by: request.user.id,
          email,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        log.error('Failed to create invitation', error);
        return createErrorResponse(
          'Nem sikerült létrehozni a meghívót.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // TODO: Send invitation email here
      log.info('Invitation created', { teamId, email, token });

      return NextResponse.json({
        invitation: {
          id: data.id,
          team_id: data.team_id,
          email: data.email,
          token: data.token,
          status: data.status,
          expires_at: data.expires_at,
          created_at: data.created_at,
        },
      });
    },
  ),
);
