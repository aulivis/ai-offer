/**
 * Team Invitation Email Service
 *
 * Sends email notifications when team invitations are created.
 * Currently, this is a placeholder for future email infrastructure implementation.
 *
 * TODO: Implement email sending when email service is configured.
 * Options:
 * - Supabase Edge Function for email sending
 * - External email service (Resend, SendGrid, etc.)
 * - Supabase Auth email customization (if applicable)
 */

import { logger } from '@/lib/logger';
import { envServer } from '@/env.server';

export type TeamInvitationEmailData = {
  email: string;
  teamId: string;
  teamName?: string;
  inviterName?: string;
  inviterEmail?: string;
  token: string;
  expiresAt: string;
};

/**
 * Sends a team invitation email to the invited user.
 *
 * @param data - Invitation email data
 * @returns Promise that resolves when email is sent (or queued)
 */
export async function sendTeamInvitationEmail(data: TeamInvitationEmailData): Promise<void> {
  const {
    email,
    teamId,
    token,
    expiresAt,
    teamName: _teamName,
    inviterName: _inviterName,
    inviterEmail: _inviterEmail,
  } = data;

  try {
    // TODO: Implement email sending when email service is configured
    // For now, log the invitation details so they can be tracked

    // Construct invitation acceptance URL
    // The invitation is accepted via POST to /api/teams/invitations/[token] with action: 'accept'
    // For email links, we can create a direct link to the teams page where users can accept
    const acceptanceUrl = new URL('/teams', envServer.APP_URL);
    // Note: The actual acceptance happens via API call, but we can link to teams page
    // Alternative: Create a dedicated invitation acceptance page at /teams/invitations/[token]

    logger.info('Team invitation email (placeholder - email not sent)', {
      email,
      teamId,
      token,
      expiresAt,
      acceptanceUrl: acceptanceUrl.toString(),
      // Note: Do not log full token in production - this is for development only
      ...(process.env.NODE_ENV !== 'production' ? { fullToken: token } : {}),
    });

    // TODO: When email service is implemented, send email here:
    // await emailService.send({
    //   to: email,
    //   subject: `Meghívó csapatba: ${teamName || 'Csapat'}`,
    //   template: 'team-invitation',
    //   data: {
    //     teamName: teamName || 'Csapat',
    //     inviterName: inviterName || 'Kolléga',
    //     acceptanceUrl: acceptanceUrl.toString(),
    //     expiresAt: new Date(expiresAt).toLocaleDateString('hu-HU'),
    //   },
    // });

    // For now, invitation is created in database but email is not sent
    // Users can accept invitations through the application UI or by visiting the URL directly
    // This is tracked in TODO_ITEMS.md for future implementation
  } catch (error) {
    // Log error but don't throw - invitation is still created in database
    // Email sending failures should not block invitation creation
    logger.error('Failed to send team invitation email', error, {
      email,
      teamId,
      // Don't log token in error messages for security
    });

    // In production, you might want to:
    // 1. Queue email for retry
    // 2. Send to dead letter queue
    // 3. Alert operations team
  }
}

/**
 * Checks if email sending is configured and available.
 *
 * @returns true if email service is configured, false otherwise
 */
export function isEmailServiceConfigured(): boolean {
  // TODO: Check if email service is configured
  // For example: return !!envServer.EMAIL_SERVICE_API_KEY;
  return false;
}
