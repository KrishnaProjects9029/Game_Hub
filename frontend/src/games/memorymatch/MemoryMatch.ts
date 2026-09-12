import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface CardItem {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy: string | null;
}

export interface MemoryMatchState {
  players: string[];
  playerNames: Record<string, string>;
  currentPlayerIndex: number;
  cards: CardItem[];
  flippedCardIds: number[];
  scores: Record<string, number>;
  phase: 'playing' | 'revealing_mismatch' | 'finished';
  winner: WinResult | null;
  movesCount: number;
  pairCount: number;
  seenCards?: Record<number, string>;
}

const EMOJI_POOLS = ['🦁', '🦊', '🐼', '🐯', '🐨', '🐸', '🦄', '🐙', '🦋', '🦉', '🐢', '🐬'];

function createDeck(pairCount: number = 8): CardItem[] {
  const selected = EMOJI_POOLS.slice(0, pairCount);
  const items = [...selected, ...selected];
  // Shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.map((emoji, id) => ({
    id,
    emoji,
    isFlipped: false,
    isMatched: false,
    matchedBy: null,
  }));
}

export class MemoryMatchEngine implements GameEngine<MemoryMatchState> {
  config: GameConfig = {
    id: 'memorymatch',
    name: 'Memory Match',
    category: 'brain',
    description: 'Find all the matching pairs! Remember card locations and clear the board.',
    minPlayers: 1,
    maxPlayers: 4,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🃏',
    estimatedDuration: '2-5 min',
    controls: {
      desktop: 'Click on cards to flip and reveal',
      touch: 'Tap on cards to flip and reveal',
    },
    status: 'playable',
    phase: 2,
    isFeatured: true,
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): MemoryMatchState {
    const pairCount = playerIds.length > 2 ? 10 : 8;
    return {
      players: playerIds,
      playerNames,
      currentPlayerIndex: 0,
      cards: createDeck(pairCount),
      flippedCardIds: [],
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      phase: 'playing',
      winner: null,
      movesCount: 0,
      pairCount,
      seenCards: {},
    };
  }

  validateMove(state: MemoryMatchState, move: Move, playerId: string): boolean {
    const { type, cardId, pairs } = move as { type: string; cardId?: number; pairs?: number };

    if (type === 'set_size') {
      return (pairs === 6 || pairs === 8 || pairs === 10) && state.movesCount === 0;
    }

    // 'continue' is allowed whenever in mismatch reveal or 2 cards are flipped
    if (type === 'continue') {
      return state.phase === 'revealing_mismatch' || state.flippedCardIds.length === 2;
    }

    if (state.phase !== 'playing') return false;
    const currentId = state.players[state.currentPlayerIndex];
    if (playerId !== currentId && state.players.length > 1) return false;

    if (type === 'flip') {
      if (cardId === undefined || cardId < 0 || cardId >= state.cards.length) return false;
      const card = state.cards[cardId];
      if (card.isMatched || card.isFlipped) return false;
      if (state.flippedCardIds.length >= 2) return false;
      return true;
    }
    return false;
  }

