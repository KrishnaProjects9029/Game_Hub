import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface RRState {
  players: string[];
  playerNames: Record<string, string>;
  phase: 'waiting' | 'countdown' | 'ready' | 'go' | 'results' | 'finished';
  scores: Record<string, number>;
  reactionTimes: Record<string, number | null>;
  round: number;
  totalRounds: number;
  signalTime: number | null;
  countdownValue: number;
  roundHistory: Array<{ round: number; times: Record<string, number | null>; winnerId: string | 'draw' }>;
  winner: WinResult | null;
  falseStart: Record<string, boolean>;
}

export class ReactionRaceEngine implements GameEngine<RRState> {
  config: GameConfig = {
    id: 'reactionrush',
    name: 'Reaction Rush',
    category: 'reflex',
    description: 'Wait for the correct signal and tap as fast as you can! Avoid false starts.',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '⚡',
    estimatedDuration: '2-4 min',
    controls: {
      desktop: 'Click anywhere or press Space as soon as screen turns green',
      touch: 'Tap the screen as soon as it turns green',
    },
    status: 'playable',
    phase: 2,
    isFeatured: true,
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): RRState {
    return {
      players: playerIds, playerNames,
      phase: 'waiting',
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      reactionTimes: Object.fromEntries(playerIds.map(p => [p, null])),
      round: 1, totalRounds: 5,
      signalTime: null, countdownValue: 3,
      roundHistory: [], winner: null,
      falseStart: Object.fromEntries(playerIds.map(p => [p, false])),
    };
  }

  validateMove(state: RRState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type } = move as { type: string };
    return type === 'tap' || type === 'start_round' || type === 'countdown_tick' || type === 'signal' || type === 'go';
  }

  applyMove(state: RRState, move: Move, playerId: string): RRState {
    const m = move as { type: string; reactionMs?: number; countdownValue?: number };
    if (m.type === 'start_round') {
      return {
        ...state, phase: 'countdown', countdownValue: 3,
        reactionTimes: Object.fromEntries(state.players.map(p => [p, null])),
        falseStart: Object.fromEntries(state.players.map(p => [p, false])),
        signalTime: null,
      };
    }
    if (m.type === 'countdown_tick') {
      const next = (m.countdownValue ?? state.countdownValue) - 1;
      if (next <= 0) return { ...state, phase: 'go', signalTime: Date.now(), countdownValue: 0 };
      return { ...state, countdownValue: next };
    }
    if (m.type === 'signal' || m.type === 'go') {
      return { ...state, phase: 'go', signalTime: Date.now() };
    }
    if (m.type === 'tap') {
      const reactionMs = m.reactionMs ?? 0;
      const isFalseStart = state.phase !== 'go';
      const newFalseStart = { ...state.falseStart };
      const newTimes = { ...state.reactionTimes };
      if (isFalseStart) {
        newFalseStart[playerId] = true;
        newTimes[playerId] = -1; // penalty
        // Ensure round finishes on false start
        for (const p of state.players) {
          if (p !== playerId && newTimes[p] === null) {
            newTimes[p] = 450;
          }
        }
      } else {
        if (newTimes[playerId] === null) newTimes[playerId] = reactionMs;
      }
      const allDone = state.players.every(p => newTimes[p] !== null);
      if (!allDone) return { ...state, reactionTimes: newTimes, falseStart: newFalseStart, phase: isFalseStart ? state.phase : 'go' };
      // Resolve round
      let roundWinner: string | 'draw' = 'draw';
      let bestTime = Infinity;
      for (const p of state.players) {
        const t = newTimes[p];
        if (t !== null && t >= 0 && t < bestTime) { bestTime = t; roundWinner = p; }
      }
      const newScores = { ...state.scores };
      if (roundWinner !== 'draw') newScores[roundWinner] = (newScores[roundWinner] ?? 0) + 1;
      const history = [...state.roundHistory, { round: state.round, times: { ...newTimes }, winnerId: roundWinner }];
      const isLastRound = state.round >= state.totalRounds;
      let gameWinner: WinResult | null = null;
      if (isLastRound) {
        const maxScore = Math.max(...state.players.map(p => newScores[p]));
        const leaders = state.players.filter(p => newScores[p] === maxScore);
        gameWinner = { winner: leaders.length === 1 ? leaders[0] : 'draw', scores: newScores };
      }
      return {
        ...state, reactionTimes: newTimes, falseStart: newFalseStart,
        scores: newScores, phase: isLastRound ? 'finished' : 'results',
        roundHistory: history, winner: gameWinner,
        round: isLastRound ? state.round : state.round + 1,
      };
    }

    return state;
  }

  checkWinner(state: RRState): WinResult | null { return state.winner; }
  isGameOver(state: RRState): boolean { return state.phase === 'finished'; }

  getAIMove(_state: RRState, _playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    // Human reaction benchmarks (ms) based on real visual reaction psychometrics
    // Hard: 215ms - 290ms (athletic gamer reflex, rare 2% early flinch)
    // Medium: 270ms - 390ms (average active gamer, 4% flinch)
    // Easy: 360ms - 540ms (casual/distracted player, 8% flinch)
    const flinchChance = difficulty === 'hard' ? 0.02 : difficulty === 'medium' ? 0.04 : 0.08;
    if (Math.random() < flinchChance) {
      return { type: 'tap', reactionMs: -1 }; // False start flinch
    }

    const ranges: Record<string, [number, number]> = {
      hard: [215, 290],
      medium: [270, 390],
      easy: [360, 540],
    };
    const [min, max] = ranges[difficulty];
    // Add natural human micro-jitter
    const base = Math.floor(Math.random() * (max - min) + min);
    const jitter = Math.floor(Math.random() * 20 - 10);
    const reactionMs = Math.max(195, base + jitter);
    return { type: 'tap', reactionMs };
  }
}
