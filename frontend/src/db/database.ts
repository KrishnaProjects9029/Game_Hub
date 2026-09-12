import { v4 as uuidv4 } from 'uuid';

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

export interface Achievement {
  id: string;
  playerId: string;
  achievementId: string;
  unlockedAt: string;
}

const XP_THRESHOLDS: number[] = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000,
  15000, 20000, 26000, 33000, 41000, 50000, 60000, 71000, 83000, 96000,
  110000, 125000, 141000, 158000, 176000, 195000, 215000, 236000, 258000, 281000,
  305000, 330000, 356000, 383000, 411000, 440000, 470000, 501000, 533000, 566000,
  600000, 635000, 671000, 708000, 746000, 785000, 825000, 866000, 908000, 951000,
];

function calcLevel(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

const PLAYERS_KEY = 'gamehub_players';
const MATCHES_KEY = 'gamehub_matches';
const ACHIEVEMENTS_KEY = 'gamehub_achievements';

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

class LocalDB {
  createPlayer(username: string, avatar: string): Player {
    const players = load<Player>(PLAYERS_KEY);
    const player: Player = {
      id: uuidv4(),
      username,
      avatar,
      xp: 0,
      level: 1,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      createdAt: new Date().toISOString(),
    };
    players.push(player);
    save(PLAYERS_KEY, players);
    return player;
  }

  getPlayer(id: string): Player | null {
    const players = load<Player>(PLAYERS_KEY);
    return players.find((p) => p.id === id) ?? null;
  }

  getAllPlayers(): Player[] {
    return load<Player>(PLAYERS_KEY);
  }

  updatePlayerStats(id: string, won: boolean): Player | null {
    const players = load<Player>(PLAYERS_KEY);
    const idx = players.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const p = players[idx];
    const xpGain = won ? 50 : 10;
    p.xp += xpGain;
    p.level = calcLevel(p.xp);
    p.gamesPlayed += 1;
    if (won) p.wins += 1;
    else p.losses += 1;
    players[idx] = p;
    save(PLAYERS_KEY, players);
    return p;
  }

  saveMatch(data: Omit<Match, 'id' | 'playedAt'>): Match {
    const matches = load<Match>(MATCHES_KEY);
    const match: Match = {
      id: uuidv4(),
      ...data,
      playedAt: new Date().toISOString(),
    };
    matches.push(match);
    save(MATCHES_KEY, matches);
    return match;
  }

  getPlayerMatches(playerId: string): Match[] {
    const matches = load<Match>(MATCHES_KEY);
    return matches.filter((m) => m.playerIds.includes(playerId));
  }

  saveAchievement(playerId: string, achievementId: string): Achievement {
    const achievements = load<Achievement>(ACHIEVEMENTS_KEY);
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
    save(ACHIEVEMENTS_KEY, achievements);
    return ach;
  }

  getAchievements(playerId: string): Achievement[] {
    const achievements = load<Achievement>(ACHIEVEMENTS_KEY);
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

  getHighScore(gameId: string): number {
    const matches = load<Match>(MATCHES_KEY);
    let max = 0;
    for (const m of matches) {
      if (m.gameId === gameId && m.scores) {
        for (const score of Object.values(m.scores)) {
          if (typeof score === 'number' && score > max) max = score;
        }
      }
    }
    return max;
  }

  getRecentlyPlayed(): string[] {
    const matches = load<Match>(MATCHES_KEY);
    const recent: string[] = [];
    for (let i = matches.length - 1; i >= 0; i--) {
      const gid = matches[i].gameId;
      if (gid && !recent.includes(gid)) {
        recent.push(gid);
      }
      if (recent.length >= 12) break;
    }
    return recent;
  }
}

export const db = new LocalDB();
export const localDB = db;
export type MatchData = Match;
export { calcLevel, XP_THRESHOLDS };
