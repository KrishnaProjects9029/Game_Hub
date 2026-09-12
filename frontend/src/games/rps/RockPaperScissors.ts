import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

type Choice = 'rock' | 'paper' | 'scissors';

export interface RoundRecord {
  round: number;
  choices: Record<string, Choice>;
  winner: string | 'draw';
}

export interface RPSState {
  players: string[];
  playerNames: Record<string, string>;
  choices: Record<string, Choice | null>;
  scores: Record<string, number>;
  round: number;
  totalRounds: number;
  phase: 'choosing' | 'revealing' | 'finished';
  roundHistory: RoundRecord[];
  winner: WinResult | null;
  lastRoundResult: string | 'draw' | null;
}

function beats(a: Choice, b: Choice): boolean {
  return (a === 'rock' && b === 'scissors') ||
    (a === 'paper' && b === 'rock') ||
    (a === 'scissors' && b === 'paper');
}

function resolveRound(choices: Record<string, Choice | null>, players: string[]): string | 'draw' {
  const [p1, p2] = players;
  const c1 = choices[p1]; const c2 = choices[p2];
  if (!c1 || !c2) return 'draw';
  if (c1 === c2) return 'draw';
  return beats(c1, c2) ? p1 : p2;
}

export class RPSEngine implements GameEngine<RPSState> {
  config: GameConfig = {
    id: 'rps',
    name: 'Rock Paper Scissors',
    category: 'party',
    description: 'Best of 3 or 5! Outsmart your opponent with Rock, Paper, or Scissors.',
    minPlayers: 2,
    maxPlayers: 2,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '✂️',
    estimatedDuration: '1-3 min',
    controls: {
      desktop: 'Click Rock, Paper, or Scissors button',
      touch: 'Tap Rock, Paper, or Scissors card',
    },
    status: 'playable',
    phase: 2,
    isFeatured: true,
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): RPSState {
    return {
      players: playerIds, playerNames,
      choices: Object.fromEntries(playerIds.map(p => [p, null])),
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      round: 1, totalRounds: 5, phase: 'choosing',
      roundHistory: [], winner: null, lastRoundResult: null,
    };
  }

  validateMove(state: RPSState, move: Move, playerId: string): boolean {
    const { type, choice, totalRounds } = move as { type?: string; choice?: Choice; totalRounds?: number };
    if (type === 'set_rounds' && (totalRounds === 3 || totalRounds === 5)) {
      return state.round === 1 && state.roundHistory.length === 0;
    }
    if (type === 'continue') {
      return state.phase === 'revealing';
    }
    if (state.phase !== 'choosing') return false;
    if (!state.players.includes(playerId)) return false;
    if (state.choices[playerId] !== null) return false;
    return choice ? ['rock', 'paper', 'scissors'].includes(choice) : false;
  }

  applyMove(state: RPSState, move: Move, playerId: string): RPSState {
    const { type, choice, totalRounds } = move as { type?: string; choice?: Choice; totalRounds?: number };

    if (type === 'set_rounds' && totalRounds) {
      return { ...state, totalRounds };
    }

    if (type === 'continue') {
      return {
        ...state,
        phase: 'choosing',
        choices: Object.fromEntries(state.players.map(p => [p, null])),
        lastRoundResult: null,
      };
    }

    const newChoices = { ...state.choices, [playerId]: choice! };
    const allChosen = state.players.every(p => newChoices[p] !== null);
    if (!allChosen) return { ...state, choices: newChoices };
    // Resolve round
    const roundWinner = resolveRound(newChoices, state.players);
    const newScores = { ...state.scores };
    if (roundWinner !== 'draw') newScores[roundWinner] = (newScores[roundWinner] ?? 0) + 1;
    const history: RoundRecord[] = [
      ...state.roundHistory,
      { round: state.round, choices: newChoices as Record<string, Choice>, winner: roundWinner },
    ];
    const toWin = Math.ceil(state.totalRounds / 2);
    let gameWinner: WinResult | null = null;
    let phase: RPSState['phase'] = 'revealing';
    for (const p of state.players) {
      if (newScores[p] >= toWin) {
        gameWinner = { winner: p, scores: newScores };
        phase = 'finished';
        break;
      }
    }
    if (!gameWinner && state.round >= state.totalRounds) {
      const maxScore = Math.max(...state.players.map(p => newScores[p]));
      const leaders = state.players.filter(p => newScores[p] === maxScore);
      if (leaders.length === 1) {
        gameWinner = { winner: leaders[0], scores: newScores };
      } else {
        gameWinner = { winner: 'draw', scores: newScores };
      }
      phase = 'finished';
    }
    return {
      ...state, choices: newChoices, scores: newScores,
      round: state.round + 1, phase, roundHistory: history,
      winner: gameWinner, lastRoundResult: roundWinner,
    };
  }

