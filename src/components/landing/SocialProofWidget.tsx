'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

interface Activity {
  name: string;
  action: string;
  time: string;
}

interface SocialProofWidgetProps {
  activities?: Activity[];
  className?: string;
}

// Generate 100+ different names and activities
const generateActivities = (): Activity[] => {
  const firstNames = [
    'Kovács', 'Nagy', 'Szabó', 'Tóth', 'Kiss', 'Horváth', 'Varga', 'Molnár', 'Németh', 'Farkas',
    'Balogh', 'Papp', 'Lakatos', 'Takács', 'Juhász', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete',
    'Szilágyi', 'Török', 'Fehér', 'Balázs', 'Gál', 'Kis', 'Szűcs', 'Kovács', 'Mátyás', 'Orbán',
    'Hegedűs', 'László', 'Antal', 'Somogyi', 'Fodor', 'Bodnár', 'Sipos', 'Magyar', 'Sándor', 'Deák',
    'Király', 'Barna', 'Bakos', 'Dudás', 'Major', 'Hajdu', 'Veres', 'Borbély', 'Fábián', 'Lengyel',
    'Gulyás', 'Jakab', 'Bognár', 'Szekeres', 'Márton', 'Pál', 'Illés', 'Vörös', 'Rónai', 'Benedek',
    'Fülöp', 'Szalai', 'Huszár', 'Makai', 'Kállai', 'Barta', 'Péter', 'Szőke', 'Virág', 'Máté',
    'Bálint', 'Kertész', 'Pataki', 'Bognár', 'Katona', 'Székely', 'Boros', 'Ács', 'Vincze', 'Lukács',
    'Novák', 'Soós', 'Tisza', 'Gergely', 'Tamás', 'Nagy', 'Boros', 'Puskás', 'Szabó', 'Fazekas',
    'Kocsis', 'Dobos', 'Balog', 'Kelemen', 'Kárpáti', 'Lázár', 'Bíró', 'Sárosi', 'Erdős', 'Szász',
    'Vas', 'Kálmán', 'Császár', 'Vida', 'Benedek', 'György', 'Körösi', 'Márkus', 'Sipos', 'Dudás',
  ];
  
  const lastNames = [
    'Márta', 'Péter', 'Anna', 'János', 'Éva', 'László', 'Katalin', 'István', 'Zsuzsanna', 'Ferenc',
    'Mária', 'Gábor', 'Judit', 'András', 'Erzsébet', 'József', 'Ilona', 'Mihály', 'Ágnes', 'Zoltán',
    'Edit', 'Sándor', 'Mónika', 'Tamás', 'Krisztina', 'Róbert', 'Zsolt', 'Erika', 'Balázs', 'Andrea',
    'Tibor', 'Gabriella', 'Dániel', 'Ildikó', 'Attila', 'Beáta', 'György', 'Anikó', 'Gergő', 'Dóra',
    'Márk', 'Viktória', 'Barnabás', 'Szilvia', 'Richárd', 'Renáta', 'Bence', 'Adrienn', 'Ádám', 'Dorottya',
    'Máté', 'Nikolett', 'Dávid', 'Kitti', 'Levente', 'Réka', 'Márton', 'Patrícia', 'Bálint', 'Klaudia',
    'Dominik', 'Fanni', 'Noémi', 'Gergely', 'Bernadett', 'Kristóf', 'Enikő', 'Boldizsár', 'Petra', 'Csongor',
    'Dénes', 'Vivien', 'Mátyás', 'Nikoletta', 'Áron', 'Lilla', 'Kristóf', 'Nóra', 'Milán', 'Luca',
    'Zsombor', 'Lili', 'Ákos', 'Napsugár', 'Marcell', 'Zsófia', 'Ábel', 'Liliána', 'Benjámin', 'Emese',
    'Ármin', 'Rebeka', 'Péter', 'Szabina', 'Alex', 'Bianka', 'Zétény', 'Dalma', 'Árpád', 'Léna',
  ];
  
  const actions = [
    'létrehozott egy új ajánlatot',
    'elfogadott egy ajánlatot',
    'megosztott egy ajánlatot',
    'frissített egy ajánlatot',
    'mentett egy ajánlatot',
    'exportált egy PDF-et',
    'létrehozott egy új sablont',
    'hozzáadott egy új tevékenységet',
  ];
  
  const times = [
    '1 perce', '2 perce', '3 perce', '5 perce', '8 perce', '10 perce', '12 perce', '15 perce',
    '18 perce', '20 perce', '25 perce', '30 perce', '35 perce', '40 perce', '45 perce', '50 perce',
    '1 órája', '2 órája', '3 órája', '5 órája',
  ];
  
  const activities: Activity[] = [];
  const usedCombinations = new Set<string>();
  
  // Generate unique combinations until we have 100+
  while (activities.length < 100) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const time = times[Math.floor(Math.random() * times.length)];
    const combination = `${firstName} ${lastName}-${action}-${time}`;
    
    if (!usedCombinations.has(combination)) {
      usedCombinations.add(combination);
      activities.push({
        name: `${firstName} ${lastName}`,
        action,
        time,
      });
    }
  }
  
  return activities;
};

export default function SocialProofWidget({
  activities: providedActivities,
  className = '',
}: SocialProofWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [shuffledActivities, setShuffledActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Mark as mounted to avoid hydration mismatch
    setMounted(true);
    
    // Generate or use provided activities only on client
    const activitiesToUse = providedActivities || generateActivities();
    
    // Shuffle activities on mount for variety
    const shuffled = [...activitiesToUse].sort(() => Math.random() - 0.5);
    setShuffledActivities(shuffled);
    setCurrentActivity(0);
    
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % shuffled.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [providedActivities]);

  if (!isVisible) return null;

  // Don't render activity content until mounted to avoid hydration mismatch
  if (!mounted || shuffledActivities.length === 0) {
    return (
      <Card
        className={`flex items-center gap-3 border-primary/20 bg-primary/5 p-4 shadow-sm transition-all duration-500 ${className}`}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="h-4 w-32 animate-pulse rounded bg-primary/10" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-primary/5" />
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 rounded-full p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
          aria-label="Bezárás"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </Card>
    );
  }

  const activity = shuffledActivities[currentActivity] || shuffledActivities[0];

  return (
    <Card
      className={`flex items-center gap-3 border-primary/20 bg-primary/5 p-4 shadow-sm transition-all duration-500 ${className}`}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm text-fg">
          <span className="font-semibold">{activity.name}</span> {activity.action}
        </p>
        <p className="text-xs text-fg-muted">{activity.time}</p>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="flex-shrink-0 rounded-full p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
        aria-label="Bezárás"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </Card>
  );
}












