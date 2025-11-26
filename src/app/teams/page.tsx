'use client';

import { useEffect, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/components/ToastProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchWithSupabaseAuth } from '@/lib/api';
import { createClientLogger } from '@/lib/clientLogger';
import Link from 'next/link';

type Team = {
  team_id: string;
  members: Array<{
    user_id: string;
    email: string | null;
    joined_at: string;
  }>;
};

export default function TeamsPage() {
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const logger = createClientLogger({
    userId: user?.id,
    component: 'TeamsPage',
  });

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    const loadTeams = async () => {
      setLoading(true);
      try {
        const response = await fetchWithSupabaseAuth('/api/teams', {});
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        } else {
          const error = await response.json();
          showToast({
            title: 'Hiba',
            description: error.error || 'Nem sikerült betölteni a csapatokat.',
            variant: 'error',
          });
        }
      } catch (error) {
        logger.error('Failed to load teams', error, {
          userId: user.id,
        });
        showToast({
          title: 'Hiba',
          description: 'Nem sikerült betölteni a csapatokat.',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user, showToast]);

  const handleCreateTeam = async () => {
    try {
      const response = await fetchWithSupabaseAuth('/api/teams', {
        method: 'POST',
      });
      if (response.ok) {
        await response.json();
        showToast({
          title: 'Siker',
          description: 'Csapat létrehozva!',
          variant: 'success',
        });
        // Reload teams
        const teamsResponse = await fetchWithSupabaseAuth('/api/teams', {});
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeams(teamsData.teams || []);
        }
      } else {
        const error = await response.json();
        showToast({
          title: 'Hiba',
          description: error.error || 'Nem sikerült létrehozni a csapatot.',
          variant: 'error',
        });
      }
    } catch (error) {
      logger.error('Failed to create team', error, {
        userId: user?.id,
      });
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült létrehozni a csapatot.',
        variant: 'error',
      });
    }
  };

  return (
    <AppFrame
      title="Csapatok"
      description="Kezeld a csapatokat és hívj meg más Pro felhasználókat."
      actions={
        <Button onClick={handleCreateTeam} variant="primary">
          Új csapat
        </Button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold text-fg mb-2">Még nincs csapatod</h3>
          <p className="text-fg-muted mb-4">
            Hozz létre egy új csapatot és hívj meg más Pro felhasználókat!
          </p>
          <Button onClick={handleCreateTeam} variant="primary">
            Új csapat létrehozása
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.team_id} href={`/teams/${team.team_id}`}>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-lg font-semibold text-fg mb-3">Csapat</h3>
                <div className="space-y-2">
                  <p className="text-sm text-fg-muted">
                    <span className="font-semibold">{team.members.length}</span> tag
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {team.members.slice(0, 3).map((member) => (
                      <span
                        key={member.user_id}
                        className="text-xs px-2 py-1 rounded bg-bg-muted text-fg"
                      >
                        {member.email || member.user_id}
                      </span>
                    ))}
                    {team.members.length > 3 && (
                      <span className="text-xs px-2 py-1 rounded bg-bg-muted text-fg">
                        +{team.members.length - 3} további
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppFrame>
  );
}
