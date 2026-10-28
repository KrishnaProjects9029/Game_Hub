import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { storage } from '../db/storage';
import { MASTER_CATALOG, GAME_LIST } from '../games/engine/GameRegistry';
import { GameDefinition } from '../games/engine/GameDefinition';
import { Header } from '../components/layout/Header';
import { FeaturedHero } from '../components/home/FeaturedHero';
import { GameShelf } from '../components/home/GameShelf';
import { GameDetailsModal } from '../components/game/GameDetailsModal';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { loadPlayers } = usePlayerStore();
  const [modalGame, setModalGame] = useState<GameDefinition | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => storage.getFavorites());

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleFavoriteToggle = () => {
    setFavoriteIds(storage.getFavorites());
  };

  // 1. Featured Games (Top tier browser classics)
  const featuredGames = useMemo(() => {
    const featuredIds = ['snake', 'hextris', 'game2048', 'tetris', 'pacman', 'flappy-bird', 'minesweeper', 'asteroids', 'pong', 'breakout'];
    return GAME_LIST.filter((g) => featuredIds.includes(g.id));
  }, []);

  // 2. Recently Played
  const recentGames = useMemo(() => {
    const recents = storage.getRecentlyPlayed();
    return recents
      .map((id) => GAME_LIST.find((g) => g.id === id))
      .filter((g): g is GameDefinition => !!g);
  }, []);

  // 3. User Favorites
  const favoriteGames = useMemo(() => {
    return favoriteIds
      .map((id) => GAME_LIST.find((g) => g.id === id))
      .filter((g): g is GameDefinition => !!g);
  }, [favoriteIds]);

  // 4. Brain & Strategy Shelf
  const brainGames = useMemo(() => {
    return GAME_LIST.filter((g) => g.category === 'brain');
  }, []);

  // 5. Arcade & Reflex Shelf
  const reflexGames = useMemo(() => {
    return GAME_LIST.filter((g) => g.category === 'reflex' || g.category === 'action' || g.category === 'racing');
  }, []);

  // 6. Multiplayer Games Shelf
  const multiplayerGames = useMemo(() => {
    return GAME_LIST.filter((g) => g.supportsMultiplayer);
  }, []);

  return (
    <div className="page" style={{ background: '#0a0b12', minHeight: '100vh', color: '#f1f5f9' }}>
      <Header />

      <main className="container" style={{ flex: 1, paddingTop: '1.5rem', paddingBottom: '3.5rem' }}>
        {/* Featured Cinematic Hero Banner */}
        <FeaturedHero
          featuredGames={featuredGames}
          onOpenDetails={(g) => setModalGame(g)}
        />

        {/* Quick Mode Jump Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '2.5rem' }}>
          <div
            onClick={() => navigate('/singleplayer')}
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(20, 22, 38, 0.95) 100%)',
              border: '1.5px solid rgba(124, 58, 237, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'transform 0.2s ease',
            }}
            className="console-tile"
          >
            <div style={{ fontSize: '2.4rem' }}>👤</div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Solo Play vs AI</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>7795 40 instant browser games with smart AI</div>
            </div>
          </div>

          <div
            onClick={() => navigate('/multiplayer')}
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(20, 22, 38, 0.95) 100%)',
              border: '1.5px solid rgba(6, 182, 212, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'transform 0.2s ease',
            }}
            className="console-tile"
          >
            <div style={{ fontSize: '2.4rem' }}>🌐</div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Online Multiplayer</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time WebRTC & LAN rooms</div>
            </div>
          </div>

          <div
            onClick={() => navigate('/play/local')}
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(20, 22, 38, 0.95) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'transform 0.2s ease',
            }}
            className="console-tile"
          >
            <div style={{ fontSize: '2.4rem' }}>📱</div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Pass & Play</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local 2-player on same screen</div>
            </div>
          </div>
        </div>

        {/* 1. Continue Playing / Recently Played (Only shown if genuinely played) */}
        {recentGames.length > 0 && (
          <GameShelf
            title="Continue Playing"
            icon="🕒"
            games={recentGames}
            onOpenDetails={(g) => setModalGame(g)}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}

        {/* 2. Your Favorites Shelf (Only shown if user has favorited games) */}
        {favoriteGames.length > 0 && (
          <GameShelf
            title="Your Favorites"
            icon="⭐"
            games={favoriteGames}
            onOpenDetails={(g) => setModalGame(g)}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}

        {/* 3. Featured Games Shelf */}
        <GameShelf
          title="Featured Classics"
          icon="🔥"
          games={featuredGames}
          onOpenDetails={(g) => setModalGame(g)}
          onFavoriteToggle={handleFavoriteToggle}
          onViewAll={() => navigate('/singleplayer')}
        />

        {/* Arcade Classics Shelf */}
        <GameShelf
          title="Classic Arcade Hits"
          icon="🕹️"
          games={GAME_LIST.filter((g) => g.category === 'arcade')}
          onOpenDetails={(g) => setModalGame(g)}
          onFavoriteToggle={handleFavoriteToggle}
          onViewAll={() => navigate('/singleplayer?category=arcade')}
        />

        {/* 2-Player Couch Duels Shelf */}
        <GameShelf
          title="2-Player Couch Favorites"
          icon="👥"
          games={GAME_LIST.filter((g) => g.isTwoPlayer || g.category === 'twoplayer')}
          onOpenDetails={(g) => setModalGame(g)}
          onFavoriteToggle={handleFavoriteToggle}
          onViewAll={() => navigate('/singleplayer?category=twoplayer')}
        />

        {/* 4. Brain & Puzzle Shelf */}
        <GameShelf
          title="Brain & Strategy"
          icon="🧠"
          games={brainGames}
          onOpenDetails={(g) => setModalGame(g)}
          onFavoriteToggle={handleFavoriteToggle}
          onViewAll={() => navigate('/singleplayer?category=brain')}
        />

        {/* 5. Arcade & Reflex Shelf */}
        <GameShelf
          title="Arcade & Reflex"
          icon="⚡"
          games={reflexGames}
          onOpenDetails={(g) => setModalGame(g)}
          onFavoriteToggle={handleFavoriteToggle}
          onViewAll={() => navigate('/singleplayer?category=reflex')}
        />

        {/* 6. Multiplayer Shelf */}
        <GameShelf
          title="Multiplayer Duels"
          icon="👥"
          games={multiplayerGames}
          onOpenDetails={(g) => setModalGame(g)}
          onFavoriteToggle={handleFavoriteToggle}
          onViewAll={() => navigate('/multiplayer')}
        />
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
