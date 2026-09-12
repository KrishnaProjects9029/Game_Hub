import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface SpaceDodgeState {
  players: string[];
  playerNames: Record<string, string>;
  shields: Record<string, number>;      // 100 shield points
  crystals: Record<string, number>;     // Collected energy crystals
  distance: Record<string, number>;     // Light years traveled
  isDestroyed: Record<string, boolean>;
  scores: Record<string, number>;
  phase: 'flying' | 'finished';
  winner: WinResult | null;
}

export class SpaceDodgeEngine implements GameEngine<SpaceDodgeState> {
  config: GameConfig = {
    id: 'spacedodge',
    name: 'Space Dodge',
    category: 'action',
    description: 'Pilot your starship through a dense asteroid field! Collect warp crystals and survive the cosmos.',
    minPlayers: 1,
    maxPlayers: 4,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🚀',
    estimatedDuration: '1-2 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): SpaceDodgeState {
    return {
      players: playerIds,
      playerNames,
      shields: Object.fromEntries(playerIds.map(p => [p, 100])),
      crystals: Object.fromEntries(playerIds.map(p => [p, 0])),
      distance: Object.fromEntries(playerIds.map(p => [p, 0])),
      isDestroyed: Object.fromEntries(playerIds.map(p => [p, false])),
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      phase: 'flying',
      winner: null,
    };
  }

  validateMove(state: SpaceDodgeState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type } = move as { type: string };
    return type === 'update_telemetry' || type === 'hit_asteroid' || type === 'collect_crystal';
  }

  applyMove(state: SpaceDodgeState, move: Move, playerId: string): SpaceDodgeState {
    const { type, distDelta, damage, value } = move as {
      type: string;
      distDelta?: number;
      damage?: number;
      value?: number;
    };

    if (type === 'update_telemetry' && distDelta !== undefined) {
      if (state.isDestroyed[playerId]) return state;

      const newDist = (state.distance[playerId] || 0) + distDelta;
      const updatedDist = { ...state.distance, [playerId]: newDist };
      const currentCrystals = state.crystals[playerId] || 0;
      const updatedScores = {
        ...state.scores,
        [playerId]: Math.floor(newDist * 5) + currentCrystals * 50,
      };

      return {
        ...state,
        distance: updatedDist,
        scores: updatedScores,
      };
    }

    if (type === 'collect_crystal') {
      const addVal = value || 1;
      const newCrystals = {
        ...state.crystals,
        [playerId]: (state.crystals[playerId] || 0) + addVal,
      };
      const newScores = {
        ...state.scores,
        [playerId]: (state.scores[playerId] || 0) + addVal * 50,
      };

      return {
        ...state,
        crystals: newCrystals,
        scores: newScores,
      };
    }

    if (type === 'hit_asteroid') {
      const curShield = state.shields[playerId] ?? 100;
      const dmg = damage ?? 25;
      const nextShield = Math.max(0, curShield - dmg);
      const isDead = nextShield <= 0;

      const updatedShields = { ...state.shields, [playerId]: nextShield };
      const updatedDestroyed = { ...state.isDestroyed, [playerId]: isDead };

      const anyAlive = state.players.some(p => !updatedDestroyed[p]);

      if (!anyAlive || (state.players.length > 1 && Object.values(updatedDestroyed).filter(d => !d).length <= 1)) {
        const sorted = [...state.players].sort((a, b) => (state.scores[b] || 0) - (state.scores[a] || 0));
        const points = [100, 70, 50, 30];
        const finalScores: Record<string, number> = {};
        sorted.forEach((p, idx) => {
          finalScores[p] = points[idx] || 20;
        });

        return {
          ...state,
          shields: updatedShields,
          isDestroyed: updatedDestroyed,
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
        shields: updatedShields,
        isDestroyed: updatedDestroyed,
      };
    }

    return state;
  }

  checkWinner(state: SpaceDodgeState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: SpaceDodgeState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: SpaceDodgeState, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const hitChance = difficulty === 'hard' ? 0.03 : difficulty === 'medium' ? 0.07 : 0.12;
    if (Math.random() < hitChance) {
      return { type: 'hit_asteroid', damage: 25 };
    }
    if (Math.random() < 0.2) {
      return { type: 'collect_crystal', value: 1 };
    }
    return { type: 'update_telemetry', distDelta: 3 };
  }
}
