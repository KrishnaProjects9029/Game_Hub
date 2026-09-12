/**
 * RoomManager.ts
 * --------------
 * Reusable room and lobby controller for offline local multiplayer:
 * - Room creation and code generation
 * - Room joining and host migration
 * - Player readiness state tracking
 * - Game selection in lobby
 */
import { createRoom, RoomInfo } from '../discovery';
import { localNetworkManager } from './LocalNetworkManager';
import { useRoomStore, RoomPlayer } from '../../store/roomStore';

export class RoomManager {
  private static instance: RoomManager;

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public async hostNewRoom(
    hostId: string,
    hostName: string,
    avatar: string,
    maxPlayers: number = 6
  ): Promise<RoomInfo | null> {
    const ip = localNetworkManager.getHostIp();
    const port = localNetworkManager.getPort();
    const room = await createRoom(ip, port, hostId, hostName, avatar, maxPlayers);
    if (room) {
      useRoomStore.getState().setRoom(room.roomCode, ip, port);
      useRoomStore.getState().setIsHost(true);
      const hostPlayer: RoomPlayer = {
        id: hostId,
        name: hostName,
        avatar,
        isReady: true,
        isHost: true,
      };
      useRoomStore.getState().setPlayers([hostPlayer]);
      await localNetworkManager.connectSocket(room.roomCode, hostId);
    }
    return room;
  }

  public async joinExistingRoom(roomCode: string, playerId: string, playerName: string, avatar: string): Promise<boolean> {
    const ip = localNetworkManager.getHostIp();
    const port = localNetworkManager.getPort();
    try {
      useRoomStore.getState().setRoom(roomCode, ip, port);
      useRoomStore.getState().setIsHost(false);
      await localNetworkManager.connectSocket(roomCode, playerId);
      localNetworkManager.send('join_room', { playerId, playerName, avatar });
      return true;
    } catch {
      return false;
    }
  }

  public toggleReady(playerId: string, isReady: boolean): void {
    localNetworkManager.send('player_ready', { playerId, isReady });
  }

  public selectLobbyGame(gameId: string): void {
    useRoomStore.getState().setSelectedGame(gameId);
    localNetworkManager.send('select_game', { gameId });
  }

  public startLobbyGame(gameId?: string): void {
    const gid = gameId || useRoomStore.getState().selectedGame;
    if (gid) {
      localNetworkManager.send('start_game', { gameId: gid });
    }
  }

  public leaveRoom(): void {
    localNetworkManager.disconnectSocket();
    useRoomStore.getState().clearRoom();
  }
}

export const roomManager = RoomManager.getInstance();
