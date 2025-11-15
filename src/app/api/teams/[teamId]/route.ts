import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../../middleware/auth';
import {
  HttpStatus,
  createErrorResponse,
  withAuthenticatedErrorHandling,
} from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { isTeamMember, getTeamMembers } from '@/lib/services/teams';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';

const teamIdParamsSchema = z.object({
  teamId: uuidSchema,
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

      // Get team members
      const members = await getTeamMembers(sb, teamId);

      return NextResponse.json({
        team_id: teamId,
        members: members.map((m) => ({
          user_id: m.user_id,
          email: (m.user as { email?: string })?.email || null,
          joined_at: m.joined_at,
        })),
      });
    },
  ),
);

export const DELETE = withAuth(
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

      // Remove user from team
      const { error } = await sb
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', request.user.id);

      if (error) {
        log.error('Failed to leave team', error);
        return createErrorResponse(
          'Nem sikerült elhagyni a csapatot.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      log.info('User left team', { teamId });

      return NextResponse.json({ success: true });
    },
  ),
);
