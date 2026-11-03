import { CellData } from '../types/minesweeper';

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export function createEmptyBoard(rows: number, cols: number): CellData[][] {
  const board: CellData[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        neighborMines: 0,
        state: 'hidden',
      });
    }
    board.push(row);
  }
  return board;
}

export function cloneBoard(board: CellData[][]): CellData[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function getNeighbors(
  board: CellData[][],
  row: number,
  col: number
): CellData[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const result: CellData[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      result.push(board[nr][nc]);
    }
  }
  return result;
}

/**
 * Places mines guaranteeing that `(safeRow, safeCol)` (and its 3x3 neighborhood
 * whenever total cells allow) is completely mine-free for a smooth opening cascade.
 */
export function placeMinesWithSafeZone(
  initialBoard: CellData[][],
  mines: number,
  safeRow: number,
  safeCol: number
): CellData[][] {
  const board = cloneBoard(initialBoard);
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const maxPossibleMines = Math.max(1, rows * cols - 1);
  const targetMines = Math.min(mines, maxPossibleMines);

  const outerCandidates: Array<[number, number]> = [];
  const innerRingCandidates: Array<[number, number]> = [];

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

  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  let chosen: Array<[number, number]>;
  if (outerCandidates.length >= targetMines) {
    chosen = shuffle(outerCandidates).slice(0, targetMines);
  } else {
    const remainingNeeded = targetMines - outerCandidates.length;
    chosen = [
      ...outerCandidates,
      ...shuffle(innerRingCandidates).slice(0, remainingNeeded),
    ];
  }

  for (const [mr, mc] of chosen) {
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

/**
 * Computes Bechtel's Board Benchmark Value (3BV):
 * Minimum number of left-clicks theoretically required to solve the board without flags.
 */
export function calculate3BV(board: CellData[][]): number {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  let clicks = 0;

  // 1. Count connected components of 0-value non-mine cells (and mark their frontier)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isMine && cell.neighborMines === 0 && !visited[r][c]) {
        clicks++;
        const queue: Array<[number, number]> = [[r, c]];
        visited[r][c] = true;

        while (queue.length > 0) {
          const [cr, cc] = queue.shift()!;
          for (const neighbor of getNeighbors(board, cr, cc)) {
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

  // 2. Count remaining isolated non-mine number cells not opened by any 0-cascade
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine && !visited[r][c]) {
        clicks++;
      }
    }
  }

  return Math.max(1, clicks);
}

export function checkVictory(board: CellData[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && cell.state !== 'revealed') {
        return false;
      }
    }
  }
  return true;
}

export function autoFlagRemainingMinesOnWin(board: CellData[][]): CellData[][] {
  return board.map((row) =>
    row.map((cell) => {
      if (cell.isMine && cell.state !== 'flagged') {
        return { ...cell, state: 'flagged' };
      }
      return cell;
    })
  );
}

export function revealBoardOnLoss(
  board: CellData[][],
  explodedCoords: Array<[number, number]>
): CellData[][] {
  const explodedSet = new Set(explodedCoords.map(([r, c]) => `${r}-${c}`));

  return board.map((row) =>
    row.map((cell) => {
      const key = `${cell.row}-${cell.col}`;
      if (explodedSet.has(key)) {
        return {
          ...cell,
          state: 'revealed',
          exploded: true,
        };
      }
      if (cell.isMine && cell.state !== 'flagged') {
        return {
          ...cell,
          state: 'revealed',
        };
      }
      if (!cell.isMine && cell.state === 'flagged') {
        return {
          ...cell,
          wrongFlag: true,
        };
      }
      return cell;
    })
  );
}

export interface RevealOutcome {
  board: CellData[][];
  hitMine: boolean;
  newlyRevealedCount: number;
  won: boolean;
}

