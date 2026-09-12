import { create } from 'zustand';

type Phase = 'idle' | 'lobby' | 'playing' | 'finished';
type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
}

interface RoomState {
  roomCode: string | null;
  hostIp: string | null;
  port: number;
  players: RoomPlayer[];
  phase: Phase;
  selectedGame: string | null;
  isHost: boolean;
  wsStatus: WsStatus;
  setRoom: (code: string, ip: string, port?: number) => void;
  setPlayers: (players: RoomPlayer[]) => void;
  setPhase: (phase: Phase) => void;
  setSelectedGame: (gameId: string) => void;
  setWsStatus: (status: WsStatus) => void;
  setIsHost: (isHost: boolean) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: null,
  hostIp: null,
  port: 8000,
  players: [],
  phase: 'idle',
  selectedGame: null,
  isHost: false,
  wsStatus: 'disconnected',

  setRoom: (code, ip, port = 8000) => set({ roomCode: code, hostIp: ip, port }),
  setPlayers: (players) => set({ players }),
  setPhase: (phase) => set({ phase }),
  setSelectedGame: (gameId) => set({ selectedGame: gameId }),
  setWsStatus: (status) => set({ wsStatus: status }),
  setIsHost: (isHost) => set({ isHost }),
  clearRoom: () =>
    set({
      roomCode: null, hostIp: null, players: [], phase: 'idle',
      selectedGame: null, isHost: false, wsStatus: 'disconnected',
    }),
}));
