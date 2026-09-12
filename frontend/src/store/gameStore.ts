import { create } from 'zustand';

type Difficulty = 'easy' | 'medium' | 'hard';

interface GameState {
  activeGame: string | null;
  gameState: unknown;
  isPlaying: boolean;
  isSinglePlayer: boolean;
  difficulty: Difficulty;
  players: Array<{ id: string; name: string; avatar: string }>;
  setActiveGame: (gameId: string) => void;
  setGameState: (state: unknown) => void;
  setDifficulty: (d: Difficulty) => void;
  setPlayers: (players: Array<{ id: string; name: string; avatar: string }>) => void;
  startGame: (gameId: string, isSingle: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  activeGame: null,
  gameState: null,
  isPlaying: false,
  isSinglePlayer: true,
  difficulty: 'medium',
  players: [],

  setActiveGame: (gameId: string) => set({ activeGame: gameId }),
  setGameState: (state: unknown) => set({ gameState: state }),
  setDifficulty: (d: Difficulty) => set({ difficulty: d }),
  setPlayers: (players) => set({ players }),

  startGame: (gameId: string, isSingle: boolean) =>
    set({ activeGame: gameId, isPlaying: true, isSinglePlayer: isSingle, gameState: null }),

  resetGame: () =>
    set({ activeGame: null, gameState: null, isPlaying: false }),
}));
