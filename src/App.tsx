import { useCallback, useEffect, useRef, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { GuidePanel } from './components/GuidePanel';
import { RecordsPanel } from './components/RecordsPanel';
import { TitleMenu } from './components/TitleMenu';
import { TopBar } from './components/TopBar';
import {
  CellData,
  DIFFICULTY_PRESETS,
  DifficultyConfig,
  DifficultyKey,
  GameState,
  InputMode,
  NavSection,
  ScoreRecord,
  StatsByDifficulty,
  UserPreferences,
} from './types/minesweeper';
import {
  calculate3BV,
  chordCell,
  cloneBoard,
  countFlags,
  countRevealedSafeCells,
  createEmptyBoard,
  cycleCellMark,
  findSmartHint,
  placeMinesWithSafeZone,
  revealCell,
} from './utils/minesweeperLogic';
import { soundEngine } from './utils/sound';
import {
  clearAllRecordsAndStats,
  loadPreferences,
  loadRecords,
  loadStats,
  recordGameResult,
  savePreferences,
  saveRecord,
} from './utils/storage';

const MAX_HINTS_PER_GAME = 3;

const MOBILE_NAV_ITEMS: ReadonlyArray<{ key: NavSection; label: string }> = [
  { key: 'PLAY', label: '게임 보드' },
  { key: 'SETUP', label: '난이도' },
  { key: 'RECORDS', label: '최고 기록' },
  { key: 'GUIDE', label: '가이드' },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('SETUP');
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');

  const [difficulty, setDifficulty] = useState<DifficultyKey>('beginner');
  const [customConfig, setCustomConfig] = useState<DifficultyConfig>({
    key: 'custom',
    label: '사용자 지정',
    subtitle: '원하는 가로·세로 크기와 지뢰 밀도를 자유롭게 구성합니다',
    rows: 12,
    cols: 16,
    mines: 32,
  });

  const activeConfig: DifficultyConfig =
    difficulty === 'custom' ? customConfig : DIFFICULTY_PRESETS[difficulty];

  const [board, setBoard] = useState<CellData[][]>(() =>
    createEmptyBoard(
      DIFFICULTY_PRESETS.beginner.rows,
      DIFFICULTY_PRESETS.beginner.cols
    )
  );
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [board3BV, setBoard3BV] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(MAX_HINTS_PER_GAME);
  const [hintHighlight, setHintHighlight] = useState<{
    row: number;
    col: number;
    reason: string;
  } | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('reveal');
  const [isNewBestRecord, setIsNewBestRecord] = useState(false);

  const [records, setRecords] = useState<ScoreRecord[]>(() => loadRecords());
  const [stats, setStats] = useState<StatsByDifficulty>(() => loadStats());
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    loadPreferences()
  );

  const lastTickRef = useRef<number | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);

  // Sync audio preference
  useEffect(() => {
    soundEngine.setEnabled(preferences.soundEnabled);
  }, [preferences.soundEnabled]);

  // High-resolution game timer (active only when PLAYING and mines have been placed)
  useEffect(() => {
    if (gameState !== 'PLAYING' || !minesPlaced) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = performance.now();
    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const prev = lastTickRef.current ?? now;
      const delta = Math.max(0, now - prev);
      lastTickRef.current = now;
      setElapsedMs((curr) => Math.min(9999900, curr + delta));
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [gameState, minesPlaced]);

  const clearHintHighlight = useCallback(() => {
    setHintHighlight(null);
    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
  }, []);

  const initializeBoard = useCallback(
    (targetConfig: DifficultyConfig, targetState: GameState = 'PLAYING') => {
      clearHintHighlight();
      setBoard(createEmptyBoard(targetConfig.rows, targetConfig.cols));
      setMinesPlaced(false);
      setBoard3BV(0);
      setElapsedMs(0);
      setHintsRemaining(MAX_HINTS_PER_GAME);
      setIsNewBestRecord(false);
      setGameState(targetState);
    },
    [clearHintHighlight]
  );

  const finalizeRound = useCallback(
    (
      won: boolean,
      finalTimeMs: number,
      computed3BV: number,
      usedHintsCount: number,
      diffKey: DifficultyKey
    ) => {
      const updatedStats = recordGameResult(diffKey, won);
      setStats(updatedStats);

      if (won) {
        soundEngine.playVictory();
        if (diffKey !== 'custom') {
          const { records: nextRecords, isNewBest } = saveRecord({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            difficulty: diffKey,
            timeMs: Math.max(100, Math.round(finalTimeMs)),
            dateIso: new Date().toISOString(),
            board3BV: computed3BV,
            hintsUsed: usedHintsCount,
          });
          setRecords(nextRecords);
          setIsNewBestRecord(isNewBest);
        }
        setGameState('ROUND_SUMMARY');
      } else {
        soundEngine.playExplosion();
        setGameState('GAME_OVER');
      }
    },
    []
  );

  const handleSelectDifficulty = useCallback(
    (nextKey: DifficultyKey) => {
      setDifficulty(nextKey);
      const nextCfg =
        nextKey === 'custom' ? customConfig : DIFFICULTY_PRESETS[nextKey];
      initializeBoard(
        nextCfg,
        activeSection === 'PLAY' ? 'PLAYING' : 'TITLE_MENU'
      );
    },
    [activeSection, customConfig, initializeBoard]
  );

  const handleUpdateCustomConfig = useCallback(
    (nextCustom: DifficultyConfig) => {
      setCustomConfig(nextCustom);
      if (difficulty === 'custom') {
        initializeBoard(
          nextCustom,
          activeSection === 'PLAY' ? 'PLAYING' : 'TITLE_MENU'
        );
      }
    },
    [activeSection, difficulty, initializeBoard]
  );

  const handleStartFromMenu = useCallback(() => {
    initializeBoard(activeConfig, 'PLAYING');
    setActiveSection('PLAY');
  }, [activeConfig, initializeBoard]);

  const handleStartNewGame = useCallback(() => {
    initializeBoard(activeConfig, 'PLAYING');
    setActiveSection('PLAY');
  }, [activeConfig, initializeBoard]);

  const handleSelectNavSection = useCallback(
    (section: NavSection) => {
      setActiveSection(section);
      if (section === 'PLAY' && gameState === 'TITLE_MENU') {
        setGameState('PLAYING');
      }
    },
    [gameState]
  );

  const handleCellContextAction = useCallback(
    (row: number, col: number) => {
      if (gameState !== 'PLAYING') return;
      clearHintHighlight();

      const { board: nextBoard, placedFlag } = cycleCellMark(
        board,
        row,
        col,
        preferences.allowQuestionMarks
      );

      if (placedFlag !== null) {
        soundEngine.playFlag(placedFlag);
        setBoard(nextBoard);
      }
    },
    [board, clearHintHighlight, gameState, preferences.allowQuestionMarks]
  );

  const handleCellPrimaryAction = useCallback(
    (row: number, col: number) => {
      if (gameState !== 'PLAYING') return;
      clearHintHighlight();

      const target = board[row]?.[col];
      if (!target) return;

      // Chording on an already revealed number cell works regardless of inputMode
      if (target.state === 'revealed') {
        if (target.neighborMines > 0 && minesPlaced) {
          const outcome = chordCell(board, row, col);
          if (!outcome.triggered) return;

          setBoard(outcome.board);
          const usedHints = MAX_HINTS_PER_GAME - hintsRemaining;

          if (outcome.hitMine) {
            finalizeRound(false, elapsedMs, board3BV, usedHints, difficulty);
          } else if (outcome.won) {
            finalizeRound(true, elapsedMs, board3BV, usedHints, difficulty);
          } else if (outcome.newlyRevealedCount > 0) {
            soundEngine.playChord();
          }
        }
        return;
      }

      // In Flag input mode, primary click toggles flag/question mark
      if (inputMode === 'flag') {
        handleCellContextAction(row, col);
        return;
      }

      if (target.state === 'flagged') {
        return;
      }

      let workingBoard = board;
      let current3BV = board3BV;

      if (!minesPlaced) {
        workingBoard = placeMinesWithSafeZone(
          board,
          activeConfig.mines,
          row,
          col
        );
        current3BV = calculate3BV(workingBoard);
        setMinesPlaced(true);
        setBoard3BV(current3BV);
      }

      const outcome = revealCell(workingBoard, row, col);
      setBoard(outcome.board);

      const usedHints = MAX_HINTS_PER_GAME - hintsRemaining;

      if (outcome.hitMine) {
        finalizeRound(false, elapsedMs, current3BV, usedHints, difficulty);
      } else if (outcome.won) {
        finalizeRound(true, elapsedMs, current3BV, usedHints, difficulty);
      } else if (outcome.newlyRevealedCount > 0) {
        soundEngine.playReveal(outcome.newlyRevealedCount);
      }
    },
    [
      activeConfig.mines,
      board,
      board3BV,
      clearHintHighlight,
      difficulty,
      elapsedMs,
      finalizeRound,
      gameState,
      handleCellContextAction,
      hintsRemaining,
      inputMode,
      minesPlaced,
    ]
  );

  const handleUseHint = useCallback(() => {
    if (gameState !== 'PLAYING' || hintsRemaining <= 0) return;

    const hint = findSmartHint(board, minesPlaced);
    if (!hint) return;

    const nextHintsRemaining = hintsRemaining - 1;
    setHintsRemaining(nextHintsRemaining);
    soundEngine.playHint();

    let workingBoard = board;
    let current3BV = board3BV;

    if (!minesPlaced) {
      workingBoard = placeMinesWithSafeZone(
        board,
        activeConfig.mines,
        hint.row,
        hint.col
      );
      current3BV = calculate3BV(workingBoard);
      setMinesPlaced(true);
      setBoard3BV(current3BV);
    }

    if (hint.action === 'flag') {
      const nextBoard = cloneBoard(workingBoard);
      nextBoard[hint.row][hint.col].state = 'flagged';
      setBoard(nextBoard);
    } else {
      const cleanedBoard = cloneBoard(workingBoard);
      if (cleanedBoard[hint.row][hint.col].state === 'flagged') {
        cleanedBoard[hint.row][hint.col].state = 'hidden';
      }
      const outcome = revealCell(cleanedBoard, hint.row, hint.col);
      setBoard(outcome.board);

      if (outcome.won) {
        const usedHints = MAX_HINTS_PER_GAME - nextHintsRemaining;
        finalizeRound(true, elapsedMs, current3BV, usedHints, difficulty);
        return;
      }
    }

    setHintHighlight({
      row: hint.row,
      col: hint.col,
      reason: hint.reason,
    });

    if (hintTimeoutRef.current !== null) {
      window.clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = window.setTimeout(() => {
      setHintHighlight(null);
    }, 3200);
  }, [
    activeConfig.mines,
    board,
    board3BV,
    difficulty,
    elapsedMs,
    finalizeRound,
    gameState,
    hintsRemaining,
    minesPlaced,
  ]);

  const handleTogglePause = useCallback(() => {
    if (!minesPlaced) return;
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  }, [gameState, minesPlaced]);

  const handleUpdatePreferences = useCallback(
    (partial: Partial<UserPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...partial };
        savePreferences(next);
        return next;
      });
    },
    []
  );

  // Global keyboard shortcuts when on PLAY view (R to restart, P to pause/resume)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeSection !== 'PLAY') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        initializeBoard(activeConfig, 'PLAYING');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleTogglePause();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeConfig, activeSection, handleTogglePause, initializeBoard]);

  const flagCount = countFlags(board);
  const revealedSafeCount = countRevealedSafeCells(board);

  const bestTimeForDifficulty = (() => {
    if (difficulty === 'custom') return null;
    const matching = records.filter((r) => r.difficulty === difficulty);
    if (matching.length === 0) return null;
    return Math.min(...matching.map((r) => r.timeMs));
  })();

  const hasActiveGame =
    minesPlaced && (gameState === 'PLAYING' || gameState === 'PAUSED');

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <TopBar
        activeSection={activeSection}
        onSelectSection={handleSelectNavSection}
        onStartNewGame={handleStartNewGame}
      />

      {/* Mobile Section Switcher (visible below md breakpoint) */}
      <div className="border-b border-slate-800/80 bg-slate-950 px-4 py-2 md:hidden">
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-900 p-1">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelectNavSection(item.key)}
                className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-800 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {activeSection === 'SETUP' && (
          <TitleMenu
            selectedDifficulty={difficulty}
            customConfig={customConfig}
            records={records}
            stats={stats}
            hasActiveGame={hasActiveGame}
            onSelectDifficulty={handleSelectDifficulty}
            onUpdateCustomConfig={handleUpdateCustomConfig}
            onStartGame={handleStartFromMenu}
            onResumeActiveGame={() => setActiveSection('PLAY')}
            onOpenGuide={() => setActiveSection('GUIDE')}
          />
        )}

        {activeSection === 'PLAY' && (
          <GameBoard
            board={board}
            gameState={gameState}
            difficulty={difficulty}
            activeConfig={activeConfig}
            minesPlaced={minesPlaced}
            elapsedMs={elapsedMs}
            flagCount={flagCount}
            revealedSafeCount={revealedSafeCount}
            board3BV={board3BV}
            hintsRemaining={hintsRemaining}
            hintHighlight={hintHighlight}
            inputMode={inputMode}
            preferences={preferences}
            bestTimeForDifficulty={bestTimeForDifficulty}
            isNewBestRecord={isNewBestRecord}
            onSelectDifficulty={(key) => {
              setDifficulty(key);
              const cfg =
                key === 'custom' ? customConfig : DIFFICULTY_PRESETS[key];
              initializeBoard(cfg, 'PLAYING');
            }}
            onCellPrimaryAction={handleCellPrimaryAction}
            onCellContextAction={handleCellContextAction}
            onToggleInputMode={setInputMode}
            onUseHint={handleUseHint}
            onTogglePause={handleTogglePause}
            onRestart={() => initializeBoard(activeConfig, 'PLAYING')}
            onUpdatePreferences={handleUpdatePreferences}
            onOpenCustomSetup={() => setActiveSection('SETUP')}
          />
        )}

        {activeSection === 'RECORDS' && (
          <RecordsPanel
            records={records}
            stats={stats}
            onStartWithDifficulty={(diff) => {
              setDifficulty(diff);
              initializeBoard(DIFFICULTY_PRESETS[diff], 'PLAYING');
              setActiveSection('PLAY');
            }}
            onClearAll={() => {
              const cleared = clearAllRecordsAndStats();
              setRecords(cleared.records);
              setStats(cleared.stats);
            }}
          />
        )}

        {activeSection === 'GUIDE' && (
          <GuidePanel
            onStartPlaying={() => {
              if (gameState === 'TITLE_MENU') {
                setGameState('PLAYING');
              }
              setActiveSection('PLAY');
            }}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 text-xs text-slate-500">
          <span>마인스위퍼 — 정통 논리 지뢰찾기</span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleSelectNavSection('PLAY')}
              className="hover:text-slate-300 transition-colors whitespace-nowrap shrink-0"
            >
              게임 보드
            </button>
            <button
              type="button"
              onClick={() => handleSelectNavSection('RECORDS')}
              className="hover:text-slate-300 transition-colors whitespace-nowrap shrink-0"
            >
              최고 기록
            </button>
            <button
              type="button"
              onClick={() => handleSelectNavSection('GUIDE')}
              className="hover:text-slate-300 transition-colors whitespace-nowrap shrink-0"
            >
              플레이 가이드
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
