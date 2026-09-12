import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface C4State {
  board: (string | null)[][];
  players: string[];
  playerNames: Record<string, string>;
  currentPlayerIndex: number;
  phase: 'playing' | 'finished';
  winner: WinResult | null;
  colors: Record<string, 'red' | 'yellow'>;
  winningCells: [number, number][] | null;
  lastDrop: { row: number; col: number } | null;
}

const ROWS = 6;
const COLS = 7;

function emptyBoard(): (string | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function checkWin(board: (string | null)[][]): { winner: string; cells: [number, number][] } | null {
  const dirs: [number, number][] = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (!v) continue;
      for (const [dr, dc] of dirs) {
        const cells: [number, number][] = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k; const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== v) break;
          cells.push([nr, nc]);
        }
        if (cells.length === 4) return { winner: v, cells };
      }
    }
  }
  return null;
}

function isFull(board: (string | null)[][]): boolean {
  return board[0].every(c => c !== null);
}

function getLowestRow(board: (string | null)[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) return r;
  }
  return -1;
}

function score(board: (string | null)[][], myId: string, oppId: string): number {
  let s = 0;
  const check = (cells: (string|null)[]) => {
    const mine = cells.filter(c => c === myId).length;
    const opp = cells.filter(c => c === oppId).length;
    const empty = cells.filter(c => c === null).length;
    if (opp === 0) {
      if (mine === 4) s += 1000;
      else if (mine === 3 && empty === 1) s += 5;
      else if (mine === 2 && empty === 2) s += 2;
    }
    if (mine === 0) {
      if (opp === 3 && empty === 1) s -= 4;
    }
  };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS - 4; c++) check(board[r].slice(c, c+4));
  for (let c = 0; c < COLS; c++) for (let r = 0; r <= ROWS - 4; r++) check([board[r][c],board[r+1][c],board[r+2][c],board[r+3][c]]);
  for (let r = 0; r <= ROWS-4; r++) for (let c = 0; c <= COLS-4; c++) check([[0,0],[1,1],[2,2],[3,3]].map(([dr,dc])=>board[r+dr][c+dc]));
  for (let r = 3; r < ROWS; r++) for (let c = 0; c <= COLS-4; c++) check([[0,0],[-1,1],[-2,2],[-3,3]].map(([dr,dc])=>board[r+dr][c+dc]));
  return s;
}

