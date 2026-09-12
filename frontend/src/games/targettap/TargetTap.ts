import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface TargetBubble {
  id: number;
  x: number; // percentage 10-90
  y: number; // percentage 10-90
  size: number;
  points: number;
  color: string;
}

export interface TargetTapState {
  players: string[];
  playerNames: Record<string, string>;
  scores: Record<string, number>;
  combos: Record<string, number>;
  hits: Record<string, number>;
  misses: Record<string, number>;
  timeLeft: number; // 30 seconds
  targets: TargetBubble[];
  phase: 'countdown' | 'playing' | 'finished';
  winner: WinResult | null;
}

export class TargetTapEngine implements GameEngine<TargetTapState> {
  config: GameConfig = {
    id: 'targettap',
    name: 'Target Tap',
    category: 'reflex',
    description: '30-second target frenzy! Tap targets rapidly and build combos for high scores.',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🏹',
    estimatedDuration: '1-2 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): TargetTapState {
    return {
      players: playerIds,
      playerNames,
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      combos: Object.fromEntries(playerIds.map(p => [p, 0])),
      hits: Object.fromEntries(playerIds.map(p => [p, 0])),
      misses: Object.fromEntries(playerIds.map(p => [p, 0])),
      timeLeft: 30,
      targets: [
        { id: 1, x: 50, y: 50, size: 55, points: 10, color: '#ec4899' },
        { id: 2, x: 25, y: 35, size: 50, points: 10, color: '#8b5cf6' },
        { id: 3, x: 75, y: 65, size: 45, points: 15, color: '#06b6d4' },
      ],
      phase: 'playing',
      winner: null,
    };
  }

  validateMove(state: TargetTapState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type } = move as { type: string };
    return type === 'hit_target' || type === 'miss_tap' || type === 'time_tick' || type === 'end_game';
  }

  applyMove(state: TargetTapState, move: Move, playerId: string): TargetTapState {
    const { type, targetId, newTarget } = move as { type: string; targetId?: number; newTarget?: TargetBubble };

    if (type === 'hit_target' && targetId !== undefined) {
      const target = state.targets.find(t => t.id === targetId);
      const combo = (state.combos[playerId] || 0) + 1;
      const multiplier = combo > 10 ? 3 : combo > 5 ? 2 : 1;
      const pts = ((target?.points || 10) * multiplier);

      const nextTarget: TargetBubble = newTarget || {
        id: Date.now() + Math.random(),
        x: Math.floor(Math.random() * 75) + 12,
        y: Math.floor(Math.random() * 75) + 12,
        size: Math.floor(Math.random() * 20) + 40,
        points: Math.random() < 0.25 ? 20 : 10,
        color: ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
      };

      const updatedTargets = state.targets.filter(t => t.id !== targetId).concat(nextTarget);

      return {
        ...state,
        scores: { ...state.scores, [playerId]: (state.scores[playerId] || 0) + pts },
        combos: { ...state.combos, [playerId]: combo },
        hits: { ...state.hits, [playerId]: (state.hits[playerId] || 0) + 1 },
        targets: updatedTargets,
      };
    }

    if (type === 'miss_tap') {
      return {
        ...state,
        combos: { ...state.combos, [playerId]: 0 },
        misses: { ...state.misses, [playerId]: (state.misses[playerId] || 0) + 1 },
      };
    }

    if (type === 'time_tick') {
      const nextTime = Math.max(0, state.timeLeft - 1);
      if (nextTime === 0) {
        const maxScore = Math.max(...state.players.map(p => state.scores[p] || 0));
        const winners = state.players.filter(p => state.scores[p] === maxScore);
        return {
          ...state,
          timeLeft: 0,
          phase: 'finished',
          winner: {
            winner: winners.length === 1 ? winners[0] : 'draw',
            scores: state.scores,
          },
        };
      }
      return { ...state, timeLeft: nextTime };
    }

    if (type === 'end_game') {
      const maxScore = Math.max(...state.players.map(p => state.scores[p] || 0));
      const winners = state.players.filter(p => state.scores[p] === maxScore);
      return {
        ...state,
        phase: 'finished',
        winner: {
          winner: winners.length === 1 ? winners[0] : 'draw',
          scores: state.scores,
        },
      };
    }

    return state;
  }

  checkWinner(state: TargetTapState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: TargetTapState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: TargetTapState, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    if (state.targets.length > 0 && state.phase === 'playing') {
      const target = state.targets[Math.floor(Math.random() * state.targets.length)];
      const willHit = difficulty === 'hard' ? 0.9 : difficulty === 'medium' ? 0.75 : 0.55;
      if (Math.random() < willHit) {
        return { type: 'hit_target', targetId: target.id };
      }
      return { type: 'miss_tap' };
    }
    return { type: 'time_tick' };
  }
}
