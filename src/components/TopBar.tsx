import { NavSection } from '../types/minesweeper';

interface TopBarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onStartNewGame: () => void;
}

const NAV_ITEMS: ReadonlyArray<{ key: NavSection; label: string }> = [
  { key: 'PLAY', label: '게임 보드' },
  { key: 'SETUP', label: '난이도 선택' },
  { key: 'RECORDS', label: '최고 기록' },
  { key: 'GUIDE', label: '플레이 가이드' },
];

export function TopBar({
  activeSection,
  onSelectSection,
  onStartNewGame,
}: TopBarProps) {
  return (
    <header className="border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectSection('SETUP')}
          className="font-display text-lg font-bold tracking-tight text-slate-100 transition-colors hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 whitespace-nowrap shrink-0"
        >
          마인스위퍼
        </button>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav
          aria-label="주요 메뉴"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectSection(item.key)}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 ${
                  isActive
                    ? 'text-slate-100 underline decoration-amber-400 decoration-2 underline-offset-8'
                    : 'text-slate-400 hover:text-slate-100 hover:underline hover:decoration-slate-600 hover:underline-offset-8'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartNewGame}
            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 whitespace-nowrap shrink-0"
          >
            새 게임
          </button>
        </div>
      </div>
    </header>
  );
}
