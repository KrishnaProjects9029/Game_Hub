import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface ObstacleRushState {
  players: string[];
  playerNames: Record<string, string>;
  distances: Record<string, number>; // distance run in meters (goal 500m)
  lives: Record<string, number>; // 3 lives each
  finishedRacers: string[];
  scores: Record<string, number>;
  targetDistance: number;
  phase: 'running' | 'finished';
  winner: WinResult | null;
}

export class ObstacleRushEngine implements GameEngine<ObstacleRushState> {
  config: GameConfig = {
    id: 'obstaclerush',
    name: 'Obstacle Rush',
    category: 'running',
    description: 'Jump, duck, and dash through hazardous obstacles to reach the finish line!',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🏃',
    estimatedDuration: '1-3 min',
    controls: {
      desktop: 'Up Arrow / Space to Jump, Down Arrow to Slide',
      touch: 'Tap Jump / Slide action buttons',
    },
    status: 'playable',
    phase: 8,
    isFeatured: true,
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): ObstacleRushState {
    return {
      players: playerIds,
      playerNames,
      distances: Object.fromEntries(playerIds.map(p => [p, 0])),
      lives: Object.fromEntries(playerIds.map(p => [p, 3])),
      finishedRacers: [],
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      targetDistance: 500,
      phase: 'running',
      winner: null,
    };
  }

  validateMove(state: ObstacleRushState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type } = move as { type: string };
    return type === 'update_progress' || type === 'hit_obstacle' || type === 'finish_runner';
  }

  applyMove(state: ObstacleRushState, move: Move, playerId: string): ObstacleRushState {
    const { type, distanceDelta } = move as { type: string; distanceDelta?: number };

    if (type === 'update_progress' && distanceDelta !== undefined) {
      if (state.finishedRacers.includes(playerId) || (state.lives[playerId] || 0) <= 0) return state;

      const currentDist = state.distances[playerId] || 0;
      const nextDist = Math.min(state.targetDistance, currentDist + distanceDelta);
      const newDistances = { ...state.distances, [playerId]: nextDist };

      let newFinished = [...state.finishedRacers];
      if (nextDist >= state.targetDistance && !newFinished.includes(playerId)) {
        newFinished.push(playerId);
      }

      // Check if all players either finished or lost all lives
      const allDone = state.players.every(
        p => newFinished.includes(p) || (state.lives[p] || 0) <= 0
      );

      if (allDone || newFinished.length >= 1) {
        const sorted = [...state.players].sort((a, b) => {
          const fa = newFinished.indexOf(a);
          const fb = newFinished.indexOf(b);
          if (fa !== -1 && fb !== -1) return fa - fb;
          if (fa !== -1) return -1;
          if (fb !== -1) return 1;
          return (newDistances[b] || 0) - (newDistances[a] || 0);
        });

        const points = [100, 70, 50, 30, 20, 10];
        const newScores: Record<string, number> = {};
        sorted.forEach((p, idx) => {
          newScores[p] = points[idx] || 10;
        });

        return {
          ...state,
          distances: newDistances,
          finishedRacers: newFinished,
          scores: newScores,
          phase: 'finished',
          winner: {
            winner: sorted[0] || 'draw',
            scores: newScores,
          },
        };
      }

      return {
        ...state,
        distances: newDistances,
        finishedRacers: newFinished,
      };
    }

    if (type === 'hit_obstacle') {
      const remainingLives = Math.max(0, (state.lives[playerId] || 1) - 1);
      const newLives = { ...state.lives, [playerId]: remainingLives };

      const allDeadOrDone = state.players.every(
        p => state.finishedRacers.includes(p) || (newLives[p] || 0) <= 0
      );

      if (allDeadOrDone) {
        const maxDist = Math.max(...state.players.map(p => state.distances[p] || 0));
        const winners = state.players.filter(p => (state.distances[p] || 0) === maxDist);
        return {
          ...state,
          lives: newLives,
          phase: 'finished',
          winner: {
            winner: winners[0] || 'draw',
            scores: state.distances,
          },
        };
      }

      return {
        ...state,
        lives: newLives,
      };
    }

    return state;
  }

  checkWinner(state: ObstacleRushState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: ObstacleRushState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: ObstacleRushState, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const pace = difficulty === 'hard' ? 25 : difficulty === 'medium' ? 18 : 12;
    if (Math.random() < 0.04) {
      return { type: 'hit_obstacle' };
    }
    return { type: 'update_progress', distanceDelta: pace };
  }
}
