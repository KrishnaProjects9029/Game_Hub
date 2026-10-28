import { v4 as uuidv4 } from 'uuid';

export const STORAGE_SCHEMA_VERSION = 2;

export interface UserPreferences {
  soundEnabled: boolean;
  reducedMotion: boolean;
  theme: 'console-dark' | 'midnight' | 'cyber';
  nickname: string;
  avatar: string;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  createdAt: string;
}

export interface Match {
  id: string;
  gameId: string;
  playerIds: string[];
  winnerId: string | null;
  scores: Record<string, number>;
  playedAt: string;
}

export type MatchData = Match;

export interface Achievement {
  id: string;
  playerId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface ExportDataPayload {
  version: number;
  exportedAt: string;
  preferences: UserPreferences;
  favorites: string[];
  highScores: Record<string, number>;
  recentGames: string[];
  players: Player[];
  matches: Match[];
  achievements: Achievement[];
}

export const XP_THRESHOLDS: number[] = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000,
  15000, 20000, 26000, 33000, 41000, 50000, 60000, 71000, 83000, 96000,
  110000, 125000, 141000, 158000, 176000, 195000, 215000, 236000, 258000, 281000,
  305000, 330000, 356000, 383000, 411000, 440000, 470000, 501000, 533000, 566000,
  600000, 635000, 671000, 708000, 746000, 785000, 825000, 866000, 908000, 951000,
];

