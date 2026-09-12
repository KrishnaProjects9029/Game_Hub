import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface BombPassState {
  players: string[];
  playerNames: Record<string, string>;
  activePlayerId: string;
  lives: Record<string, number>;
  eliminated: string[];
  bombTimerSeconds: number; // secret countdown in seconds
  passedCount: number;
  phase: 'ticking' | 'exploded' | 'finished';
  winner: WinResult | null;
  lastEliminated: string | null;
}

function getRandomTimer(): number {
  return Math.floor(Math.random() * 12) + 10; // 10-22 seconds
}

export class BombPassEngine implements GameEngine<BombPassState> {
  config: GameConfig = {
    id: 'bombpass',
    name: 'Bomb Pass',
    category: 'party',
    description: 'Hot potato with a cartoon bomb! Pass it quickly before the secret fuse blows up.',
    minPlayers: 2,
    maxPlayers: 6,
    supportsSinglePlayer: false, // 2-6 human players only
    supportsMultiplayer: true,
    icon: '💣',
    estimatedDuration: '2-5 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): BombPassState {
    return {
      players: playerIds,
      playerNames,
      activePlayerId: playerIds[0],
      lives: Object.fromEntries(playerIds.map(p => [p, 2])), // 2 lives each
      eliminated: [],
      bombTimerSeconds: getRandomTimer(),
      passedCount: 0,
      phase: 'ticking',
      winner: null,
      lastEliminated: null,
    };
  }

  validateMove(state: BombPassState, move: Move, playerId: string): boolean {
    const { type } = move as { type: string };
    if (type === 'pass_bomb') {
      return state.phase === 'ticking' && state.activePlayerId === playerId;
    }
    if (type === 'timer_tick') {
      return state.phase === 'ticking';
    }
    if (type === 'next_round') {
      return state.phase === 'exploded';
    }
    return false;
  }

  applyMove(state: BombPassState, move: Move, _playerId: string): BombPassState {
    const { type } = move as { type: string };

    if (type === 'pass_bomb') {
      // Find next alive player
      const activePlayers = state.players.filter(p => !state.eliminated.includes(p));
      const currentIndex = activePlayers.indexOf(state.activePlayerId);
      const nextIndex = (currentIndex + 1) % activePlayers.length;
      const nextPlayerId = activePlayers[nextIndex];

      return {
        ...state,
        activePlayerId: nextPlayerId,
        passedCount: state.passedCount + 1,
      };
    }

    if (type === 'timer_tick') {
      const nextTime = state.bombTimerSeconds - 1;
      if (nextTime <= 0) {
        // BOOM! Active player loses a life
        const victim = state.activePlayerId;
        const newLives = {
          ...state.lives,
          [victim]: Math.max(0, (state.lives[victim] || 1) - 1),
        };

        const newEliminated = [...state.eliminated];
        if (newLives[victim] === 0 && !newEliminated.includes(victim)) {
          newEliminated.push(victim);
        }

        const remaining = state.players.filter(p => !newEliminated.includes(p));
        const isFinished = remaining.length <= 1;

        let winner: WinResult | null = null;
        if (isFinished) {
          const survivor = remaining[0] || 'draw';
          winner = {
            winner: survivor,
            scores: newLives,
          };
        }

        return {
          ...state,
          lives: newLives,
          eliminated: newEliminated,
          bombTimerSeconds: 0,
          phase: isFinished ? 'finished' : 'exploded',
          lastEliminated: victim,
          winner,
        };
      }

      return {
        ...state,
        bombTimerSeconds: nextTime,
      };
    }

    if (type === 'next_round') {
      const remaining = state.players.filter(p => !state.eliminated.includes(p));
      const nextStarter = remaining[Math.floor(Math.random() * remaining.length)] || state.players[0];

      return {
        ...state,
        activePlayerId: nextStarter,
        bombTimerSeconds: getRandomTimer(),
        phase: 'ticking',
        passedCount: 0,
        lastEliminated: null,
      };
    }

    return state;
  }

  checkWinner(state: BombPassState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: BombPassState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(_state: BombPassState, _playerId: string, _difficulty: 'easy' | 'medium' | 'hard'): Move {
    return { type: 'pass_bomb' };
  }
}
