'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppFrame from '@/components/AppFrame';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/components/ToastProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchWithSupabaseAuth } from '@/lib/api';
import { createClientLogger } from '@/lib/clientLogger';

type TeamMember = {
  user_id: string;
  email: string | null;
  joined_at: string;
};

type TeamInvitation = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId as string;
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const [team, setTeam] = useState<{ team_id: string; members: TeamMember[] } | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const logger = createClientLogger({
    userId: user?.id,
    component: 'TeamDetailPage',
    teamId,
  });

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user || !teamId) {
      return;
    }

    const loadTeam = async () => {
      setLoading(true);
      try {
        const [teamResponse, invitationsResponse] = await Promise.all([
          fetchWithSupabaseAuth(`/api/teams/${teamId}`, {}),
          fetchWithSupabaseAuth(`/api/teams/${teamId}/invitations`, {}),
        ]);

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeam(teamData);
        } else {
          showToast({
            title: 'Hiba',
            description: 'Nem található a csapat.',
            variant: 'error',
          });
        }

        if (invitationsResponse.ok) {
          const invitationsData = await invitationsResponse.json();
          setInvitations(invitationsData.invitations || []);
        }
      } catch (error) {
        logger.error('Failed to load team', error, {
          teamId,
          userId: user?.id,
        });
        showToast({
          title: 'Hiba',
          description: 'Nem sikerült betölteni a csapatot.',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user, teamId, showToast]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showToast({
        title: 'Hiba',
        description: 'Kérlek add meg az e-mail címet.',
        variant: 'error',
      });
      return;
    }

    setInviting(true);
    try {
      const response = await fetchWithSupabaseAuth(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (response.ok) {
        showToast({
          title: 'Siker',
          description: 'Meghívó elküldve!',
          variant: 'success',
        });
        setInviteEmail('');
        // Reload invitations
        const invitationsResponse = await fetchWithSupabaseAuth(
          `/api/teams/${teamId}/invitations`,
          {},
        );
        if (invitationsResponse.ok) {
          const invitationsData = await invitationsResponse.json();
          setInvitations(invitationsData.invitations || []);
        }
      } else {
        const error = await response.json();
        showToast({
          title: 'Hiba',
          description: error.error || 'Nem sikerült elküldeni a meghívót.',
          variant: 'error',
        });
      }
    } catch (error) {
      logger.error('Failed to send invitation', error, {
        teamId,
        email: inviteEmail.trim(),
        userId: user?.id,
      });
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült elküldeni a meghívót.',
        variant: 'error',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Biztosan el akarod hagyni ezt a csapatot?')) {
      return;
    }

    try {
      const response = await fetchWithSupabaseAuth(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast({
          title: 'Siker',
          description: 'Elhagytad a csapatot.',
          variant: 'success',
        });
        router.push('/teams');
      } else {
        const error = await response.json();
        showToast({
          title: 'Hiba',
          description: error.error || 'Nem sikerült elhagyni a csapatot.',
          variant: 'error',
        });
      }
    } catch (error) {
      logger.error('Failed to leave team', error, {
        teamId,
        userId: user?.id,
      });
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült elhagyni a csapatot.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <AppFrame title="Csapat" description="Betöltés...">
        <Card className="p-8 animate-pulse" />
      </AppFrame>
    );
  }

  if (!team) {
    return (
      <AppFrame title="Csapat" description="Nem található">
        <Card className="p-8 text-center">
          <p className="text-fg-muted">Nem található a csapat.</p>
        </Card>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title="Csapat"
      description="Kezeld a csapat tagokat és küldj meghívókat."
      actions={
        <Button onClick={handleLeaveTeam} variant="danger">
          Csapat elhagyása
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Members */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-fg mb-4">Tagok ({team.members.length})</h2>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-muted"
              >
                <div>
                  <p className="font-medium text-fg">{member.email || member.user_id}</p>
                  <p className="text-sm text-fg-muted">
                    Csatlakozott: {new Date(member.joined_at).toLocaleDateString('hu-HU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Invitations */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-fg mb-4">Meghívók ({invitations.length})</h2>
          <div className="space-y-4">
            {/* Invite form */}
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="E-mail cím"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInvite();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleInvite} disabled={inviting} variant="primary">
                Meghívás
              </Button>
            </div>

            {/* Pending invitations */}
            {invitations.length > 0 && (
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-bg-muted"
                  >
                    <div>
                      <p className="font-medium text-fg">{invitation.email}</p>
                      <p className="text-sm text-fg-muted">
                        Lejárat: {new Date(invitation.expires_at).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                      Függőben
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppFrame>
  );
}
