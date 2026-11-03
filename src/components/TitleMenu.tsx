import { useState } from 'react';
import { Flag, Grid3X3, Play, ShieldCheck, Zap } from 'lucide-react';
import {
  DIFFICULTY_PRESETS,
  DifficultyConfig,
  DifficultyKey,
  ScoreRecord,
  StatsByDifficulty,
} from '../types/minesweeper';
import { formatTimeMs } from '../utils/storage';
import boardArtworkUrl from '../assets/images/tactical_minesweeper_board_1793672200447.jpg';

interface TitleMenuProps {
  selectedDifficulty: DifficultyKey;
  customConfig: DifficultyConfig;
  records: ScoreRecord[];
  stats: StatsByDifficulty;
  hasActiveGame: boolean;
  onSelectDifficulty: (key: DifficultyKey) => void;
  onUpdateCustomConfig: (config: DifficultyConfig) => void;
  onStartGame: () => void;
  onResumeActiveGame: () => void;
  onOpenGuide: () => void;
}

export function TitleMenu({
  selectedDifficulty,
  customConfig,
  records,
  stats,
  hasActiveGame,
  onSelectDifficulty,
  onUpdateCustomConfig,
  onStartGame,
  onResumeActiveGame,
  onOpenGuide,
}: TitleMenuProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const activeConfig: DifficultyConfig =
    selectedDifficulty === 'custom'
      ? customConfig
      : DIFFICULTY_PRESETS[selectedDifficulty];

  const totalCells = activeConfig.rows * activeConfig.cols;
  const densityPercent = ((activeConfig.mines / totalCells) * 100).toFixed(1);
  const maxCustomMines = Math.max(
    5,
    Math.min(200, Math.floor(customConfig.rows * customConfig.cols * 0.35))
  );

  const getBestTimeLabel = (diff: Exclude<DifficultyKey, 'custom'>): string => {
    const filtered = records.filter((r) => r.difficulty === diff);
    if (filtered.length === 0) return '기록 없음';
    const best = Math.min(...filtered.map((r) => r.timeMs));
    return formatTimeMs(best);
  };

  const totalPlayed =
    stats.beginner.played +
    stats.intermediate.played +
    stats.expert.played +
    stats.custom.played;
  const totalWon =
    stats.beginner.won +
    stats.intermediate.won +
    stats.expert.won +
    stats.custom.won;
  const overallWinRate =
    totalPlayed > 0 ? `${Math.round((totalWon / totalPlayed) * 100)}%` : '0%';
  const maxStreak = Math.max(
    stats.beginner.bestStreak,
    stats.intermediate.bestStreak,
    stats.expert.bestStreak,
    stats.custom.bestStreak
  );

  const handleCustomDimensionChange = (
    field: 'rows' | 'cols' | 'mines',
    rawValue: number
  ) => {
    let nextRows = customConfig.rows;
    let nextCols = customConfig.cols;
    let nextMines = customConfig.mines;

    if (field === 'rows') {
      nextRows = Math.max(8, Math.min(24, rawValue));
    } else if (field === 'cols') {
      nextCols = Math.max(8, Math.min(30, rawValue));
    } else {
      nextMines = rawValue;
    }

    const nextMaxMines = Math.max(
      5,
      Math.min(200, Math.floor(nextRows * nextCols * 0.35))
    );
    nextMines = Math.max(5, Math.min(nextMaxMines, nextMines));

    onUpdateCustomConfig({
      ...customConfig,
      rows: nextRows,
      cols: nextCols,
      mines: nextMines,
    });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 md:py-12">
      {/* 2-Column Hero Split */}
      <section className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Title, Difficulty Setup, CTA */}
        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <p className="text-xs font-medium text-slate-400">
              <span>정통 전략 지뢰찾기</span>
              <span aria-hidden="true" className="mx-2 text-slate-600">
                ·
              </span>
              <span>첫 클릭 안전 구역 보장</span>
              <span aria-hidden="true" className="mx-2 text-slate-600">
                ·
              </span>
              <span>주변 동시 열기 지원</span>
            </p>

            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.18] [text-wrap:balance]">
              숫자의 단서로 지뢰밭을 해독하는 정교한 논리 퍼즐
            </h1>

            <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-slate-300">
              운에 기대는 첫 클릭 폭발 없이 항상 안전한 개방 구역에서 출발합니다.
              열린 숫자를 클릭해 주변 칸을 단번에 여는 코드 열기(Chording)와 키보드·터치
              단축 조작으로 쾌적하게 최고 기록에 도전해 보세요.
            </p>

            {/* Difficulty Segmented Control */}
            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-200">
                  난이도 규격 선택
                </span>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {activeConfig.cols} × {activeConfig.rows} 격자 · 지뢰{' '}
                  {activeConfig.mines}개 · 밀도 {densityPercent}%
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="난이도 선택"
                className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-900 p-1.5 border border-slate-800 sm:grid-cols-4"
              >
                {(
                  ['beginner', 'intermediate', 'expert', 'custom'] as const
                ).map((key) => {
                  const isSelected = selectedDifficulty === key;
                  const label =
                    key === 'custom'
                      ? '사용자 지정'
                      : DIFFICULTY_PRESETS[key].label;
                  const sub =
                    key === 'custom'
                      ? `${customConfig.cols}×${customConfig.rows}`
                      : `${DIFFICULTY_PRESETS[key].cols}×${DIFFICULTY_PRESETS[key].rows}`;

                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => onSelectDifficulty(key)}
                      className={`flex items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400 ${
                        isSelected
                          ? 'bg-slate-800 text-amber-400 shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-2.5 text-xs text-slate-400">
                {activeConfig.subtitle}
              </p>

              {/* Custom Board Configurator */}
              {selectedDifficulty === 'custom' && (
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="flex items-center justify-between text-xs text-slate-300">
                      <span>가로 칸 수 (8–30)</span>
                      <span className="font-mono font-semibold text-amber-400 tabular-nums">
                        {customConfig.cols}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={8}
                      max={30}
                      value={customConfig.cols}
                      onChange={(e) =>
                        handleCustomDimensionChange(
                          'cols',
                          Number(e.target.value)
                        )
                      }
                      className="mt-2 w-full accent-amber-500"
                    />
                  </label>

                  <label className="block">
                    <span className="flex items-center justify-between text-xs text-slate-300">
                      <span>세로 칸 수 (8–24)</span>
                      <span className="font-mono font-semibold text-amber-400 tabular-nums">
                        {customConfig.rows}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={8}
                      max={24}
                      value={customConfig.rows}
                      onChange={(e) =>
                        handleCustomDimensionChange(
                          'rows',
                          Number(e.target.value)
                        )
                      }
                      className="mt-2 w-full accent-amber-500"
                    />
                  </label>

                  <label className="block">
                    <span className="flex items-center justify-between text-xs text-slate-300">
                      <span>지뢰 수 (5–{maxCustomMines})</span>
                      <span className="font-mono font-semibold text-amber-400 tabular-nums">
                        {customConfig.mines}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={maxCustomMines}
                      value={customConfig.mines}
                      onChange={(e) =>
                        handleCustomDimensionChange(
                          'mines',
                          Number(e.target.value)
                        )
                      }
                      className="mt-2 w-full accent-amber-500"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Row */}
          <div className="mt-8 flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStartGame}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 whitespace-nowrap shrink-0"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>{activeConfig.label} 게임 시작</span>
            </button>

            {hasActiveGame && (
              <button
                type="button"
                onClick={onResumeActiveGame}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors duration-150 hover:border-slate-600 hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                진행 중인 보드로 복귀
              </button>
            )}

            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex min-h-[44px] items-center justify-center px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-200 hover:underline hover:underline-offset-4 whitespace-nowrap shrink-0"
            >
              규칙 및 단축키 안내
            </button>
          </div>
        </div>

        {/* Right Column: Bespoke Tabletop Artwork with Measured Scrim & Fallback */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 lg:col-span-5">
          {!imgFailed ? (
            <img
              src={boardArtworkUrl}
              alt="다크 슬레이트 타일과 앰버 깃발 핀으로 구성된 전략 지뢰찾기 보드"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-64 w-full object-cover sm:h-80 lg:h-full"
            />
          ) : (
            <div className="flex h-64 w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:h-80 lg:h-full">
              <Grid3X3
                className="h-14 w-14 text-amber-400/80"
                aria-hidden="true"
              />
              <p className="mt-3 font-display text-base font-semibold text-slate-200">
                전략 지뢰찾기 보드
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-xs font-medium text-amber-300">
              핵심 조작 요약
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-200 sm:grid-cols-3 lg:grid-cols-1">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="h-4 w-4 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span>좌클릭으로 안전 칸 개방 (첫 클릭 100% 안전)</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag
                  className="h-4 w-4 text-amber-400 shrink-0"
                  aria-hidden="true"
                />
                <span>우클릭 또는 길게 터치하여 지뢰 위치에 깃발 표시</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap
                  className="h-4 w-4 text-sky-400 shrink-0"
                  aria-hidden="true"
                />
                <span>깃발 수가 맞은 열린 숫자를 클릭해 주변 칸 동시 개방</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Best Records & Summary Strip Below Hero Split */}
      <section
        aria-label="난이도별 최고 기록 요약"
        className="mt-10 grid grid-cols-2 gap-6 border-t border-slate-800/90 pt-8 sm:grid-cols-4"
      >
        <div>
          <p className="text-xs text-slate-400">초급 최고 기록 (9×9)</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-100 tabular-nums">
            {getBestTimeLabel('beginner')}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            클리어 {stats.beginner.won}회 · 도전 {stats.beginner.played}회
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">중급 최고 기록 (16×16)</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-100 tabular-nums">
            {getBestTimeLabel('intermediate')}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            클리어 {stats.intermediate.won}회 · 도전 {stats.intermediate.played}회
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">고급 최고 기록 (30×16)</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-slate-100 tabular-nums">
            {getBestTimeLabel('expert')}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            클리어 {stats.expert.won}회 · 도전 {stats.expert.played}회
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">전체 승률 및 최다 연승</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-amber-400 tabular-nums">
            {overallWinRate}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            총 {totalPlayed}게임 · 최고 {maxStreak}연승
          </p>
        </div>
      </section>
    </div>
  );
}
