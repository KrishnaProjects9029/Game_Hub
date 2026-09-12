export interface DiscoveredRoom {
  roomCode: string;
  hostIp: string;
  port: number;
  gameId: string | null;
  playerCount: number;
  maxPlayers: number;
}

export async function discoverRooms(serverIp: string, port = 8000): Promise<DiscoveredRoom[]> {
  try {
    const response = await fetch(`http://${serverIp}:${port}/rooms`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const list: any[] = Array.isArray(data) ? data : (data.rooms || data.items || []);
    return list.map((r: any) => ({
      roomCode: r.roomCode || r.code || '',
      hostIp: r.hostIp || serverIp,
      port: r.port || port,
      gameId: r.gameId || r.game_id || null,
      playerCount: r.playerCount ?? r.player_count ?? 1,
      maxPlayers: r.maxPlayers ?? r.max_players ?? 4,
    }));
  } catch {
    return [];
  }
}

export async function checkServerHealth(ip: string, port = 8000): Promise<boolean> {
  try {
    const response = await fetch(`http://${ip}:${port}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type RoomInfo = {
  roomCode: string;
  hostIp?: string;
  port?: number;
  gameId?: string | null;
  playerCount?: number;
  maxPlayers?: number;
};

export async function createRoom(
  hostIp: string,
  port: number,
  playerId: string,
  playerName: string,
  avatar: string,
  maxPlayers = 4
): Promise<{ roomCode: string } | null> {
  try {
    const response = await fetch(`http://${hostIp}:${port}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host_player_id: playerId,
        hostId: playerId,
        hostName: playerName,
        username: playerName,
        avatar,
        max_players: maxPlayers,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const code = data.roomCode || data.code || (data.room && data.room.code);
    return code ? { roomCode: code } : null;
  } catch {
    return null;
  }
}

export function getLocalIpGuess(): string {
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.hostname;
  }
  return '';
}

