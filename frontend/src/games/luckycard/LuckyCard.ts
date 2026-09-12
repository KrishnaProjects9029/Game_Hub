import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export type CardType = 'number' | 'multiplier' | 'shield' | 'bust';

export interface Card {
  type: CardType;
  value: number; // for number cards
  label: string;
  emoji: string;
}

export interface LuckyCardState {
  players: string[];
  playerNames: Record<string, string>;
  currentPlayerIndex: number;
  round: number;
  totalRounds: number;
  bankedScores: Record<string, number>;
  currentTurnPoints: number;
  hasShield: boolean;
  multiplier: number;
  lastDrawnCard: Card | null;
  phase: 'turn_active' | 'busted' | 'finished';
  winner: WinResult | null;
}

const DECK_TEMPLATES: Card[] = [
  { type: 'number', value: 10, label: '+10 Points', emoji: '🪙' },
  { type: 'number', value: 20, label: '+20 Points', emoji: '💎' },
  { type: 'number', value: 30, label: '+30 Points', emoji: '👑' },
  { type: 'number', value: 50, label: '+50 Points', emoji: '💰' },
  { type: 'multiplier', value: 2, label: '2x Multiplier', emoji: '⚡' },
  { type: 'shield', value: 0, label: 'Bust Shield', emoji: '🛡️' },
  { type: 'bust', value: 0, label: 'BUST! Lose unbanked', emoji: '💀' },
];

function drawCard(): Card {
  const roll = Math.random();
  if (roll < 0.22) return DECK_TEMPLATES[6]; // Bust (22%)
  if (roll < 0.32) return DECK_TEMPLATES[4]; // 2x (10%)
  if (roll < 0.42) return DECK_TEMPLATES[5]; // Shield (10%)
  if (roll < 0.60) return DECK_TEMPLATES[3]; // +50 (18%)
  if (roll < 0.75) return DECK_TEMPLATES[2]; // +30 (15%)
  if (roll < 0.90) return DECK_TEMPLATES[1]; // +20 (15%)
  return DECK_TEMPLATES[0]; // +10 (10%)
}

export class LuckyCardEngine implements GameEngine<LuckyCardState> {
  config: GameConfig = {
    id: 'luckycard',
    name: 'Lucky Card',
    category: 'party',
    description: 'Push your luck! Draw cards to stack points or bank them before drawing a deadly skull.',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🎴',
    estimatedDuration: '2-4 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): LuckyCardState {
    return {
      players: playerIds,
      playerNames,
      currentPlayerIndex: 0,
      round: 1,
      totalRounds: 3,
      bankedScores: Object.fromEntries(playerIds.map(p => [p, 0])),
      currentTurnPoints: 0,
      hasShield: false,
      multiplier: 1,
      lastDrawnCard: null,
      phase: 'turn_active',
      winner: null,
    };
  }

  validateMove(state: LuckyCardState, move: Move, playerId: string): boolean {
    const currentId = state.players[state.currentPlayerIndex];
    if (playerId !== currentId && state.players.length > 1) return false;

    const { type } = move as { type: string };
    if (type === 'draw_card') return state.phase === 'turn_active';
    if (type === 'bank_points') return state.phase === 'turn_active' && state.currentTurnPoints > 0;
    if (type === 'continue_turn') return state.phase === 'busted';
    return false;
  }

  applyMove(state: LuckyCardState, move: Move, playerId: string): LuckyCardState {
    const { type } = move as { type: string };

    if (type === 'draw_card') {
      const card = drawCard();

      if (card.type === 'bust') {
        if (state.hasShield) {
          // Shield saves player!
          return {
            ...state,
            hasShield: false,
            lastDrawnCard: { ...card, label: 'SHIELD SAVED YOU!' },
          };
        } else {
          // Busted!
          return {
            ...state,
            currentTurnPoints: 0,
            multiplier: 1,
            lastDrawnCard: card,
            phase: 'busted',
          };
        }
      }

      if (card.type === 'multiplier') {
        return {
          ...state,
          multiplier: state.multiplier * 2,
          lastDrawnCard: card,
        };
      }

      if (card.type === 'shield') {
        return {
          ...state,
          hasShield: true,
          lastDrawnCard: card,
        };
      }

      // Number card
      const pointsGained = card.value * state.multiplier;
      return {
        ...state,
        currentTurnPoints: state.currentTurnPoints + pointsGained,
        lastDrawnCard: card,
      };
    }

    if (type === 'bank_points') {
      const newBanked = {
        ...state.bankedScores,
        [playerId]: (state.bankedScores[playerId] || 0) + state.currentTurnPoints,
      };

      const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
      const isNewRound = nextIdx === 0;
      const nextRound = isNewRound ? state.round + 1 : state.round;
      const isFinished = nextRound > state.totalRounds;

      let winner: WinResult | null = null;
      if (isFinished) {
        const maxScore = Math.max(...state.players.map(p => newBanked[p] || 0));
        const winners = state.players.filter(p => newBanked[p] === maxScore);
        winner = {
          winner: winners.length === 1 ? winners[0] : 'draw',
          scores: newBanked,
        };
      }

      return {
        ...state,
        bankedScores: newBanked,
        currentTurnPoints: 0,
        hasShield: false,
        multiplier: 1,
        lastDrawnCard: null,
        currentPlayerIndex: nextIdx,
        round: Math.min(nextRound, state.totalRounds),
        phase: isFinished ? 'finished' : 'turn_active',
        winner,
      };
    }

    if (type === 'continue_turn') {
      const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
      const isNewRound = nextIdx === 0;
      const nextRound = isNewRound ? state.round + 1 : state.round;
      const isFinished = nextRound > state.totalRounds;

      let winner: WinResult | null = null;
      if (isFinished) {
        const maxScore = Math.max(...state.players.map(p => state.bankedScores[p] || 0));
        const winners = state.players.filter(p => state.bankedScores[p] === maxScore);
        winner = {
          winner: winners.length === 1 ? winners[0] : 'draw',
          scores: state.bankedScores,
        };
      }

      return {
        ...state,
        currentTurnPoints: 0,
        hasShield: false,
        multiplier: 1,
        lastDrawnCard: null,
        currentPlayerIndex: nextIdx,
        round: Math.min(nextRound, state.totalRounds),
        phase: isFinished ? 'finished' : 'turn_active',
        winner,
      };
    }

    return state;
  }

  checkWinner(state: LuckyCardState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: LuckyCardState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: LuckyCardState, _playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    if (state.phase === 'busted') return { type: 'continue_turn' };

    const threshold = difficulty === 'hard' ? 50 : difficulty === 'medium' ? 70 : 100;
    if (state.currentTurnPoints >= threshold) {
      return { type: 'bank_points' };
    }
    return { type: 'draw_card' };
  }
}
