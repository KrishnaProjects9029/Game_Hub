import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface FastestFingerState {
  players: string[];
  playerNames: Record<string, string>;
  round: number;
  totalRounds: number;
  gridSize: number; // e.g. 16 (4x4)
  activeTile: number | null; // which tile is the target
  scores: Record<string, number>;
  taps: Record<string, { tile: number; timeMs: number; isHit: boolean } | null>;
  phase: 'waiting' | 'ready' | 'target_active' | 'round_result' | 'finished';
  winner: WinResult | null;
  targetAppearanceTime: number | null;
}

export class FastestFingerEngine implements GameEngine<FastestFingerState> {
  config: GameConfig = {
    id: 'fastestfinger',
    name: 'Fastest Finger',
    category: 'reflex',
    description: 'A target flashes in a random slot. Tap it with lightning speed! Beware of mis-clicks.',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🎯',
    estimatedDuration: '1-3 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): FastestFingerState {
    return {
      players: playerIds,
      playerNames,
      round: 1,
      totalRounds: 5,
      gridSize: 16,
      activeTile: null,
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      taps: Object.fromEntries(playerIds.map(p => [p, null])),
      phase: 'ready',
      winner: null,
      targetAppearanceTime: null,
    };
  }

  validateMove(state: FastestFingerState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type } = move as { type: string; tile?: number };

    if (type === 'spawn_target') {
      return state.phase === 'ready';
    }
    if (type === 'tap_tile') {
      return state.phase === 'target_active' && state.taps[playerId] === null;
    }
    if (type === 'next_round') {
      return state.phase === 'round_result';
    }
    return false;
  }

  applyMove(state: FastestFingerState, move: Move, playerId: string): FastestFingerState {
    const { type, tile, timeMs } = move as { type: string; tile?: number; timeMs?: number };

    if (type === 'spawn_target') {
      const activeTile = Math.floor(Math.random() * state.gridSize);
      return {
        ...state,
        phase: 'target_active',
        activeTile,
        targetAppearanceTime: Date.now(),
        taps: Object.fromEntries(state.players.map(p => [p, null])),
      };
    }

    if (type === 'tap_tile' && tile !== undefined) {
      const isHit = tile === state.activeTile;
      const elapsed = timeMs ?? (state.targetAppearanceTime ? Math.max(80, Date.now() - state.targetAppearanceTime) : 500);
      const points = isHit ? Math.max(50, 160 - Math.floor(elapsed / 10)) : -25;

      const newTaps = {
        ...state.taps,
        [playerId]: { tile, timeMs: elapsed, isHit },
      };
      const newScores = {
        ...state.scores,
        [playerId]: Math.max(0, (state.scores[playerId] || 0) + points),
      };

      const allTapped = state.players.every(p => newTaps[p] !== null);
      if (allTapped) {
        const isLastRound = state.round >= state.totalRounds;
        let winner: WinResult | null = null;
        if (isLastRound) {
          const maxScore = Math.max(...state.players.map(p => newScores[p] || 0));
          const winners = state.players.filter(p => newScores[p] === maxScore);
          winner = {
            winner: winners.length === 1 ? winners[0] : 'draw',
            scores: newScores,
          };
        }

        return {
          ...state,
          taps: newTaps,
          scores: newScores,
          phase: isLastRound ? 'finished' : 'round_result',
          winner,
        };
      }

      return {
        ...state,
        taps: newTaps,
        scores: newScores,
      };
    }

    if (type === 'next_round') {
      return {
        ...state,
        round: state.round + 1,
        activeTile: null,
        targetAppearanceTime: null,
        taps: Object.fromEntries(state.players.map(p => [p, null])),
        phase: 'ready',
      };
    }

    return state;
  }

  checkWinner(state: FastestFingerState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: FastestFingerState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: FastestFingerState, _playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    if (state.phase === 'target_active' && state.activeTile !== null) {
      const isAccurate = difficulty === 'hard' ? 0.95 : difficulty === 'medium' ? 0.78 : 0.55;
      const willHit = Math.random() < isAccurate;
      const target = willHit ? state.activeTile : (state.activeTile + 1) % state.gridSize;

      const delay = difficulty === 'hard'
        ? Math.floor(Math.random() * 200) + 220
        : difficulty === 'medium'
        ? Math.floor(Math.random() * 300) + 380
        : Math.floor(Math.random() * 500) + 600;

      return { type: 'tap_tile', tile: target, timeMs: delay };
    }
    return { type: 'spawn_target' };
  }
}
