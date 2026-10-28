import { GameConfig, GameEngine, Move, WinResult } from '../engine/GameEngine';

export type Direction2048 = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Game2048State {
  board: number[][]; // 4x4
  score: number;
  bestScore: number;
  previousBoard: number[][] | null;
  previousScore: number;
  isWon: boolean;
  isGameOver: boolean;
  playerIds: string[];
}

export class Game2048Engine implements GameEngine<Game2048State> {
  config: GameConfig = {
    id: 'game2048',
    name: '2048',
    category: 'brain',
    description: 'Slide matching tiles to merge numbers and reach the legendary 2048 tile!',
    supportsSinglePlayer: true,
    supportsMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'medium',
    icon: '🔢',
    estimatedDuration: '5-15 min',
    controls: {
      desktop: 'Arrow keys or WASD to slide tiles, U to undo',
      touch: 'Swipe across the grid in any direction',
    },
    status: 'playable',
    phase: 1,
    isFeatured: true,
    popularityRank: 4,
  };

  getInitialState(playerIds: string[], _playerNames?: Record<string, string>): Game2048State {
    const board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    this.spawnRandomTile(board);
    this.spawnRandomTile(board);

    return {
      board,
      score: 0,
      bestScore: 0,
      previousBoard: null,
      previousScore: 0,
      isWon: false,
      isGameOver: false,
      playerIds: playerIds.length > 0 ? playerIds : ['player1'],
    };
  }

  spawnRandomTile(board: number[][]): boolean {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return false;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  // Slide & Merge a single row of length 4 to the left
  slideLeft(row: number[]): { newRow: number[]; scoreGained: number } {
    const nonZero = row.filter((val) => val !== 0);
    const newRow: number[] = [];
    let scoreGained = 0;

    for (let i = 0; i < nonZero.length; i++) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        const merged = nonZero[i] * 2;
        newRow.push(merged);
        scoreGained += merged;
        i++; // skip next since merged
      } else {
        newRow.push(nonZero[i]);
      }
    }

    while (newRow.length < 4) {
      newRow.push(0);
    }

    return { newRow, scoreGained };
  }

  rotateBoard(board: number[][]): number[][] {
    // 90 deg clockwise
    const N = board.length;
    const rotated: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        rotated[c][N - 1 - r] = board[r][c];
      }
    }
    return rotated;
  }

  moveBoard(board: number[][], dir: Direction2048): { newBoard: number[][]; scoreGained: number; changed: boolean } {
    let current = board.map((row) => [...row]);
    let rotations = 0;

    if (dir === 'UP') rotations = 3;
    else if (dir === 'RIGHT') rotations = 2;
    else if (dir === 'DOWN') rotations = 1;

    for (let i = 0; i < rotations; i++) {
      current = this.rotateBoard(current);
    }

    let totalGained = 0;
    const slid: number[][] = [];
    for (let r = 0; r < 4; r++) {
      const { newRow, scoreGained } = this.slideLeft(current[r]);
      slid.push(newRow);
      totalGained += scoreGained;
    }

    let finalBoard = slid;
    const backRotations = (4 - rotations) % 4;
    for (let i = 0; i < backRotations; i++) {
      finalBoard = this.rotateBoard(finalBoard);
    }

    let changed = false;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] !== finalBoard[r][c]) {
          changed = true;
          break;
        }
      }
    }

    return { newBoard: finalBoard, scoreGained: totalGained, changed };
  }

  hasLegalMoves(board: number[][]): boolean {
    // Empty cell?
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) return true;
      }
    }
    // Adjacent equals?
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = board[r][c];
        if (r + 1 < 4 && board[r + 1][c] === val) return true;
        if (c + 1 < 4 && board[r][c + 1] === val) return true;
      }
    }
    return false;
  }

  validateMove(state: Game2048State, move: Move, _playerId?: string): boolean {
    if (move.type === 'UNDO') {
      return state.previousBoard !== null;
    }
    if (move.type === 'RESTART') {
      return true;
    }
    if (move.type === 'SLIDE') {
      if (state.isGameOver) return false;
      const dir = move.direction as Direction2048;
      const { changed } = this.moveBoard(state.board, dir);
      return changed;
    }
    return false;
  }

  applyMove(state: Game2048State, move: Move, _playerId?: string): Game2048State {
    if (move.type === 'RESTART') {
      return this.getInitialState(state.playerIds);
    }

    if (move.type === 'UNDO' && state.previousBoard) {
      return {
        ...state,
        board: state.previousBoard,
        score: state.previousScore,
        previousBoard: null,
        isGameOver: false,
      };
    }

    if (move.type === 'SLIDE') {
      const dir = move.direction as Direction2048;
      const { newBoard, scoreGained, changed } = this.moveBoard(state.board, dir);
      if (!changed) return state;

      const previousBoard = state.board.map((r) => [...r]);
      const previousScore = state.score;

      this.spawnRandomTile(newBoard);

      const newScore = state.score + scoreGained;
      const hasMoves = this.hasLegalMoves(newBoard);

      // Check if won (has 2048 tile)
      let isWon = state.isWon;
      if (!isWon) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (newBoard[r][c] >= 2048) {
              isWon = true;
              break;
            }
          }
        }
      }

      return {
        ...state,
        board: newBoard,
        score: newScore,
        bestScore: Math.max(state.bestScore, newScore),
        previousBoard,
        previousScore,
        isWon,
        isGameOver: !hasMoves,
      };
    }

    return state;
  }

  checkWinner(state: Game2048State): WinResult | null {
    if (!state.isGameOver) return null;
    const playerId = state.playerIds[0] || 'player1';
    return {
      winner: playerId,
      scores: { [playerId]: state.score },
      reason: state.isWon ? 'Congratulations! You reached 2048!' : `Game Over! Final Score: ${state.score}`,
    };
  }

  isGameOver(state: Game2048State): boolean {
    return state.isGameOver;
  }

  getAIMove(state: Game2048State): Move {
    // Greedy heuristic: prefer DOWN and RIGHT to keep big numbers in the corner
    const dirs: Direction2048[] = ['DOWN', 'RIGHT', 'LEFT', 'UP'];
    for (const d of dirs) {
      const { changed } = this.moveBoard(state.board, d);
      if (changed) return { type: 'SLIDE', direction: d };
    }
    return { type: 'SLIDE', direction: 'DOWN' };
  }
}
