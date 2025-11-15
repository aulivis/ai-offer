import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '../../../../middleware/auth';
import {
  HttpStatus,
  createErrorResponse,
  withAuthenticatedErrorHandling,
} from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { verifyProUser, getUserTeams, getTeamMembers } from '@/lib/services/teams';

export const GET = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const requestId = getRequestId(request);
    const log = createLogger(requestId);
    log.setContext({ userId: request.user.id });

    const sb = await supabaseServer();

    // Verify Pro user
    const isPro = await verifyProUser(sb, request.user.id);
    if (!isPro) {
      return createErrorResponse(
        'Csak Pro felhasználók hozhatnak létre csapatokat.',
        HttpStatus.FORBIDDEN,
      );
    }

    // Get all team_ids user belongs to
    const teamIds = await getUserTeams(sb, request.user.id);

    if (teamIds.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    // Get all members for each team
    const teams = await Promise.all(
      teamIds.map(async (teamId) => {
        const members = await getTeamMembers(sb, teamId);
        return {
          team_id: teamId,
          members: members.map((m) => ({
            user_id: m.user_id,
            email: (m.user as { email?: string })?.email || null,
            joined_at: m.joined_at,
          })),
        };
      }),
    );

    return NextResponse.json({ teams });
  }),
);

export const POST = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const requestId = getRequestId(request);
    const log = createLogger(requestId);
    log.setContext({ userId: request.user.id });

    const sb = await supabaseServer();

    // Verify Pro user
    const isPro = await verifyProUser(sb, request.user.id);
    if (!isPro) {
      return createErrorResponse(
        'Csak Pro felhasználók hozhatnak létre csapatokat.',
        HttpStatus.FORBIDDEN,
      );
    }

    // Generate new team_id
    const teamId = crypto.randomUUID();

    // Add current user to team
    const { data, error } = await sb
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: request.user.id,
      })
      .select()
      .single();

    if (error) {
      log.error('Failed to create team', error);
      return createErrorResponse(
        'Nem sikerült létrehozni a csapatot.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Get user email for response
    const { data: userData } = await sb.auth.getUser();
    const email = userData?.user?.email || null;

    const members = [
      {
        user_id: request.user.id,
        email,
        joined_at: data.joined_at,
      },
    ];

    log.info('Team created', { teamId });

    return NextResponse.json({
      team_id: teamId,
      members,
    });
  }),
);
