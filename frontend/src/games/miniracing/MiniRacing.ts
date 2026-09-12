import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface RacerProgress {
  playerId: string;
  lap: number; // 0, 1, 2, 3
  checkpoint: number; // 0..3
  distance: number; // total distance along track
  finishTimeMs: number | null;
  position: number | null; // 1, 2, 3, 4
}

export interface MiniRacingState {
  players: string[];
  playerNames: Record<string, string>;
  totalLaps: number;
  racers: Record<string, RacerProgress>;
  scores: Record<string, number>;
  phase: 'countdown' | 'racing' | 'finished';
  winner: WinResult | null;
  raceStartTime: number | null;
}

export class MiniRacingEngine implements GameEngine<MiniRacingState> {
  config: GameConfig = {
    id: 'miniracing',
    name: 'Mini Racing',
    category: 'racing',
    description: 'Top-down arcade racing! Steer your mini racer around the circuit, hit boosts, and finish 1st.',
    minPlayers: 1,
    maxPlayers: 4,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🏎️',
    estimatedDuration: '2-4 min',
    controls: {
      desktop: 'Arrow Keys or A/D to steer, Space to Boost',
      touch: 'Steering buttons on left/right & Boost button',
    },
    status: 'playable',
    phase: 6,
    isFeatured: true,
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): MiniRacingState {
    const racers: Record<string, RacerProgress> = {};
    for (const pid of playerIds) {
      racers[pid] = {
        playerId: pid,
        lap: 1,
        checkpoint: 0,
        distance: 0,
        finishTimeMs: null,
        position: null,
      };
    }

    return {
      players: playerIds,
      playerNames,
      totalLaps: 3,
      racers,
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      phase: 'countdown',
      winner: null,
      raceStartTime: null,
    };
  }

  validateMove(state: MiniRacingState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type } = move as { type: string };
    return type === 'start_race' || type === 'cross_checkpoint' || type === 'finish_race';
  }

  applyMove(state: MiniRacingState, move: Move, playerId: string): MiniRacingState {
    const { type, checkpoint, timeMs } = move as { type: string; checkpoint?: number; timeMs?: number };

    if (type === 'start_race') {
      return {
        ...state,
        phase: 'racing',
        raceStartTime: Date.now(),
      };
    }

    if (type === 'cross_checkpoint' && checkpoint !== undefined) {
      const racer = state.racers[playerId];
      if (!racer || racer.finishTimeMs !== null) return state;

      let nextLap = racer.lap;
      let nextCp = racer.checkpoint;

      // Track has 4 checkpoints: 0, 1, 2, 3
      if (checkpoint === (racer.checkpoint + 1) % 4) {
        nextCp = checkpoint;
        if (nextCp === 0) {
          nextLap = racer.lap + 1;
        }
      }

      const isFinished = nextLap > state.totalLaps;
      const finishedCount = Object.values(state.racers).filter(r => r.finishTimeMs !== null).length;
      const rank = isFinished ? finishedCount + 1 : null;
      const finishTime = isFinished ? (timeMs ?? (state.raceStartTime ? Date.now() - state.raceStartTime : 30000)) : null;

      const updatedRacer: RacerProgress = {
        ...racer,
        lap: Math.min(nextLap, state.totalLaps),
        checkpoint: nextCp,
        distance: racer.distance + 1,
        finishTimeMs: finishTime,
        position: rank,
      };

      const newRacers = { ...state.racers, [playerId]: updatedRacer };
      const allFinished = state.players.every(p => newRacers[p].finishTimeMs !== null);

      if (allFinished || (isFinished && state.players.length === 1)) {
        // Compute scores by finish position: 1st=100, 2nd=70, 3rd=50, 4th=30
        const pointsTable = [100, 70, 50, 30];
        const newScores: Record<string, number> = {};
        for (const p of state.players) {
          const pos = newRacers[p].position || 4;
          newScores[p] = pointsTable[pos - 1] ?? 20;
        }

        const winnerId = Object.entries(newRacers).find(([, r]) => r.position === 1)?.[0] || state.players[0];

        return {
          ...state,
          racers: newRacers,
          scores: newScores,
          phase: 'finished',
          winner: {
            winner: winnerId,
            scores: newScores,
          },
        };
      }

      return {
        ...state,
        racers: newRacers,
      };
    }

    if (type === 'finish_race') {
      const winnerId = state.players[0];
      return {
        ...state,
        phase: 'finished',
        winner: {
          winner: winnerId,
          scores: { [winnerId]: 100 },
        },
      };
    }

    return state;
  }

  checkWinner(state: MiniRacingState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: MiniRacingState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: MiniRacingState, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const racer = state.racers[playerId];
    if (racer && racer.finishTimeMs === null) {
      const nextCp = (racer.checkpoint + 1) % 4;
      const speed = difficulty === 'hard' ? 2200 : difficulty === 'medium' ? 2800 : 3600;
      const elapsed = state.raceStartTime ? Date.now() - state.raceStartTime + speed : speed;
      return { type: 'cross_checkpoint', checkpoint: nextCp, timeMs: elapsed };
    }
    return { type: 'start_race' };
  }
}