export function calcLevel(xp: number): number {
  if (typeof xp !== 'number' || isNaN(xp) || xp <= 0) return 1;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

const KEYS = {
  SCHEMA: 'gamehub_schema_version',
  PREFERENCES: 'gamehub_preferences',
  FAVORITES: 'gamehub_favorites',
  HIGH_SCORES: 'gamehub_high_scores',
  RECENT: 'gamehub_recent_games',
  PLAYERS: 'gamehub_players',
  MATCHES: 'gamehub_matches',
  ACHIEVEMENTS: 'gamehub_achievements',
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  soundEnabled: true,
  reducedMotion: false,
  theme: 'console-dark',
  nickname: 'Console Player',
  avatar: '🎮',
};

class StorageEngine {
  private memoryStore: Map<string, string> = new Map();

  constructor() {
    this.runMigrations();
  }

  private safeGet<T>(key: string, fallback: T): T {
    try {
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = localStorage.getItem(key);
      } else {
        raw = this.memoryStore.get(key) ?? null;
      }
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private safeSet<T>(key: string, value: T): boolean {
    try {
      const json = JSON.stringify(value);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, json);
      }
      this.memoryStore.set(key, json);
      return true;
    } catch {
      this.memoryStore.set(key, JSON.stringify(value));
      return false;
    }
  }

  private runMigrations(): void {
    try {
      let currentVer = 1;
      if (typeof window !== 'undefined' && window.localStorage) {
        currentVer = parseInt(localStorage.getItem(KEYS.SCHEMA) || '1', 10);
      } else {
        currentVer = parseInt(this.memoryStore.get(KEYS.SCHEMA) || '1', 10);
      }

      if (currentVer < STORAGE_SCHEMA_VERSION) {
        const players = this.safeGet<Player[]>(KEYS.PLAYERS, []);
        if (players.length === 0) {
          const defaultPlayer: Player = {
            id: 'player_default',
            username: 'Player 1',
            avatar: '🎮',
            xp: 0,
            level: 1,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            createdAt: new Date().toISOString(),
          };
          this.safeSet(KEYS.PLAYERS, [defaultPlayer]);
        }
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(KEYS.SCHEMA, String(STORAGE_SCHEMA_VERSION));
        }
        this.memoryStore.set(KEYS.SCHEMA, String(STORAGE_SCHEMA_VERSION));
      }
    } catch {
      // Ignore migration errors on restricted envs
    }
  }

  // Preferences
  getPreferences(): UserPreferences {
    const saved = this.safeGet<Partial<UserPreferences>>(KEYS.PREFERENCES, {});
    return { ...DEFAULT_PREFERENCES, ...saved };
  }

  setPreferences(pref: Partial<UserPreferences>): UserPreferences {
    const updated = { ...this.getPreferences(), ...pref };
    this.safeSet(KEYS.PREFERENCES, updated);
    return updated;
  }

  // Favorites
  getFavorites(): string[] {
    const favs = this.safeGet<unknown>(KEYS.FAVORITES, []);
    return Array.isArray(favs) ? favs.filter((id): id is string => typeof id === 'string') : [];
  }

  isFavorite(gameId: string): boolean {
    return this.getFavorites().includes(gameId);
  }

  toggleFavorite(gameId: string): boolean {
    const favs = this.getFavorites();
    const idx = favs.indexOf(gameId);
    let isFav = false;
    if (idx >= 0) {
      favs.splice(idx, 1);
      isFav = false;
    } else {
      favs.push(gameId);
      isFav = true;
    }
    this.safeSet(KEYS.FAVORITES, favs);
    return isFav;
  }

  // High Scores
  getHighScore(gameId: string): number {
    const scores = this.safeGet<Record<string, number>>(KEYS.HIGH_SCORES, {});
    if (typeof scores[gameId] === 'number') return scores[gameId];
    // Fallback: check matches
    const matches = this.safeGet<Match[]>(KEYS.MATCHES, []);
    let max = 0;
    for (const m of matches) {
      if (m.gameId === gameId && m.scores) {
        for (const s of Object.values(m.scores)) {
          if (typeof s === 'number' && s > max) max = s;
        }
      }
    }
    return max;
  }

  saveHighScore(gameId: string, score: number): boolean {
    if (typeof score !== 'number' || isNaN(score) || score <= 0) return false;
    const scores = this.safeGet<Record<string, number>>(KEYS.HIGH_SCORES, {});
    const current = scores[gameId] || 0;
    if (score > current) {
      scores[gameId] = score;
      this.safeSet(KEYS.HIGH_SCORES, scores);
      return true;
    }
    return false;
  }

  // Recently Played
  getRecentlyPlayed(): string[] {
    const recents = this.safeGet<unknown>(KEYS.RECENT, []);
    if (Array.isArray(recents) && recents.length > 0) {
      return recents.filter((id): id is string => typeof id === 'string').slice(0, 16);
    }
    // Fallback to match history
    const matches = this.safeGet<Match[]>(KEYS.MATCHES, []);
    const recent: string[] = [];
    for (let i = matches.length - 1; i >= 0; i--) {
      const gid = matches[i].gameId;
      if (gid && !recent.includes(gid)) {
        recent.push(gid);
      }
      if (recent.length >= 16) break;
    }
    return recent;
  }

  recordPlayed(gameId: string): void {
    if (!gameId) return;
    const recents = this.getRecentlyPlayed().filter(id => id !== gameId);
    recents.unshift(gameId);
    this.safeSet(KEYS.RECENT, recents.slice(0, 16));
  }

  // Players
  createPlayer(username: string, avatar: string): Player {
    const players = this.safeGet<Player[]>(KEYS.PLAYERS, []);
    const player: Player = {
      id: uuidv4(),
      username: username.trim() || 'Player',
      avatar: avatar || '🎮',
      xp: 0,
      level: 1,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      createdAt: new Date().toISOString(),
    };
    players.push(player);
    this.safeSet(KEYS.PLAYERS, players);
    return player;
  }

  getPlayer(id: string): Player | null {
    const players = this.safeGet<Player[]>(KEYS.PLAYERS, []);
    return players.find((p) => p.id === id) ?? null;
  }

  getAllPlayers(): Player[] {
    const players = this.safeGet<Player[]>(KEYS.PLAYERS, []);
    if (players.length === 0) {
      return [this.getOrCreateDefaultPlayer()];
    }
    return players;
  }

  getOrCreateDefaultPlayer(): Player {
    const players = this.safeGet<Player[]>(KEYS.PLAYERS, []);
    if (players.length > 0) return players[0];
    const defaultP: Player = {
      id: 'player_default',
      username: 'Player 1',
      avatar: '🎮',
      xp: 0,
      level: 1,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      createdAt: new Date().toISOString(),
    };
    this.safeSet(KEYS.PLAYERS, [defaultP]);
    return defaultP;
  }

  updatePlayerStats(id: string, won: boolean): Player | null {
    const players = this.safeGet<Player[]>(KEYS.PLAYERS, []);
    const idx = players.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const p = { ...players[idx] };
    const xpGain = won ? 50 : 10;
    p.xp += xpGain;
    p.level = calcLevel(p.xp);
    p.gamesPlayed += 1;
    if (won) p.wins += 1;
    else p.losses += 1;
    players[idx] = p;
    this.safeSet(KEYS.PLAYERS, players);
    return p;
  }

  // Matches
  saveMatch(data: Omit<Match, 'id' | 'playedAt'>): Match {
    const matches = this.safeGet<Match[]>(KEYS.MATCHES, []);
    const match: Match = {
      id: uuidv4(),
      ...data,
      playedAt: new Date().toISOString(),
    };
    matches.push(match);
    if (matches.length > 100) {
      matches.splice(0, matches.length - 100);
    }
    this.safeSet(KEYS.MATCHES, matches);
    this.recordPlayed(data.gameId);
    return match;
  }

  getPlayerMatches(playerId: string): Match[] {
    const matches = this.safeGet<Match[]>(KEYS.MATCHES, []);
    return matches.filter((m) => m.playerIds.includes(playerId));
  }

  // Achievements
  saveAchievement(playerId: string, achievementId: string): Achievement {
    const achievements = this.safeGet<Achievement[]>(KEYS.ACHIEVEMENTS, []);
    const existing = achievements.find(
      (a) => a.playerId === playerId && a.achievementId === achievementId
    );
    if (existing) return existing;
    const ach: Achievement = {
      id: uuidv4(),
      playerId,
      achievementId,
      unlockedAt: new Date().toISOString(),
    };
    achievements.push(ach);
    this.safeSet(KEYS.ACHIEVEMENTS, achievements);
    return ach;
  }

  getAchievements(playerId: string): Achievement[] {
    const achievements = this.safeGet<Achievement[]>(KEYS.ACHIEVEMENTS, []);
    return achievements.filter((a) => a.playerId === playerId);
  }

  getXpForLevel(level: number): number {
    const idx = Math.max(0, Math.min(level - 1, XP_THRESHOLDS.length - 1));
    return XP_THRESHOLDS[idx];
  }

  getXpForNextLevel(level: number): number {
    const idx = Math.min(level, XP_THRESHOLDS.length - 1);
    return XP_THRESHOLDS[idx];
  }

  // Import / Export / Wipe
  exportData(): string {
    const payload: ExportDataPayload = {
      version: STORAGE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      preferences: this.getPreferences(),
      favorites: this.getFavorites(),
      highScores: this.safeGet<Record<string, number>>(KEYS.HIGH_SCORES, {}),
      recentGames: this.getRecentlyPlayed(),
      players: this.getAllPlayers(),
      matches: this.safeGet<Match[]>(KEYS.MATCHES, []),
      achievements: this.safeGet<Achievement[]>(KEYS.ACHIEVEMENTS, []),
    };
    return JSON.stringify(payload, null, 2);
  }

  importData(jsonString: string): { success: boolean; error?: string } {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return { success: false, error: 'Empty or invalid JSON data' };
      }
      if (jsonString.length > 5 * 1024 * 1024) {
        return { success: false, error: 'Import payload exceeds maximum 5MB size limit' };
      }
      const data = JSON.parse(jsonString) as Partial<ExportDataPayload>;
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Parsed payload is not an object' };
      }
      if (data.preferences) this.safeSet(KEYS.PREFERENCES, data.preferences);
      if (Array.isArray(data.favorites)) this.safeSet(KEYS.FAVORITES, data.favorites);
      if (data.highScores && typeof data.highScores === 'object') this.safeSet(KEYS.HIGH_SCORES, data.highScores);
      if (Array.isArray(data.recentGames)) this.safeSet(KEYS.RECENT, data.recentGames);
      if (Array.isArray(data.players)) this.safeSet(KEYS.PLAYERS, data.players);
      if (Array.isArray(data.matches)) this.safeSet(KEYS.MATCHES, data.matches);
      if (Array.isArray(data.achievements)) this.safeSet(KEYS.ACHIEVEMENTS, data.achievements);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Invalid JSON file format' };
    }
  }

  resetAllData(): void {
    try {
      this.memoryStore.clear();
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
      }
      this.runMigrations();
    } catch {
      // Ignore
    }
  }
}

export const storage = new StorageEngine();
export const localDB = storage;
export const db = storage;
