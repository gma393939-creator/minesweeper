import {
  DifficultyKey,
  ScoreRecord,
  StatsByDifficulty,
  UserPreferences,
} from '../types/minesweeper';

const RECORDS_STORAGE_KEY = 'minesweeper_kr_records_v1';
const STATS_STORAGE_KEY = 'minesweeper_kr_stats_v1';
const PREFS_STORAGE_KEY = 'minesweeper_kr_prefs_v1';

const DEFAULT_STATS: StatsByDifficulty = {
  beginner: { played: 0, won: 0, currentStreak: 0, bestStreak: 0 },
  intermediate: { played: 0, won: 0, currentStreak: 0, bestStreak: 0 },
  expert: { played: 0, won: 0, currentStreak: 0, bestStreak: 0 },
  custom: { played: 0, won: 0, currentStreak: 0, bestStreak: 0 },
};

const DEFAULT_PREFS: UserPreferences = {
  soundEnabled: true,
  allowQuestionMarks: false,
  largeTiles: false,
};

export function loadRecords(): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecord(newRecord: ScoreRecord): {
  records: ScoreRecord[];
  isNewBest: boolean;
} {
  const existing = loadRecords();
  const sameDiff = existing.filter((r) => r.difficulty === newRecord.difficulty);
  const previousBest =
    sameDiff.length > 0 ? Math.min(...sameDiff.map((r) => r.timeMs)) : Infinity;
  const isNewBest = newRecord.timeMs < previousBest;

  const otherDiff = existing.filter((r) => r.difficulty !== newRecord.difficulty);
  const updatedSameDiff = [...sameDiff, newRecord]
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, 8);

  const combined = [...otherDiff, ...updatedSameDiff];
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(combined));
  } catch {
    // Ignore storage quota errors
  }

  return { records: combined, isNewBest };
}

export function clearAllRecordsAndStats(): {
  records: ScoreRecord[];
  stats: StatsByDifficulty;
} {
  try {
    localStorage.removeItem(RECORDS_STORAGE_KEY);
    localStorage.removeItem(STATS_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  return {
    records: [],
    stats: structuredClone(DEFAULT_STATS),
  };
}

export function loadStats(): StatsByDifficulty {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATS);
    const parsed = JSON.parse(raw) as Partial<StatsByDifficulty>;
    return {
      beginner: { ...DEFAULT_STATS.beginner, ...parsed.beginner },
      intermediate: { ...DEFAULT_STATS.intermediate, ...parsed.intermediate },
      expert: { ...DEFAULT_STATS.expert, ...parsed.expert },
      custom: { ...DEFAULT_STATS.custom, ...parsed.custom },
    };
  } catch {
    return structuredClone(DEFAULT_STATS);
  }
}

export function recordGameResult(
  difficulty: DifficultyKey,
  won: boolean
): StatsByDifficulty {
  const stats = loadStats();
  const entry = { ...stats[difficulty] };
  entry.played += 1;

  if (won) {
    entry.won += 1;
    entry.currentStreak += 1;
    entry.bestStreak = Math.max(entry.bestStreak, entry.currentStreak);
  } else {
    entry.currentStreak = 0;
  }

  const nextStats: StatsByDifficulty = {
    ...stats,
    [difficulty]: entry,
  };

  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(nextStats));
  } catch {
    // Ignore storage errors
  }

  return nextStats;
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function formatTimeMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}.${tenths}`;
  }
  return `${String(seconds).padStart(2, '0')}.${tenths}초`;
}

export function formatDigitalClock(ms: number): string {
  const totalSeconds = Math.min(9999, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
