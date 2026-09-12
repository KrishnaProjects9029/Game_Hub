import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface NinjaDodgeState {
  players: string[];
  playerNames: Record<string, string>;
  survivalTimes: Record<string, number>; // seconds or ticks survived
  lives: Record<string, number>;         // 3 lives each
  isAlive: Record<string, boolean>;
  scores: Record<string, number>;
  phase: 'dodging' | 'finished';
  winner: WinResult | null;
}

export class NinjaDodgeEngine implements GameEngine<NinjaDodgeState> {
  config: GameConfig = {
    id: 'ninjadodge',
    name: 'Ninja Dodge',
    category: 'action',
    description: 'Dodge flying shurikens and razor kunais! Master your reflexes to survive the barrage.',
    minPlayers: 1,
    maxPlayers: 4,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🥷',
    estimatedDuration: '1-2 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): NinjaDodgeState {
    return {
      players: playerIds,
      playerNames,
      survivalTimes: Object.fromEntries(playerIds.map(p => [p, 0])),
      lives: Object.fromEntries(playerIds.map(p => [p, 3])),
      isAlive: Object.fromEntries(playerIds.map(p => [p, true])),
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      phase: 'dodging',
      winner: null,
    };
  }

  validateMove(state: NinjaDodgeState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type } = move as { type: string };
    return type === 'update_survival' || type === 'hit' || type === 'bonus_scroll';
  }

  applyMove(state: NinjaDodgeState, move: Move, playerId: string): NinjaDodgeState {
    const { type, time, bonus } = move as { type: string; time?: number; bonus?: number };

    if (type === 'update_survival' && time !== undefined) {
      if (!state.isAlive[playerId]) return state;

      const newSurvival = { ...state.survivalTimes, [playerId]: time };
      const newScores = {
        ...state.scores,
        [playerId]: Math.floor(time * 10) + (state.scores[playerId] || 0) % 50,
      };

      return {
        ...state,
        survivalTimes: newSurvival,
        scores: newScores,
      };
    }

    if (type === 'bonus_scroll') {
      const addBonus = bonus || 50;
      return {
        ...state,
        scores: {
          ...state.scores,
          [playerId]: (state.scores[playerId] || 0) + addBonus,
        },
      };
    }

    if (type === 'hit') {
      const curLives = state.lives[playerId] || 1;
      const nextLives = Math.max(0, curLives - 1);
      const isStillAlive = nextLives > 0;

      const newLives = { ...state.lives, [playerId]: nextLives };
      const newAlive = { ...state.isAlive, [playerId]: isStillAlive };

      const anyAlive = state.players.some(p => newAlive[p]);

      if (!anyAlive || (state.players.length > 1 && Object.values(newAlive).filter(Boolean).length <= 1)) {
        const sorted = [...state.players].sort((a, b) => {
          const scoreDiff = (state.scores[b] || 0) - (state.scores[a] || 0);
          if (scoreDiff !== 0) return scoreDiff;
          return (state.survivalTimes[b] || 0) - (state.survivalTimes[a] || 0);
        });

        const points = [100, 70, 50, 30];
        const finalScores: Record<string, number> = {};
        sorted.forEach((p, idx) => {
          finalScores[p] = points[idx] || 20;
        });

        return {
          ...state,
          lives: newLives,
          isAlive: newAlive,
          scores: finalScores,
          phase: 'finished',
          winner: {
            winner: sorted[0] || 'draw',
            scores: finalScores,
          },
        };
      }

      return {
        ...state,
        lives: newLives,
        isAlive: newAlive,
      };
    }

    return state;
  }

  checkWinner(state: NinjaDodgeState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: NinjaDodgeState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: NinjaDodgeState, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const failRate = difficulty === 'hard' ? 0.02 : difficulty === 'medium' ? 0.05 : 0.09;
    if (Math.random() < failRate) {
      return { type: 'hit' };
    }
    const curTime = state.survivalTimes[playerId] || 0;
    return { type: 'update_survival', time: curTime + 1 };
  }
}
