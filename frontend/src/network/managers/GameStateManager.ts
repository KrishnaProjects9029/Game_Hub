/**
 * GameStateManager.ts
 * -------------------
 * Unified state manager for game moves, optimistic execution, and winner calculation:
 * - Engine dispatch for single player / pass and play
 * - WebSocket dispatch for LAN multiplayer
 * - Win result checking
 */
import { Move, WinResult, GameEngine } from '../../games/engine/GameEngine';
import { localNetworkManager } from './LocalNetworkManager';
import { useGameStore } from '../../store/gameStore';

export class GameStateManager {
  private static instance: GameStateManager;

  private constructor() {}

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  public dispatchLocalMove<S>(
    engine: GameEngine<S>,
    currentState: S,
    move: Move,
    playerId: string
  ): { nextState: S; winResult: WinResult | null } | null {
    if (!engine.validateMove(currentState, move, playerId)) {
      return null;
    }
    const nextState = engine.applyMove(currentState, move, playerId);
    useGameStore.getState().setGameState(nextState);

    const winResult = engine.checkWinner(nextState);
    return { nextState, winResult };
  }

  public dispatchLanMove(move: Move, playerId: string): void {
    localNetworkManager.send('make_move', { move, playerId });
  }
}

export const gameStateManager = GameStateManager.getInstance();
