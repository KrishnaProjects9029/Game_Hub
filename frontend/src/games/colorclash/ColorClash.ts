import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface ColorPrompt {
  word: string;
  textColor: string;
  correctAnswer: string;
  options: string[];
}

export interface ColorClashState {
  players: string[];
  playerNames: Record<string, string>;
  round: number;
  totalRounds: number;
  currentPrompt: ColorPrompt;
  scores: Record<string, number>;
  playerAnswers: Record<string, { answer: string; timeMs: number; isCorrect: boolean } | null>;
  phase: 'active' | 'round_result' | 'finished';
  winner: WinResult | null;
  startTime: number;
}

const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];
const COLOR_HEX: Record<string, string> = {
  RED: '#ef4444',
  BLUE: '#3b82f6',
  GREEN: '#10b981',
  YELLOW: '#f59e0b',
  PURPLE: '#a855f7',
  ORANGE: '#f97316',
};

function generatePrompt(): ColorPrompt {
  const word = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  let textColor = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  // 50% chance they match, 50% Stroop mismatch
  if (Math.random() < 0.35) {
    textColor = word;
  }
  const correctAnswer = textColor;

  // Options
  const pool = Array.from(new Set([correctAnswer, word, ...COLOR_NAMES]));
  const options = pool.slice(0, 4).sort(() => Math.random() - 0.5);

  return {
    word,
    textColor: COLOR_HEX[textColor] || '#fff',
    correctAnswer,
    options,
  };
}

export class ColorClashEngine implements GameEngine<ColorClashState> {
  config: GameConfig = {
    id: 'colorclash',
    name: 'Color Clash',
    category: 'reflex',
    description: 'Brain-bending color reflex test! Choose the actual font color, not the written word.',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🎨',
    estimatedDuration: '1-3 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): ColorClashState {
    return {
      players: playerIds,
      playerNames,
      round: 1,
      totalRounds: 6,
      currentPrompt: generatePrompt(),
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      playerAnswers: Object.fromEntries(playerIds.map(p => [p, null])),
      phase: 'active',
      winner: null,
      startTime: Date.now(),
    };
  }

  validateMove(state: ColorClashState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type, answer } = move as { type: string; answer?: string };

    if (type === 'submit_color') {
      if (state.phase !== 'active') return false;
      if (state.playerAnswers[playerId] !== null) return false;
      return typeof answer === 'string';
    }
    if (type === 'next_round') {
      return state.phase === 'round_result';
    }
    return false;
  }

  applyMove(state: ColorClashState, move: Move, playerId: string): ColorClashState {
    const { type, answer, timeMs } = move as { type: string; answer?: string; timeMs?: number };

    if (type === 'submit_color' && answer) {
      const isCorrect = answer.toUpperCase() === state.currentPrompt.correctAnswer.toUpperCase();
      const elapsed = timeMs ?? Math.max(150, Date.now() - state.startTime);
      const points = isCorrect ? Math.max(50, 160 - Math.floor(elapsed / 80)) : 0;

      const newAnswers = {
        ...state.playerAnswers,
        [playerId]: { answer, timeMs: elapsed, isCorrect },
      };
      const newScores = {
        ...state.scores,
        [playerId]: (state.scores[playerId] || 0) + points,
      };

      const allSubmitted = state.players.every(p => newAnswers[p] !== null);
      if (allSubmitted) {
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
          playerAnswers: newAnswers,
          scores: newScores,
          phase: isLastRound ? 'finished' : 'round_result',
          winner,
        };
      }

      return {
        ...state,
        playerAnswers: newAnswers,
        scores: newScores,
      };
    }

    if (type === 'next_round') {
      return {
        ...state,
        round: state.round + 1,
        currentPrompt: generatePrompt(),
        playerAnswers: Object.fromEntries(state.players.map(p => [p, null])),
        phase: 'active',
        startTime: Date.now(),
      };
    }

    return state;
  }

  checkWinner(state: ColorClashState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: ColorClashState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: ColorClashState, _playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const prompt = state.currentPrompt;
    const accuracy = difficulty === 'hard' ? 0.9 : difficulty === 'medium' ? 0.7 : 0.4;
    const isCorrect = Math.random() < accuracy;

    let ans = prompt.correctAnswer;
    if (!isCorrect) {
      // Common human mistake: pick the written word instead of font color!
      ans = Math.random() < 0.7 ? prompt.word : prompt.options.find(o => o !== prompt.correctAnswer) || prompt.word;
    }

    const delay = difficulty === 'hard'
      ? Math.floor(Math.random() * 500) + 700
      : difficulty === 'medium'
      ? Math.floor(Math.random() * 800) + 1100
      : Math.floor(Math.random() * 1400) + 1600;

    return { type: 'submit_color', answer: ans, timeMs: delay };
  }
}
