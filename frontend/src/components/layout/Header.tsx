import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';
import { SettingsModal } from '../settings/SettingsModal';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPlayer } = usePlayerStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const isHome = location.pathname === '/';
  const isGames = location.pathname.startsWith('/singleplayer') || location.pathname.startsWith('/play');
  const isMulti = location.pathname.startsWith('/multiplayer') || location.pathname.startsWith('/lobby') || location.pathname.startsWith('/join');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/singleplayer?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
      setMobileMenuOpen(false);
    }
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: isActive ? '#fff' : 'var(--text-muted)',
    background: isActive ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
    border: isActive ? '1px solid rgba(124, 58, 237, 0.5)' : '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
  });

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(10, 12, 20, 0.88)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.75rem 1.25rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Left: Back / Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isHome && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                style={{ fontSize: '0.85rem', padding: '6px 10px' }}
              >
                ← Back
              </button>
            )}

            <div
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>🎮</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.04em', background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                GAME HUB
              </span>
            </div>
          </div>

          {/* Center: Search Field */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: '0 1 320px',
              display: 'none',
              alignItems: 'center',
              position: 'relative',
            }}
            className="header-search-form"
          >
            <input
              type="text"
              placeholder="Search 40+ games..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '6px 14px 6px 36px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '12px', fontSize: '0.85rem', opacity: 0.5, pointerEvents: 'none' }}>
              🔍
            </span>
          </form>

          {/* Desktop Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="header-nav-desktop">
            <button style={navItemStyle(isHome)} onClick={() => navigate('/')}>
              <span>🌟</span> Discover
            </button>
            <button style={navItemStyle(isGames && !location.search.includes('filter=favorites'))} onClick={() => navigate('/singleplayer')}>
              <span>🕹️</span> Games
            </button>
            <button style={navItemStyle(isMulti)} onClick={() => navigate('/multiplayer')}>
              <span>👥</span> Multiplayer
            </button>
            <button style={navItemStyle(location.search.includes('filter=favorites'))} onClick={() => navigate('/singleplayer?filter=favorites')}>
              <span>⭐</span> Library
            </button>
          </nav>

          {/* Right: Settings & Player Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
              title="Settings"
              style={{ fontSize: '1.1rem', padding: '6px 10px' }}
            >
              ⚙️
            </button>

            {currentPlayer && (
              <div
                onClick={() => setIsSettingsOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                }}
                title="Edit profile & preferences"
              >
                <span style={{ fontSize: '1.2rem' }}>{currentPlayer.avatar || '🎮'}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>{currentPlayer.username}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '1px 6px', borderRadius: '8px' }}>
                  Lv.{currentPlayer.level || 1}
                </span>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className="btn btn-ghost btn-sm header-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              style={{ fontSize: '1.2rem', padding: '4px 8px' }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              paddingTop: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '0.75rem',
            }}
          >
            <form onSubmit={handleSearchSubmit} style={{ marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search games..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </form>
            <button style={navItemStyle(isHome)} onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
              <span>🌟</span> Discover
            </button>
            <button style={navItemStyle(isGames)} onClick={() => { navigate('/singleplayer'); setMobileMenuOpen(false); }}>
              <span>🕹️</span> Playable Games
            </button>
            <button style={navItemStyle(isMulti)} onClick={() => { navigate('/multiplayer'); setMobileMenuOpen(false); }}>
              <span>👥</span> Multiplayer
            </button>
            <button style={navItemStyle(false)} onClick={() => { navigate('/singleplayer?filter=favorites'); setMobileMenuOpen(false); }}>
              <span>⭐</span> My Library & Favorites
            </button>
            <button style={navItemStyle(false)} onClick={() => { setIsSettingsOpen(true); setMobileMenuOpen(false); }}>
              <span>⚙️</span> Settings & Backups
            </button>
          </div>
        )}
      </header>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
