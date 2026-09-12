import { create } from 'zustand';
import { db, Player } from '../db/database';

interface PlayerState {
  currentPlayer: Player | null;
  allPlayers: Player[];
  setCurrentPlayer: (player: Player) => void;
  createPlayer: (username: string, avatar: string) => Player;
  loadPlayers: () => void;
  updateCurrentPlayer: (id: string, won: boolean) => void;
  clearCurrentPlayer: () => void;
}

const CURRENT_PLAYER_KEY = 'gamehub_current_player_id';

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentPlayer: null,
  allPlayers: [],

  setCurrentPlayer: (player: Player) => {
    localStorage.setItem(CURRENT_PLAYER_KEY, player.id);
    set({ currentPlayer: player });
  },

  createPlayer: (username: string, avatar: string) => {
    const player = db.createPlayer(username, avatar);
    localStorage.setItem(CURRENT_PLAYER_KEY, player.id);
    set((state) => ({
      currentPlayer: player,
      allPlayers: [...state.allPlayers, player],
    }));
    return player;
  },

  loadPlayers: () => {
    const players = db.getAllPlayers();
    const savedId = localStorage.getItem(CURRENT_PLAYER_KEY);
    const current = savedId ? players.find((p) => p.id === savedId) ?? null : null;
    set({ allPlayers: players, currentPlayer: current });
  },

  updateCurrentPlayer: (id: string, won: boolean) => {
    const updated = db.updatePlayerStats(id, won);
    if (!updated) return;
    const { currentPlayer } = get();
    if (currentPlayer?.id === id) {
      set({ currentPlayer: updated });
    }
    set((state) => ({
      allPlayers: state.allPlayers.map((p) => (p.id === id ? updated : p)),
    }));
  },

  clearCurrentPlayer: () => {
    localStorage.removeItem(CURRENT_PLAYER_KEY);
    set({ currentPlayer: null });
  },
}));
