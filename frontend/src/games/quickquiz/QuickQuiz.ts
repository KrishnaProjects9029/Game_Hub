import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';
import { QUIZ_DATABASE, QuizQuestion } from './quizData';

export interface QuickQuizState {
  players: string[];
  playerNames: Record<string, string>;
  round: number;
  totalRounds: number;
  currentQuestion: QuizQuestion;
  scores: Record<string, number>;
  playerAnswers: Record<string, { optionIndex: number; timeMs: number; isCorrect: boolean } | null>;
  phase: 'question' | 'reveal' | 'finished';
  winner: WinResult | null;
  questionStartTime: number;
  usedQuestionIds: number[];
}

function getRandomQuestion(usedIds: number[]): QuizQuestion {
  const available = QUIZ_DATABASE.filter(q => !usedIds.includes(q.id));
  const pool = available.length > 0 ? available : QUIZ_DATABASE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export class QuickQuizEngine implements GameEngine<QuickQuizState> {
  config: GameConfig = {
    id: 'quickquiz',
    name: 'Quick Quiz',
    category: 'brain',
    description: 'Test your trivia knowledge! Answer fastest for bonus points across 5 rounds.',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '💡',
    estimatedDuration: '2-4 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): QuickQuizState {
    const firstQ = getRandomQuestion([]);
    return {
      players: playerIds,
      playerNames,
      round: 1,
      totalRounds: 5,
      currentQuestion: firstQ,
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      playerAnswers: Object.fromEntries(playerIds.map(p => [p, null])),
      phase: 'question',
      winner: null,
      questionStartTime: Date.now(),
      usedQuestionIds: [firstQ.id],
    };
  }

  validateMove(state: QuickQuizState, move: Move, playerId: string): boolean {
    const targetPid = (move as any).playerId || playerId;
    if (!state.players.includes(targetPid) && targetPid !== '__ai__') return false;
    const { type, optionIndex } = move as { type: string; optionIndex?: number };

    if (type === 'submit_answer') {
      if (state.phase !== 'question') return false;
      return state.playerAnswers[targetPid] === null && optionIndex !== undefined && optionIndex >= 0 && optionIndex < 4;
    }
    if (type === 'ai_force_answer') {
      return state.phase === 'question';
    }
    if (type === 'next_question') {
      return state.phase === 'reveal';
    }
    return false;
  }

  applyMove(state: QuickQuizState, move: Move, playerId: string): QuickQuizState {
    const { type, optionIndex, timeMs } = move as { type: string; optionIndex?: number; timeMs?: number };
    const effectivePid = (move as any).playerId || playerId;

    if (type === 'ai_force_answer') {
      const newAnswers = { ...state.playerAnswers };
      const newScores = { ...state.scores };

      state.players.forEach(pid => {
        if (newAnswers[pid] === null) {
          const isCorrect = Math.random() < 0.65;
          const pick = isCorrect
            ? state.currentQuestion.correctIndex
            : [0, 1, 2, 3].find(i => i !== state.currentQuestion.correctIndex) ?? 0;
          const elapsed = 1400;
          const points = isCorrect ? 90 : 0;
          newAnswers[pid] = { optionIndex: pick, timeMs: elapsed, isCorrect };
          newScores[pid] = (newScores[pid] || 0) + points;
        }
      });

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
        phase: isLastRound ? 'finished' : 'reveal',
        winner,
      };
    }

    if (type === 'submit_answer' && optionIndex !== undefined) {
      const isCorrect = optionIndex === state.currentQuestion.correctIndex;
      const elapsed = timeMs ?? Math.max(200, Date.now() - state.questionStartTime);
      const points = isCorrect ? Math.max(70, 160 - Math.floor(elapsed / 120)) : 0;

      const newAnswers: Record<string, { optionIndex: number; timeMs: number; isCorrect: boolean } | null> = {
        ...state.playerAnswers,
        [effectivePid]: { optionIndex, timeMs: elapsed, isCorrect },
      };
      const newScores: Record<string, number> = {
        ...state.scores,
        [effectivePid]: (state.scores[effectivePid] || 0) + points,
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
          phase: isLastRound ? 'finished' : 'reveal',
          winner,
        };
      }

      return {
        ...state,
        playerAnswers: newAnswers,
        scores: newScores,
      };
    }

    if (type === 'next_question') {
      const nextRound = state.round + 1;
      const nextQ = getRandomQuestion(state.usedQuestionIds);
      return {
        ...state,
        round: nextRound,
        currentQuestion: nextQ,
        usedQuestionIds: [...state.usedQuestionIds, nextQ.id],
        playerAnswers: Object.fromEntries(state.players.map(p => [p, null])),
        phase: 'question',
        questionStartTime: Date.now(),
      };
    }

    return state;
  }

  checkWinner(state: QuickQuizState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: QuickQuizState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: QuickQuizState, _playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const correctIdx = state.currentQuestion.correctIndex;
    const accuracy = difficulty === 'hard' ? 0.88 : difficulty === 'medium' ? 0.65 : 0.4;
    const isCorrect = Math.random() < accuracy;

    let pick = correctIdx;
    if (!isCorrect) {
      const wrongs = [0, 1, 2, 3].filter(i => i !== correctIdx);
      pick = wrongs[Math.floor(Math.random() * wrongs.length)];
    }

    const delay = difficulty === 'hard'
      ? Math.floor(Math.random() * 1000) + 1200
      : difficulty === 'medium'
      ? Math.floor(Math.random() * 1500) + 1800
      : Math.floor(Math.random() * 2500) + 2500;

    return { type: 'submit_answer', optionIndex: pick, timeMs: delay };
  }
}
