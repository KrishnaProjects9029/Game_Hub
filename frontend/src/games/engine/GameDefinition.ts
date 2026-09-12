export type GameCategory = 'brain' | 'reflex' | 'racing' | 'action' | 'running' | 'sports' | 'party';

export interface GameControls {
  desktop: string;
  touch: string;
}

export interface GameDefinition {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  supportsSinglePlayer: boolean;
  supportsMultiplayer: boolean;
  minPlayers: number;
  maxPlayers: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  icon: string;
  estimatedDuration: string;
  controls?: GameControls;
  status?: 'playable' | 'in_development' | 'planned';
  phase?: number;
  isFeatured?: boolean;
  popularityRank?: number;
}

export interface CategoryInfo {
  id: GameCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const CATEGORIES: Record<GameCategory, CategoryInfo> = {
  brain: {
    id: 'brain',
    name: 'Brain & Puzzle',
    icon: '🧠',
    color: '#8b5cf6',
    description: 'Test your logic, memory, math, and tactical thinking',
  },
  reflex: {
    id: 'reflex',
    name: 'Arcade & Reflex',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Fast-paced challenges testing speed, reaction, and timing',
  },
  racing: {
    id: 'racing',
    name: 'Racing & Driving',
    icon: '🏎️',
    color: '#ef4444',
    description: 'High-speed track races, drifts, stunts, and obstacle sprints',
  },
  action: {
    id: 'action',
    name: 'Action & Battle',
    icon: '⚔️',
    color: '#06b6d4',
    description: 'Arena battles, ninja dodging, target combat, and robotics',
  },
  running: {
    id: 'running',
    name: 'Running & Obstacle',
    icon: '🏃',
    color: '#10b981',
    description: 'Jump, slide, dash, and parkour through intense obstacle courses',
  },
  sports: {
    id: 'sports',
    name: 'Sports',
    icon: '🏀',
    color: '#f97316',
    description: 'Soccer, basketball, table tennis, bowling, and mini golf showdowns',
  },
  party: {
    id: 'party',
    name: 'Party & Multiplayer',
    icon: '🎉',
    color: '#ec4899',
    description: 'Hilarious, fast, and exciting party games for groups of friends',
  },
};
