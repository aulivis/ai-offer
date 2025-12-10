'use client';

import { useEffect, useState } from 'react';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import AppFrame from '@/components/AppFrame';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchWithSupabaseAuth } from '@/lib/api';
import { createClientLogger } from '@/lib/clientLogger';
import Link from 'next/link';
import { Users } from 'lucide-react';

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
    ...(user?.id && { userId: user.id }),
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
        const teamData = await response.json();
        showToast({
          title: 'Siker',
          description: 'Csapat létrehozva! Most már meghívhatsz tagokat.',
          variant: 'success',
        });
        // Reload teams
        const teamsResponse = await fetchWithSupabaseAuth('/api/teams', {});
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeams(teamsData.teams || []);
          // Navigate to team detail page if team was created
          if (teamData.team_id) {
            setTimeout(() => {
              window.location.href = `/teams/${teamData.team_id}`;
            }, 1000);
          }
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
    <PageErrorBoundary>
      <AppFrame
        title="Csapatok"
        description="Kezeld a csapatokat és hívj meg más Pro felhasználókat."
        actions={
          <Button onClick={handleCreateTeam} variant="primary" size="lg" className="min-w-[160px]">
            <Users className="h-5 w-5 mr-2" />
            Új csapat létrehozása
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
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-fg">Még nincs csapatod</h3>
                <p className="text-fg-muted">
                  Hozz létre egy új csapatot és hívj meg más Pro felhasználókat!
                </p>
              </div>
              <Button
                onClick={handleCreateTeam}
                variant="primary"
                size="lg"
                className="min-w-[200px]"
              >
                <Users className="h-5 w-5 mr-2" />
                Új csapat létrehozása
              </Button>
            </div>
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
    </PageErrorBoundary>
  );
}
