import { GameConfig, GameEngine, Move, WinResult } from '../engine/GameEngine';

export interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export type MinesweeperDifficulty = 'easy' | 'medium' | 'hard';

export interface MinesweeperState {
  rows: number;
  cols: number;
  totalMines: number;
  grid: Cell[][];
  difficulty: MinesweeperDifficulty;
  isFirstClick: boolean;
  isGameOver: boolean;
  isWon: boolean;
  secondsElapsed: number;
  flagsRemaining: number;
  playerIds: string[];
}

export class MinesweeperEngine implements GameEngine<MinesweeperState> {
  config: GameConfig = {
    id: 'minesweeper',
    name: 'Minesweeper',
    category: 'brain',
    description: 'Uncover safe cells using mathematical deduction. Flag dangerous hidden mines to secure the field!',
    supportsSinglePlayer: true,
    supportsMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'medium',
    icon: '💣',
    estimatedDuration: '3-8 min',
    controls: {
      desktop: 'Left-click to reveal cell, Right-click to toggle flag',
      touch: 'Tap to reveal, or toggle Flag Mode button to place flags',
    },
    status: 'playable',
    phase: 1,
    isFeatured: true,
    popularityRank: 6,
  };

  private readonly PRESETS: Record<MinesweeperDifficulty, { rows: number; cols: number; mines: number }> = {
    easy: { rows: 8, cols: 8, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 20 },
    hard: { rows: 16, cols: 16, mines: 40 },
  };

  getInitialState(
    playerIds: string[],
    _playerNames?: Record<string, string> | MinesweeperDifficulty,
    difficultyParam?: MinesweeperDifficulty
  ): MinesweeperState {
    let difficulty: MinesweeperDifficulty = 'medium';
    if (typeof _playerNames === 'string') {
      difficulty = _playerNames;
    } else if (difficultyParam) {
      difficulty = difficultyParam;
    }
    const preset = this.PRESETS[difficulty] || this.PRESETS.medium;
    const grid: Cell[][] = [];
    for (let r = 0; r < preset.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < preset.cols; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        });
      }
      grid.push(row);
    }

    return {
      rows: preset.rows,
      cols: preset.cols,
      totalMines: preset.mines,
      grid,
      difficulty,
      isFirstClick: true,
      isGameOver: false,
      isWon: false,
      secondsElapsed: 0,
      flagsRemaining: preset.mines,
      playerIds: playerIds.length > 0 ? playerIds : ['player1'],
    };
  }

  // Populate mines ensuring safeZone (first click cell and surrounding 8 neighbors)
  populateMines(grid: Cell[][], rows: number, cols: number, totalMines: number, safeR: number, safeC: number): void {
    const safeSet = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = safeR + dr;
        const nc = safeC + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          safeSet.add(`${nr},${nc}`);
        }
      }
    }

    let placed = 0;
    while (placed < totalMines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!grid[r][c].isMine && !safeSet.has(`${r},${c}`)) {
        grid[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate adjacent numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!grid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isMine) {
                count++;
              }
            }
          }
          grid[r][c].adjacentMines = count;
        }
      }
    }
  }

  // Recursive flood reveal
  revealCell(grid: Cell[][], rows: number, cols: number, r: number, c: number): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const cell = grid[r][c];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return;

    cell.isRevealed = true;
    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            this.revealCell(grid, rows, cols, r + dr, c + dc);
          }
        }
      }
    }
  }

  validateMove(state: MinesweeperState, move: Move, _playerId?: string): boolean {
    if (move.type === 'RESTART' || move.type === 'SET_DIFFICULTY') return true;
    if (state.isGameOver) return false;

    if (move.type === 'REVEAL' || move.type === 'FLAG') {
      const r = move.r as number;
      const c = move.c as number;
      if (typeof r !== 'number' || typeof c !== 'number') return false;
      if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return false;
      const cell = state.grid[r][c];
      if (cell.isRevealed) return false;
      if (move.type === 'REVEAL' && cell.isFlagged) return false;
      return true;
    }

    if (move.type === 'TICK') return !state.isGameOver && !state.isFirstClick;
    return false;
  }

  applyMove(state: MinesweeperState, move: Move, _playerId?: string): MinesweeperState {
    if (move.type === 'RESTART') {
      return this.getInitialState(state.playerIds, state.difficulty);
    }

    if (move.type === 'SET_DIFFICULTY') {
      const diff = (move.difficulty as MinesweeperDifficulty) || 'medium';
      return this.getInitialState(state.playerIds, diff);
    }

    if (move.type === 'TICK') {
      if (state.isGameOver || state.isFirstClick) return state;
      return { ...state, secondsElapsed: state.secondsElapsed + 1 };
    }

    if (move.type === 'FLAG') {
      const r = move.r as number;
      const c = move.c as number;
      const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
      const target = newGrid[r][c];
      if (target.isRevealed) return state;

      target.isFlagged = !target.isFlagged;
      const flagsRemaining = state.flagsRemaining + (target.isFlagged ? -1 : 1);
      return { ...state, grid: newGrid, flagsRemaining };
    }

    if (move.type === 'REVEAL') {
      const r = move.r as number;
      const c = move.c as number;
      const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));

      // Handle first click safety
      if (state.isFirstClick) {
        this.populateMines(newGrid, state.rows, state.cols, state.totalMines, r, c);
      }

      const target = newGrid[r][c];
      if (target.isMine) {
        // Exploded! Reveal all mines
        for (let row = 0; row < state.rows; row++) {
          for (let col = 0; col < state.cols; col++) {
            if (newGrid[row][col].isMine) {
              newGrid[row][col].isRevealed = true;
            }
          }
        }
        return {
          ...state,
          grid: newGrid,
          isFirstClick: false,
          isGameOver: true,
          isWon: false,
        };
      }

      // Safe reveal
      this.revealCell(newGrid, state.rows, state.cols, r, c);

      // Check win condition: every non-mine cell is revealed
      let unrevealedSafe = 0;
      for (let row = 0; row < state.rows; row++) {
        for (let col = 0; col < state.cols; col++) {
          if (!newGrid[row][col].isMine && !newGrid[row][col].isRevealed) {
            unrevealedSafe++;
          }
        }
      }

      const isWon = unrevealedSafe === 0;
      const isGameOver = isWon;

      return {
        ...state,
        grid: newGrid,
        isFirstClick: false,
        isGameOver,
        isWon,
      };
    }

    return state;
  }

  checkWinner(state: MinesweeperState): WinResult | null {
    if (!state.isGameOver) return null;
    const playerId = state.playerIds[0] || 'player1';
    const score = state.isWon ? Math.max(10, 1000 - state.secondsElapsed * 2) : 0;
    return {
      winner: state.isWon ? playerId : 'draw',
      scores: { [playerId]: score },
      reason: state.isWon
        ? `Victory! Field Cleared in ${state.secondsElapsed} seconds!`
        : 'Mine Detonated! Game Over.',
    };
  }

  isGameOver(state: MinesweeperState): boolean {
    return state.isGameOver;
  }

  getAIMove(state: MinesweeperState): Move {
    // Basic AI finding unrevealed non-flagged cell
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if (!state.grid[r][c].isRevealed && !state.grid[r][c].isFlagged) {
          return { type: 'REVEAL', r, c };
        }
      }
    }
    return { type: 'RESTART' };
  }
}
