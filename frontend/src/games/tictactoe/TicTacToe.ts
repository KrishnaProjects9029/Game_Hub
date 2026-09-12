import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface TTTState {
  board: (string | null)[][];
  players: string[];
  playerNames: Record<string, string>;
  currentPlayerIndex: number;
  phase: 'playing' | 'finished';
  winner: WinResult | null;
  marks: Record<string, 'X' | 'O'>;
  winningCells: [number, number][] | null;
}

const WIN_LINES: [number, number][][] = [
  [[0,0],[0,1],[0,2]],[[1,0],[1,1],[1,2]],[[2,0],[2,1],[2,2]],
  [[0,0],[1,0],[2,0]],[[0,1],[1,1],[2,1]],[[0,2],[1,2],[2,2]],
  [[0,0],[1,1],[2,2]],[[0,2],[1,1],[2,0]],
];

function checkBoardWinner(board: (string|null)[][], marks: Record<string,'X'|'O'>): { winner: string, cells: [number,number][] } | 'draw' | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const va = board[a[0]][a[1]];
    const vb = board[b[0]][b[1]];
    const vc = board[c[0]][c[1]];
    if (va && va === vb && vb === vc) {
      const winnerId = Object.entries(marks).find(([, m]) => m === va)?.[0];
      if (winnerId) return { winner: winnerId, cells: line as [number,number][] };
    }
  }
  const full = board.every(row => row.every(c => c !== null));
  if (full) return 'draw';
  return null;
}

