import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bomb,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Minimize2,
  MousePointerClick,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  CellData,
  DIFFICULTY_PRESETS,
  DifficultyConfig,
  DifficultyKey,
  GameState,
  InputMode,
  UserPreferences,
} from '../types/minesweeper';
import { getNeighbors } from '../utils/minesweeperLogic';
import { formatTimeMs } from '../utils/storage';

interface GameBoardProps {
  board: CellData[][];
  gameState: GameState;
  difficulty: DifficultyKey;
  activeConfig: DifficultyConfig;
  minesPlaced: boolean;
  elapsedMs: number;
  flagCount: number;
  revealedSafeCount: number;
  board3BV: number;
  hintsRemaining: number;
  hintHighlight: { row: number; col: number; reason: string } | null;
  inputMode: InputMode;
  preferences: UserPreferences;
  bestTimeForDifficulty: number | null;
  isNewBestRecord: boolean;
  onSelectDifficulty: (key: DifficultyKey) => void;
  onCellPrimaryAction: (row: number, col: number) => void;
  onCellContextAction: (row: number, col: number) => void;
  onToggleInputMode: (mode: InputMode) => void;
  onUseHint: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onUpdatePreferences: (next: Partial<UserPreferences>) => void;
  onOpenCustomSetup: () => void;
}

const NUMBER_COLOR_CLASSES: Record<number, string> = {
  1: 'text-sky-400',
  2: 'text-emerald-400',
  3: 'text-rose-400',
  4: 'text-violet-400',
  5: 'text-amber-400',
  6: 'text-cyan-400',
  7: 'text-fuchsia-400',
  8: 'text-slate-200',
};

