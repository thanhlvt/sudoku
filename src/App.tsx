import { useEffect, useState } from 'react';
import type { Level, LevelBank, Manifest } from './core/types';
import { dailyPuzzle, dateKey } from './game/daily';
import { loadLevel, loadManifest } from './game/puzzleBank';
import { setupBackButton } from './native';
import { migrate, syncGeneratorVersion } from './storage/schema';
import { HomeScreen } from './ui/HomeScreen';
import { LevelListScreen } from './ui/LevelListScreen';
import { PlayScreen } from './ui/PlayScreen';
import { useDaily } from './ui/hooks/useDaily';
import { useHashRoute } from './ui/hooks/useHashRoute';
import { useSettings } from './ui/hooks/useSettings';
import { useStats } from './ui/hooks/useStats';

export default function App(): JSX.Element {
  const [route, navigate] = useHashRoute();
  const [settings, updateSettings] = useSettings();
  const [stats, updateStats] = useStats();
  const [daily, updateDaily] = useDaily();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [levelBank, setLevelBank] = useState<LevelBank | null>(null);

  useEffect(() => {
    migrate();
  }, []);

  useEffect(() => setupBackButton(), []);

  // `data-theme` overrides the OS preference; without it the CSS follows prefers-color-scheme.
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

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

  const today = dateKey(new Date());
  const dailyId = manifest
    ? dailyPuzzle(today, (level: Level) => manifest.levels.find((l) => l.level === level)?.count ?? 0).id
    : null;

  // Keyed per screen so each navigation replays the entrance animation.
  const screenKey = route.name === 'home' ? 'home' : route.name === 'level' ? `level-${route.level}` : `play-${route.puzzleId}`;

  return (
    <div key={screenKey} className="mx-auto flex w-full max-w-md flex-1 flex-col animate-screen-in">
      {route.name === 'home' && (
        <HomeScreen
          manifest={manifest}
          stats={stats}
          daily={daily}
          today={today}
          dailyId={dailyId}
          settings={settings}
          onSettingsChange={updateSettings}
          onNavigate={navigate}
        />
      )}
      {route.name === 'level' && (
        <LevelListScreen level={route.level} bank={levelBank} onNavigate={navigate} onBack={() => navigate('#/', true)} />
      )}
      {route.name === 'play' && (
        <PlayScreen
          puzzleId={route.puzzleId}
          onNavigate={navigate}
          settings={settings}
          stats={stats}
          updateStats={updateStats}
          dailyId={dailyId}
          today={today}
          daily={daily}
          updateDaily={updateDaily}
        />
      )}
    </div>
  );
}