function minimax(board: (string|null)[][], isMax: boolean, myMark: string, oppMark: string, alpha: number, beta: number, depth: number): number {
  if (depth > 8) return 0;
  // check winner
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const va = board[a[0]][a[1]]; const vb = board[b[0]][b[1]]; const vc = board[c[0]][c[1]];
    if (va && va === vb && vb === vc) return va === myMark ? (10 - depth) : -(10 - depth);
  }
  const empty: [number,number][] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (!board[r][c]) empty.push([r,c]);
  if (empty.length === 0) return 0;
  if (isMax) {
    let best = -Infinity;
    for (const [r,c] of empty) {
      board[r][c] = myMark;
      best = Math.max(best, minimax(board, false, myMark, oppMark, alpha, beta, depth+1));
      board[r][c] = null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const [r,c] of empty) {
      board[r][c] = oppMark;
      best = Math.min(best, minimax(board, true, myMark, oppMark, alpha, beta, depth+1));
      board[r][c] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export class TicTacToeEngine implements GameEngine<TTTState> {
  config: GameConfig = {
    id: 'tictactoe',
    name: 'Tic-Tac-Toe',
    category: 'brain',
    description: 'Classic 3x3 strategy game. Align three marks to win!',
    minPlayers: 2,
    maxPlayers: 2,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '❌⭕',
    estimatedDuration: '1-3 min',
    controls: {
      desktop: 'Click on any empty grid cell',
      touch: 'Tap on any empty grid cell',
    },
    status: 'playable',
    phase: 2,
    isFeatured: true,
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): TTTState {
    const marks: Record<string, 'X' | 'O'> = {};
    marks[playerIds[0]] = 'X';
    marks[playerIds[1] ?? '__ai__'] = 'O';
    return {
      board: [[null,null,null],[null,null,null],[null,null,null]],
      players: playerIds, playerNames, currentPlayerIndex: 0,
      phase: 'playing', winner: null, marks, winningCells: null,
    };
  }

  validateMove(state: TTTState, move: Move, playerId: string): boolean {
    if (state.phase !== 'playing') return false;
    if (state.players[state.currentPlayerIndex] !== playerId) return false;
    const { row, col } = move as { row: number; col: number };
    if (row < 0 || row > 2 || col < 0 || col > 2) return false;
    return state.board[row][col] === null;
  }

  applyMove(state: TTTState, move: Move, _playerId: string): TTTState {
    const { row, col } = move as { row: number; col: number };
    const board = state.board.map(r => [...r]);
    const mark = state.marks[state.players[state.currentPlayerIndex]];
    board[row][col] = mark;
    const result = checkBoardWinner(board, state.marks);
    let phase: TTTState['phase'] = 'playing';
    let winner: WinResult | null = null;
    let winningCells: [number,number][] | null = null;
    if (result === 'draw') {
      phase = 'finished';
      winner = { winner: 'draw', scores: Object.fromEntries(state.players.map(p => [p, 0])) };
    } else if (result) {
      phase = 'finished';
      winningCells = result.cells;
      winner = { winner: result.winner, scores: Object.fromEntries(state.players.map(p => [p, p === result.winner ? 1 : 0])) };
    }
    return {
      ...state, board,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      phase, winner, winningCells,
    };
  }

  checkWinner(state: TTTState): WinResult | null { return state.winner; }
  isGameOver(state: TTTState): boolean { return state.phase === 'finished'; }

  getAIMove(state: TTTState, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const empty: [number, number][] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!state.board[r][c]) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return { row: 0, col: 0 };

    const myMark = state.marks[playerId] || 'O';
    const oppMark = myMark === 'X' ? 'O' : 'X';

    // Helper: find immediate winning move for a mark
    const findWinningMove = (mark: string): [number, number] | null => {
      for (const [r, c] of empty) {
        state.board[r][c] = mark;
        const res = checkBoardWinner(state.board, state.marks);
        state.board[r][c] = null;
        if (res && res !== 'draw') return [r, c];
      }
      return null;
    };

    // Strategic cell categorizations
    const corners: [number, number][] = [[0, 0], [0, 2], [2, 0], [2, 2]];
    const openCorners = empty.filter(([r, c]) => corners.some(([cr, cc]) => cr === r && cc === c));
    const centerOpen = empty.some(([r, c]) => r === 1 && c === 1);

    // EASY: Casual human beginner (not pure random bot)
    // Spots obvious wins 65% of the time, blocks 50% of the time, favors center/corners
    if (difficulty === 'easy') {
      const winMove = findWinningMove(myMark);
      if (winMove && Math.random() < 0.65) return { row: winMove[0], col: winMove[1] };

      const blockMove = findWinningMove(oppMark);
      if (blockMove && Math.random() < 0.50) return { row: blockMove[0], col: blockMove[1] };

      // Beginner center/corner instinct
      if (centerOpen && Math.random() < 0.45) return { row: 1, col: 1 };
      if (openCorners.length > 0 && Math.random() < 0.40) {
        const pick = openCorners[Math.floor(Math.random() * openCorners.length)];
        return { row: pick[0], col: pick[1] };
      }

      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      return { row: r, col: c };
    }

    // MEDIUM: Capable human player
    // Takes winning move 100%, blocks opponent 88%, actively builds 2-in-a-row lines, values center & corners
    if (difficulty === 'medium') {
      const winMove = findWinningMove(myMark);
      if (winMove) return { row: winMove[0], col: winMove[1] };

      const blockMove = findWinningMove(oppMark);
      if (blockMove && Math.random() < 0.88) return { row: blockMove[0], col: blockMove[1] };

      // Take center if available
      if (centerOpen && Math.random() < 0.80) return { row: 1, col: 1 };

      // Look for a move that sets up 2-in-a-row
      const strategicMoves = empty.filter(([r, c]) => {
        state.board[r][c] = myMark;
        let threats = 0;
        for (const [er, ec] of empty) {
          if (er === r && ec === c) continue;
          state.board[er][ec] = myMark;
          const res = checkBoardWinner(state.board, state.marks);
          state.board[er][ec] = null;
          if (res && res !== 'draw') threats++;
        }
        state.board[r][c] = null;
        return threats > 0;
      });

      if (strategicMoves.length > 0 && Math.random() < 0.75) {
        const pick = strategicMoves[Math.floor(Math.random() * strategicMoves.length)];
        return { row: pick[0], col: pick[1] };
      }

      // Take corner
      if (openCorners.length > 0 && Math.random() < 0.65) {
        const pick = openCorners[Math.floor(Math.random() * openCorners.length)];
        return { row: pick[0], col: pick[1] };
      }

      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      return { row: r, col: c };
    }

    // HARD: Master human player using optimal Minimax
    // With strategic tie-breaking (prefers center > corners > edges) and opening variety
    const board = state.board.map(r => [...r]);
    const scoredMoves: { move: [number, number]; score: number; weight: number }[] = [];

    for (const [r, c] of empty) {
      board[r][c] = myMark;
      const score = minimax(board, false, myMark, oppMark, -Infinity, Infinity, 0);
      board[r][c] = null;

      // Positional tie-breaker: center (+3), corners (+2), edges (+1)
      const positionalBonus = (r === 1 && c === 1) ? 3 : (r % 2 === 0 && c % 2 === 0) ? 2 : 1;
      scoredMoves.push({ move: [r, c], score, weight: positionalBonus });
    }

    // Find best minimax score
    const maxScore = Math.max(...scoredMoves.map(m => m.score));
    const topMoves = scoredMoves.filter(m => m.score === maxScore);

    // Among optimal moves, pick based on human positional intuition with slight variety
    topMoves.sort((a, b) => b.weight - a.weight + (Math.random() * 0.4 - 0.2));
    const bestMove = topMoves[0].move;
    return { row: bestMove[0], col: bestMove[1] };
  }
}
