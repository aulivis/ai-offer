'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { fetchWithSupabaseAuth } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';

type TeamMember = {
  user_id: string;
  email: string | null;
  joined_at: string;
};

type Team = {
  team_id: string;
  members: TeamMember[];
};

type TeamInvitation = {
  id: string;
  team_id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
  token: string;
};

type SettingsTeamSectionProps = {
  plan: 'free' | 'standard' | 'pro';
};

export function SettingsTeamSection({ plan }: SettingsTeamSectionProps) {
  const { user } = useRequireAuth();
  const supabase = useSupabase();
  const { showToast } = useToast();
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [invitingMember, setInvitingMember] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);
  const isPro = plan === 'pro';

  const loadTeams = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetchWithSupabaseAuth('/api/teams', {
        method: 'GET',
        defaultErrorMessage: 'Nem sikerült betölteni a csapatokat.',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Nem sikerült betölteni a csapatokat.');
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      showToast({
        title: 'Hiba',
        description:
          error instanceof Error ? error.message : 'Nem sikerült betölteni a csapatokat.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const loadInvitations = useCallback(async () => {
    if (!user || !isPro) return;

    // Load invitations for all teams user belongs to
    const allInvitations: TeamInvitation[] = [];
    for (const team of teams) {
      try {
        const response = await fetchWithSupabaseAuth(`/api/teams/${team.team_id}/invitations`, {
          method: 'GET',
          defaultErrorMessage: 'Nem sikerült betölteni a meghívókat.',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.invitations) {
            allInvitations.push(...data.invitations);
          }
        }
      } catch (_error) {
        // Silently fail - invitations are not critical
      }
    }

    // Also load invitations sent to current user's email
    if (user.email) {
      try {
        const { data: userInvitations } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('email', user.email)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (userInvitations) {
          allInvitations.push(...userInvitations);
        }
      } catch (_error) {
        // Silently fail
      }
    }

    setInvitations(allInvitations);
  }, [user, teams, isPro, supabase]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (teams.length > 0) {
      loadInvitations();
    }
  }, [teams, loadInvitations]);

  const handleCreateTeam = async () => {
    if (!isPro) {
      openPlanUpgradeDialog({
        description: 'A csapatkezelés csak Pro csomaggal érhető el.',
      });
      return;
    }

    try {
      setCreatingTeam(true);
      const response = await fetchWithSupabaseAuth('/api/teams', {
        method: 'POST',
        defaultErrorMessage: 'Nem sikerült létrehozni a csapatot.',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Nem sikerült létrehozni a csapatot.');
      }

      await response.json();
      showToast({
        title: 'Sikeres',
        description: 'Csapat létrehozva.',
        variant: 'success',
      });
      await loadTeams();
    } catch (error) {
      showToast({
        title: 'Hiba',
        description: error instanceof Error ? error.message : 'Nem sikerült létrehozni a csapatot.',
        variant: 'error',
      });
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleInviteMember = async (teamId: string) => {
    if (!inviteEmail.trim()) {
      showToast({
        title: 'Hiba',
        description: 'Kérjük, adjon meg egy e-mail címet.',
        variant: 'error',
      });
      return;
    }

    try {
      setInvitingMember(teamId);
      const response = await fetchWithSupabaseAuth(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          expires_in_days: 7,
        }),
        defaultErrorMessage: 'Nem sikerült elküldeni a meghívót.',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Nem sikerült elküldeni a meghívót.');
      }

      showToast({
        title: 'Sikeres',
        description: 'Meghívó elküldve.',
        variant: 'success',
      });
      setInviteEmail('');
      await loadInvitations();
    } catch (error) {
      showToast({
        title: 'Hiba',
        description: error instanceof Error ? error.message : 'Nem sikerült elküldeni a meghívót.',
        variant: 'error',
      });
    } finally {
      setInvitingMember(null);
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!confirm('Biztosan el szeretné hagyni ezt a csapatot?')) {
      return;
    }

    try {
      setLeavingTeamId(teamId);
      const response = await fetchWithSupabaseAuth(`/api/teams/${teamId}`, {
        method: 'DELETE',
        defaultErrorMessage: 'Nem sikerült elhagyni a csapatot.',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Nem sikerült elhagyni a csapatot.');
      }

      showToast({
        title: 'Sikeres',
        description: 'Elhagytad a csapatot.',
        variant: 'success',
      });
      await loadTeams();
    } catch (error) {
      showToast({
        title: 'Hiba',
        description: error instanceof Error ? error.message : 'Nem sikerült elhagyni a csapatot.',
        variant: 'error',
      });
    } finally {
      setLeavingTeamId(null);
    }
  };

  const handleAcceptInvitation = async (invitation: TeamInvitation) => {
    try {
      const response = await fetchWithSupabaseAuth(`/api/teams/invitations/${invitation.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
        defaultErrorMessage: 'Nem sikerült elfogadni a meghívót.',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Nem sikerült elfogadni a meghívót.');
      }

      showToast({
        title: 'Sikeres',
        description: 'Meghívó elfogadva.',
        variant: 'success',
      });
      await loadTeams();
      await loadInvitations();
    } catch (error) {
      showToast({
        title: 'Hiba',
        description: error instanceof Error ? error.message : 'Nem sikerült elfogadni a meghívót.',
        variant: 'error',
      });
    }
  };

  const handleRejectInvitation = async (invitation: TeamInvitation) => {
    try {
      const response = await fetchWithSupabaseAuth(`/api/teams/invitations/${invitation.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
        defaultErrorMessage: 'Nem sikerült elutasítani a meghívót.',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Nem sikerült elutasítani a meghívót.');
      }

      showToast({
        title: 'Sikeres',
        description: 'Meghívó elutasítva.',
        variant: 'success',
      });
      await loadInvitations();
    } catch (error) {
      showToast({
        title: 'Hiba',
        description:
          error instanceof Error ? error.message : 'Nem sikerült elutasítani a meghívót.',
        variant: 'error',
      });
    }
  };

  const userInvitations = invitations.filter((inv) => inv.email === user?.email);
  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  if (!isPro) {
    return (
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
              <UserGroupIcon className="relative z-10 h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Csapatkezelés</h2>
              <p className="text-sm md:text-base text-slate-500">
                Dolgozz együtt csapatoddal az ajánlatokon
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-border bg-slate-50/50 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <LockClosedIcon className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            A csapatkezelés csak Pro csomaggal érhető el
          </h3>
          <p className="mt-2 text-xs text-slate-600">
            Válts Pro csomagra, hogy csapatot hozhass létre és meghívhass másokat.
          </p>
          <Button
            onClick={() =>
              openPlanUpgradeDialog({
                description: 'A csapatkezelés csak Pro csomaggal érhető el.',
              })
            }
            variant="primary"
            className="mt-4"
          >
            Frissítés Pro-ra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
              <UserGroupIcon className="relative z-10 h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Csapatkezelés</h2>
              <p className="text-sm md:text-base text-slate-500">
                Dolgozz együtt csapatoddal az ajánlatokon
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateTeam}
            disabled={creatingTeam}
            loading={creatingTeam}
            variant="secondary"
          >
            <PlusIcon className="h-4 w-4" />
            Új csapat
          </Button>
        </div>
      </div>

      {/* Pending Invitations for Current User */}
      {userInvitations.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Meghívók</h3>
          <div className="space-y-3">
            {userInvitations.map((invitation) => (
              <Card key={invitation.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Csapat meghívás</p>
                    <p className="text-xs text-slate-500">
                      Lejár: {new Date(invitation.expires_at).toLocaleDateString('hu-HU')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptInvitation(invitation)}
                      variant="secondary"
                      size="sm"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Elfogad
                    </Button>
                    <Button
                      onClick={() => handleRejectInvitation(invitation)}
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Elutasít
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Teams List */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Betöltés...</div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-slate-50/50 p-12 text-center">
          <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">Még nincs csapatod</p>
          <p className="mt-1 text-xs text-slate-500">
            Hozz létre egy új csapatot, vagy várj egy meghívót.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => (
            <Card key={team.team_id} className="p-6">
              <div className="space-y-4">
                {/* Team Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Csapat ({team.members.length} tag)
                  </h3>
                  <Button
                    onClick={() => handleLeaveTeam(team.team_id)}
                    disabled={leavingTeamId === team.team_id}
                    loading={leavingTeamId === team.team_id}
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Csapat elhagyása
                  </Button>
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">Tagok</h4>
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between rounded-lg border border-border bg-slate-50/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {member.email || 'Ismeretlen felhasználó'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Csatlakozott: {new Date(member.joined_at).toLocaleDateString('hu-HU')}
                          </p>
                        </div>
                        {member.user_id === user?.id && (
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            Ön
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite Member */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">Tag meghívása</h4>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="e-mail cím"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleInviteMember(team.team_id)}
                      disabled={invitingMember === team.team_id || !inviteEmail.trim()}
                      loading={invitingMember === team.team_id}
                      variant="secondary"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      Meghívás
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Csak Pro felhasználókat lehet meghívni.
                  </p>
                </div>

                {/* Pending Invitations */}
                {pendingInvitations.filter((inv) => inv.team_id === team.team_id).length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-700">
                      Függőben lévő meghívók
                    </h4>
                    <div className="space-y-2">
                      {pendingInvitations
                        .filter((inv) => inv.team_id === team.team_id)
                        .map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {invitation.email}
                              </p>
                              <p className="text-xs text-slate-500">
                                Lejár: {new Date(invitation.expires_at).toLocaleDateString('hu-HU')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
