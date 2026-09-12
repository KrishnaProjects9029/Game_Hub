import { GameEngine, GameConfig, Move, WinResult } from '../engine/GameEngine';

export interface Fighter {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number; // 3 lives
  knockouts: number;
  color: string;
}

export interface BattleArenaState {
  players: string[];
  playerNames: Record<string, string>;
  fighters: Record<string, Fighter>;
  matchTimeLeft: number;
  scores: Record<string, number>;
  phase: 'fighting' | 'finished';
  winner: WinResult | null;
}

const FIGHTER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export class BattleArenaEngine implements GameEngine<BattleArenaState> {
  config: GameConfig = {
    id: 'battlearena',
    name: 'Mini Battle Arena',
    category: 'action',
    description: 'Bumper ring combat! Dash into rivals, push them into hazard walls, and score knockouts.',
    minPlayers: 1,
    maxPlayers: 6,
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    icon: '🥊',
    estimatedDuration: '1-3 min',
  };

  getInitialState(playerIds: string[], playerNames: Record<string, string>): BattleArenaState {
    const fighters: Record<string, Fighter> = {};
    const count = playerIds.length;
    playerIds.forEach((pid, idx) => {
      const angle = (idx / count) * Math.PI * 2;
      fighters[pid] = {
        id: pid,
        name: playerNames[pid] ?? pid,
        x: 250 + Math.cos(angle) * 120,
        y: 180 + Math.sin(angle) * 100,
        vx: 0,
        vy: 0,
        hp: 3,
        knockouts: 0,
        color: FIGHTER_COLORS[idx % FIGHTER_COLORS.length],
      };
    });

    return {
      players: playerIds,
      playerNames,
      fighters,
      matchTimeLeft: 45,
      scores: Object.fromEntries(playerIds.map(p => [p, 0])),
      phase: 'fighting',
      winner: null,
    };
  }

  validateMove(state: BattleArenaState, move: Move, playerId: string): boolean {
    if (!state.players.includes(playerId)) return false;
    const { type } = move as { type: string };
    return type === 'dash' || type === 'time_tick' || type === 'knockout_scored';
  }

  applyMove(state: BattleArenaState, move: Move, playerId: string): BattleArenaState {
    const { type, dx, dy, victimId } = move as { type: string; dx?: number; dy?: number; victimId?: string };

    if (type === 'dash' && dx !== undefined && dy !== undefined) {
      const fighter = state.fighters[playerId];
      if (!fighter || fighter.hp <= 0) return state;

      const updated = {
        ...state.fighters,
        [playerId]: {
          ...fighter,
          vx: dx * 8,
          vy: dy * 8,
        },
      };
      return { ...state, fighters: updated };
    }

    if (type === 'knockout_scored' && victimId) {
      const attacker = state.fighters[playerId];
      const victim = state.fighters[victimId];
      if (!attacker || !victim) return state;

      const newVictimHp = Math.max(0, victim.hp - 1);
      const newAttackerKOs = attacker.knockouts + 1;
      const newScores = {
        ...state.scores,
        [playerId]: (state.scores[playerId] || 0) + 100,
      };

      const updatedFighters = {
        ...state.fighters,
        [playerId]: { ...attacker, knockouts: newAttackerKOs },
        [victimId]: {
          ...victim,
          hp: newVictimHp,
          x: 250,
          y: 180,
          vx: 0,
          vy: 0,
        },
      };

      const aliveCount = Object.values(updatedFighters).filter(f => f.hp > 0).length;
      if (aliveCount <= 1 && state.players.length > 1) {
        const lastStanding = Object.values(updatedFighters).find(f => f.hp > 0)?.id || playerId;
        return {
          ...state,
          fighters: updatedFighters,
          scores: newScores,
          phase: 'finished',
          winner: {
            winner: lastStanding,
            scores: newScores,
          },
        };
      }

      return {
        ...state,
        fighters: updatedFighters,
        scores: newScores,
      };
    }

    if (type === 'time_tick') {
      const nextTime = Math.max(0, state.matchTimeLeft - 1);
      if (nextTime === 0) {
        const maxScore = Math.max(...state.players.map(p => state.scores[p] || 0));
        const winners = state.players.filter(p => (state.scores[p] || 0) === maxScore);
        return {
          ...state,
          matchTimeLeft: 0,
          phase: 'finished',
          winner: {
            winner: winners[0] || 'draw',
            scores: state.scores,
          },
        };
      }
      return { ...state, matchTimeLeft: nextTime };
    }

    return state;
  }

  checkWinner(state: BattleArenaState): WinResult | null {
    return state.winner;
  }

  isGameOver(state: BattleArenaState): boolean {
    return state.phase === 'finished';
  }

  getAIMove(state: BattleArenaState, playerId: string, _difficulty: 'easy' | 'medium' | 'hard'): Move {
    const me = state.fighters[playerId];
    const opponent = Object.values(state.fighters).find(f => f.id !== playerId && f.hp > 0);
    if (me && opponent) {
      const angle = Math.atan2(opponent.y - me.y, opponent.x - me.x);
      return { type: 'dash', dx: Math.cos(angle), dy: Math.sin(angle) };
    }
    return { type: 'time_tick' };
  }
}