export function revealCell(
  currentBoard: CellData[][],
  row: number,
  col: number
): RevealOutcome {
  const target = currentBoard[row]?.[col];
  if (!target || target.state === 'revealed' || target.state === 'flagged') {
    return {
      board: currentBoard,
      hitMine: false,
      newlyRevealedCount: 0,
      won: false,
    };
  }

  if (target.isMine) {
    const lostBoard = revealBoardOnLoss(currentBoard, [[row, col]]);
    return {
      board: lostBoard,
      hitMine: true,
      newlyRevealedCount: 1,
      won: false,
    };
  }

  const nextBoard = cloneBoard(currentBoard);
  let newlyRevealedCount = 0;
  const queue: Array<[number, number]> = [[row, col]];

  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    const cell = nextBoard[cr][cc];
    if (cell.state === 'revealed' || cell.state === 'flagged' || cell.isMine) {
      continue;
    }

    cell.state = 'revealed';
    newlyRevealedCount++;

    if (cell.neighborMines === 0) {
      for (const neighbor of getNeighbors(nextBoard, cr, cc)) {
        if (neighbor.state === 'hidden' || neighbor.state === 'question') {
          queue.push([neighbor.row, neighbor.col]);
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

export interface ChordOutcome extends RevealOutcome {
  triggered: boolean;
}

export function chordCell(
  currentBoard: CellData[][],
  row: number,
  col: number
): ChordOutcome {
  const center = currentBoard[row]?.[col];
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
    const lostBoard = revealBoardOnLoss(
      currentBoard,
      hitMines.map((m) => [m.row, m.col])
    );
    return {
      board: lostBoard,
      triggered: true,
      hitMine: true,
      newlyRevealedCount: hitMines.length,
      won: false,
    };
  }

  let workingBoard = cloneBoard(currentBoard);
  let totalOpened = 0;

  for (const candidate of toOpen) {
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

export function cycleCellMark(
  currentBoard: CellData[][],
  row: number,
  col: number,
  allowQuestionMarks: boolean
): { board: CellData[][]; placedFlag: boolean | null } {
  const cell = currentBoard[row]?.[col];
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

export interface SmartHint {
  row: number;
  col: number;
  action: 'reveal' | 'flag';
  reason: string;
}

export function findSmartHint(
  board: CellData[][],
  minesPlaced: boolean
): SmartHint | null {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  if (!minesPlaced) {
    return {
      row: Math.floor(rows / 2),
      col: Math.floor(cols / 2),
      action: 'reveal',
      reason: '첫 클릭은 항상 지뢰가 없는 안전 구역으로 시작됩니다.',
    };
  }

  // Fix wrongly placed flags first if any exist so player isn't misled
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

  // 1. Deterministic safe neighbor around a satisfied number
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
          const pick = unrevealedSafe[0];
          return {
            row: pick.row,
            col: pick.col,
            action: 'reveal',
            reason: '주변 지뢰 개수가 모두 충족되어 논리적으로 안전한 칸입니다.',
          };
        }
      }
    }
  }

  // 2. Deterministic mine neighbor around a number where remaining cells == remaining mines
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
          const pick = unflaggedMines[0];
          return {
            row: pick.row,
            col: pick.col,
            action: 'flag',
            reason: '남은 닫힌 칸 수와 필요한 지뢰 수가 일치하여 깃발을 표시했습니다.',
          };
        }
      }
    }
  }

  // 3. Fallback: pick a safe unrevealed frontier cell (or 0-cascade cell)
  const frontierSafe: CellData[] = [];
  const anySafe: CellData[] = [];

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
  const chosen = pool[0];
  return {
    row: chosen.row,
    col: chosen.col,
    action: 'reveal',
    reason: '추론이 어려운 구간에서 안전한 돌파구를 열었습니다.',
  };
}

export function countFlags(board: CellData[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.state === 'flagged') count++;
    }
  }
  return count;
}

export function countRevealedSafeCells(board: CellData[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && cell.state === 'revealed') count++;
    }
  }
  return count;
}
