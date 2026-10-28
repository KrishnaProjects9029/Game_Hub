import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { GAME_LIST } from '../games/engine/GameRegistry';
import { GameDefinition, CATEGORIES, GameCategory } from '../games/engine/GameDefinition';
import { useGameStore } from '../store/gameStore';
import { storage } from '../db/storage';
import { Header } from '../components/layout/Header';
import { ConsoleGameCard } from '../components/game/ConsoleGameCard';
import { GameDetailsModal } from '../components/game/GameDetailsModal';

type Difficulty = 'easy' | 'medium' | 'hard';
type FilterTab = 'all' | 'favorites' | GameCategory;
type SortOption = 'featured' | 'name' | 'highest_score' | 'recently_played';

export const SinglePlayer: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = (searchParams.get('category') as FilterTab) || (searchParams.get('filter') === 'favorites' ? 'favorites' : 'all');

  const { setDifficulty, difficulty } = useGameStore();
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>(difficulty);
  const [activeTab, setActiveTab] = useState<FilterTab>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [modeFilter, setModeFilter] = useState<'all' | 'single' | 'multi'>('all');
  const [modalGame, setModalGame] = useState<GameDefinition | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => storage.getFavorites());

  useEffect(() => {
    setDifficulty(selectedDiff);
  }, [selectedDiff, setDifficulty]);

  // Update query when location changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
    const cat = searchParams.get('category') as FilterTab;
    if (cat) setActiveTab(cat);
    if (searchParams.get('filter') === 'favorites') setActiveTab('favorites');
  }, [location.search]);

  const recentlyPlayedIds = useMemo(() => storage.getRecentlyPlayed(), []);

  const handleFavoriteToggle = () => {
    setFavoriteIds(storage.getFavorites());
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setModeFilter('all');
    setSortBy('featured');
  };

  // Filter and sort catalog
  const filteredAndSortedGames = useMemo(() => {
    let list = [...GAME_LIST];

    // Tab filter
    if (activeTab === 'favorites') {
      list = list.filter((g) => favoriteIds.includes(g.id));
    } else if (activeTab !== 'all') {
      list = list.filter((g) => g.category === activeTab);
    }

    // Mode filter
    if (modeFilter === 'single') {
      list = list.filter((g) => g.supportsSinglePlayer);
    } else if (modeFilter === 'multi') {
      list = list.filter((g) => g.supportsMultiplayer);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.tags?.some((t) => t.toLowerCase().includes(q)) ||
          (g.publisher && g.publisher.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.popularityRank || 99) - (b.popularityRank || 99);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'highest_score') {
        const scoreA = storage.getHighScore(a.id);
        const scoreB = storage.getHighScore(b.id);
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
  }, [activeTab, favoriteIds, modeFilter, searchQuery, sortBy, recentlyPlayedIds]);

  return (
    <div className="page" style={{ background: '#0a0b12', minHeight: '100vh', color: '#f1f5f9' }}>
      <Header />

      <main className="container" style={{ flex: 1, paddingTop: '1.5rem', paddingBottom: '3.5rem' }}>
        {/* Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🎮</span> Game Discovery Library
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
              Browse 40 instant browser games. Play solo vs smart AI, 2-player couch mode, or battle friends online.
            </p>
          </div>

          {/* AI Difficulty Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI Level:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDiff(d)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: selectedDiff === d ? '#7c3aed' : 'transparent',
                    color: selectedDiff === d ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Controls Filter Card */}
        <div
          style={{
            background: 'rgba(20, 22, 34, 0.95)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Row 1: Search + Sort + Mode */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <input
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search games by title, rules, keywords..."
                style={{ width: '100%', paddingLeft: '1rem', background: 'rgba(0,0,0,0.3)' }}
              />
            </div>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto', background: 'rgba(0,0,0,0.4)' }}
              >
                <option value="featured">🔥 Featured First</option>
                <option value="name">🔤 Alphabetical (A-Z)</option>
                <option value="highest_score">🏆 High Score</option>
                <option value="recently_played">🕒 Recently Played</option>
              </select>
            </div>

            {/* Mode Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mode:</span>
              {(['all', 'single', 'multi'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: modeFilter === m ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                    color: modeFilter === m ? '#38bdf8' : 'var(--text-muted)',
                    border: modeFilter === m ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {m === 'all' ? 'All' : m === 'single' ? 'Solo' : 'Multiplayer'}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Genre & Category Filter Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: activeTab === 'all' ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'all' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              All Games ({GAME_LIST.length})
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: activeTab === 'favorites' ? '#fbbf24' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'favorites' ? '#000' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ★ Favorites ({favoriteIds.length})
            </button>

            {(Object.keys(CATEGORIES) as GameCategory[])
              .filter((catKey) => GAME_LIST.some((g) => g.category === catKey))
              .map((catKey) => {
              const cat = CATEGORIES[catKey];
              const isActive = activeTab === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setActiveTab(catKey)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: isActive ? `${cat.color}35` : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    border: isActive ? `1.5px solid ${cat.color}` : '1.5px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              );
            })}

            {(searchQuery || activeTab !== 'all' || modeFilter !== 'all') && (
              <button
                onClick={handleClearFilters}
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.78rem',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Game Cards Grid */}
        {filteredAndSortedGames.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '18px',
            }}
          >
            {filteredAndSortedGames.map((game) => (
              <ConsoleGameCard
                key={game.id}
                game={game}
                onOpenDetails={(g) => setModalGame(g)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              border: '1px dashed var(--border)',
              padding: '3rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f1f5f9' }}>No Matching Games Found</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.25rem', fontSize: '0.9rem' }}>
              No games matched your current filters{searchQuery ? ` for "${searchQuery}"` : ''}. Try adjusting your keywords or clearing filters.
            </p>
            <button className="btn btn-secondary btn-md" onClick={handleClearFilters}>
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Game Details Modal */}
      <GameDetailsModal
        game={modalGame}
        isOpen={!!modalGame}
        onClose={() => setModalGame(null)}
        onSelectGame={(g) => setModalGame(g)}
      />
    </div>
  );
};
