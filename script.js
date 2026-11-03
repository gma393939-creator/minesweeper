/**
 * 마인스위퍼 — 클래식 지뢰찾기 (Pure Vanilla ES6+ JavaScript)
 * Zero-build GitHub Pages compatible implementation.
 */

(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Constants & Presets
  // ---------------------------------------------------------------------------
  const RECORDS_STORAGE_KEY = 'minesweeper_kr_records_v1';
  const STATS_STORAGE_KEY = 'minesweeper_kr_stats_v1';
  const PREFS_STORAGE_KEY = 'minesweeper_kr_prefs_v1';
  const MAX_HINTS_PER_GAME = 3;

  const DIRECTIONS = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  const DIFFICULTY_PRESETS = {
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

  const NUMBER_COLOR_CLASSES = {
    1: 'text-sky-400',
    2: 'text-emerald-400',
    3: 'text-rose-400',
    4: 'text-violet-400',
    5: 'text-amber-400',
    6: 'text-cyan-400',
    7: 'text-fuchsia-400',
    8: 'text-slate-200',
  };

  // Crisp inline SVG snippets matching Lucide icons
  const ICONS = {
    bomb: `<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="13" r="9"></circle><path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95"></path><path d="m22 2-1.5 1.5"></path></svg>`,
    flagFilled: `<svg class="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line></svg>`,
    wrongFlag: `<span class="relative inline-flex items-center justify-center"><svg class="h-4 w-4 text-amber-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line></svg><svg class="absolute h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></span>`,
    pauseSm: `<svg class="h-3.5 w-3.5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="4" width="4" height="16" rx="1"></rect><rect x="6" y="4" width="4" height="16" rx="1"></rect></svg>`,
    playEmeraldSm: `<svg class="h-3.5 w-3.5 text-emerald-400 fill-current" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`,
    maximizeSm: `<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" x2="14" y1="3" y2="10"></line><line x1="3" x2="10" y1="21" y2="14"></line></svg>`,
    minimizeSm: `<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" x2="21" y1="10" y2="3"></line><line x1="3" x2="10" y1="21" y2="14"></line></svg>`,
    volumeOnSm: `<svg class="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
    volumeOffSm: `<svg class="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="22" x2="16" y1="9" y2="15"></line><line x1="16" x2="22" y1="9" y2="15"></line></svg>`,
    checkCircleSm: `<svg class="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>`,
    alertTriangleSm: `<svg class="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`,
    rotateAmberSm: `<svg class="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`,
    trophyLg: `<svg class="h-6 w-6 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`,
    bombRedLg: `<svg class="h-6 w-6 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="13" r="9"></circle><path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95"></path><path d="m22 2-1.5 1.5"></path></svg>`,
  };

  // ---------------------------------------------------------------------------
  // 2. Web Audio API Synthesizer
  // ---------------------------------------------------------------------------
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
    }

    getContext() {
      if (!this.enabled || typeof window === 'undefined') return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    playReveal(cascadeSize = 1) {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const steps = Math.min(cascadeSize, 5);

      for (let i = 0; i < steps; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + i * 0.028;

        osc.type = 'triangle';
        const baseFreq = 340 + i * 65;
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, startTime + 0.06);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.065 / (1 + i * 0.25), startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.075);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.08);
      }
    }

    playFlag(placed) {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (placed) {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.065);
      } else {
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.065);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    }

    playChord() {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.022;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.095);
      });
    }

    playHint() {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.065, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.17);
      });
    }

    playExplosion() {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.35);

      oscGain.gain.setValueAtTime(0.14, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      const bufferSize = Math.floor(ctx.sampleRate * 0.32);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.09));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(680, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.3);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.14, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
    }

    playVictory() {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.085;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.085, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.34);
      });
    }
  }

  const soundEngine = new SoundEngine();

  // ---------------------------------------------------------------------------
  // 3. Storage & Formatting Helpers
  // ---------------------------------------------------------------------------
  function createDefaultStats() {
    return {
      beginner: { played: 0, won: 0, currentStreak: 0, bestStreak: 0 },
      intermediate: { played: 0, won: 0, currentStreak: 0, bestStreak: 0 },
      expert: { played: 0, won: 0, currentStreak: 0, bestStreak: 0 },
      custom: { played: 0, won: 0, currentStreak: 0, bestStreak: 0 },
    };
  }

  function createDefaultPrefs() {
    return {
      soundEnabled: true,
      allowQuestionMarks: false,
      largeTiles: false,
    };
  }

  function loadRecords() {
    try {
      const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveRecord(newRecord) {
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
      // Ignore quota errors
    }

    return { records: combined, isNewBest };
  }

  function loadStats() {
    const defaults = createDefaultStats();
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) || {};
      return {
        beginner: { ...defaults.beginner, ...parsed.beginner },
        intermediate: { ...defaults.intermediate, ...parsed.intermediate },
        expert: { ...defaults.expert, ...parsed.expert },
        custom: { ...defaults.custom, ...parsed.custom },
      };
    } catch {
      return defaults;
    }
  }

  function recordGameResult(difficulty, won) {
    const current = loadStats();
    const entry = { ...current[difficulty] };
    entry.played += 1;

    if (won) {
      entry.won += 1;
      entry.currentStreak += 1;
      entry.bestStreak = Math.max(entry.bestStreak, entry.currentStreak);
    } else {
      entry.currentStreak = 0;
    }

    const nextStats = { ...current, [difficulty]: entry };
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(nextStats));
    } catch {
      // Ignore storage errors
    }
    return nextStats;
  }

  function clearAllRecordsAndStats() {
    try {
      localStorage.removeItem(RECORDS_STORAGE_KEY);
      localStorage.removeItem(STATS_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    return {
      records: [],
      stats: createDefaultStats(),
    };
  }

  function loadPreferences() {
    const defaults = createDefaultPrefs();
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  }

  function savePreferences(prefs) {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage errors
    }
  }

  function formatTimeMs(ms) {
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

  function formatDateIso(iso) {
    try {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}.${m}.${day}`;
    } catch {
      return '-';
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Pure Minesweeper Board Engine
  // ---------------------------------------------------------------------------
  function createEmptyBoard(rows, cols) {
    const board = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          neighborMines: 0,
          state: 'hidden',
          exploded: false,
          wrongFlag: false,
        });
      }
      board.push(row);
    }
    return board;
  }

  function cloneBoard(board) {
    return board.map((row) => row.map((cell) => ({ ...cell })));
  }

  function getNeighbors(board, row, col) {
    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;
    const result = [];

    for (let i = 0; i < DIRECTIONS.length; i++) {
      const nr = row + DIRECTIONS[i][0];
      const nc = col + DIRECTIONS[i][1];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        result.push(board[nr][nc]);
      }
    }
    return result;
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function placeMinesWithSafeZone(initialBoard, mines, safeRow, safeCol) {
    const board = cloneBoard(initialBoard);
    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;
    const maxPossibleMines = Math.max(1, rows * cols - 1);
    const targetMines = Math.min(mines, maxPossibleMines);

    const outerCandidates = [];
    const innerRingCandidates = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === safeRow && c === safeCol) continue;
        if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) {
          innerRingCandidates.push([r, c]);
        } else {
          outerCandidates.push([r, c]);
        }
      }
    }

    let chosen;
    if (outerCandidates.length >= targetMines) {
      chosen = shuffleArray(outerCandidates).slice(0, targetMines);
    } else {
      const remainingNeeded = targetMines - outerCandidates.length;
      chosen = outerCandidates.concat(
        shuffleArray(innerRingCandidates).slice(0, remainingNeeded)
      );
    }

    for (let i = 0; i < chosen.length; i++) {
      const [mr, mc] = chosen[i];
      board[mr][mc].isMine = true;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].isMine) continue;
        const count = getNeighbors(board, r, c).filter((n) => n.isMine).length;
        board[r][c].neighborMines = count;
      }
    }

    return board;
  }

  function calculate3BV(board) {
    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    let clicks = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        if (!cell.isMine && cell.neighborMines === 0 && !visited[r][c]) {
          clicks++;
          const queue = [[r, c]];
          visited[r][c] = true;

          let head = 0;
          while (head < queue.length) {
            const [cr, cc] = queue[head++];
            const neighbors = getNeighbors(board, cr, cc);
            for (let i = 0; i < neighbors.length; i++) {
              const neighbor = neighbors[i];
              if (!neighbor.isMine && !visited[neighbor.row][neighbor.col]) {
                visited[neighbor.row][neighbor.col] = true;
                if (neighbor.neighborMines === 0) {
                  queue.push([neighbor.row, neighbor.col]);
                }
              }
            }
          }
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isMine && !visited[r][c]) {
          clicks++;
        }
      }
    }

    return Math.max(1, clicks);
  }

  function checkVictory(board) {
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const cell = board[r][c];
        if (!cell.isMine && cell.state !== 'revealed') {
          return false;
        }
      }
    }
    return true;
  }

  function autoFlagRemainingMinesOnWin(board) {
    return board.map((row) =>
      row.map((cell) => {
        if (cell.isMine && cell.state !== 'flagged') {
          return { ...cell, state: 'flagged' };
        }
        return cell;
      })
    );
  }

  function revealBoardOnLoss(board, explodedCoords) {
    const explodedSet = new Set(explodedCoords.map(([r, c]) => `${r}-${c}`));

    return board.map((row) =>
      row.map((cell) => {
        const key = `${cell.row}-${cell.col}`;
        if (explodedSet.has(key)) {
          return { ...cell, state: 'revealed', exploded: true };
        }
        if (cell.isMine && cell.state !== 'flagged') {
          return { ...cell, state: 'revealed' };
        }
        if (!cell.isMine && cell.state === 'flagged') {
          return { ...cell, wrongFlag: true };
        }
        return cell;
      })
    );
  }

  function revealCell(currentBoard, row, col) {
    const target = currentBoard[row] && currentBoard[row][col];
    if (!target || target.state === 'revealed' || target.state === 'flagged') {
      return {
        board: currentBoard,
        hitMine: false,
        newlyRevealedCount: 0,
        won: false,
      };
    }

    if (target.isMine) {
      return {
        board: revealBoardOnLoss(currentBoard, [[row, col]]),
        hitMine: true,
        newlyRevealedCount: 1,
        won: false,
      };
    }

    const nextBoard = cloneBoard(currentBoard);
    let newlyRevealedCount = 0;
    const queue = [[row, col]];
    let head = 0;

    while (head < queue.length) {
      const [cr, cc] = queue[head++];
      const cell = nextBoard[cr][cc];
      if (cell.state === 'revealed' || cell.state === 'flagged' || cell.isMine) {
        continue;
      }

      cell.state = 'revealed';
      newlyRevealedCount++;

      if (cell.neighborMines === 0) {
        const neighbors = getNeighbors(nextBoard, cr, cc);
        for (let i = 0; i < neighbors.length; i++) {
          const n = neighbors[i];
          if (n.state === 'hidden' || n.state === 'question') {
            queue.push([n.row, n.col]);
          }
        }
      }
    }

    const won = checkVictory(nextBoard);
    const finalBoard = won ? autoFlagRemainingMinesOnWin(nextBoard) : nextBoard;

    return {
      board: finalBoard,
      hitMine: false,
      newlyRevealedCount,
      won,
    };
  }

  function chordCell(currentBoard, row, col) {
    const center = currentBoard[row] && currentBoard[row][col];
    if (!center || center.state !== 'revealed' || center.neighborMines === 0) {
      return {
        board: currentBoard,
        triggered: false,
        hitMine: false,
        newlyRevealedCount: 0,
        won: false,
      };
    }

    const neighbors = getNeighbors(currentBoard, row, col);
    const flaggedCount = neighbors.filter((n) => n.state === 'flagged').length;

    if (flaggedCount !== center.neighborMines) {
      return {
        board: currentBoard,
        triggered: false,
        hitMine: false,
        newlyRevealedCount: 0,
        won: false,
      };
    }

    const toOpen = neighbors.filter(
      (n) => n.state === 'hidden' || n.state === 'question'
    );
    if (toOpen.length === 0) {
      return {
        board: currentBoard,
        triggered: false,
        hitMine: false,
        newlyRevealedCount: 0,
        won: false,
      };
    }

    const hitMines = toOpen.filter((n) => n.isMine);
    if (hitMines.length > 0) {
      return {
        board: revealBoardOnLoss(
          currentBoard,
          hitMines.map((m) => [m.row, m.col])
        ),
        triggered: true,
        hitMine: true,
        newlyRevealedCount: hitMines.length,
        won: false,
      };
    }

    let workingBoard = cloneBoard(currentBoard);
    let totalOpened = 0;

    for (let i = 0; i < toOpen.length; i++) {
      const candidate = toOpen[i];
      if (workingBoard[candidate.row][candidate.col].state !== 'revealed') {
        const step = revealCell(workingBoard, candidate.row, candidate.col);
        workingBoard = step.board;
        totalOpened += step.newlyRevealedCount;
      }
    }

    const won = checkVictory(workingBoard);
    const finalBoard = won
      ? autoFlagRemainingMinesOnWin(workingBoard)
      : workingBoard;

    return {
      board: finalBoard,
      triggered: true,
      hitMine: false,
      newlyRevealedCount: totalOpened,
      won,
    };
  }

  function cycleCellMark(currentBoard, row, col, allowQuestionMarks) {
    const cell = currentBoard[row] && currentBoard[row][col];
    if (!cell || cell.state === 'revealed') {
      return { board: currentBoard, placedFlag: null };
    }

    const nextBoard = cloneBoard(currentBoard);
    const target = nextBoard[row][col];

    if (target.state === 'hidden') {
      target.state = 'flagged';
      return { board: nextBoard, placedFlag: true };
    }

    if (target.state === 'flagged') {
      target.state = allowQuestionMarks ? 'question' : 'hidden';
      return { board: nextBoard, placedFlag: false };
    }

    target.state = 'hidden';
    return { board: nextBoard, placedFlag: false };
  }

  function findSmartHint(board, minesPlaced) {
    const rows = board.length;
    const cols = board[0] ? board[0].length : 0;

    if (!minesPlaced) {
      return {
        row: Math.floor(rows / 2),
        col: Math.floor(cols / 2),
        action: 'reveal',
        reason: '첫 클릭은 항상 지뢰가 없는 안전 구역으로 시작됩니다.',
      };
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        if (cell.state === 'flagged' && !cell.isMine) {
          return {
            row: r,
            col: c,
            action: 'reveal',
            reason: `(${r + 1}행 ${c + 1}열)에 잘못 꽂힌 깃발을 정리하고 안전 칸을 열었습니다.`,
          };
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        if (cell.state === 'revealed' && cell.neighborMines > 0) {
          const neighbors = getNeighbors(board, r, c);
          const flaggedMines = neighbors.filter(
            (n) => n.state === 'flagged' && n.isMine
          );
          const unrevealedSafe = neighbors.filter(
            (n) => (n.state === 'hidden' || n.state === 'question') && !n.isMine
          );

          if (
            flaggedMines.length === cell.neighborMines &&
            unrevealedSafe.length > 0
          ) {
            return {
              row: unrevealedSafe[0].row,
              col: unrevealedSafe[0].col,
              action: 'reveal',
              reason: '주변 지뢰 개수가 모두 충족되어 논리적으로 안전한 칸입니다.',
            };
          }
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        if (cell.state === 'revealed' && cell.neighborMines > 0) {
          const neighbors = getNeighbors(board, r, c);
          const flagged = neighbors.filter((n) => n.state === 'flagged');
          const unrevealed = neighbors.filter(
            (n) => n.state === 'hidden' || n.state === 'question'
          );
          const unflaggedMines = unrevealed.filter((n) => n.isMine);

          if (
            flagged.length + unrevealed.length === cell.neighborMines &&
            unflaggedMines.length > 0
          ) {
            return {
              row: unflaggedMines[0].row,
              col: unflaggedMines[0].col,
              action: 'flag',
              reason: '남은 닫힌 칸 수와 필요한 지뢰 수가 일치하여 깃발을 표시했습니다.',
            };
          }
        }
      }
    }

    const frontierSafe = [];
    const anySafe = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board[r][c];
        if (!cell.isMine && (cell.state === 'hidden' || cell.state === 'question')) {
          anySafe.push(cell);
          const touchesRevealed = getNeighbors(board, r, c).some(
            (n) => n.state === 'revealed'
          );
          if (touchesRevealed) {
            frontierSafe.push(cell);
          }
        }
      }
    }

    const pool = frontierSafe.length > 0 ? frontierSafe : anySafe;
    if (pool.length === 0) return null;

    pool.sort((a, b) => a.neighborMines - b.neighborMines);
    return {
      row: pool[0].row,
      col: pool[0].col,
      action: 'reveal',
      reason: '추론이 어려운 구간에서 안전한 돌파구를 열었습니다.',
    };
  }

  function countFlags(board) {
    let count = 0;
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c].state === 'flagged') count++;
      }
    }
    return count;
  }

  function countRevealedSafeCells(board) {
    let count = 0;
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (!board[r][c].isMine && board[r][c].state === 'revealed') count++;
      }
    }
    return count;
  }

  // ---------------------------------------------------------------------------
  // 5. Application State
  // ---------------------------------------------------------------------------
  const state = {
    activeSection: 'SETUP', // 'PLAY' | 'SETUP' | 'RECORDS' | 'GUIDE'
    gameState: 'TITLE_MENU', // 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY' | 'GAME_OVER'
    difficulty: 'beginner', // 'beginner' | 'intermediate' | 'expert' | 'custom'
    customConfig: {
      key: 'custom',
      label: '사용자 지정',
      subtitle: '원하는 가로·세로 크기와 지뢰 밀도를 자유롭게 구성합니다',
      rows: 12,
      cols: 16,
      mines: 32,
    },
    board: createEmptyBoard(
      DIFFICULTY_PRESETS.beginner.rows,
      DIFFICULTY_PRESETS.beginner.cols
    ),
    minesPlaced: false,
    board3BV: 0,
    elapsedMs: 0,
    hintsRemaining: MAX_HINTS_PER_GAME,
    hintHighlight: null, // { row, col, reason } | null
    inputMode: 'reveal', // 'reveal' | 'flag'
    isNewBestRecord: false,
    showEndModal: false,
    chordPreviewCenter: null, // [r, c] | null
    focusedCell: [0, 0],
    selectedRecordTab: 'beginner',
    confirmResetRecords: false,
    records: loadRecords(),
    stats: loadStats(),
    preferences: loadPreferences(),
  };

  let timerIntervalId = null;
  let lastTickTime = null;
  let hintTimeoutId = null;
  let longPressTimerId = null;
  let longPressFired = false;
  let pointerStartPos = null;

  // Matrix of button elements for fast incremental DOM updates
  let gridElements = [];
  let renderedGridDims = { rows: 0, cols: 0 };

  function getActiveConfig() {
    return state.difficulty === 'custom'
      ? state.customConfig
      : DIFFICULTY_PRESETS[state.difficulty];
  }

  // ---------------------------------------------------------------------------
  // 6. DOM Element Cache
  // ---------------------------------------------------------------------------
  const el = {
    brandBtn: document.getElementById('brand-btn'),
    headerNewGameBtn: document.getElementById('header-new-game-btn'),
    desktopNavBtns: Array.from(document.querySelectorAll('[data-nav]')),
    mobileNavBtns: Array.from(document.querySelectorAll('[data-mobile-nav]')),
    footerNavBtns: Array.from(document.querySelectorAll('[data-footer-nav]')),

    sectionSetup: document.getElementById('section-setup'),
    sectionPlay: document.getElementById('section-play'),
    sectionRecords: document.getElementById('section-records'),
    sectionGuide: document.getElementById('section-guide'),

    // Setup elements
    setupSpecSummary: document.getElementById('setup-spec-summary'),
    setupDiffBtns: Array.from(document.querySelectorAll('[data-setup-diff]')),
    setupCustomDimLabel: document.getElementById('setup-custom-dim-label'),
    setupDiffSubtitle: document.getElementById('setup-diff-subtitle'),
    setupCustomPanel: document.getElementById('setup-custom-panel'),
    customColsVal: document.getElementById('custom-cols-val'),
    customColsRange: document.getElementById('custom-cols-range'),
    customRowsVal: document.getElementById('custom-rows-val'),
    customRowsRange: document.getElementById('custom-rows-range'),
    customMinesMaxLabel: document.getElementById('custom-mines-max-label'),
    customMinesVal: document.getElementById('custom-mines-val'),
    customMinesRange: document.getElementById('custom-mines-range'),
    setupStartBtn: document.getElementById('setup-start-btn'),
    setupStartLabel: document.getElementById('setup-start-label'),
    setupResumeBtn: document.getElementById('setup-resume-btn'),
    setupGuideBtn: document.getElementById('setup-guide-btn'),
    heroBoardImg: document.getElementById('hero-board-img'),
    heroBoardFallback: document.getElementById('hero-board-fallback'),
    summaryBestBeginner: document.getElementById('summary-best-beginner'),
    summaryStatsBeginner: document.getElementById('summary-stats-beginner'),
    summaryBestIntermediate: document.getElementById('summary-best-intermediate'),
    summaryStatsIntermediate: document.getElementById('summary-stats-intermediate'),
    summaryBestExpert: document.getElementById('summary-best-expert'),
    summaryStatsExpert: document.getElementById('summary-stats-expert'),
    summaryOverallWinrate: document.getElementById('summary-overall-winrate'),
    summaryOverallTotals: document.getElementById('summary-overall-totals'),

    // Play elements
    playDiffBtns: Array.from(document.querySelectorAll('[data-play-diff]')),
    playSpecSummary: document.getElementById('play-spec-summary'),
    modeRevealBtn: document.getElementById('mode-reveal-btn'),
    modeFlagBtn: document.getElementById('mode-flag-btn'),
    hintBtn: document.getElementById('hint-btn'),
    hintCountLabel: document.getElementById('hint-count-label'),
    pauseBtn: document.getElementById('pause-btn'),
    pauseBtnIcon: document.getElementById('pause-btn-icon'),
    pauseBtnLabel: document.getElementById('pause-btn-label'),
    questionToggleBtn: document.getElementById('question-toggle-btn'),
    tilesizeToggleBtn: document.getElementById('tilesize-toggle-btn'),
    tilesizeToggleIcon: document.getElementById('tilesize-toggle-icon'),
    tilesizeToggleLabel: document.getElementById('tilesize-toggle-label'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    soundToggleIcon: document.getElementById('sound-toggle-icon'),
    soundToggleLabel: document.getElementById('sound-toggle-label'),
    hudFlagIcon: document.getElementById('hud-flag-icon'),
    hudRemainingMines: document.getElementById('hud-remaining-mines'),
    hudStatusRestartBtn: document.getElementById('hud-status-restart-btn'),
    hudReopenModalBtn: document.getElementById('hud-reopen-modal-btn'),
    hudProgressPercent: document.getElementById('hud-progress-percent'),
    hudElapsedTime: document.getElementById('hud-elapsed-time'),
    hintBanner: document.getElementById('hint-banner'),
    hintBannerText: document.getElementById('hint-banner-text'),
    boardArena: document.getElementById('board-arena'),
    minesweeperGrid: document.getElementById('minesweeper-grid'),
    pauseOverlay: document.getElementById('pause-overlay'),
    pauseResumeOverlayBtn: document.getElementById('pause-resume-overlay-btn'),
    endModalOverlay: document.getElementById('end-modal-overlay'),
    modalIconSlot: document.getElementById('modal-icon-slot'),
    modalKicker: document.getElementById('modal-kicker'),
    roundResultHeading: document.getElementById('round-result-heading'),
    modalCloseXBtn: document.getElementById('modal-close-x-btn'),
    modalTimeVal: document.getElementById('modal-time-val'),
    modalSafeVal: document.getElementById('modal-safe-val'),
    modal3bvVal: document.getElementById('modal-3bv-val'),
    modalEffVal: document.getElementById('modal-eff-val'),
    modalInspectBtn: document.getElementById('modal-inspect-btn'),
    modalPlayAgainBtn: document.getElementById('modal-play-again-btn'),

    // Records elements
    recordTabBtns: Array.from(document.querySelectorAll('[data-record-tab]')),
    recKpiPlayed: document.getElementById('rec-kpi-played'),
    recKpiWon: document.getElementById('rec-kpi-won'),
    recKpiWinrate: document.getElementById('rec-kpi-winrate'),
    recKpiStreak: document.getElementById('rec-kpi-streak'),
    recordsEmptyState: document.getElementById('records-empty-state'),
    recordsEmptyTitle: document.getElementById('records-empty-title'),
    recordsEmptyCtaBtn: document.getElementById('records-empty-cta-btn'),
    recordsEmptyCtaLabel: document.getElementById('records-empty-cta-label'),
    recordsTableWrapper: document.getElementById('records-table-wrapper'),
    recordsTbody: document.getElementById('records-tbody'),
    recordsResetFooter: document.getElementById('records-reset-footer'),
    recordsResetTriggerBtn: document.getElementById('records-reset-trigger-btn'),
    recordsResetConfirmBox: document.getElementById('records-reset-confirm-box'),
    recordsConfirmDeleteBtn: document.getElementById('records-confirm-delete-btn'),
    recordsCancelDeleteBtn: document.getElementById('records-cancel-delete-btn'),

    // Guide elements
    guidePlayBtn: document.getElementById('guide-play-btn'),
  };

  // ---------------------------------------------------------------------------
  // 7. Timer Management
  // ---------------------------------------------------------------------------
  function syncTimerSubscription() {
    const shouldRun = state.gameState === 'PLAYING' && state.minesPlaced;
    if (shouldRun && timerIntervalId === null) {
      lastTickTime = performance.now();
      timerIntervalId = window.setInterval(() => {
        const now = performance.now();
        const prev = lastTickTime ?? now;
        const delta = Math.max(0, now - prev);
        lastTickTime = now;
        state.elapsedMs = Math.min(9999900, state.elapsedMs + delta);
        el.hudElapsedTime.textContent = formatTimeMs(state.elapsedMs);
      }, 100);
    } else if (!shouldRun && timerIntervalId !== null) {
      window.clearInterval(timerIntervalId);
      timerIntervalId = null;
      lastTickTime = null;
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Core Actions & State Transitions
  // ---------------------------------------------------------------------------
  function clearHintHighlight() {
    state.hintHighlight = null;
    if (hintTimeoutId !== null) {
      window.clearTimeout(hintTimeoutId);
      hintTimeoutId = null;
    }
  }

  function initializeBoard(targetConfig, targetState = 'PLAYING') {
    clearHintHighlight();
    state.board = createEmptyBoard(targetConfig.rows, targetConfig.cols);
    state.minesPlaced = false;
    state.board3BV = 0;
    state.elapsedMs = 0;
    state.hintsRemaining = MAX_HINTS_PER_GAME;
    state.isNewBestRecord = false;
    state.showEndModal = false;
    state.chordPreviewCenter = null;
    state.focusedCell = [0, 0];
    state.gameState = targetState;
    syncTimerSubscription();
    renderAll();
  }

  function finalizeRound(won, finalTimeMs, computed3BV, usedHintsCount, diffKey) {
    state.stats = recordGameResult(diffKey, won);

    if (won) {
      soundEngine.playVictory();
      if (diffKey !== 'custom') {
        const { records, isNewBest } = saveRecord({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          difficulty: diffKey,
          timeMs: Math.max(100, Math.round(finalTimeMs)),
          dateIso: new Date().toISOString(),
          board3BV: computed3BV,
          hintsUsed: usedHintsCount,
        });
        state.records = records;
        state.isNewBestRecord = isNewBest;
      }
      state.gameState = 'ROUND_SUMMARY';
    } else {
      soundEngine.playExplosion();
      state.gameState = 'GAME_OVER';
    }

    state.showEndModal = true;
    state.chordPreviewCenter = null;
    syncTimerSubscription();
    renderAll();
  }

  function setNavSection(section) {
    state.activeSection = section;
    state.confirmResetRecords = false;
    if (section === 'PLAY' && state.gameState === 'TITLE_MENU') {
      state.gameState = 'PLAYING';
    }
    syncTimerSubscription();
    renderAll();
  }

  function handleCellContextAction(row, col) {
    if (state.gameState !== 'PLAYING') return;
    clearHintHighlight();

    const { board: nextBoard, placedFlag } = cycleCellMark(
      state.board,
      row,
      col,
      state.preferences.allowQuestionMarks
    );

    if (placedFlag !== null) {
      soundEngine.playFlag(placedFlag);
      state.board = nextBoard;
      renderPlayView();
      renderSetupView();
    }
  }

  function handleCellPrimaryAction(row, col) {
    if (state.gameState !== 'PLAYING') return;
    clearHintHighlight();

    const target = state.board[row] && state.board[row][col];
    if (!target) return;

    // Chording on an already revealed number cell
    if (target.state === 'revealed') {
      if (target.neighborMines > 0 && state.minesPlaced) {
        const outcome = chordCell(state.board, row, col);
        if (!outcome.triggered) return;

        state.board = outcome.board;
        const usedHints = MAX_HINTS_PER_GAME - state.hintsRemaining;

        if (outcome.hitMine) {
          finalizeRound(
            false,
            state.elapsedMs,
            state.board3BV,
            usedHints,
            state.difficulty
          );
        } else if (outcome.won) {
          finalizeRound(
            true,
            state.elapsedMs,
            state.board3BV,
            usedHints,
            state.difficulty
          );
        } else {
          if (outcome.newlyRevealedCount > 0) {
            soundEngine.playChord();
          }
          renderPlayView();
        }
      }
      return;
    }

    // In Flag input mode, primary click toggles flag/question mark
    if (state.inputMode === 'flag') {
      handleCellContextAction(row, col);
      return;
    }

    if (target.state === 'flagged') return;

    const activeCfg = getActiveConfig();
    let workingBoard = state.board;
    let current3BV = state.board3BV;

    if (!state.minesPlaced) {
      workingBoard = placeMinesWithSafeZone(
        state.board,
        activeCfg.mines,
        row,
        col
      );
      current3BV = calculate3BV(workingBoard);
      state.minesPlaced = true;
      state.board3BV = current3BV;
      syncTimerSubscription();
    }

    const outcome = revealCell(workingBoard, row, col);
    state.board = outcome.board;

    const usedHints = MAX_HINTS_PER_GAME - state.hintsRemaining;

    if (outcome.hitMine) {
      finalizeRound(
        false,
        state.elapsedMs,
        current3BV,
        usedHints,
        state.difficulty
      );
    } else if (outcome.won) {
      finalizeRound(
        true,
        state.elapsedMs,
        current3BV,
        usedHints,
        state.difficulty
      );
    } else {
      if (outcome.newlyRevealedCount > 0) {
        soundEngine.playReveal(outcome.newlyRevealedCount);
      }
      renderPlayView();
      renderSetupView();
    }
  }

  function handleUseHint() {
    if (state.gameState !== 'PLAYING' || state.hintsRemaining <= 0) return;

    const hint = findSmartHint(state.board, state.minesPlaced);
    if (!hint) return;

    state.hintsRemaining -= 1;
    soundEngine.playHint();

    const activeCfg = getActiveConfig();
    let workingBoard = state.board;
    let current3BV = state.board3BV;

    if (!state.minesPlaced) {
      workingBoard = placeMinesWithSafeZone(
        state.board,
        activeCfg.mines,
        hint.row,
        hint.col
      );
      current3BV = calculate3BV(workingBoard);
      state.minesPlaced = true;
      state.board3BV = current3BV;
      syncTimerSubscription();
    }

    if (hint.action === 'flag') {
      const nextBoard = cloneBoard(workingBoard);
      nextBoard[hint.row][hint.col].state = 'flagged';
      state.board = nextBoard;
    } else {
      const cleanedBoard = cloneBoard(workingBoard);
      if (cleanedBoard[hint.row][hint.col].state === 'flagged') {
        cleanedBoard[hint.row][hint.col].state = 'hidden';
      }
      const outcome = revealCell(cleanedBoard, hint.row, hint.col);
      state.board = outcome.board;

      if (outcome.won) {
        const usedHints = MAX_HINTS_PER_GAME - state.hintsRemaining;
        finalizeRound(
          true,
          state.elapsedMs,
          current3BV,
          usedHints,
          state.difficulty
        );
        return;
      }
    }

    state.hintHighlight = {
      row: hint.row,
      col: hint.col,
      reason: hint.reason,
    };

    if (hintTimeoutId !== null) {
      window.clearTimeout(hintTimeoutId);
    }
    hintTimeoutId = window.setTimeout(() => {
      state.hintHighlight = null;
      renderPlayView();
    }, 3200);

    renderPlayView();
    renderSetupView();
  }

  function handleTogglePause() {
    if (!state.minesPlaced) return;
    if (state.gameState === 'PLAYING') {
      state.gameState = 'PAUSED';
    } else if (state.gameState === 'PAUSED') {
      state.gameState = 'PLAYING';
    }
    syncTimerSubscription();
    renderPlayView();
  }

  function updatePreferences(partial) {
    state.preferences = { ...state.preferences, ...partial };
    soundEngine.setEnabled(state.preferences.soundEnabled);
    savePreferences(state.preferences);
    renderPlayView();
  }

  // ---------------------------------------------------------------------------
  // 9. DOM Rendering Functions
  // ---------------------------------------------------------------------------
  function renderNavigation() {
    // Desktop Nav
    el.desktopNavBtns.forEach((btn) => {
      const key = btn.getAttribute('data-nav');
      const isActive = state.activeSection === key;
      btn.className = isActive
        ? 'relative py-1 transition-colors whitespace-nowrap shrink-0 text-slate-100 underline decoration-amber-400 decoration-2 underline-offset-8'
        : 'relative py-1 transition-colors whitespace-nowrap shrink-0 text-slate-400 hover:text-slate-100 hover:underline hover:decoration-slate-600 hover:underline-offset-8';
    });

    // Mobile Nav
    el.mobileNavBtns.forEach((btn) => {
      const key = btn.getAttribute('data-mobile-nav');
      const isActive = state.activeSection === key;
      btn.className = isActive
        ? 'rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 bg-slate-800 text-amber-400'
        : 'rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 text-slate-400 hover:text-slate-200';
    });

    // Section visibility
    el.sectionSetup.classList.toggle('hidden', state.activeSection !== 'SETUP');
    el.sectionPlay.classList.toggle('hidden', state.activeSection !== 'PLAY');
    el.sectionRecords.classList.toggle('hidden', state.activeSection !== 'RECORDS');
    el.sectionGuide.classList.toggle('hidden', state.activeSection !== 'GUIDE');
  }

  function getBestTimeForDiff(diffKey) {
    if (diffKey === 'custom') return null;
    const filtered = state.records.filter((r) => r.difficulty === diffKey);
    if (filtered.length === 0) return null;
    return Math.min(...filtered.map((r) => r.timeMs));
  }

  function renderSetupView() {
    const activeCfg = getActiveConfig();
    const totalCells = activeCfg.rows * activeCfg.cols;
    const densityPercent = ((activeCfg.mines / totalCells) * 100).toFixed(1);

    el.setupSpecSummary.textContent = `${activeCfg.cols} × ${activeCfg.rows} 격자 · 지뢰 ${activeCfg.mines}개 · 밀도 ${densityPercent}%`;
    el.setupCustomDimLabel.textContent = `${state.customConfig.cols}×${state.customConfig.rows}`;
    el.setupDiffSubtitle.textContent = activeCfg.subtitle;
    el.setupStartLabel.textContent = `${activeCfg.label} 게임 시작`;

    el.setupDiffBtns.forEach((btn) => {
      const key = btn.getAttribute('data-setup-diff');
      const isSelected = state.difficulty === key;
      btn.setAttribute('aria-checked', String(isSelected));
      btn.className = isSelected
        ? 'flex items-center justify-between gap-2 rounded-lg bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-amber-400 shadow-sm transition-colors duration-150 whitespace-nowrap shrink-0'
        : 'flex items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-slate-800/50 hover:text-slate-100 whitespace-nowrap shrink-0';
    });

    const isCustom = state.difficulty === 'custom';
    el.setupCustomPanel.classList.toggle('hidden', !isCustom);
    el.setupCustomPanel.classList.toggle('grid', isCustom);

    const maxCustomMines = Math.max(
      5,
      Math.min(
        200,
        Math.floor(state.customConfig.rows * state.customConfig.cols * 0.35)
      )
    );
    el.customColsVal.textContent = String(state.customConfig.cols);
    el.customColsRange.value = String(state.customConfig.cols);
    el.customRowsVal.textContent = String(state.customConfig.rows);
    el.customRowsRange.value = String(state.customConfig.rows);
    el.customMinesMaxLabel.textContent = `지뢰 수 (5–${maxCustomMines})`;
    el.customMinesRange.max = String(maxCustomMines);
    el.customMinesVal.textContent = String(state.customConfig.mines);
    el.customMinesRange.value = String(state.customConfig.mines);

    const hasActiveGame =
      state.minesPlaced &&
      (state.gameState === 'PLAYING' || state.gameState === 'PAUSED');
    el.setupResumeBtn.classList.toggle('hidden', !hasActiveGame);
    el.setupResumeBtn.classList.toggle('inline-flex', hasActiveGame);

    // 4-Column Best Records Strip
    const bestBeg = getBestTimeForDiff('beginner');
    const bestInt = getBestTimeForDiff('intermediate');
    const bestExp = getBestTimeForDiff('expert');

    el.summaryBestBeginner.textContent =
      bestBeg !== null ? formatTimeMs(bestBeg) : '기록 없음';
    el.summaryStatsBeginner.textContent = `클리어 ${state.stats.beginner.won}회 · 도전 ${state.stats.beginner.played}회`;

    el.summaryBestIntermediate.textContent =
      bestInt !== null ? formatTimeMs(bestInt) : '기록 없음';
    el.summaryStatsIntermediate.textContent = `클리어 ${state.stats.intermediate.won}회 · 도전 ${state.stats.intermediate.played}회`;

    el.summaryBestExpert.textContent =
      bestExp !== null ? formatTimeMs(bestExp) : '기록 없음';
    el.summaryStatsExpert.textContent = `클리어 ${state.stats.expert.won}회 · 도전 ${state.stats.expert.played}회`;

    const totalPlayed =
      state.stats.beginner.played +
      state.stats.intermediate.played +
      state.stats.expert.played +
      state.stats.custom.played;
    const totalWon =
      state.stats.beginner.won +
      state.stats.intermediate.won +
      state.stats.expert.won +
      state.stats.custom.won;
    const overallWinRate =
      totalPlayed > 0 ? `${Math.round((totalWon / totalPlayed) * 100)}%` : '0%';
    const maxStreak = Math.max(
      state.stats.beginner.bestStreak,
      state.stats.intermediate.bestStreak,
      state.stats.expert.bestStreak,
      state.stats.custom.bestStreak
    );

    el.summaryOverallWinrate.textContent = overallWinRate;
    el.summaryOverallTotals.textContent = `총 ${totalPlayed}게임 · 최고 ${maxStreak}연승`;
  }

  function getTileSizeClass(cols) {
    if (state.preferences.largeTiles) {
      if (cols <= 10) return 'w-[52px] h-[52px] text-lg';
      return 'w-11 h-11 text-base';
    }
    if (cols <= 10) return 'w-11 h-11 text-base';
    if (cols <= 18) return 'w-[42px] h-[42px] text-[15px]';
    return 'w-10 h-10 text-sm';
  }

  function ensureGridSkeleton(rows, cols) {
    if (renderedGridDims.rows === rows && renderedGridDims.cols === cols) {
      return;
    }

    el.minesweeperGrid.innerHTML = '';
    el.minesweeperGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    gridElements = [];

    const fragment = document.createDocumentFragment();

    for (let r = 0; r < rows; r++) {
      const rowBtns = [];
      for (let c = 0; c < cols; c++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.row = String(r);
        btn.dataset.col = String(c);
        rowBtns.push(btn);
        fragment.appendChild(btn);
      }
      gridElements.push(rowBtns);
    }

    el.minesweeperGrid.appendChild(fragment);
    renderedGridDims = { rows, cols };
  }

  function syncGridCellsDOM() {
    const rows = state.board.length;
    const cols = state.board[0] ? state.board[0].length : 0;
    const activeCfg = getActiveConfig();
    ensureGridSkeleton(rows, cols);

    el.minesweeperGrid.setAttribute(
      'aria-label',
      `${activeCfg.label} 지뢰찾기 보드 (${cols}열 ${rows}행)`
    );

    const isPaused = state.gameState === 'PAUSED';
    el.minesweeperGrid.classList.toggle('opacity-10', isPaused);
    el.minesweeperGrid.classList.toggle('pointer-events-none', isPaused);
    el.minesweeperGrid.classList.toggle('opacity-100', !isPaused);

    const chordPreviewSet = new Set();
    if (state.chordPreviewCenter && state.gameState === 'PLAYING') {
      const [cr, cc] = state.chordPreviewCenter;
      const centerCell = state.board[cr] && state.board[cr][cc];
      if (
        centerCell &&
        centerCell.state === 'revealed' &&
        centerCell.neighborMines > 0
      ) {
        const neighbors = getNeighbors(state.board, cr, cc);
        for (let i = 0; i < neighbors.length; i++) {
          const n = neighbors[i];
          if (n.state === 'hidden' || n.state === 'question') {
            chordPreviewSet.add(`${n.row}-${n.col}`);
          }
        }
      }
    }

    const tileSizeClass = getTileSizeClass(cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = state.board[r][c];
        const btn = gridElements[r][c];

        const isRevealed = cell.state === 'revealed';
        const isFlagged = cell.state === 'flagged';
        const isQuestion = cell.state === 'question';
        const isChordPressed = chordPreviewSet.has(`${r}-${c}`);
        const isHinted =
          state.hintHighlight &&
          state.hintHighlight.row === r &&
          state.hintHighlight.col === c;
        const isKeyboardTarget =
          state.focusedCell[0] === r && state.focusedCell[1] === c;

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

        let ariaLabel = `${r + 1}행 ${c + 1}열, `;
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

        const nextClassName = [
          'relative flex items-center justify-center rounded-[4px] font-mono font-bold leading-none select-none',
          tileSizeClass,
          surfaceClass,
          isChordPressed ? 'tile-pressed !bg-slate-800' : '',
          isHinted
            ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 z-10'
            : '',
        ]
          .filter(Boolean)
          .join(' ');

        if (btn.className !== nextClassName) {
          btn.className = nextClassName;
        }

        btn.tabIndex = isKeyboardTarget ? 0 : -1;
        btn.setAttribute('aria-label', ariaLabel);

        let innerMarkup = '';
        if (isRevealed) {
          if (cell.isMine) {
            innerMarkup = ICONS.bomb;
          } else if (cell.neighborMines > 0) {
            const colorCls =
              NUMBER_COLOR_CLASSES[cell.neighborMines] || 'text-slate-100';
            innerMarkup = `<span class="tabular-nums ${colorCls}">${cell.neighborMines}</span>`;
          }
        } else if (cell.wrongFlag) {
          innerMarkup = ICONS.wrongFlag;
        } else if (isFlagged) {
          innerMarkup = ICONS.flagFilled;
        } else if (isQuestion) {
          innerMarkup = `<span class="text-sm font-bold text-slate-300">?</span>`;
        }

        if (btn.dataset.renderedState !== innerMarkup) {
          btn.innerHTML = innerMarkup;
          btn.dataset.renderedState = innerMarkup;
        }
      }
    }
  }

  function renderPlayView() {
    const activeCfg = getActiveConfig();
    const rows = state.board.length;
    const cols = state.board[0] ? state.board[0].length : 0;
    const flagCount = countFlags(state.board);
    const revealedSafeCount = countRevealedSafeCells(state.board);
    const totalSafeCells = Math.max(1, rows * cols - activeCfg.mines);
    const progressPercent = Math.min(
      100,
      Math.round((revealedSafeCount / totalSafeCells) * 100)
    );
    const remainingMines = activeCfg.mines - flagCount;

    const isFinished =
      state.gameState === 'ROUND_SUMMARY' || state.gameState === 'GAME_OVER';
    const isPaused = state.gameState === 'PAUSED';

    // Difficulty Switcher
    el.playDiffBtns.forEach((btn) => {
      const key = btn.getAttribute('data-play-diff');
      const active = state.difficulty === key;
      btn.className = active
        ? 'rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors whitespace-nowrap shrink-0'
        : 'rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-100 whitespace-nowrap shrink-0';
    });

    const bestForDiff = getBestTimeForDiff(state.difficulty);
    el.playSpecSummary.textContent =
      `${activeCfg.cols}×${activeCfg.rows} · 지뢰 ${activeCfg.mines}개` +
      (bestForDiff !== null ? ` · 최고 ${formatTimeMs(bestForDiff)}` : '');

    // Input Mode Switch
    el.modeRevealBtn.className =
      state.inputMode === 'reveal'
        ? 'inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0'
        : 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 whitespace-nowrap shrink-0';

    el.modeFlagBtn.className =
      state.inputMode === 'flag'
        ? 'inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition-colors whitespace-nowrap shrink-0'
        : 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 whitespace-nowrap shrink-0';

    // Hint Button
    el.hintCountLabel.textContent = `안전 힌트 (${state.hintsRemaining})`;
    el.hintBtn.disabled = state.hintsRemaining <= 0 || isFinished || isPaused;

    // Pause Button
    el.pauseBtn.disabled = !state.minesPlaced || isFinished;
    el.pauseBtnIcon.innerHTML = isPaused ? ICONS.playEmeraldSm : ICONS.pauseSm;
    el.pauseBtnLabel.textContent = isPaused ? '계속하기' : '일시정지';

    // Question Mark Toggle
    el.questionToggleBtn.setAttribute(
      'aria-pressed',
      String(state.preferences.allowQuestionMarks)
    );
    el.questionToggleBtn.className = state.preferences.allowQuestionMarks
      ? 'inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-xs font-medium text-amber-300 transition-colors whitespace-nowrap shrink-0'
      : 'inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 whitespace-nowrap shrink-0';

    // Large Tiles Toggle
    el.tilesizeToggleBtn.setAttribute(
      'aria-pressed',
      String(state.preferences.largeTiles)
    );
    el.tilesizeToggleIcon.innerHTML = state.preferences.largeTiles
      ? ICONS.minimizeSm
      : ICONS.maximizeSm;
    el.tilesizeToggleLabel.textContent = state.preferences.largeTiles
      ? '표준 크기'
      : '크게 보기';

    // Sound Toggle
    el.soundToggleBtn.setAttribute(
      'aria-pressed',
      String(state.preferences.soundEnabled)
    );
    el.soundToggleBtn.setAttribute(
      'aria-label',
      state.preferences.soundEnabled ? '효과음 끄기' : '효과음 켜기'
    );
    el.soundToggleIcon.innerHTML = state.preferences.soundEnabled
      ? ICONS.volumeOnSm
      : ICONS.volumeOffSm;
    el.soundToggleLabel.textContent = state.preferences.soundEnabled
      ? '효과음'
      : '음소거';

    // HUD Counters
    el.hudFlagIcon.setAttribute(
      'class',
      `h-4 w-4 shrink-0 ${remainingMines < 0 ? 'text-red-400' : 'text-amber-400'}`
    );
    el.hudRemainingMines.textContent = String(remainingMines);
    el.hudRemainingMines.className = `font-mono text-lg font-bold leading-none tabular-nums ${
      remainingMines < 0 ? 'text-red-400' : 'text-slate-100'
    }`;

    if (state.gameState === 'ROUND_SUMMARY') {
      el.hudStatusRestartBtn.className =
        'inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 whitespace-nowrap shrink-0';
      el.hudStatusRestartBtn.innerHTML = `${ICONS.checkCircleSm}<span>탐색 성공 · 다시 플레이</span>`;
    } else if (state.gameState === 'GAME_OVER') {
      el.hudStatusRestartBtn.className =
        'inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/25 whitespace-nowrap shrink-0';
      el.hudStatusRestartBtn.innerHTML = `${ICONS.alertTriangleSm}<span>지뢰 폭발 · 다시 플레이</span>`;
    } else {
      el.hudStatusRestartBtn.className =
        'inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 whitespace-nowrap shrink-0';
      const statusLabel = !state.minesPlaced
        ? '첫 클릭 대기 · 새 보드'
        : '진행 중 · 재시작 (R)';
      el.hudStatusRestartBtn.innerHTML = `${ICONS.rotateAmberSm}<span>${statusLabel}</span>`;
    }

    el.hudReopenModalBtn.classList.toggle(
      'hidden',
      !(isFinished && !state.showEndModal)
    );
    el.hudProgressPercent.textContent = `${progressPercent}%`;
    el.hudElapsedTime.textContent = formatTimeMs(state.elapsedMs);

    // Hint Banner
    if (state.hintHighlight) {
      el.hintBanner.classList.remove('hidden');
      el.hintBannerText.textContent = `힌트 안내 · ${state.hintHighlight.reason}`;
    } else {
      el.hintBanner.classList.add('hidden');
    }

    // Pause Overlay
    el.pauseOverlay.classList.toggle('hidden', !isPaused);
    el.pauseOverlay.classList.toggle('flex', isPaused);

    // End Modal Overlay
    const showModal = isFinished && state.showEndModal;
    el.endModalOverlay.classList.toggle('hidden', !showModal);
    el.endModalOverlay.classList.toggle('flex', showModal);

    if (showModal) {
      el.modalIconSlot.innerHTML =
        state.gameState === 'ROUND_SUMMARY' ? ICONS.trophyLg : ICONS.bombRedLg;
      el.modalKicker.textContent =
        `${activeCfg.label} (${activeCfg.cols}×${activeCfg.rows})` +
        (state.isNewBestRecord ? ' · 개인 최고 신기록 달성' : '');
      el.roundResultHeading.textContent =
        state.gameState === 'ROUND_SUMMARY'
          ? '모든 지뢰 해체 완료!'
          : '지뢰가 폭발했습니다';
      el.modalTimeVal.textContent = formatTimeMs(state.elapsedMs);
      el.modalSafeVal.textContent = `${revealedSafeCount} / ${totalSafeCells}`;
      el.modal3bvVal.textContent = state.minesPlaced
        ? String(state.board3BV)
        : '-';
      const elapsedSeconds = Math.max(0.1, state.elapsedMs / 1000);
      const eff = state.minesPlaced
        ? (state.board3BV / elapsedSeconds).toFixed(2)
        : '0.00';
      el.modalEffVal.textContent = `${eff} /s`;
    }

    // Board Grid Cells
    syncGridCellsDOM();
  }

  function renderRecordsView() {
    const tabKey = state.selectedRecordTab;
    const preset = DIFFICULTY_PRESETS[tabKey];

    el.recordTabBtns.forEach((btn) => {
      const key = btn.getAttribute('data-record-tab');
      const active = tabKey === key;
      btn.className = active
        ? 'rounded-md bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-amber-400 transition-colors whitespace-nowrap shrink-0'
        : 'rounded-md px-3.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-100 whitespace-nowrap shrink-0';
    });

    const curStats = state.stats[tabKey];
    const winRate =
      curStats.played > 0
        ? `${Math.round((curStats.won / curStats.played) * 100)}%`
        : '0%';

    el.recKpiPlayed.textContent = `${curStats.played}회`;
    el.recKpiWon.textContent = `${curStats.won}회`;
    el.recKpiWinrate.textContent = winRate;
    el.recKpiStreak.textContent = `${curStats.currentStreak} / ${curStats.bestStreak}연승`;

    const filteredRecords = state.records
      .filter((r) => r.difficulty === tabKey)
      .sort((a, b) => a.timeMs - b.timeMs);

    if (filteredRecords.length === 0) {
      el.recordsEmptyState.classList.remove('hidden');
      el.recordsEmptyState.classList.add('flex');
      el.recordsTableWrapper.classList.add('hidden');
      el.recordsEmptyTitle.textContent = `아직 ${preset.label} 난이도 클리어 기록이 없습니다`;
      el.recordsEmptyCtaLabel.textContent = `${preset.label} 도전 시작`;
    } else {
      el.recordsEmptyState.classList.add('hidden');
      el.recordsEmptyState.classList.remove('flex');
      el.recordsTableWrapper.classList.remove('hidden');

      el.recordsTbody.innerHTML = filteredRecords
        .map((rec, index) => {
          const seconds = Math.max(0.1, rec.timeMs / 1000);
          const eff = (rec.board3BV / seconds).toFixed(2);
          const modeLabel =
            rec.hintsUsed === 0
              ? '무힌트 정석 클리어'
              : `힌트 ${rec.hintsUsed}회 사용`;
          return `
            <tr class="transition-colors hover:bg-slate-800/35">
              <td class="px-5 py-3.5 font-mono font-semibold text-slate-200 tabular-nums">${index + 1}위</td>
              <td class="px-5 py-3.5 font-mono font-bold text-amber-400 tabular-nums">${formatTimeMs(rec.timeMs)}</td>
              <td class="px-5 py-3.5 font-mono text-slate-300 tabular-nums">${rec.board3BV}</td>
              <td class="px-5 py-3.5 font-mono text-slate-300 tabular-nums">${eff} /s</td>
              <td class="px-5 py-3.5 text-xs text-slate-400">${modeLabel}</td>
              <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400 tabular-nums">${formatDateIso(rec.dateIso)}</td>
            </tr>
          `;
        })
        .join('');
    }

    const totalAnyPlayed =
      state.stats.beginner.played +
      state.stats.intermediate.played +
      state.stats.expert.played +
      state.stats.custom.played;
    const hasAnyData = state.records.length > 0 || totalAnyPlayed > 0;

    el.recordsResetFooter.classList.toggle('hidden', !hasAnyData);
    el.recordsResetFooter.classList.toggle('flex', hasAnyData);

    el.recordsResetTriggerBtn.classList.toggle(
      'hidden',
      state.confirmResetRecords
    );
    el.recordsResetConfirmBox.classList.toggle(
      'hidden',
      !state.confirmResetRecords
    );
    el.recordsResetConfirmBox.classList.toggle(
      'flex',
      state.confirmResetRecords
    );
  }

  function renderAll() {
    renderNavigation();
    renderSetupView();
    renderPlayView();
    renderRecordsView();
  }

  // ---------------------------------------------------------------------------
  // 10. Event Listeners Wiring
  // ---------------------------------------------------------------------------
  function bindEvents() {
    // Resilient Hero Image Fallback
    if (el.heroBoardImg) {
      el.heroBoardImg.addEventListener('error', () => {
        el.heroBoardImg.classList.add('hidden');
        el.heroBoardFallback.classList.remove('hidden');
        el.heroBoardFallback.classList.add('flex');
      });
    }

    // Header & Navigation
    el.brandBtn.addEventListener('click', () => setNavSection('SETUP'));
    el.headerNewGameBtn.addEventListener('click', () => {
      initializeBoard(getActiveConfig(), 'PLAYING');
      setNavSection('PLAY');
    });

    el.desktopNavBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        setNavSection(btn.getAttribute('data-nav'));
      });
    });

    el.mobileNavBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        setNavSection(btn.getAttribute('data-mobile-nav'));
      });
    });

    el.footerNavBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        setNavSection(btn.getAttribute('data-footer-nav'));
      });
    });

    // Setup Difficulty Selection & Custom Sliders
    el.setupDiffBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextKey = btn.getAttribute('data-setup-diff');
        state.difficulty = nextKey;
        const cfg =
          nextKey === 'custom'
            ? state.customConfig
            : DIFFICULTY_PRESETS[nextKey];
        initializeBoard(cfg, 'TITLE_MENU');
      });
    });

    const handleCustomSliderInput = (field, rawValue) => {
      let nextRows = state.customConfig.rows;
      let nextCols = state.customConfig.cols;
      let nextMines = state.customConfig.mines;

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

      state.customConfig = {
        ...state.customConfig,
        rows: nextRows,
        cols: nextCols,
        mines: nextMines,
      };

      if (state.difficulty === 'custom') {
        initializeBoard(state.customConfig, 'TITLE_MENU');
      } else {
        renderSetupView();
      }
    };

    el.customColsRange.addEventListener('input', (e) => {
      handleCustomSliderInput('cols', Number(e.target.value));
    });
    el.customRowsRange.addEventListener('input', (e) => {
      handleCustomSliderInput('rows', Number(e.target.value));
    });
    el.customMinesRange.addEventListener('input', (e) => {
      handleCustomSliderInput('mines', Number(e.target.value));
    });

    el.setupStartBtn.addEventListener('click', () => {
      initializeBoard(getActiveConfig(), 'PLAYING');
      setNavSection('PLAY');
    });

    el.setupResumeBtn.addEventListener('click', () => {
      setNavSection('PLAY');
    });

    el.setupGuideBtn.addEventListener('click', () => {
      setNavSection('GUIDE');
    });

    // Play Toolbar Controls
    el.playDiffBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-play-diff');
        if (key === 'custom' && state.difficulty === 'custom') {
          setNavSection('SETUP');
          return;
        }
        state.difficulty = key;
        const cfg =
          key === 'custom' ? state.customConfig : DIFFICULTY_PRESETS[key];
        initializeBoard(cfg, 'PLAYING');
      });
    });

    el.modeRevealBtn.addEventListener('click', () => {
      state.inputMode = 'reveal';
      renderPlayView();
    });

    el.modeFlagBtn.addEventListener('click', () => {
      state.inputMode = 'flag';
      renderPlayView();
    });

    el.hintBtn.addEventListener('click', handleUseHint);
    el.pauseBtn.addEventListener('click', handleTogglePause);
    el.pauseResumeOverlayBtn.addEventListener('click', handleTogglePause);

    el.questionToggleBtn.addEventListener('click', () => {
      updatePreferences({
        allowQuestionMarks: !state.preferences.allowQuestionMarks,
      });
    });

    el.tilesizeToggleBtn.addEventListener('click', () => {
      updatePreferences({
        largeTiles: !state.preferences.largeTiles,
      });
    });

    el.soundToggleBtn.addEventListener('click', () => {
      updatePreferences({
        soundEnabled: !state.preferences.soundEnabled,
      });
    });

    el.hudStatusRestartBtn.addEventListener('click', () => {
      initializeBoard(getActiveConfig(), 'PLAYING');
    });

    el.hudReopenModalBtn.addEventListener('click', () => {
      state.showEndModal = true;
      renderPlayView();
    });

    el.modalCloseXBtn.addEventListener('click', () => {
      state.showEndModal = false;
      renderPlayView();
    });

    el.modalInspectBtn.addEventListener('click', () => {
      state.showEndModal = false;
      renderPlayView();
    });

    el.modalPlayAgainBtn.addEventListener('click', () => {
      initializeBoard(getActiveConfig(), 'PLAYING');
    });

    // Board Arena Event Delegation (Mouse, Touch Long-Press, Keyboard)
    el.boardArena.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    const getCellTargetCoords = (eventTarget) => {
      const btn =
        eventTarget instanceof Element
          ? eventTarget.closest('button[data-row]')
          : null;
      if (!btn) return null;
      return {
        btn,
        row: Number(btn.dataset.row),
        col: Number(btn.dataset.col),
      };
    };

    el.minesweeperGrid.addEventListener('pointerdown', (e) => {
      const info = getCellTargetCoords(e.target);
      if (!info) return;
      const { row, col } = info;

      const isFinished =
        state.gameState === 'ROUND_SUMMARY' || state.gameState === 'GAME_OVER';
      const isPaused = state.gameState === 'PAUSED';
      if (isFinished || isPaused) return;

      state.focusedCell = [row, col];
      const cell = state.board[row] && state.board[row][col];
      if (!cell) return;

      if (e.pointerType === 'touch') {
        longPressFired = false;
        pointerStartPos = { x: e.clientX, y: e.clientY };
        if (cell.state !== 'revealed') {
          if (longPressTimerId !== null) {
            window.clearTimeout(longPressTimerId);
          }
          longPressTimerId = window.setTimeout(() => {
            longPressFired = true;
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(15);
            }
            handleCellContextAction(row, col);
          }, 320);
        }
        return;
      }

      if (e.button === 0 && cell.state === 'revealed' && cell.neighborMines > 0) {
        state.chordPreviewCenter = [row, col];
        syncGridCellsDOM();
      }
    });

    el.minesweeperGrid.addEventListener('pointermove', (e) => {
      if (
        e.pointerType === 'touch' &&
        pointerStartPos &&
        longPressTimerId !== null
      ) {
        const dx = Math.abs(e.clientX - pointerStartPos.x);
        const dy = Math.abs(e.clientY - pointerStartPos.y);
        if (dx > 10 || dy > 10) {
          window.clearTimeout(longPressTimerId);
          longPressTimerId = null;
        }
      }
    });

    const clearGlobalPointerState = () => {
      if (state.chordPreviewCenter !== null) {
        state.chordPreviewCenter = null;
        if (state.activeSection === 'PLAY') {
          syncGridCellsDOM();
        }
      }
      if (longPressTimerId !== null) {
        window.clearTimeout(longPressTimerId);
        longPressTimerId = null;
      }
    };

    window.addEventListener('pointerup', clearGlobalPointerState);
    window.addEventListener('pointercancel', clearGlobalPointerState);

    el.minesweeperGrid.addEventListener('click', (e) => {
      const info = getCellTargetCoords(e.target);
      if (!info) return;

      if (longPressFired) {
        longPressFired = false;
        return;
      }
      if (longPressTimerId !== null) {
        window.clearTimeout(longPressTimerId);
        longPressTimerId = null;
      }

      const isFinished =
        state.gameState === 'ROUND_SUMMARY' || state.gameState === 'GAME_OVER';
      const isPaused = state.gameState === 'PAUSED';
      if (isFinished || isPaused) return;

      handleCellPrimaryAction(info.row, info.col);
    });

    el.minesweeperGrid.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const info = getCellTargetCoords(e.target);
      if (!info || longPressFired) return;

      const isFinished =
        state.gameState === 'ROUND_SUMMARY' || state.gameState === 'GAME_OVER';
      const isPaused = state.gameState === 'PAUSED';
      if (isFinished || isPaused) return;

      handleCellContextAction(info.row, info.col);
    });

    el.minesweeperGrid.addEventListener('keydown', (e) => {
      const info = getCellTargetCoords(e.target);
      if (!info) return;
      const { row, col } = info;
      const rows = state.board.length;
      const cols = state.board[0] ? state.board[0].length : 0;

      const isFinished =
        state.gameState === 'ROUND_SUMMARY' || state.gameState === 'GAME_OVER';
      const isPaused = state.gameState === 'PAUSED';

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
          handleCellContextAction(row, col);
        }
        return;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isFinished && !isPaused) {
          handleCellPrimaryAction(row, col);
        }
        return;
      }

      if (moved) {
        e.preventDefault();
        state.focusedCell = [nextRow, nextCol];
        syncGridCellsDOM();
        const nextBtn = gridElements[nextRow] && gridElements[nextRow][nextCol];
        if (nextBtn) nextBtn.focus();
      }
    });

    // Global Keyboard Shortcuts (R to restart, P to pause/resume)
    window.addEventListener('keydown', (e) => {
      if (state.activeSection !== 'PLAY') return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        initializeBoard(getActiveConfig(), 'PLAYING');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handleTogglePause();
      }
    });

    // Records View Controls
    el.recordTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedRecordTab = btn.getAttribute('data-record-tab');
        state.confirmResetRecords = false;
        renderRecordsView();
      });
    });

    el.recordsEmptyCtaBtn.addEventListener('click', () => {
      state.difficulty = state.selectedRecordTab;
      initializeBoard(DIFFICULTY_PRESETS[state.selectedRecordTab], 'PLAYING');
      setNavSection('PLAY');
    });

    el.recordsResetTriggerBtn.addEventListener('click', () => {
      state.confirmResetRecords = true;
      renderRecordsView();
    });

    el.recordsCancelDeleteBtn.addEventListener('click', () => {
      state.confirmResetRecords = false;
      renderRecordsView();
    });

    el.recordsConfirmDeleteBtn.addEventListener('click', () => {
      const cleared = clearAllRecordsAndStats();
      state.records = cleared.records;
      state.stats = cleared.stats;
      state.confirmResetRecords = false;
      renderRecordsView();
      renderSetupView();
      renderPlayView();
    });

    // Guide View Controls
    el.guidePlayBtn.addEventListener('click', () => {
      setNavSection('PLAY');
    });
  }

  // ---------------------------------------------------------------------------
  // 11. Bootstrap
  // ---------------------------------------------------------------------------
  soundEngine.setEnabled(state.preferences.soundEnabled);
  bindEvents();
  renderAll();
})();
