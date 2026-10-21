import { useCallback, useEffect, useState } from 'react';
import type { Level, LevelBank, Manifest } from './core/types';
import { preloadSounds } from './feedback';
import { dailyPuzzle, dateKey } from './game/daily';
import { weekStartKey, weeklyPuzzles } from './game/weekly';
import { loadLevel, loadManifest } from './game/puzzleBank';
import { setLanguage } from './i18n';
import { setupBackButton } from './native';
import { migrate, syncGeneratorVersion } from './storage/schema';
import { AchievementsScreen } from './ui/AchievementsScreen';
import { CalendarScreen } from './ui/CalendarScreen';
import { HomeScreen } from './ui/HomeScreen';
import { LearnScreen } from './ui/LearnScreen';
import { ModesScreen } from './ui/ModesScreen';
import { LevelListScreen } from './ui/LevelListScreen';
import { PlayScreen } from './ui/PlayScreen';
import { StatsScreen } from './ui/StatsScreen';
import { TechniqueScreen } from './ui/TechniqueScreen';
import { StorageBanner } from './ui/StorageBanner';
import { useDaily } from './ui/hooks/useDaily';
import { useHashRoute } from './ui/hooks/useHashRoute';
import { useReminders } from './ui/hooks/useReminders';
import { useSettings } from './ui/hooks/useSettings';
import { useStats } from './ui/hooks/useStats';

export default function App(): JSX.Element {
  const [route, navigate] = useHashRoute();
  const [settings, updateSettings] = useSettings();
  const [stats, updateStats] = useStats();
  const [daily, updateDaily] = useDaily();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [levelBank, setLevelBank] = useState<LevelBank | null>(null);
  const [manifestFailed, setManifestFailed] = useState(false);
  const [levelFailed, setLevelFailed] = useState(false);
  /** Bumped by the "retry" buttons to re-run the loading effects. */
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    migrate();
  }, []);

  useEffect(() => setupBackButton(), []);

  // Fetch the sound files up front so the first effect in a game is not late.
  useEffect(() => {
    if (settings.soundEnabled) preloadSounds();
  }, [settings.soundEnabled]);

  // The display language follows the setting; "auto" is the device's language (Android's system language in the app).
  useEffect(() => {
    setLanguage(settings.language);
  }, [settings.language]);

  // `data-theme` overrides the OS preference; without it the CSS follows prefers-color-scheme.
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Board colour scheme (`violet` is the stylesheet default, so it needs no attribute).
  useEffect(() => {
    const root = document.documentElement;
    if (settings.boardPalette === 'violet') root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', settings.boardPalette);
  }, [settings.boardPalette]);

  useEffect(() => {
    let cancelled = false;
    setManifestFailed(false);
    loadManifest()
      .then((m) => {
        if (cancelled) return;
        setManifest(m);
        syncGeneratorVersion(m.generatorVersion);
      })
      .catch(() => {
        // Offline or a bad deploy: the home screen shows a retry button.
        if (!cancelled) setManifestFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const levelRoute = route.name === 'level' ? route.level : null;
  useEffect(() => {
    if (levelRoute === null) return;
    let cancelled = false; // a slow response for an earlier level must not replace the one now on screen
    setLevelBank(null);
    setLevelFailed(false);
    loadLevel(levelRoute)
      .then((bank) => {
        if (!cancelled) setLevelBank(bank);
      })
      .catch(() => {
        if (!cancelled) setLevelFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [levelRoute, attempt]);

  const today = dateKey(new Date());
  useReminders({
    enabled: settings.reminderEnabled,
    today,
    daily,
    solvedCount: Object.values(stats).reduce((n, s) => n + s.completed, 0),
  });
  const dailyId = manifest
    ? dailyPuzzle(today, (level: Level) => manifest.levels.find((l) => l.level === level)?.count ?? 0).id
    : null;

  // This week's five-puzzle challenge (same on every device for a given week).
  const weekly = manifest
    ? {
        key: weekStartKey(today),
        ids: weeklyPuzzles(weekStartKey(today), (level: Level) => manifest.levels.find((l) => l.level === level)?.count ?? 0).map(
          (p) => p.id,
        ),
      }
    : null;

  // Keyed per screen so each navigation replays the entrance animation.
  const screenKey =
    route.name === 'level'
      ? `level-${route.level}`
      : route.name === 'play'
        ? `play-${route.puzzleId}`
        : route.name === 'technique'
          ? `technique-${route.id}`
          : route.name;
  const goHome = (): void => navigate('#/', true);

  return (
    <>
      <StorageBanner />
      <div key={screenKey} className="mx-auto flex w-full max-w-md flex-1 flex-col animate-screen-in">
        {route.name === 'home' && (
          <HomeScreen
            manifest={manifest}
            loadFailed={manifestFailed}
            onRetry={retry}
            stats={stats}
            daily={daily}
            today={today}
            dailyId={dailyId}
            weekly={weekly}
            settings={settings}
            onSettingsChange={updateSettings}
            onNavigate={navigate}
          />
        )}
        {route.name === 'achievements' && <AchievementsScreen stats={stats} daily={daily} onBack={goHome} />}
        {route.name === 'calendar' && (
          <CalendarScreen manifest={manifest} daily={daily} today={today} onNavigate={navigate} onBack={goHome} />
        )}
        {route.name === 'stats' && <StatsScreen stats={stats} onBack={goHome} />}
        {route.name === 'modes' && <ModesScreen manifest={manifest} weekly={weekly} onNavigate={navigate} onBack={goHome} />}
        {route.name === 'learn' && <LearnScreen onNavigate={navigate} onBack={goHome} />}
        {route.name === 'technique' && (
          <TechniqueScreen id={route.id} onNavigate={navigate} onBack={() => navigate('#/learn', true)} />
        )}
        {route.name === 'level' && (
          <LevelListScreen
            level={route.level}
            bank={levelBank}
            loadFailed={levelFailed}
            onRetry={retry}
            onNavigate={navigate}
            onBack={() => navigate('#/', true)}
          />
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
            mode={route.mode}
            weekly={weekly}
          />
        )}
      </div>
    </>
  );
}
