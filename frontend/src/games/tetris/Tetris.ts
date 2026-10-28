import { GameConfig, GameEngine, Move, WinResult } from '../engine/GameEngine';

export const TETROMINOES = {
  I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#06b6d4' },
  J: { shape: [[1,0,0], [1,1,1], [0,0,0]], color: '#3b82f6' },
  L: { shape: [[0,0,1], [1,1,1], [0,0,0]], color: '#f97316' },
  O: { shape: [[1,1], [1,1]], color: '#eab308' },
  S: { shape: [[0,1,1], [1,1,0], [0,0,0]], color: '#22c55e' },
  T: { shape: [[0,1,0], [1,1,1], [0,0,0]], color: '#a855f7' },
  Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], color: '#ef4444' },
};

export type TetrominoType = keyof typeof TETROMINOES;

export interface Piece {
  type: TetrominoType;
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export interface TetrisState {
  grid: string[][]; // 20 rows x 10 cols, contains color string or ''
  currentPiece: Piece;
  nextPiece: Piece;
  score: number;
  lines: number;
  level: number;
  isPaused: boolean;
  isGameOver: boolean;
  playerIds: string[];
}

export class TetrisEngine implements GameEngine<TetrisState> {
  config: GameConfig = {
    id: 'tetris',
    name: 'Tetris Arcade',
    category: 'brain',
    description: 'Arrange falling tetrominoes, clear lines, and chase high scores in this iconic arcade block puzzle!',
    supportsSinglePlayer: true,
    supportsMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'medium',
    icon: '🧱',
    estimatedDuration: '3-10 min',
    controls: {
      desktop: '← → to move, ↑ to rotate, ↓ soft drop, Space hard drop, P pause',
      touch: 'On-screen arcade buttons for move, rotate, and drop',
    },
    status: 'playable',
    phase: 1,
    isFeatured: true,
    popularityRank: 5,
  };

  private readonly ROWS = 20;
  private readonly COLS = 10;

  getInitialState(playerIds: string[], _playerNames?: Record<string, string>): TetrisState {
    const grid: string[][] = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(''));
    const currentPiece = this.generatePiece();
    const nextPiece = this.generatePiece();

    return {
      grid,
      currentPiece,
      nextPiece,
      score: 0,
      lines: 0,
      level: 1,
      isPaused: false,
      isGameOver: false,
      playerIds: playerIds.length > 0 ? playerIds : ['player1'],
    };
  }

  generatePiece(): Piece {
    const types = Object.keys(TETROMINOES) as TetrominoType[];
    const type = types[Math.floor(Math.random() * types.length)];
    const def = TETROMINOES[type];
    return {
      type,
      shape: def.shape.map((row) => [...row]),
      color: def.color,
      x: Math.floor((this.COLS - def.shape[0].length) / 2),
      y: 0,
    };
  }

