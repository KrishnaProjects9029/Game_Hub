import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_LIST, getGameEngine } from '../games/engine/GameRegistry';
import { GameDefinition } from '../games/engine/GameDefinition';
import { CATEGORIES, GameCategory } from '../games/engine/GameDefinition';
import { useGameStore } from '../store/gameStore';
import { localDB } from '../db/database';
import { Header } from '../components/layout/Header';
import { GameDetailsModal } from '../components/game/GameDetailsModal';

type Difficulty = 'easy' | 'medium' | 'hard';
type FilterCategory = 'all' | 'featured' | GameCategory;
type ModeFilter = 'all' | 'solo' | 'multi';
type PlayerCountFilter = 'all' | '2' | '4' | '6';
type SortOption = 'featured' | 'popular' | 'new' | 'highest_score' | 'recently_played';

export const SinglePlayer: React.FC = () => {
  const navigate = useNavigate();
  const { setDifficulty, difficulty, setActiveGame } = useGameStore();
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>(difficulty);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [playerFilter, setPlayerFilter] = useState<PlayerCountFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [modalGame, setModalGame] = useState<GameDefinition | null>(null);

  useEffect(() => {
    setDifficulty(selectedDiff);
  }, [selectedDiff, setDifficulty]);

  const recentlyPlayedIds = useMemo(() => localDB.getRecentlyPlayed(), []);

  // Filter and sort catalog
  const filteredAndSortedGames = useMemo(() => {
    let list = [...GAME_LIST];

    // Category filter
    if (activeCategory === 'featured') {
      list = list.filter(g => g.isFeatured);
    } else if (activeCategory !== 'all') {
      list = list.filter(g => g.category === activeCategory);
    }

    // Mode filter
    if (modeFilter === 'solo') {
      list = list.filter(g => g.supportsSinglePlayer);
    } else if (modeFilter === 'multi') {
      list = list.filter(g => g.supportsMultiplayer);
    }

    // Player count filter
    if (playerFilter === '2') {
      list = list.filter(g => g.minPlayers <= 2 && g.maxPlayers >= 2);
    } else if (playerFilter === '4') {
      list = list.filter(g => g.minPlayers <= 4 && g.maxPlayers >= 4);
    } else if (playerFilter === '6') {
      list = list.filter(g => g.maxPlayers >= 6);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        g =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.popularityRank || 99) - (b.popularityRank || 99);
      }
      if (sortBy === 'popular') {
        return (a.popularityRank || 99) - (b.popularityRank || 99);
      }
      if (sortBy === 'new') {
        return (a.phase || 99) - (b.phase || 99);
      }
      if (sortBy === 'highest_score') {
        const scoreA = localDB.getHighScore(a.id);
        const scoreB = localDB.getHighScore(b.id);
        return scoreB - scoreA;
      }
      if (sortBy === 'recently_played') {
        const idxA = recentlyPlayedIds.indexOf(a.id);
        const idxB = recentlyPlayedIds.indexOf(b.id);
        const posA = idxA === -1 ? 999 : idxA;
        const posB = idxB === -1 ? 999 : idxB;
        return posA - posB;
      }
      return 0;
    });

    return list;
  }, [activeCategory, modeFilter, playerFilter, searchQuery, sortBy, recentlyPlayedIds]);

  const handlePlayNow = (e: React.MouseEvent, game: GameDefinition) => {
    e.stopPropagation();
    const hasEngine = !!getGameEngine(game.id);
    if (!hasEngine || game.status === 'planned') {
      setModalGame(game);
      return;
    }

    setActiveGame(game.id);
    if (game.supportsSinglePlayer) {
      setDifficulty(selectedDiff);
      navigate(`/play/single/${game.id}`);
    } else {
      navigate(`/play/local?game=${game.id}`);
    }
  };

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ flex: 1, paddingTop: '1.5rem', paddingBottom: '3rem' }}>
        {/* Header Title */}
        <div style={{ marginBottom: '1.25rem', animation: 'slideDown 0.3s ease' }}>
          <h2 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎮</span> Game Library
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Discover 44 original offline games. Play solo vs smart AI or duel locally on LAN and same device.
          </p>
        </div>

        {/* Global Controls: Search, Filters, Sorting & AI Level */}
        <div
          className="card"
          style={{
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Row 1: Search + Sorting + AI Level */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search bar */}
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                className="input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search 44 games by name, type, rules..."
                style={{ width: '100%', paddingLeft: '1rem' }}
              />
            </div>

            {/* Sorting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
              <select
                className="input"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto', background: 'var(--surface)' }}
              >
                <option value="featured">🔥 Featured First</option>
                <option value="popular">⭐ Most Popular</option>
                <option value="new">🚀 New / Roadmap</option>
                <option value="highest_score">🏆 Highest Score</option>
                <option value="recently_played">🕒 Recently Played</option>
              </select>
            </div>

            {/* AI Difficulty Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                AI Level:
              </span>
              <div className="difficulty-btns">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    className={`diff-btn ${d} ${selectedDiff === d ? 'active' : ''}`}
                    onClick={() => setSelectedDiff(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Quick Filter Badges (Mode & Player Count) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mode:</span>
              {(['all', 'solo', 'multi'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: modeFilter === m ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: modeFilter === m ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {m === 'all' ? 'All Modes' : m === 'solo' ? '👤 Solo' : '👥 Multiplayer'}
                </button>
              ))}
            </div>

            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Players:</span>
              {(['all', '2', '4', '6'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPlayerFilter(p)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: playerFilter === p ? 'var(--secondary)' : 'rgba(255,255,255,0.06)',
                    color: playerFilter === p ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p === 'all' ? 'Any' : `${p} Players`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '10px',
            marginBottom: '1.5rem',
            scrollbarWidth: 'none',
          }}
        >
          {/* All */}
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              backgroundColor: activeCategory === 'all' ? '#6366f1' : 'rgba(255, 255, 255, 0.06)',
              color: activeCategory === 'all' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            🌟 All ({GAME_LIST.length})
          </button>

          {/* Featured */}
          <button
            onClick={() => setActiveCategory('featured')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: activeCategory === 'featured' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              backgroundColor: activeCategory === 'featured' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: activeCategory === 'featured' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <span>🔥</span>
            <span>Featured ({GAME_LIST.filter(g => g.isFeatured).length})</span>
          </button>

          {/* 7 Specific Categories */}
          {Object.entries(CATEGORIES).map(([catKey, catInfo]) => {
            const count = GAME_LIST.filter(g => g.category === catKey).length;
            const isSelected = activeCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey as GameCategory)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: isSelected ? `1.5px solid ${catInfo.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  backgroundColor: isSelected ? `${catInfo.color}30` : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{catInfo.icon}</span>
                <span>{catInfo.name}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Game Cards Grid */}
        {filteredAndSortedGames.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <h3>No games found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search query or filter tags.</p>
          </div>
        ) : (
          <div className="game-grid" style={{ animation: 'slideUp 0.4s ease' }}>
            {filteredAndSortedGames.map(game => {
              const catInfo = CATEGORIES[game.category] || {
                color: '#6366f1',
                name: 'Game',
                icon: '🎮',
              };
              const isPlayable = game.status === 'playable' || !game.status;

              return (
                <div
                  key={game.id}
                  className="game-card"
                  onClick={() => setModalGame(game)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setModalGame(game);
                  }}
                  style={{
                    borderTop: `3px solid ${catInfo.color}`,
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Top row: Icon + Category Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div className="game-card-icon" style={{ fontSize: '2.5rem', margin: 0 }}>
                        {game.icon}
                      </div>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${catInfo.color}25`,
                          color: catInfo.color,
                          border: `1px solid ${catInfo.color}40`,
                          fontSize: '0.7rem',
                        }}
                      >
                        {catInfo.icon} {catInfo.name}
                      </span>
                    </div>

                    {/* Game Name */}
                    <div className="game-card-name" style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                      {game.name}
                    </div>

                    {/* Description */}
                    <div className="game-card-desc" style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                      {game.description}
                    </div>
                  </div>

                  <div>
                    {/* Mode & Player Count Badges */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                      {game.supportsSinglePlayer && (
                        <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          👤 SOLO
                        </span>
                      )}
                      {game.supportsMultiplayer && (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          👥 {game.minPlayers === game.maxPlayers ? `${game.minPlayers}P` : `${game.minPlayers}–${game.maxPlayers}P`}
                        </span>
                      )}
                      {game.difficulty && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 8px', textTransform: 'capitalize' }}>
                          🎯 {game.difficulty}
                        </span>
                      )}
                    </div>

                    {/* Action Button: [ PLAY NOW ] */}
                    <button
                      className={`btn ${isPlayable ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                      onClick={e => handlePlayNow(e, game)}
                      style={{
                        width: '100%',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        padding: '8px 12px',
                        background: isPlayable ? undefined : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      {isPlayable ? '▶ PLAY NOW' : `🔍 PREVIEW (Phase ${game.phase})`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Game Details & Direct Launch */}
        <GameDetailsModal
          game={modalGame}
          isOpen={!!modalGame}
          onClose={() => setModalGame(null)}
          defaultMode="all"
        />
      </div>
    </div>
  );
};
