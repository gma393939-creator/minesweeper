export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER';

export type NavSection = 'PLAY' | 'SETUP' | 'RECORDS' | 'GUIDE';

export type DifficultyKey = 'beginner' | 'intermediate' | 'expert' | 'custom';

export type CellState = 'hidden' | 'revealed' | 'flagged' | 'question';

export type InputMode = 'reveal' | 'flag';

export interface CellData {
  row: number;
  col: number;
  isMine: boolean;
  neighborMines: number;
  state: CellState;
  exploded?: boolean;
  wrongFlag?: boolean;
}

export interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  subtitle: string;
  rows: number;
  cols: number;
  mines: number;
}

export interface ScoreRecord {
  id: string;
  difficulty: Exclude<DifficultyKey, 'custom'>;
  timeMs: number;
  dateIso: string;
  board3BV: number;
  hintsUsed: number;
}

export interface DifficultyStats {
  played: number;
  won: number;
  currentStreak: number;
  bestStreak: number;
}

export type StatsByDifficulty = Record<DifficultyKey, DifficultyStats>;

export interface UserPreferences {
  soundEnabled: boolean;
  allowQuestionMarks: boolean;
  largeTiles: boolean;
}

export const DIFFICULTY_PRESETS: Record<Exclude<DifficultyKey, 'custom'>, DifficultyConfig> = {
  beginner: {
    key: 'beginner',
    label: '초급',
    subtitle: '입문 및 워밍업에 적합한 클래식 규격',
    rows: 9,
    cols: 9,
    mines: 10,
  },
  intermediate: {
    key: 'intermediate',
    label: '중급',
    subtitle: '논리적 소거법과 주변 동시 열기가 빛나는 표준 규격',
    rows: 16,
    cols: 16,
    mines: 40,
  },
  expert: {
    key: 'expert',
    label: '고급',
    subtitle: '정교한 패턴 추론과 집중력을 요구하는 마스터 규격',
    rows: 16,
    cols: 30,
    mines: 99,
  },
};
