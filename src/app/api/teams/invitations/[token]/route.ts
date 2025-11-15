import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import {
  HttpStatus,
  createErrorResponse,
  withAuthenticatedErrorHandling,
} from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { verifyProUser } from '@/lib/services/teams';
import { z } from 'zod';

const tokenParamsSchema = z.object({
  token: z.string().min(1),
});

type RouteParams = {
  params: Promise<{
    token?: string;
  }>;
};

export const POST = withAuth(
  withAuthenticatedErrorHandling(
    async (request: AuthenticatedNextRequest, context: RouteParams) => {
      const requestId = getRequestId(request);
      const log = createLogger(requestId);
      log.setContext({ userId: request.user.id });

      const resolvedParams = await context.params;
      const parsed = tokenParamsSchema.safeParse(resolvedParams);
      if (!parsed.success) {
        throw parsed.error;
      }

      const token = parsed.data.token;
      const body = await request.json();
      const action = body.action === 'accept' ? 'accept' : 'reject';

      const sb = await supabaseServer();

      // Get invitation
      const { data: invitation, error: inviteError } = await sb
        .from('team_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (inviteError || !invitation) {
        return createErrorResponse(
          'Nem található vagy érvénytelen a meghívó.',
          HttpStatus.NOT_FOUND,
        );
      }

      // Check expiration
      const expiresAt = new Date(invitation.expires_at);
      if (expiresAt < new Date()) {
        // Mark as expired
        await sb.from('team_invitations').update({ status: 'expired' }).eq('id', invitation.id);

        return createErrorResponse('A meghívó lejárt.', HttpStatus.BAD_REQUEST);
      }

      // Verify email matches
      const { data: userData } = await sb.auth.getUser();
      const userEmail = userData?.user?.email;

      if (invitation.email !== userEmail) {
        return createErrorResponse(
          'Ez a meghívó nem a Ön e-mail címére érkezett.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (action === 'accept') {
        // Verify Pro user
        const isPro = await verifyProUser(sb, request.user.id);
        if (!isPro) {
          return createErrorResponse(
            'Csak Pro felhasználók csatlakozhatnak csapatokhoz.',
            HttpStatus.FORBIDDEN,
          );
        }

        // Check if already a member
        const { data: existingMember } = await sb
          .from('team_members')
          .select('id')
          .eq('team_id', invitation.team_id)
          .eq('user_id', request.user.id)
          .maybeSingle();

        if (existingMember) {
          // Already a member, just mark invitation as accepted
          await sb
            .from('team_invitations')
            .update({
              status: 'accepted',
              accepted_at: new Date().toISOString(),
              accepted_by: request.user.id,
            })
            .eq('id', invitation.id);

          return NextResponse.json({ success: true, team_id: invitation.team_id });
        }

        // Add user to team
        const { error: memberError } = await sb.from('team_members').insert({
          team_id: invitation.team_id,
          user_id: request.user.id,
        });

        if (memberError) {
          log.error('Failed to add user to team', memberError);
          return createErrorResponse(
            'Nem sikerült csatlakozni a csapathoz.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        // Update invitation
        await sb
          .from('team_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            accepted_by: request.user.id,
          })
          .eq('id', invitation.id);

        log.info('User accepted invitation', { teamId: invitation.team_id });

        return NextResponse.json({ success: true, team_id: invitation.team_id });
      } else {
        // Reject invitation
        await sb
          .from('team_invitations')
          .update({
            status: 'rejected',
            accepted_at: new Date().toISOString(),
            accepted_by: request.user.id,
          })
          .eq('id', invitation.id);

        log.info('User rejected invitation', { teamId: invitation.team_id });

        return NextResponse.json({ success: true });
      }
    },
  ),
);
