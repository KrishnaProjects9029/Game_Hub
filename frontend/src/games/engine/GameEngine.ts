import { GameDefinition, GameCategory } from './GameDefinition';

export type { GameCategory, GameDefinition };

export interface Move {
  [key: string]: unknown;
}

export interface WinResult {
  winner: string | 'draw';
  scores: Record<string, number>;
  reason?: string;
}

export interface GameConfig extends GameDefinition {}

export interface GameEngine<S = unknown> {
  config: GameConfig;
  getInitialState(playerIds: string[], playerNames: Record<string, string>): S;
  applyMove(state: S, move: Move, playerId: string): S;
  validateMove(state: S, move: Move, playerId: string): boolean;
  checkWinner(state: S): WinResult | null;
  getAIMove(state: S, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move;
  isGameOver(state: S): boolean;
}