export function GameBoard({
  board,
  gameState,
  difficulty,
  activeConfig,
  minesPlaced,
  elapsedMs,
  flagCount,
  revealedSafeCount,
  board3BV,
  hintsRemaining,
  hintHighlight,
  inputMode,
  preferences,
  bestTimeForDifficulty,
  isNewBestRecord,
  onSelectDifficulty,
  onCellPrimaryAction,
  onCellContextAction,
  onToggleInputMode,
  onUseHint,
  onTogglePause,
  onRestart,
  onUpdatePreferences,
  onOpenCustomSetup,
}: GameBoardProps) {
  const [chordPreviewCenter, setChordPreviewCenter] = useState<
    [number, number] | null
  >(null);
  const [focusedCell, setFocusedCell] = useState<[number, number]>([0, 0]);
  const [showEndModal, setShowEndModal] = useState(false);

  const cellRefs = useRef<Array<Array<HTMLButtonElement | null>>>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const totalSafeCells = Math.max(1, rows * cols - activeConfig.mines);
  const progressPercent = Math.min(
    100,
    Math.round((revealedSafeCount / totalSafeCells) * 100)
  );
  const remainingMines = activeConfig.mines - flagCount;

  const isFinished =
    gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER';
  const isPaused = gameState === 'PAUSED';

  // Open end-state summary modal automatically on transition to victory or loss
  useEffect(() => {
    if (gameState === 'ROUND_SUMMARY' || gameState === 'GAME_OVER') {
      setShowEndModal(true);
    } else {
      setShowEndModal(false);
    }
  }, [gameState]);

  // Clear chord preview when pointer is released anywhere
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setChordPreviewCenter(null);
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Compute chord preview neighbor set
  const chordPreviewSet = new Set<string>();
  if (chordPreviewCenter && gameState === 'PLAYING') {
    const [cr, cc] = chordPreviewCenter;
    const centerCell = board[cr]?.[cc];
    if (centerCell && centerCell.state === 'revealed' && centerCell.neighborMines > 0) {
      for (const n of getNeighbors(board, cr, cc)) {
        if (n.state === 'hidden' || n.state === 'question') {
          chordPreviewSet.add(`${n.row}-${n.col}`);
        }
      }
    }
  }

  // Determine tactile tile size (always >= 40px on desktop to satisfy touch target ergonomics)
  const getTileSizeClass = (): string => {
    if (preferences.largeTiles) {
      if (cols <= 10) return 'w-13 h-13 text-lg';
      return 'w-11 h-11 text-base';
    }
    if (cols <= 10) return 'w-11 h-11 text-base';
    if (cols <= 18) return 'w-[42px] h-[42px] text-[15px]';
    return 'w-10 h-10 text-sm';
  };

  const tileSizeClass = getTileSizeClass();

  const handleCellPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    if (isFinished || isPaused) return;
    setFocusedCell([row, col]);

    const cell = board[row]?.[col];
    if (!cell) return;

    if (e.pointerType === 'touch') {
      longPressFiredRef.current = false;
      pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
      if (cell.state !== 'revealed') {
        if (longPressTimerRef.current !== null) {
          window.clearTimeout(longPressTimerRef.current);
        }
        longPressTimerRef.current = window.setTimeout(() => {
          longPressFiredRef.current = true;
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(15);
          }
          onCellContextAction(row, col);
        }, 320);
      }
      return;
    }

    // Desktop left button press on revealed number shows neighbor highlight
    if (e.button === 0 && cell.state === 'revealed' && cell.neighborMines > 0) {
      setChordPreviewCenter([row, col]);
    }
  };

  const handleCellPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (
      e.pointerType === 'touch' &&
      pointerStartPosRef.current &&
      longPressTimerRef.current !== null
    ) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      if (dx > 10 || dy > 10) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isFinished || isPaused) return;
    onCellPrimaryAction(row, col);
  };

  const handleCellContextMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    e.preventDefault();
    if (longPressFiredRef.current) return;
    if (isFinished || isPaused) return;
    onCellContextAction(row, col);
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    let nextRow = row;
    let nextCol = col;
    let moved = false;

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      nextRow = (row - 1 + rows) % rows;
      moved = true;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      nextRow = (row + 1) % rows;
      moved = true;
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      nextCol = (col - 1 + cols) % cols;
      moved = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      nextCol = (col + 1) % cols;
      moved = true;
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (!isFinished && !isPaused) {
        onCellContextAction(row, col);
      }
      return;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!isFinished && !isPaused) {
        onCellPrimaryAction(row, col);
      }
      return;
    }

    if (moved) {
      e.preventDefault();
      setFocusedCell([nextRow, nextCol]);
      cellRefs.current[nextRow]?.[nextCol]?.focus();
    }
  };

  const elapsedSeconds = Math.max(0.1, elapsedMs / 1000);
  const current3BVs = minesPlaced ? (board3BV / elapsedSeconds).toFixed(2) : '0.00';

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 md:py-8">
      {/* Top Workspace Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        {/* Left: Difficulty Segmented Control */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            {(['beginner', 'intermediate', 'expert', 'custom'] as const).map(
              (key) => {
                const active = difficulty === key;
                const label =
                  key === 'custom'
                    ? '사용자 지정'
                    : DIFFICULTY_PRESETS[key].label;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === 'custom' && difficulty === 'custom') {
                        onOpenCustomSetup();
                      } else {
                        onSelectDifficulty(key);
                      }
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-800 text-amber-400'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>

          <span className="hidden text-xs text-slate-400 xl:inline font-mono tabular-nums">
            {activeConfig.cols}×{activeConfig.rows} · 지뢰 {activeConfig.mines}개
            {bestTimeForDifficulty !== null
              ? ` · 최고 ${formatTimeMs(bestTimeForDifficulty)}`
              : ''}
          </span>
        </div>

        {/* Right: Gameplay Action & Accessibility Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Open vs Flag Mode Segmented Switch */}
          <div
            role="group"
            aria-label="클릭 입력 모드"
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1"
          >
            <button
              type="button"
              onClick={() => onToggleInputMode('reveal')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                inputMode === 'reveal'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
              <span>열기</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleInputMode('flag')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                inputMode === 'flag'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              <span>깃발</span>
            </button>
          </div>

          {/* Smart Safe Hint */}
          <button
            type="button"
            onClick={onUseHint}
            disabled={hintsRemaining <= 0 || isFinished || isPaused}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            <Lightbulb
              className="h-3.5 w-3.5 text-amber-400"
              aria-hidden="true"
            />
            <span className="tabular-nums">안전 힌트 ({hintsRemaining})</span>
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={onTogglePause}
            disabled={!minesPlaced || isFinished}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            {isPaused ? (
              <>
                <Play
                  className="h-3.5 w-3.5 text-emerald-400 fill-current"
                  aria-hidden="true"
                />
                <span>계속하기</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                <span>일시정지</span>
              </>
            )}
          </button>

          {/* Question Mark Toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({
                allowQuestionMarks: !preferences.allowQuestionMarks,
              })
            }
            aria-pressed={preferences.allowQuestionMarks}
            title="우클릭 시 물음표(?) 단계 포함 여부"
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              preferences.allowQuestionMarks
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>물음표</span>
          </button>

          {/* Large Tile Accessibility Toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({ largeTiles: !preferences.largeTiles })
            }
            aria-pressed={preferences.largeTiles}
            title="타일 크기 전환"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 whitespace-nowrap shrink-0"
          >
            {preferences.largeTiles ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>표준 크기</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>크게 보기</span>
              </>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({ soundEnabled: !preferences.soundEnabled })
            }
            aria-pressed={preferences.soundEnabled}
            aria-label={preferences.soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 whitespace-nowrap shrink-0"
          >
            {preferences.soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span className="hidden sm:inline">효과음</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span className="hidden sm:inline">음소거</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* HUD Meter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-t-xl border border-b-0 border-slate-800 bg-slate-900/90 px-5 py-3.5">
        {/* Mine Counter */}
        <div className="flex items-center gap-3">
          <Flag
            className={`h-4 w-4 shrink-0 ${
              remainingMines < 0 ? 'text-red-400' : 'text-amber-400'
            }`}
            aria-hidden="true"
          />
          <div>
            <span className="block text-[11px] text-slate-400">남은 지뢰</span>
            <span
              className={`font-mono text-lg font-bold leading-none tabular-nums ${
                remainingMines < 0 ? 'text-red-400' : 'text-slate-100'
              }`}
            >
              {remainingMines}
            </span>
          </div>
        </div>

        {/* Center Status & Instant Restart Control */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              gameState === 'ROUND_SUMMARY'
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : gameState === 'GAME_OVER'
                ? 'border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25'
                : 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
            }`}
          >
            {gameState === 'ROUND_SUMMARY' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span>탐색 성공 · 다시 플레이</span>
              </>
            ) : gameState === 'GAME_OVER' ? (
              <>
                <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />
                <span>지뢰 폭발 · 다시 플레이</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>
                  {!minesPlaced ? '첫 클릭 대기 · 새 보드' : '진행 중 · 재시작 (R)'}
                </span>
              </>
            )}
          </button>

          {isFinished && !showEndModal && (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              결과 요약 보기
            </button>
          )}
        </div>

        {/* Timer & Progress */}
        <div className="flex items-center gap-5">
          <div className="hidden sm:block text-right">
            <span className="block text-[11px] text-slate-400">안전 개방률</span>
            <span className="font-mono text-sm font-semibold text-slate-300 tabular-nums">
              {progressPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
            <div className="text-right">
              <span className="block text-[11px] text-slate-400">경과 시간</span>
              <span className="font-mono text-lg font-bold leading-none text-slate-100 tabular-nums">
                {formatTimeMs(elapsedMs)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Hint Feedback Line */}
      {hintHighlight && (
        <div className="border-x border-t border-slate-800 bg-slate-900/60 px-5 py-2 text-xs text-amber-300">
          <span>힌트 안내 · {hintHighlight.reason}</span>
        </div>
      )}

      {/* Main Board Arena Container */}
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex min-h-[380px] items-center justify-center overflow-x-auto rounded-b-xl border border-slate-800 bg-slate-950 p-4 sm:p-6 select-none"
      >
        {/* Grid */}
        <div
          role="grid"
          aria-label={`${activeConfig.label} 지뢰찾기 보드 (${cols}열 ${rows}행)`}
          className={`inline-grid gap-[2px] rounded-lg bg-slate-900 p-2 border border-slate-800 transition-opacity duration-150 ${
            isPaused ? 'opacity-10 pointer-events-none' : 'opacity-100'
          }`}
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {board.map((rowArr, rIdx) =>
            rowArr.map((cell, cIdx) => {
              const isRevealed = cell.state === 'revealed';
              const isFlagged = cell.state === 'flagged';
              const isQuestion = cell.state === 'question';
              const isChordPressed = chordPreviewSet.has(`${rIdx}-${cIdx}`);
              const isHinted =
                hintHighlight?.row === rIdx && hintHighlight?.col === cIdx;
              const isKeyboardTarget =
                focusedCell[0] === rIdx && focusedCell[1] === cIdx;

              let surfaceClass =
                'tile-unrevealed bg-slate-700 hover:bg-slate-600 text-slate-100';

              if (isRevealed) {
                if (cell.exploded) {
                  surfaceClass = 'bg-red-600 text-white';
                } else if (cell.isMine) {
                  surfaceClass = 'tile-revealed bg-slate-900/95 text-rose-400';
                } else {
                  surfaceClass = 'tile-revealed bg-[#0B1222]';
                }
              } else if (cell.wrongFlag) {
                surfaceClass = 'tile-revealed bg-red-950/70 text-red-300';
              } else if (isFlagged) {
                surfaceClass =
                  'tile-unrevealed bg-slate-700/95 hover:bg-slate-600 text-amber-400';
              }

              // Accessible cell label
              let ariaLabel = `${rIdx + 1}행 ${cIdx + 1}열, `;
              if (isRevealed) {
                if (cell.isMine) {
                  ariaLabel += cell.exploded ? '폭발한 지뢰' : '지뢰';
                } else if (cell.neighborMines === 0) {
                  ariaLabel += '열림, 주변 지뢰 없음';
                } else {
                  ariaLabel += `열림, 주변 지뢰 ${cell.neighborMines}개`;
                }
              } else if (cell.wrongFlag) {
                ariaLabel += '잘못 표시된 깃발';
              } else if (isFlagged) {
                ariaLabel += '깃발 표시됨';
              } else if (isQuestion) {
                ariaLabel += '물음표 표시됨';
              } else {
                ariaLabel += '닫힌 칸';
              }

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  ref={(el) => {
                    if (!cellRefs.current[rIdx]) {
                      cellRefs.current[rIdx] = [];
                    }
                    cellRefs.current[rIdx][cIdx] = el;
                  }}
                  type="button"
                  tabIndex={isKeyboardTarget ? 0 : -1}
                  aria-label={ariaLabel}
                  onPointerDown={(e) => handleCellPointerDown(e, rIdx, cIdx)}
                  onPointerMove={handleCellPointerMove}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  onContextMenu={(e) => handleCellContextMenu(e, rIdx, cIdx)}
                  onKeyDown={(e) => handleCellKeyDown(e, rIdx, cIdx)}
                  className={`relative flex items-center justify-center rounded-[4px] font-mono font-bold leading-none select-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-amber-400 ${tileSizeClass} ${surfaceClass} ${
                    isChordPressed ? 'tile-pressed bg-slate-800' : ''
                  } ${
                    isHinted
                      ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 z-10'
                      : ''
                  }`}
                >
                  {isRevealed ? (
                    cell.isMine ? (
                      <Bomb
                        className="h-4 w-4 shrink-0"
                        strokeWidth={2.3}
                        aria-hidden="true"
                      />
                    ) : cell.neighborMines > 0 ? (
                      <span
                        className={`tabular-nums ${
                          NUMBER_COLOR_CLASSES[cell.neighborMines] ??
                          'text-slate-100'
                        }`}
                      >
                        {cell.neighborMines}
                      </span>
                    ) : null
                  ) : cell.wrongFlag ? (
                    <span className="relative inline-flex items-center justify-center">
                      <Flag
                        className="h-4 w-4 text-amber-400/50"
                        aria-hidden="true"
                      />
                      <X
                        className="absolute h-5 w-5 text-red-400"
                        strokeWidth={2.6}
                        aria-hidden="true"
                      />
                    </span>
                  ) : isFlagged ? (
                    <Flag
                      className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0"
                      aria-hidden="true"
                    />
                  ) : isQuestion ? (
                    <span className="text-sm font-bold text-slate-300">?</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Pause Fair-Play Screen */}
        {isPaused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xs p-6 text-center">
            <Pause className="h-9 w-9 text-amber-400" aria-hidden="true" />
            <h2 className="mt-3 font-display text-xl font-bold text-slate-100">
              게임이 일시정지되었습니다
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              공정한 기록 측정을 위해 일시정지 중에는 보드가 가려집니다.
            </p>
            <button
              type="button"
              onClick={onTogglePause}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>게임 계속하기</span>
            </button>
          </div>
        )}

        {/* End State / Victory & Defeat Summary Overlay */}
        {isFinished && showEndModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="round-result-heading"
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-[2px]"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  {gameState === 'ROUND_SUMMARY' ? (
                    <Trophy
                      className="h-6 w-6 text-amber-400 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Bomb
                      className="h-6 w-6 text-red-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      {activeConfig.label} ({activeConfig.cols}×{activeConfig.rows})
                      {isNewBestRecord ? ' · 개인 최고 신기록 달성' : ''}
                    </p>
                    <h2
                      id="round-result-heading"
                      className="mt-0.5 font-display text-xl font-bold text-slate-50"
                    >
                      {gameState === 'ROUND_SUMMARY'
                        ? '모든 지뢰 해체 완료!'
                        : '지뢰가 폭발했습니다'}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  aria-label="결과 창 닫고 보드 확인하기"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-y border-slate-800 py-4">
                <div>
                  <span className="text-xs text-slate-400">소요 시간</span>
                  <p className="mt-1 font-mono text-xl font-bold text-slate-100 tabular-nums">
                    {formatTimeMs(elapsedMs)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">안전 칸 개방</span>
                  <p className="mt-1 font-mono text-xl font-bold text-slate-100 tabular-nums">
                    {revealedSafeCount} / {totalSafeCells}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">보드 난도 (3BV)</span>
                  <p className="mt-1 font-mono text-base font-semibold text-slate-300 tabular-nums">
                    {minesPlaced ? board3BV : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">초당 효율 (3BV/s)</span>
                  <p className="mt-1 font-mono text-base font-semibold text-amber-400 tabular-nums">
                    {current3BVs} /s
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>보드 확인하기</span>
                </button>

                <button
                  type="button"
                  onClick={onRestart}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>다시 플레이</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subtle Keyboard & Touch Affordance Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          좌클릭: 열기 · 우클릭(모바일 길게 터치): 깃발 · 열린 숫자 클릭: 주변 동시 열기
        </span>
        <span>단축키: 방향키 이동 · Space 열기 · F 깃발 · R 재시작 · P 일시정지</span>
      </div>
    </div>
  );
}
