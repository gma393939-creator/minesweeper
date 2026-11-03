import { useState } from 'react';
import { Play, RotateCcw, Trophy } from 'lucide-react';
import {
  DIFFICULTY_PRESETS,
  DifficultyKey,
  ScoreRecord,
  StatsByDifficulty,
} from '../types/minesweeper';
import { formatTimeMs } from '../utils/storage';

interface RecordsPanelProps {
  records: ScoreRecord[];
  stats: StatsByDifficulty;
  onStartWithDifficulty: (diff: Exclude<DifficultyKey, 'custom'>) => void;
  onClearAll: () => void;
}

export function RecordsPanel({
  records,
  stats,
  onStartWithDifficulty,
  onClearAll,
}: RecordsPanelProps) {
  const [selectedTab, setSelectedTab] =
    useState<Exclude<DifficultyKey, 'custom'>>('beginner');
  const [confirmReset, setConfirmReset] = useState(false);

  const filteredRecords = records
    .filter((r) => r.difficulty === selectedTab)
    .sort((a, b) => a.timeMs - b.timeMs);

  const currentStats = stats[selectedTab];
  const winRate =
    currentStats.played > 0
      ? `${Math.round((currentStats.won / currentStats.played) * 100)}%`
      : '0%';

  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}.${m}.${day}`;
    } catch {
      return '-';
    }
  };

  return (
    <div className="mx-auto max-w-[1040px] px-6 py-8 md:py-12">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-slate-400">
            개인 명예의 전당 · 브라우저 자동 저장
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold text-slate-50 sm:text-3xl">
            난이도별 최고 기록 및 통계
          </h1>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1 self-start rounded-lg border border-slate-800 bg-slate-900 p-1">
          {(['beginner', 'intermediate', 'expert'] as const).map((key) => {
            const active = selectedTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedTab(key);
                  setConfirmReset(false);
                }}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-800 text-amber-400'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {DIFFICULTY_PRESETS[key].label} ({DIFFICULTY_PRESETS[key].cols}×
                {DIFFICULTY_PRESETS[key].rows})
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Difficulty KPI Strip */}
      <div className="mt-6 grid grid-cols-2 gap-6 border-b border-slate-800/80 pb-6 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-400">플레이 횟수</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-100 tabular-nums">
            {currentStats.played}회
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">클리어 횟수</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
            {currentStats.won}회
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">달성 승률</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-100 tabular-nums">
            {winRate}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">현재 / 최고 연승</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-400 tabular-nums">
            {currentStats.currentStreak} / {currentStats.bestStreak}연승
          </p>
        </div>
      </div>

      {/* Records Table or Empty State */}
      <div className="mt-8">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-14 text-center">
            <Trophy
              className="h-10 w-10 text-slate-600"
              aria-hidden="true"
            />
            <h2 className="mt-3 text-base font-semibold text-slate-200">
              아직 {DIFFICULTY_PRESETS[selectedTab].label} 난이도 클리어 기록이 없습니다
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-slate-400">
              지뢰가 없는 모든 안전한 칸을 열면 클리어 시간과 초당 보드 효율(3BV/s)이
              이곳에 자동으로 기록됩니다.
            </p>
            <button
              type="button"
              onClick={() => onStartWithDifficulty(selectedTab)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>{DIFFICULTY_PRESETS[selectedTab].label} 도전 시작</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-medium text-slate-400">
                  <th className="px-5 py-3.5">순위</th>
                  <th className="px-5 py-3.5">클리어 시간</th>
                  <th className="px-5 py-3.5">보드 기준치 (3BV)</th>
                  <th className="px-5 py-3.5">초당 효율 (3BV/s)</th>
                  <th className="px-5 py-3.5">클리어 방식</th>
                  <th className="px-5 py-3.5 text-right">달성일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredRecords.map((rec, index) => {
                  const seconds = Math.max(0.1, rec.timeMs / 1000);
                  const eff = (rec.board3BV / seconds).toFixed(2);
                  return (
                    <tr
                      key={rec.id}
                      className="transition-colors hover:bg-slate-800/35"
                    >
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-200 tabular-nums">
                        {index + 1}위
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-400 tabular-nums">
                        {formatTimeMs(rec.timeMs)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300 tabular-nums">
                        {rec.board3BV}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300 tabular-nums">
                        {eff} /s
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {rec.hintsUsed === 0
                          ? '무힌트 정석 클리어'
                          : `힌트 ${rec.hintsUsed}회 사용`}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400 tabular-nums">
                        {formatDate(rec.dateIso)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quiet Record Management Footer */}
      {(records.length > 0 ||
        stats.beginner.played +
          stats.intermediate.played +
          stats.expert.played +
          stats.custom.played >
          0) && (
        <div className="mt-6 flex items-center justify-end gap-3">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-3.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>전체 기록 초기화</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">
                모든 기록과 승률을 삭제할까요?
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setConfirmReset(false);
                }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 whitespace-nowrap shrink-0"
              >
                삭제 확인
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                취소
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
