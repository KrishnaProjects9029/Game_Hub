/**
 * PlayerManager.ts
 * ----------------
 * Manages player profile, avatar, stats, XP gains and leveling:
 * - Local offline persistence via LocalDB
 * - Match history tracking
 * - Achievement unlocks
 */
import { localDB, Player, MatchData } from '../../db/database';
import { usePlayerStore } from '../../store/playerStore';

export class PlayerManager {
  private static instance: PlayerManager;

  private constructor() {}

  public static getInstance(): PlayerManager {
    if (!PlayerManager.instance) {
      PlayerManager.instance = new PlayerManager();
    }
    return PlayerManager.instance;
  }

  public getCurrentPlayer(): Player | null {
    return usePlayerStore.getState().currentPlayer;
  }

  public getAllProfiles(): Player[] {
    return localDB.getAllPlayers();
  }

  public registerPlayer(username: string, avatar: string): Player {
    return usePlayerStore.getState().createPlayer(username, avatar);
  }

  public recordMatchOutcome(gameId: string, playerIds: string[], winnerId: string, scores: Record<string, number>): void {
    const current = this.getCurrentPlayer();
    if (!current) return;

    const won = winnerId === current.id;
    localDB.updatePlayerStats(current.id, won);

    const match: Omit<MatchData, 'id' | 'playedAt'> = {
      gameId,
      playerIds,
      winnerId,
      scores,
    };
    localDB.saveMatch(match);
    usePlayerStore.getState().loadPlayers();
  }
}

export const playerManager = PlayerManager.getInstance();
