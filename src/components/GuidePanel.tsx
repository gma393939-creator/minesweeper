import { Flag, Play } from 'lucide-react';

interface GuidePanelProps {
  onStartPlaying: () => void;
}

export function GuidePanel({ onStartPlaying }: GuidePanelProps) {
  return (
    <div className="mx-auto max-w-[1040px] px-6 py-8 md:py-12">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-slate-400">
            규칙 안내 · 고급 탐색 기술 · 키보드 및 터치 조작법
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold text-slate-50 sm:text-3xl">
            마인스위퍼 플레이 가이드
          </h1>
        </div>

        <button
          type="button"
          onClick={onStartPlaying}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
        >
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          <span>실전 보드로 이동</span>
        </button>
      </div>

      {/* Core Rules Grid */}
      <section className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            01. 숫자의 의미 파악하기
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            열린 칸에 적힌 숫자는 해당 칸을 둘러싼 <strong>주변 8칸(상·하·좌·우·대각선)</strong>{' '}
            안에 숨겨진 지뢰의 총 개수입니다. 숫자가 없는 빈 칸은 주변에 지뢰가 0개라는
            뜻이며, 인접한 안전한 영역이 연쇄적으로 함께 열립니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-100">
            02. 깃발 표시와 소거법
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            숫자와 닫힌 칸의 개수를 비교해 지뢰가 확실한 칸에는 <strong>우클릭(또는 길게 터치)</strong>으로
            깃발을 꽂으세요. 깃발이 꽂힌 칸은 실수로 클릭해도 열리지 않도록 안전하게
            잠금 보호됩니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-100">
            03. 주변 동시 열기 (Chording)
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            이미 열린 숫자 칸 주변에 그 숫자만큼의 깃발을 모두 꽂았다면, <strong>해당 숫자 칸을 한 번 클릭</strong>해
            보세요. 나머지 닫혀 있는 주변 안전 칸들이 단번에 열려 탐색 속도를 비약적으로
            단축할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Visual Pattern Walkthrough */}
      <section className="mt-10 border-t border-slate-800 pt-8">
        <h2 className="text-lg font-semibold text-slate-100">
          실전 핵심 패턴 두 가지
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          복잡해 보이는 보드도 아래의 기본 논리 패턴으로 대부분 해독할 수 있습니다.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Pattern 1: Corner 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  모서리 확정 법칙
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  모서리에 맞닿은 숫자 <span className="font-mono font-bold text-sky-400">1</span> 주변에
                  닫힌 칸이 단 한 칸뿐이라면 그 칸은 100% 지뢰입니다. 깃발을 꽂은 뒤
                  인접한 다른 <span className="font-mono font-bold text-sky-400">1</span>을 클릭하면 나머지 칸을 즉시 안전하게 열 수 있습니다.
                </p>
              </div>

              {/* Mini Visual Grid */}
              <div
                aria-hidden="true"
                className="grid grid-cols-3 gap-1 rounded-lg bg-slate-950 p-2 shrink-0 border border-slate-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-700 text-amber-400">
                  <Flag className="h-4 w-4 fill-current" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 font-mono text-sm font-bold text-sky-400">
                  1
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-950/60 border border-emerald-500/40 font-mono text-xs text-emerald-300">
                  안전
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 font-mono text-sm font-bold text-sky-400">
                  1
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 font-mono text-sm font-bold text-sky-400">
                  1
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900" />
              </div>
            </div>
          </div>

          {/* Pattern 2: 1-2-1 Wall */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  직선 벽면 1 - 2 - 1 공식
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  닫힌 벽면을 따라 <span className="font-mono font-bold text-sky-400">1</span> -{' '}
                  <span className="font-mono font-bold text-emerald-400">2</span> -{' '}
                  <span className="font-mono font-bold text-sky-400">1</span>이 나란히 나타나면,
                  가운데 2 바로 위 칸은 절대 지뢰가 될 수 없으며 양쪽의 1 바로 위 두 칸이
                  항상 지뢰가 됩니다.
                </p>
              </div>

              {/* Mini Visual Grid */}
              <div
                aria-hidden="true"
                className="grid grid-cols-3 gap-1 rounded-lg bg-slate-950 p-2 shrink-0 border border-slate-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-700 text-amber-400">
                  <Flag className="h-4 w-4 fill-current" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-950/60 border border-emerald-500/40 font-mono text-xs text-emerald-300">
                  안전
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-700 text-amber-400">
                  <Flag className="h-4 w-4 fill-current" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 font-mono text-sm font-bold text-sky-400">
                  1
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 font-mono text-sm font-bold text-emerald-400">
                  2
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 font-mono text-sm font-bold text-sky-400">
                  1
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls Reference Table */}
      <section className="mt-10 border-t border-slate-800 pt-8">
        <h2 className="text-lg font-semibold text-slate-100">
          마우스 · 키보드 · 터치 조작 일람
        </h2>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium text-slate-400">
                <th className="px-5 py-3">동작</th>
                <th className="px-5 py-3">마우스 조작</th>
                <th className="px-5 py-3">키보드 단축키</th>
                <th className="px-5 py-3">모바일 / 터치</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              <tr>
                <td className="px-5 py-3 font-medium text-slate-100">타일 열기</td>
                <td className="px-5 py-3">닫힌 칸 좌클릭</td>
                <td className="px-5 py-3 font-mono text-xs">방향키 이동 후 Space / Enter</td>
                <td className="px-5 py-3">열기 모드에서 가볍게 탭</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-slate-100">깃발 표시 / 해제</td>
                <td className="px-5 py-3">닫힌 칸 우클릭</td>
                <td className="px-5 py-3 font-mono text-xs">F 키</td>
                <td className="px-5 py-3">길게 누르기 (0.3초) 또는 깃발 모드 탭</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-slate-100">주변 동시 열기</td>
                <td className="px-5 py-3">열린 숫자 칸 좌클릭 또는 더블클릭</td>
                <td className="px-5 py-3 font-mono text-xs">숫자 칸 위에서 Space / Enter</td>
                <td className="px-5 py-3">열린 숫자 칸 탭</td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-slate-100">빠른 재시작 / 일시정지</td>
                <td className="px-5 py-3">상단 상태 버튼 클릭</td>
                <td className="px-5 py-3 font-mono text-xs">R (재시작) · P (일시정지)</td>
                <td className="px-5 py-3">상단 툴바 버튼 탭</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
