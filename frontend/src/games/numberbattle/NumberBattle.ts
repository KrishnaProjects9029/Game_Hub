import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface MathChallenge {
  question: string;
  options: number[];
  correctAnswer: number;
}

export interface NumberBattleState {
  players: string[];
  playerNames: Record<string, string>;
  round: number;
  totalRounds: number;
  currentChallenge: MathChallenge;
  scores: Record<string, number>;
  playerAnswers: Record<string, { answer: number; timeMs: number; isCorrect: boolean } | null>;
  phase: 'answering' | 'round_results' | 'finished';
  winner: WinResult | null;
  roundStartTime: number;
}

function generateChallenge(): MathChallenge {
  const types = ['add', 'sub', 'mul', 'seq'];
  const type = types[Math.floor(Math.random() * types.length)];
  let q = '';
  let ans = 0;

  if (type === 'add') {
    const a = Math.floor(Math.random() * 45) + 5;
    const b = Math.floor(Math.random() * 45) + 5;
    q = `${a} + ${b} = ?`;
    ans = a + b;
  } else if (type === 'sub') {
    const a = Math.floor(Math.random() * 60) + 20;
    const b = Math.floor(Math.random() * (a - 5)) + 5;
    q = `${a} - ${b} = ?`;
    ans = a - b;
  } else if (type === 'mul') {
    const a = Math.floor(Math.random() * 11) + 2;
    const b = Math.floor(Math.random() * 11) + 2;
    q = `${a} × ${b} = ?`;
    ans = a * b;
  } else {
    // Sequence
    const start = Math.floor(Math.random() * 8) + 2;
    const step = Math.floor(Math.random() * 4) + 2;
    const s1 = start;
    const s2 = start + step;
    const s3 = start + step * 2;
    ans = start + step * 3;
    q = `${s1}, ${s2}, ${s3}, [ ? ]`;
  }

  // Generate 4 distinct options
  const optionsSet = new Set<number>([ans]);
  while (optionsSet.size < 4) {
    const delta = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.5 ? 1 : -1);
    const fake = Math.max(1, ans + delta);
    optionsSet.add(fake);
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  return {
    question: q,
    options,
    correctAnswer: ans,
  };
}

export class NumberBattleEngine implements GameEngine<NumberBattleState> {
  config: GameConfig = {
    id: 'numberbattle',
    name: 'Number Battle',
    category: 'brain',
    description: 'Rapid-fire math challenge! Solve equations and sequences faster than your opponent.',
    minPlayers: 1,
    maxPlayers: 4,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🔢',
    estimatedDuration: '2-4 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): NumberBattleState {
    return {
      players: playerIds,
      playerNames,
      round: 1,
      totalRounds: 5,
      currentChallenge: generateChallenge(),
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      playerAnswers: Object.fromEntries(playerIds.map(p => [p, null])),
      phase: 'answering',
      winner: null,
      roundStartTime: Date.now(),
    };
  }

  validateMove(state: NumberBattleState, move: Move, playerId: string): boolean {
    const targetPid = (move as any).playerId || playerId;
    if (!state.players.includes(targetPid) && targetPid !== '__ai__') return false;
    const { type } = move as { type: string; answer?: number };

    if (type === 'submit_answer') {
      if (state.phase !== 'answering') return false;
      return state.playerAnswers[targetPid] === null;
    }
    if (type === 'ai_force_answer') {
      return state.phase === 'answering';
    }
    if (type === 'next_round') {
      return state.phase === 'round_results';
    }
    return false;
  }

  applyMove(state: NumberBattleState, move: Move, playerId: string): NumberBattleState {
    const { type, answer, timeMs } = move as { type: string; answer?: number; timeMs?: number };
    const effectivePid = (move as any).playerId || playerId;

    if (type === 'ai_force_answer') {
      const newAnswers = { ...state.playerAnswers };
      const newScores = { ...state.scores };

      state.players.forEach(pid => {
        if (newAnswers[pid] === null) {
          const isCorrect = Math.random() < 0.65;
          const ans = isCorrect
            ? state.currentChallenge.correctAnswer
            : state.currentChallenge.options.find(o => o !== state.currentChallenge.correctAnswer) ||
              state.currentChallenge.correctAnswer;
          const elapsed = 1200;
          const points = isCorrect ? 80 : 0;
          newAnswers[pid] = { answer: ans, timeMs: elapsed, isCorrect };
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
        phase: isLastRound ? 'finished' : 'round_results',
        winner,
      };
    }

    if (type === 'submit_answer' && answer !== undefined) {
      const isCorrect = answer === state.currentChallenge.correctAnswer;
      const elapsed = timeMs ?? Math.max(300, Date.now() - state.roundStartTime);
      const points = isCorrect ? Math.max(50, 150 - Math.floor(elapsed / 100)) : 0;

      const newAnswers: Record<string, { answer: number; timeMs: number; isCorrect: boolean } | null> = {
        ...state.playerAnswers,
        [effectivePid]: { answer, timeMs: elapsed, isCorrect },
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
          phase: isLastRound ? 'finished' : 'round_results',
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
      const nextRound = state.round + 1;
      return {
        ...state,
        round: nextRound,
        currentChallenge: generateChallenge(),
        playerAnswers: Object.fromEntries(state.players.map(p => [p, null])),
        phase: 'answering',
        roundStartTime: Date.now(),
      };
    }

    return state;
  }

  checkWinner(state: NumberBattleState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: NumberBattleState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: NumberBattleState, _playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const challenge = state.currentChallenge;
    const correct = challenge.correctAnswer;
    const accuracy = difficulty === 'hard' ? 0.9 : difficulty === 'medium' ? 0.72 : 0.45;
    const isCorrect = Math.random() < accuracy;

    let ans = correct;
    if (!isCorrect) {
      const wrong = challenge.options.filter(o => o !== correct);
      ans = wrong[Math.floor(Math.random() * wrong.length)] ?? correct;
    }

    const delay = difficulty === 'hard'
      ? Math.floor(Math.random() * 800) + 900
      : difficulty === 'medium'
      ? Math.floor(Math.random() * 1200) + 1400
      : Math.floor(Math.random() * 2000) + 2200;

    return { type: 'submit_answer', answer: ans, timeMs: delay };
  }
}