  checkWinner(state: RPSState): WinResult | null { return state.winner; }
  isGameOver(state: RPSState): boolean { return state.phase === 'finished'; }

  getAIMove(state: RPSState, _playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    const counter: Record<Choice, Choice> = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
    const losesTo: Record<Choice, Choice> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

    const humanId = state.players[0];
    const history = state.roundHistory;
    const lastRound = history.length > 0 ? history[history.length - 1] : null;

    // EASY: Casual human beginner
    // Opening bias: humans open with Rock ~40% of the time
    if (difficulty === 'easy') {
      if (!lastRound) {
        const r = Math.random();
        if (r < 0.40) return { choice: 'rock' };
        if (r < 0.70) return { choice: 'scissors' };
        return { choice: 'paper' };
      }
      // Often just picks with light random fluctuation like a casual player
      return { choice: choices[Math.floor(Math.random() * 3)] };
    }

    // Win-Stay, Lose-Shift transition predictor
    const predictHumanNextChoice = (): Choice => {
      if (!lastRound) {
        // Casual humans open with Rock most often, then Scissors, least Paper
        return Math.random() < 0.50 ? 'rock' : 'scissors';
      }

      const humanLastChoice = lastRound.choices[humanId];
      if (!humanLastChoice) return choices[Math.floor(Math.random() * 3)];

      if (lastRound.winner === humanId) {
        // Human WON: High probability of Win-Stay (repeating the winning move)
        return humanLastChoice;
      } else if (lastRound.winner === 'draw') {
        // Human TIED: Humans rarely stay on a draw; they tend to shift to what would have beaten it
        return counter[humanLastChoice];
      } else {
        // Human LOST: Lose-Shift. Humans shift away from losing hand, usually to what beat them
        const aiLastChoice = Object.entries(lastRound.choices).find(([pid]) => pid !== humanId)?.[1];
        if (aiLastChoice) {
          // Human often copies what beat them or counters it
          return Math.random() < 0.60 ? aiLastChoice : counter[aiLastChoice];
        }
        return counter[humanLastChoice];
      }
    };

    // MEDIUM: Insightful friend (65% psychological anticipation, 35% natural variance)
    if (difficulty === 'medium') {
      if (Math.random() < 0.65) {
        const predicted = predictHumanNextChoice();
        return { choice: counter[predicted] };
      }
      return { choice: choices[Math.floor(Math.random() * 3)] };
    }

    // HARD: Master psychological player
    // Combines frequency analysis + Win-Stay Lose-Shift sequential dynamics
    const predicted = predictHumanNextChoice();
    const humanChoices = history.map(r => r.choices[humanId]).filter(Boolean) as Choice[];

    // If player has strong overall habit, factor that in
    if (humanChoices.length >= 2 && Math.random() < 0.40) {
      const freq: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 };
      humanChoices.forEach(c => freq[c]++);
      const sorted = (Object.entries(freq) as [Choice, number][]).sort((a, b) => b[1] - a[1]);
      if (sorted[0][1] > sorted[1][1]) {
        return { choice: counter[sorted[0][0]] };
      }
    }

    // 85% of the time, accurately counter the psychological prediction
    if (Math.random() < 0.85) {
      return { choice: counter[predicted] };
    }

    // Small human bluff / unpredictable switch
    return { choice: losesTo[predicted] };
  }
}