function mmC4(board: (string|null)[][], depth: number, isMax: boolean, alpha: number, beta: number, myId: string, oppId: string): number {
  const w = checkWin(board);
  if (w) return w.winner === myId ? 1000 + depth : -(1000 + depth);
  if (isFull(board) || depth === 0) return score(board, myId, oppId);
  const valid = Array.from({length: COLS}, (_,c)=>c).filter(c => getLowestRow(board,c) >= 0);
  if (isMax) {
    let best = -Infinity;
    for (const c of valid) {
      const r = getLowestRow(board, c);
      board[r][c] = myId;
      best = Math.max(best, mmC4(board, depth-1, false, alpha, beta, myId, oppId));
      board[r][c] = null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const c of valid) {
      const r = getLowestRow(board, c);
      board[r][c] = oppId;
      best = Math.min(best, mmC4(board, depth-1, true, alpha, beta, myId, oppId));
      board[r][c] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export class Connect4Engine implements GameEngine<C4State> {
  config: GameConfig = {
    id: 'connect4',
    name: 'Connect 4',
    category: 'brain',
    description: 'Drop pieces into columns to connect four of your color in a row!',
    minPlayers: 2,
    maxPlayers: 2,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🔴🟡',
    estimatedDuration: '3-8 min',
    controls: {
      desktop: 'Click any column header or hover to preview drop',
      touch: 'Tap column buttons at the top of the board',
    },
    status: 'playable',
    phase: 2,
    isFeatured: true,
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): C4State {
    const colors: Record<string, 'red' | 'yellow'> = {};
    colors[playerIds[0]] = 'red';
    colors[playerIds[1] ?? '__ai__'] = 'yellow';
    return {
      board: emptyBoard(), players: playerIds, playerNames, currentPlayerIndex: 0,
      phase: 'playing', winner: null, colors, winningCells: null, lastDrop: null,
    };
  }

  validateMove(state: C4State, move: Move, playerId: string): boolean {
    if (state.phase !== 'playing') return false;
    if (state.players[state.currentPlayerIndex] !== playerId) return false;
    const { col } = move as { col: number };
    if (col < 0 || col >= COLS) return false;
    return getLowestRow(state.board, col) >= 0;
  }

  applyMove(state: C4State, move: Move, _playerId: string): C4State {
    const { col } = move as { col: number };
    const currentId = state.players[state.currentPlayerIndex];
    const board = state.board.map(r => [...r]);
    const row = getLowestRow(board, col);
    board[row][col] = currentId;
    const result = checkWin(board);
    let phase: C4State['phase'] = 'playing';
    let winner: WinResult | null = null;
    let winningCells: [number,number][] | null = null;
    if (result) {
      phase = 'finished';
      winningCells = result.cells;
      winner = { winner: result.winner, scores: Object.fromEntries(state.players.map(p => [p, p === result.winner ? 1 : 0])) };
    } else if (isFull(board)) {
      phase = 'finished';
      winner = { winner: 'draw', scores: Object.fromEntries(state.players.map(p => [p, 0])) };
    }
    return {
      ...state, board,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      phase, winner, winningCells, lastDrop: { row, col },
    };
  }

  checkWinner(state: C4State): WinResult | null { return state.winner; }
  isGameOver(state: C4State): boolean { return state.phase === 'finished'; }

  getAIMove(state: C4State, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const valid = Array.from({ length: COLS }, (_, c) => c).filter(c => getLowestRow(state.board, c) >= 0);
    if (valid.length === 0) return { col: 3 };

    const oppId = state.players.find(p => p !== playerId) || (playerId === 'red' ? 'yellow' : 'red');

    // Positional column weighting (Center col 3 is most valuable, outer cols least)
    const colWeights: Record<number, number> = {
      0: 1.0,
      1: 2.0,
      2: 3.5,
      3: 5.0,
      4: 3.5,
      5: 2.0,
      6: 1.0,
    };

    // Helper: Check if dropping in col wins for targetId
    const canWin = (col: number, targetId: string): boolean => {
      const board = state.board.map(r => [...r]);
      const r = getLowestRow(board, col);
      if (r < 0) return false;
      board[r][col] = targetId;
      return checkWin(board) !== null;
    };

    // Helper: Blunder check - does dropping here allow opponent to win immediately above our piece?
    const isBlunder = (col: number): boolean => {
      const r = getLowestRow(state.board, col);
      if (r <= 0) return false; // top row, no row above
      const board = state.board.map(row => [...row]);
      board[r][col] = playerId;
      board[r - 1][col] = oppId;
      return checkWin(board) !== null;
    };

    // 1. Immediate Win moves
    const winningMoves = valid.filter(c => canWin(c, playerId));
    // 2. Immediate Block moves
    const blockingMoves = valid.filter(c => canWin(c, oppId));

    // EASY: Casual novice human
    // Spots wins 65% of the time, blocks 50% of the time, prefers center naturally, blunders occasionally
    if (difficulty === 'easy') {
      if (winningMoves.length > 0 && Math.random() < 0.65) {
        return { col: winningMoves[0] };
      }
      if (blockingMoves.length > 0 && Math.random() < 0.50) {
        return { col: blockingMoves[0] };
      }

      // Filter out blunders 60% of the time
      let candidates = valid;
      if (Math.random() < 0.60) {
        const safe = valid.filter(c => !isBlunder(c));
        if (safe.length > 0) candidates = safe;
      }

      // Center-biased weighted pick
      const totalWeight = candidates.reduce((sum, c) => sum + (colWeights[c] || 1), 0);
      let rand = Math.random() * totalWeight;
      for (const col of candidates) {
        rand -= (colWeights[col] || 1);
        if (rand <= 0) return { col };
      }
      return { col: candidates[0] };
    }

    // MEDIUM: Competent human player
    // Takes wins 100%, blocks 90%, avoids blunders 92%, strongly contests center column
    if (difficulty === 'medium') {
      if (winningMoves.length > 0) return { col: winningMoves[0] };
      if (blockingMoves.length > 0 && Math.random() < 0.90) return { col: blockingMoves[0] };

      // Avoid giving opponent immediate win on next turn
      let candidates = valid.filter(c => !isBlunder(c));
      if (candidates.length === 0) candidates = valid; // forced

      // Strategic scoring based on 2-in-a-row / 3-in-a-row connections + center weight
      const scored = candidates.map(col => {
        const board = state.board.map(r => [...r]);
        const r = getLowestRow(board, col);
        board[r][col] = playerId;
        const posScore = score(board, playerId, oppId) * 0.1;
        const centerBonus = colWeights[col] * 2.5;
        const humanJitter = Math.random() * 2.0;
        return { col, total: posScore + centerBonus + humanJitter };
      });

      scored.sort((a, b) => b.total - a.total);
      return { col: scored[0].col };
    }

    // HARD: Expert tournament human
    // Minimax search with alpha-beta pruning, center column ordering, and blunder safety
    if (winningMoves.length > 0) return { col: winningMoves[0] };
    if (blockingMoves.length > 0) return { col: blockingMoves[0] };

    // Order valid moves center-first for maximum alpha-beta cutoff efficiency
    const orderedValid = [...valid].sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
    const nonBlunders = orderedValid.filter(c => !isBlunder(c));
    const searchCols = nonBlunders.length > 0 ? nonBlunders : orderedValid;

    const board = state.board.map(r => [...r]);
    let best = -Infinity;
    let bestCol = searchCols[0];

    for (const col of searchCols) {
      const r = getLowestRow(board, col);
      board[r][col] = playerId;
      // Search depth 5 with center positional tie-breaker
      const s = mmC4(board, 5, false, -Infinity, Infinity, playerId, oppId) + colWeights[col] * 0.2;
      board[r][col] = null;
      if (s > best) {
        best = s;
        bestCol = col;
      }
    }
    return { col: bestCol };
  }
}
