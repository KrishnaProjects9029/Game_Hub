import { GameConfig, GameEngine, Move, WinResult } from '../engine/GameEngine';

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  isDestroyed: boolean;
}

export interface BreakoutState {
  paddleX: number;
  paddleWidth: number;
  paddleHeight: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  ballRadius: number;
  isBallLaunched: boolean;
  bricks: Brick[];
  score: number;
  lives: number;
  isPaused: boolean;
  isGameOver: boolean;
  isWon: boolean;
  playerIds: string[];
}

export class BreakoutEngine implements GameEngine<BreakoutState> {
  config: GameConfig = {
    id: 'breakout',
    name: 'Breakout Arcade',
    category: 'reflex',
    description: 'Bounce the ball off your paddle to smash through walls of colored bricks in this thrilling arcade classic!',
    supportsSinglePlayer: true,
    supportsMultiplayer: false,
    minPlayers: 1,
    maxPlayers: 1,
    difficulty: 'medium',
    icon: '🧱',
    estimatedDuration: '2-6 min',
    controls: {
      desktop: '← → or mouse to move paddle, Space or Click to launch ball, P to pause',
      touch: 'Drag finger horizontally to steer paddle',
    },
    status: 'playable',
    phase: 1,
    isFeatured: true,
    popularityRank: 7,
  };

  readonly BOARD_WIDTH = 480;
  readonly BOARD_HEIGHT = 420;

  getInitialState(playerIds: string[], _playerNames?: Record<string, string>): BreakoutState {
    const paddleWidth = 84;
    const paddleHeight = 12;
    const paddleX = (this.BOARD_WIDTH - paddleWidth) / 2;

    const bricks = this.generateBricks();

    return {
      paddleX,
      paddleWidth,
      paddleHeight,
      ballX: this.BOARD_WIDTH / 2,
      ballY: this.BOARD_HEIGHT - 32,
      ballVx: 4,
      ballVy: -4,
      ballRadius: 6,
      isBallLaunched: false,
      bricks,
      score: 0,
      lives: 3,
      isPaused: false,
      isGameOver: false,
      isWon: false,
      playerIds: playerIds.length > 0 ? playerIds : ['player1'],
    };
  }

  generateBricks(): Brick[] {
    const rows = 5;
    const cols = 8;
    const brickWidth = 52;
    const brickHeight = 16;
    const padding = 6;
    const offsetTop = 40;
    const offsetLeft = (this.BOARD_WIDTH - (cols * (brickWidth + padding) - padding)) / 2;

    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
    const points = [50, 40, 30, 20, 10];

    const bricks: Brick[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: offsetLeft + c * (brickWidth + padding),
          y: offsetTop + r * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          color: colors[r],
          points: points[r],
          isDestroyed: false,
        });
      }
    }
    return bricks;
  }

  validateMove(state: BreakoutState, move: Move, _playerId?: string): boolean {
    if (move.type === 'RESTART' || move.type === 'PAUSE') return true;
    if (state.isGameOver) return false;
    if (move.type === 'MOVE_PADDLE') {
      const x = move.x as number;
      return typeof x === 'number';
    }
    if (move.type === 'LAUNCH_BALL') {
      return !state.isBallLaunched;
    }
    if (move.type === 'TICK') return true;
    return false;
  }

  applyMove(state: BreakoutState, move: Move, _playerId?: string): BreakoutState {
    if (move.type === 'PAUSE') {
      return { ...state, isPaused: !state.isPaused };
    }
    if (move.type === 'RESTART') {
      return this.getInitialState(state.playerIds);
    }
    if (state.isPaused || state.isGameOver) return state;

    if (move.type === 'MOVE_PADDLE') {
      let x = move.x as number;
      x = Math.max(0, Math.min(this.BOARD_WIDTH - state.paddleWidth, x));
      let newBallX = state.ballX;
      if (!state.isBallLaunched) {
        newBallX = x + state.paddleWidth / 2;
      }
      return { ...state, paddleX: x, ballX: newBallX };
    }

    if (move.type === 'LAUNCH_BALL') {
      return { ...state, isBallLaunched: true };
    }

    if (move.type === 'TICK') {
      if (!state.isBallLaunched) return state;

      let { ballX, ballY, ballVx, ballVy, lives, score } = state;
      ballX += ballVx;
      ballY += ballVy;

      // Wall reflections: Left & Right
      if (ballX - state.ballRadius <= 0) {
        ballX = state.ballRadius;
        ballVx = Math.abs(ballVx);
      } else if (ballX + state.ballRadius >= this.BOARD_WIDTH) {
        ballX = this.BOARD_WIDTH - state.ballRadius;
        ballVx = -Math.abs(ballVx);
      }

      // Ceiling reflection: Top
      if (ballY - state.ballRadius <= 0) {
        ballY = state.ballRadius;
        ballVy = Math.abs(ballVy);
      }

      // Floor loss: Bottom
      if (ballY + state.ballRadius >= this.BOARD_HEIGHT) {
        lives -= 1;
        if (lives <= 0) {
          return { ...state, lives: 0, isGameOver: true, isWon: false };
        } else {
          // Reset ball to paddle
          return {
            ...state,
            lives,
            ballX: state.paddleX + state.paddleWidth / 2,
            ballY: this.BOARD_HEIGHT - 32,
            ballVx: 4,
            ballVy: -4,
            isBallLaunched: false,
          };
        }
      }

      // Paddle collision
      const paddleY = this.BOARD_HEIGHT - 24;
      if (
        ballY + state.ballRadius >= paddleY &&
        ballY - state.ballRadius <= paddleY + state.paddleHeight &&
        ballX >= state.paddleX &&
        ballX <= state.paddleX + state.paddleWidth
      ) {
        ballVy = -Math.abs(ballVy);
        // Angle variation based on where it hit the paddle
        const hitOffset = (ballX - (state.paddleX + state.paddleWidth / 2)) / (state.paddleWidth / 2);
        ballVx = hitOffset * 6; // -6 to +6
      }

      // Brick collisions
      const newBricks = state.bricks.map((b) => ({ ...b }));
      let bricksLeft = 0;

      for (const brick of newBricks) {
        if (!brick.isDestroyed) {
          if (
            ballX + state.ballRadius >= brick.x &&
            ballX - state.ballRadius <= brick.x + brick.width &&
            ballY + state.ballRadius >= brick.y &&
            ballY - state.ballRadius <= brick.y + brick.height
          ) {
            brick.isDestroyed = true;
            ballVy = -ballVy;
            score += brick.points;
          } else {
            bricksLeft++;
          }
        }
      }

      const isWon = bricksLeft === 0;
      const isGameOver = isWon;

      return {
        ...state,
        ballX,
        ballY,
        ballVx,
        ballVy,
        score,
        lives,
        bricks: newBricks,
        isWon,
        isGameOver,
      };
    }

    return state;
  }

  checkWinner(state: BreakoutState): WinResult | null {
    if (!state.isGameOver) return null;
    const playerId = state.playerIds[0] || 'player1';
    return {
      winner: state.isWon ? playerId : 'draw',
      scores: { [playerId]: state.score },
      reason: state.isWon ? `Victory! All Bricks Smashed! Score: ${state.score}` : 'Out of Lives! Game Over.',
    };
  }

  isGameOver(state: BreakoutState): boolean {
    return state.isGameOver;
  }

  getAIMove(state: BreakoutState): Move {
    // Keep paddle centered on ball
    const targetX = state.ballX - state.paddleWidth / 2;
    return { type: 'MOVE_PADDLE', x: targetX };
  }
}
