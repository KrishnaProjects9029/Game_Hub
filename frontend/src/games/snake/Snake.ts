import { GameConfig, GameEngine, Move, WinResult } from '../engine/GameEngine';

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface SnakeState {
  snake: SnakeSegment[];
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  nextDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  food: SnakeSegment;
  score: number;
  highScore: number;
  gridSize: number;
  isPaused: boolean;
  isGameOver: boolean;
  playerIds: string[];
}

export class SnakeEngine implements GameEngine<SnakeState> {
  config: GameConfig = {
    id: 'snake',
    name: 'Snake Classic',
    category: 'reflex',
    description: 'Guide the snake, eat the apples, and grow longer. Avoid running into walls and your own tail!',
    supportsSinglePlayer: true,
    supportsMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'medium',
    icon: '🐍',
    estimatedDuration: '2-5 min',
    controls: {
      desktop: 'Arrow keys or WASD to turn, Space to pause',
      touch: 'Swipe or use the on-screen D-Pad buttons',
    },
    status: 'playable',
    phase: 1,
    isFeatured: true,
    popularityRank: 3,
  };

  getInitialState(playerIds: string[], _playerNames?: Record<string, string>): SnakeState {
    const gridSize = 20;
    const initialSnake: SnakeSegment[] = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    const food = this.generateFood(initialSnake, gridSize);
    return {
      snake: initialSnake,
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      food,
      score: 0,
      highScore: 0,
      gridSize,
      isPaused: false,
      isGameOver: false,
      playerIds: playerIds.length > 0 ? playerIds : ['player1'],
    };
  }

  generateFood(snake: SnakeSegment[], gridSize: number): SnakeSegment {
    const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
    const emptyCells: SnakeSegment[] = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length === 0) return { x: 0, y: 0 };
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  validateMove(state: SnakeState, move: Move, _playerId?: string): boolean {
    if (state.isGameOver) return false;
    if (move.type === 'CHANGE_DIRECTION') {
      const dir = move.direction as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
      const cur = state.direction;
      if (dir === 'UP' && cur === 'DOWN') return false;
      if (dir === 'DOWN' && cur === 'UP') return false;
      if (dir === 'LEFT' && cur === 'RIGHT') return false;
      if (dir === 'RIGHT' && cur === 'LEFT') return false;
      return true;
    }
    if (move.type === 'TICK' || move.type === 'PAUSE' || move.type === 'RESTART') {
      return true;
    }
    return false;
  }

  applyMove(state: SnakeState, move: Move, _playerId?: string): SnakeState {
    if (move.type === 'PAUSE') {
      return { ...state, isPaused: !state.isPaused };
    }
    if (move.type === 'RESTART') {
      return this.getInitialState(state.playerIds);
    }
    if (move.type === 'CHANGE_DIRECTION') {
      return { ...state, nextDirection: move.direction as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' };
    }

    if (move.type === 'TICK') {
      if (state.isPaused || state.isGameOver) return state;

      const direction = state.nextDirection;
      const head = { ...state.snake[0] };

      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= state.gridSize || head.y < 0 || head.y >= state.gridSize) {
        return { ...state, isGameOver: true };
      }

      // Check self-collision
      for (const segment of state.snake) {
        if (segment.x === head.x && segment.y === head.y) {
          return { ...state, isGameOver: true };
        }
      }

      const newSnake = [head, ...state.snake];

      // Check food
      if (head.x === state.food.x && head.y === state.food.y) {
        const newScore = state.score + 10;
        const newFood = this.generateFood(newSnake, state.gridSize);
        return {
          ...state,
          snake: newSnake,
          direction,
          food: newFood,
          score: newScore,
          highScore: Math.max(state.highScore, newScore),
        };
      } else {
        newSnake.pop(); // Remove tail
        return {
          ...state,
          snake: newSnake,
          direction,
        };
      }
    }

    return state;
  }

  checkWinner(state: SnakeState): WinResult | null {
    if (!state.isGameOver) return null;
    const playerId = state.playerIds[0] || 'player1';
    return {
      winner: playerId,
      scores: { [playerId]: state.score },
      reason: `Game Over! Final Score: ${state.score}`,
    };
  }

  isGameOver(state: SnakeState): boolean {
    return state.isGameOver;
  }

  getAIMove(state: SnakeState): Move {
    // Basic AI finding path toward food
    const head = state.snake[0];
    const food = state.food;
    const candidates: Array<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'> = [];

    if (food.x > head.x && state.direction !== 'LEFT') candidates.push('RIGHT');
    if (food.x < head.x && state.direction !== 'RIGHT') candidates.push('LEFT');
    if (food.y > head.y && state.direction !== 'UP') candidates.push('DOWN');
    if (food.y < head.y && state.direction !== 'DOWN') candidates.push('UP');

    return { type: 'CHANGE_DIRECTION', direction: candidates[0] || state.direction };
  }
}
