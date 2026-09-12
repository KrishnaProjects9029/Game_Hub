/**
 * GameSessionManager.ts
 * ---------------------
 * Coordinates the active session across Single Player, Pass-and-Play, and LAN:
 * - Session mode resolution
 * - Game pause / resume / rematch
 * - AI difficulty propagation
 */
import { useGameStore } from '../../store/gameStore';

export type SessionMode = 'single' | 'passplay' | 'lan';

export class GameSessionManager {
  private static instance: GameSessionManager;

  private constructor() {}

  public static getInstance(): GameSessionManager {
    if (!GameSessionManager.instance) {
      GameSessionManager.instance = new GameSessionManager();
    }
    return GameSessionManager.instance;
  }

  public startSinglePlayerSession(gameId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
    const store = useGameStore.getState();
    store.setDifficulty(difficulty);
    store.startGame(gameId, true);
  }

  public startPassAndPlaySession(gameId: string): void {
    const store = useGameStore.getState();
    store.startGame(gameId, false);
  }

  public startLanSession(gameId: string): void {
    const store = useGameStore.getState();
    store.startGame(gameId, false);
  }

  public endSession(): void {
    useGameStore.getState().resetGame();
  }

  public getActiveGame(): string | null {
    return useGameStore.getState().activeGame;
  }

  public getDifficulty(): 'easy' | 'medium' | 'hard' {
    return useGameStore.getState().difficulty;
  }
}

export const gameSessionManager = GameSessionManager.getInstance();