  rotateShape(shape: number[][]): number[][] {
    const N = shape.length;
    const rotated: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        rotated[c][N - 1 - r] = shape[r][c];
      }
    }
    return rotated;
  }

  checkCollision(grid: string[][], piece: Piece, offsetX = 0, offsetY = 0, newShape?: number[][]): boolean {
    const shape = newShape || piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const x = piece.x + c + offsetX;
          const y = piece.y + r + offsetY;

          if (x < 0 || x >= this.COLS || y >= this.ROWS) {
            return true; // Wall or floor collision
          }
          if (y >= 0 && grid[y][x] !== '') {
            return true; // Overlaps existing block
          }
        }
      }
    }
    return false;
  }

  validateMove(state: TetrisState, move: Move, _playerId?: string): boolean {
    if (state.isGameOver) return false;
    if (move.type === 'PAUSE' || move.type === 'RESTART') return true;
    if (state.isPaused) return false;

    if (move.type === 'MOVE_LEFT') {
      return !this.checkCollision(state.grid, state.currentPiece, -1, 0);
    }
    if (move.type === 'MOVE_RIGHT') {
      return !this.checkCollision(state.grid, state.currentPiece, 1, 0);
    }
    if (move.type === 'ROTATE') {
      const rotated = this.rotateShape(state.currentPiece.shape);
      // Wall kick attempts: 0, -1, +1
      return (
        !this.checkCollision(state.grid, state.currentPiece, 0, 0, rotated) ||
        !this.checkCollision(state.grid, state.currentPiece, -1, 0, rotated) ||
        !this.checkCollision(state.grid, state.currentPiece, 1, 0, rotated)
      );
    }
    if (move.type === 'DROP' || move.type === 'HARD_DROP' || move.type === 'TICK') {
      return true;
    }
    return false;
  }

  applyMove(state: TetrisState, move: Move, _playerId?: string): TetrisState {
    if (move.type === 'PAUSE') {
      return { ...state, isPaused: !state.isPaused };
    }
    if (move.type === 'RESTART') {
      return this.getInitialState(state.playerIds);
    }
    if (state.isPaused || state.isGameOver) return state;

    if (move.type === 'MOVE_LEFT') {
      if (!this.checkCollision(state.grid, state.currentPiece, -1, 0)) {
        return { ...state, currentPiece: { ...state.currentPiece, x: state.currentPiece.x - 1 } };
      }
      return state;
    }

    if (move.type === 'MOVE_RIGHT') {
      if (!this.checkCollision(state.grid, state.currentPiece, 1, 0)) {
        return { ...state, currentPiece: { ...state.currentPiece, x: state.currentPiece.x + 1 } };
      }
      return state;
    }

    if (move.type === 'ROTATE') {
      const rotated = this.rotateShape(state.currentPiece.shape);
      if (!this.checkCollision(state.grid, state.currentPiece, 0, 0, rotated)) {
        return { ...state, currentPiece: { ...state.currentPiece, shape: rotated } };
      }
      if (!this.checkCollision(state.grid, state.currentPiece, -1, 0, rotated)) {
        return { ...state, currentPiece: { ...state.currentPiece, x: state.currentPiece.x - 1, shape: rotated } };
      }
      if (!this.checkCollision(state.grid, state.currentPiece, 1, 0, rotated)) {
        return { ...state, currentPiece: { ...state.currentPiece, x: state.currentPiece.x + 1, shape: rotated } };
      }
      return state;
    }

    if (move.type === 'HARD_DROP') {
      let dropDistance = 0;
      while (!this.checkCollision(state.grid, state.currentPiece, 0, dropDistance + 1)) {
        dropDistance++;
      }
      const droppedPiece = { ...state.currentPiece, y: state.currentPiece.y + dropDistance };
      return this.lockPiece({ ...state, currentPiece: droppedPiece }, dropDistance * 2);
    }

    if (move.type === 'DROP' || move.type === 'TICK') {
      if (!this.checkCollision(state.grid, state.currentPiece, 0, 1)) {
        return {
          ...state,
          currentPiece: { ...state.currentPiece, y: state.currentPiece.y + 1 },
          score: move.type === 'DROP' ? state.score + 1 : state.score,
        };
      } else {
        return this.lockPiece(state, 0);
      }
    }

    return state;
  }

  private lockPiece(state: TetrisState, bonusScore = 0): TetrisState {
    const newGrid = state.grid.map((row) => [...row]);
    const { shape, color, x, y } = state.currentPiece;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const gridY = y + r;
          const gridX = x + c;
          if (gridY < 0 || gridY >= this.ROWS || gridX < 0 || gridX >= this.COLS) {
            continue;
          }
          newGrid[gridY][gridX] = color;
        }
      }
    }

    // Line clearing
    let cleared = 0;
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (newGrid[r].every((cell) => cell !== '')) {
        newGrid.splice(r, 1);
        newGrid.unshift(Array(this.COLS).fill(''));
        cleared++;
        r++; // Recheck same row index after splice
      }
    }

    const linePoints = [0, 100, 300, 500, 800];
    const pointsGained = (linePoints[cleared] || cleared * 200) * state.level + bonusScore;
    const newLines = state.lines + cleared;
    const newLevel = Math.floor(newLines / 10) + 1;

    // Spawn next piece
    const nextPiece = this.generatePiece();
    const isGameOver = this.checkCollision(newGrid, state.nextPiece);

    return {
      ...state,
      grid: newGrid,
      currentPiece: state.nextPiece,
      nextPiece,
      score: state.score + pointsGained,
      lines: newLines,
      level: newLevel,
      isGameOver,
    };
  }

  checkWinner(state: TetrisState): WinResult | null {
    if (!state.isGameOver) return null;
    const playerId = state.playerIds[0] || 'player1';
    return {
      winner: playerId,
      scores: { [playerId]: state.score },
      reason: `Game Over! Cleared ${state.lines} lines. Final Score: ${state.score}`,
    };
  }

  isGameOver(state: TetrisState): boolean {
    return state.isGameOver;
  }

  getAIMove(): Move {
    return { type: 'DROP' };
  }
}
