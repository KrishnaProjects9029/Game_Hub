import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export type CoinChoice = 'heads' | 'tails';

export interface CoinFlipState {
  players: string[];
  playerNames: Record<string, string>;
  round: number;
  totalRounds: number;
  choices: Record<string, CoinChoice | null>;
  coinResult: CoinChoice | null;
  streaks: Record<string, number>;
  scores: Record<string, number>;
  phase: 'predicting' | 'flipping' | 'result' | 'finished';
  winner: WinResult | null;
}

export class CoinFlipEngine implements GameEngine<CoinFlipState> {
  config: GameConfig = {
    id: 'coinflip',
    name: 'Coin Flip Battle',
    category: 'party',
    description: 'Predict Heads or Tails! Build winning streaks to multiply your points.',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🪙',
    estimatedDuration: '1-3 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): CoinFlipState {
    return {
      players: playerIds,
      playerNames,
      round: 1,
      totalRounds: 5,
      choices: Object.fromEntries(playerIds.map(p => [p, null])),
      coinResult: null,
      streaks: Object.fromEntries(playerIds.map(p => [p, 0])),
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      phase: 'predicting',
      winner: null,
    };
  }

  validateMove(state: CoinFlipState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type, choice } = move as { type: string; choice?: CoinChoice };

    if (type === 'choose_side') {
      if (state.phase !== 'predicting') return false;
      if (state.choices[playerId] !== null) return false;
      return choice === 'heads' || choice === 'tails';
    }
    if (type === 'resolve_flip') {
      return state.phase === 'flipping';
    }
    if (type === 'next_round') {
      return state.phase === 'result';
    }
    return false;
  }

  applyMove(state: CoinFlipState, move: Move, playerId: string): CoinFlipState {
    const { type, choice, result } = move as { type: string; choice?: CoinChoice; result?: CoinChoice };

    if (type === 'choose_side' && choice) {
      const newChoices = { ...state.choices, [playerId]: choice };
      const allChosen = state.players.every(p => newChoices[p] !== null);

      if (allChosen) {
        return {
          ...state,
          choices: newChoices,
          phase: 'flipping',
        };
      }
      return {
        ...state,
        choices: newChoices,
      };
    }

    if (type === 'resolve_flip') {
      const outcome: CoinChoice = result || (Math.random() < 0.5 ? 'heads' : 'tails');
      const newStreaks = { ...state.streaks };
      const newScores = { ...state.scores };

      for (const p of state.players) {
        if (state.choices[p] === outcome) {
          const streak = (newStreaks[p] || 0) + 1;
          newStreaks[p] = streak;
          const streakBonus = streak > 1 ? streak * 20 : 0;
          newScores[p] = (newScores[p] || 0) + 100 + streakBonus;
        } else {
          newStreaks[p] = 0;
        }
      }

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
        coinResult: outcome,
        streaks: newStreaks,
        scores: newScores,
        phase: isLastRound ? 'finished' : 'result',
        winner,
      };
    }

    if (type === 'next_round') {
      return {
        ...state,
        round: state.round + 1,
        choices: Object.fromEntries(state.players.map(p => [p, null])),
        coinResult: null,
        phase: 'predicting',
      };
    }

    return state;
  }

  checkWinner(state: CoinFlipState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: CoinFlipState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(_state: CoinFlipState, _playerId: string, _difficulty: 'easy' | 'medium' | 'hard'): Move {
    const choice: CoinChoice = Math.random() < 0.5 ? 'heads' : 'tails';
    return { type: 'choose_side', choice };
  }
}