  applyMove(state: MemoryMatchState, move: Move, playerId: string): MemoryMatchState {
    const { type, cardId, pairs } = move as { type: string; cardId?: number; pairs?: number };

    if (type === 'set_size' && pairs) {
      return {
        ...state,
        pairCount: pairs,
        cards: createDeck(pairs),
        flippedCardIds: [],
        seenCards: {},
        phase: 'playing',
      };
    }

    if (type === 'flip' && cardId !== undefined) {
      const targetCard = state.cards[cardId];
      const cards = state.cards.map(c => (c.id === cardId ? { ...c, isFlipped: true } : c));
      const flipped = [...state.flippedCardIds, cardId];
      const updatedSeen = {
        ...(state.seenCards || {}),
        [cardId]: targetCard.emoji,
      };

      if (flipped.length === 2) {
        const [c1, c2] = [cards[flipped[0]], cards[flipped[1]]];
        if (c1.emoji === c2.emoji) {
          // Match!
          const updatedCards = cards.map(c =>
            c.id === c1.id || c.id === c2.id ? { ...c, isMatched: true, matchedBy: playerId } : c
          );
          const newScores = { ...state.scores, [playerId]: (state.scores[playerId] || 0) + 1 };
          const allMatched = updatedCards.every(c => c.isMatched);

          let winner: WinResult | null = null;
          if (allMatched) {
            const maxScore = Math.max(...state.players.map(p => newScores[p] || 0));
            const winners = state.players.filter(p => newScores[p] === maxScore);
            winner = {
              winner: winners.length === 1 ? winners[0] : 'draw',
              scores: newScores,
            };
          }

          return {
            ...state,
            cards: updatedCards,
            flippedCardIds: [],
            scores: newScores,
            movesCount: state.movesCount + 1,
            phase: allMatched ? 'finished' : 'playing',
            winner,
            seenCards: updatedSeen,
          };
        } else {
          // Mismatch
          return {
            ...state,
            cards,
            flippedCardIds: flipped,
            movesCount: state.movesCount + 1,
            phase: 'revealing_mismatch',
            seenCards: updatedSeen,
          };
        }
      }

      return {
        ...state,
        cards,
        flippedCardIds: flipped,
        seenCards: updatedSeen,
      };
    }

    if (type === 'continue') {
      // Unflip mismatched cards and advance turn
      const cards = state.cards.map(c =>
        state.flippedCardIds.includes(c.id) && !c.isMatched ? { ...c, isFlipped: false } : c
      );
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      return {
        ...state,
        cards,
        flippedCardIds: [],
        currentPlayerIndex: nextIndex,
        phase: 'playing',
      };
    }

    return state;
  }

  checkWinner(state: MemoryMatchState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: MemoryMatchState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: MemoryMatchState, _playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    if (state.phase === 'revealing_mismatch') {
      return { type: 'continue' };
    }

    const unrevealed = state.cards.filter(c => !c.isMatched && !c.isFlipped);
    if (unrevealed.length === 0) return { type: 'continue' };

    // Human memory simulation: AI only knows cards that have actually been seen!
    const seenMap: Record<number, string> = state.seenCards || {};
    const availableSeen = Object.entries(seenMap)
      .map(([idStr, emoji]) => ({ id: Number(idStr), emoji }))
      .filter(item => {
        const card = state.cards[item.id];
        return card && !card.isMatched && !card.isFlipped;
      });

    // Memory recall probability based on human difficulty
    const memoryRetention = difficulty === 'hard' ? 0.94 : difficulty === 'medium' ? 0.70 : 0.40;
    const recalledSeen = availableSeen.filter(() => Math.random() < memoryRetention);

    // Case 1: First card is already flipped
    if (state.flippedCardIds.length === 1) {
      const firstId = state.flippedCardIds[0];
      const firstCard = state.cards[firstId];

      // Check if AI remembers the matching pair from previously seen cards
      const rememberedMatch = recalledSeen.find(
        c => c.emoji === firstCard.emoji && c.id !== firstId
      );

      if (rememberedMatch) {
        return { type: 'flip', cardId: rememberedMatch.id };
      }

      // Otherwise pick an unrevealed card like a human exploring the board
      const candidates = unrevealed.filter(c => c.id !== firstId);
      const unknownCards = candidates.filter(c => !(c.id in seenMap));
      const pool = unknownCards.length > 0 && Math.random() < 0.75 ? unknownCards : candidates;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return { type: 'flip', cardId: pick.id };
    }

    // Case 2: No cards flipped yet this turn
    // Check if AI remembers any full matching pair from memory!
    const emojiToIds: Record<string, number[]> = {};
    for (const item of recalledSeen) {
      if (!emojiToIds[item.emoji]) emojiToIds[item.emoji] = [];
      emojiToIds[item.emoji].push(item.id);
    }
    const knownPair = Object.values(emojiToIds).find(ids => ids.length >= 2);
    if (knownPair && Math.random() < memoryRetention) {
      return { type: 'flip', cardId: knownPair[0] };
    }

    // Pick a card to start the turn (preferring unknown or unrevealed cards)
    const unknownCards = unrevealed.filter(c => !(c.id in seenMap));
    const pool = unknownCards.length > 0 && Math.random() < 0.8 ? unknownCards : unrevealed;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { type: 'flip', cardId: pick.id };
  }
}
