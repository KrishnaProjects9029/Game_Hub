export type GameCategory =
  | 'brain'
  | 'reflex'
  | 'racing'
  | 'action'
  | 'running'
  | 'sports'
  | 'party'
  | 'puzzle'
  | 'arcade'
  | 'adventure'
  | 'strategy'
  | 'casual'
  | 'twoplayer'
  | 'simulation';

export type IntegrationType = 'local' | 'html5_hosted' | 'authorized_embed' | 'external_link';

export interface GameControls {
  desktop: string;
  touch: string;
}

export interface SupportedControls {
  keyboard?: boolean;
  mouse?: boolean;
  touch?: boolean;
  gamepad?: boolean;
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

  // Poki-inspired Library Extension Metadata
  integrationType?: IntegrationType;
  playUrl?: string;
  externalUrl?: string;
  publisher?: string;
  license?: string;
  tags?: string[];
  aspectRatio?: string;
  thumbnailUrl?: string;
  supportedControls?: SupportedControls;
  isMobileReady?: boolean;
  isTwoPlayer?: boolean;
  releaseYear?: number | string;
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
    name: 'Brain & Logic',
    icon: '🧠',
    color: '#8b5cf6',
    description: 'Test your logic, memory, math, and tactical thinking',
  },
  puzzle: {
    id: 'puzzle',
    name: 'Puzzle & Brain',
    icon: '🧩',
    color: '#a855f7',
    description: 'Mind-bending puzzles, sliding blocks, and word challenges',
  },
  reflex: {
    id: 'reflex',
    name: 'Arcade & Reflex',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Fast-paced challenges testing speed, reaction, and timing',
  },
  arcade: {
    id: 'arcade',
    name: 'Classic Arcade',
    icon: '🕹️',
    color: '#ec4899',
    description: 'Timeless retro arcade classics, pixel combat, and high-score chases',
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
    name: 'Action & Combat',
    icon: '⚔️',
    color: '#06b6d4',
    description: 'Arena battles, ninja dodging, target combat, and robotics',
  },
  adventure: {
    id: 'adventure',
    name: 'Adventure & Platformer',
    icon: '🗺️',
    color: '#3b82f6',
    description: 'Explore vibrant levels, jump across platforms, and dodge perils',
  },
  running: {
    id: 'running',
    name: 'Endless Runner',
    icon: '🏃',
    color: '#10b981',
    description: 'Jump, slide, dash, and parkour through intense obstacle courses',
  },
  sports: {
    id: 'sports',
    name: 'Sports & Competition',
    icon: '🏀',
    color: '#f97316',
    description: 'Soccer, basketball, table tennis, bowling, and mini golf showdowns',
  },
  strategy: {
    id: 'strategy',
    name: 'Strategy & Tactics',
    icon: '♟️',
    color: '#6366f1',
    description: 'Turn-based tactics, board domination, and strategic thinking',
  },
  twoplayer: {
    id: 'twoplayer',
    name: '2 Player Games',
    icon: '👥',
    color: '#14b8a6',
    description: 'Share a screen or battle a friend in head-to-head competition',
  },
  casual: {
    id: 'casual',
    name: 'Casual & Relaxing',
    icon: '☕',
    color: '#eab308',
    description: 'Easy-to-learn, satisfying games to unwind and pass the time',
  },
  simulation: {
    id: 'simulation',
    name: 'Simulation & Physics',
    icon: '🏗️',
    color: '#64748b',
    description: 'Physics playgrounds, stacking, balancing, and building',
  },
  party: {
    id: 'party',
    name: 'Party & Multiplayer',
    icon: '🎉',
    color: '#d946ef',
    description: 'Hilarious, fast, and exciting party games for groups of friends',
  },
};
