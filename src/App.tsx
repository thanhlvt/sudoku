import { useEffect, useState } from 'react';
import type { LevelBank, Manifest } from './core/types';
import { loadLevel, loadManifest } from './game/puzzleBank';
import { loadLast, migrate, syncGeneratorVersion } from './storage/schema';
import { HomeScreen } from './ui/HomeScreen';
import { LevelListScreen } from './ui/LevelListScreen';
import { PlayScreen } from './ui/PlayScreen';
import { useHashRoute } from './ui/hooks/useHashRoute';
import { useSettings } from './ui/hooks/useSettings';
import { useStats } from './ui/hooks/useStats';

export default function App(): JSX.Element {
  const [route, navigate] = useHashRoute();
  const [settings] = useSettings();
  const [stats, updateStats] = useStats();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [levelBank, setLevelBank] = useState<LevelBank | null>(null);

  useEffect(() => {
    migrate();
  }, []);

  useEffect(() => {
    loadManifest()
      .then((m) => {
        setManifest(m);
        syncGeneratorVersion(m.generatorVersion);
      })
      .catch(() => {
        // Manifest failed to load (offline, bad deploy); screens render their own empty states.
      });
  }, []);

  useEffect(() => {
    if (route.name !== 'level') return;
    setLevelBank(null);
    loadLevel(route.level)
      .then(setLevelBank)
      .catch(() => {});
  }, [route]);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {route.name === 'home' && (
        <HomeScreen manifest={manifest} stats={stats} last={loadLast()} onNavigate={navigate} />
      )}
      {route.name === 'level' && (
        <LevelListScreen level={route.level} bank={levelBank} onNavigate={navigate} onBack={() => navigate('#/')} />
      )}
      {route.name === 'play' && (
        <PlayScreen
          puzzleId={route.puzzleId}
          onBack={() => navigate('#/')}
          onNavigate={navigate}
          settings={settings}
          stats={stats}
          updateStats={updateStats}
        />
      )}
    </div>
  );
}
