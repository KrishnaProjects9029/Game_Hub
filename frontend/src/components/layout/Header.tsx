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
              className="brand-logo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                userSelect: 'none',
                flexShrink: 0,
                textDecoration: 'none',
              }}
              title="Game Hub Home"
            >
              {/* Sleek Glowing Controller Badge */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                  padding: '1.5px',
                  boxShadow: '0 0 16px rgba(124, 58, 237, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                className="brand-icon-box"
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '9px',
                    background: '#0d111e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="url(#brandGrad)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <defs>
                      <linearGradient id="brandGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                    <line x1="6" y1="12" x2="10" y2="12" stroke="#38bdf8" strokeWidth="2.5" />
                    <line x1="8" y1="10" x2="8" y2="14" stroke="#38bdf8" strokeWidth="2.5" />
                    <circle cx="15" cy="12" r="1" fill="#ef4444" stroke="none" />
                    <circle cx="17" cy="10" r="1" fill="#eab308" stroke="none" />
                    <circle cx="15" cy="8" r="1" fill="#10b981" stroke="none" />
                    <circle cx="13" cy="10" r="1" fill="#3b82f6" stroke="none" />
                    <rect x="2" y="6" width="20" height="12" rx="6" />
                  </svg>
                </div>
              </div>

              {/* Brand Typography (Strictly single-line, zero wrap, high contrast) */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    color: '#f8fafc',
                    textTransform: 'uppercase',
                  }}
                >
                  GAME
                </span>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textTransform: 'uppercase',
                  }}
                >
                  HUB
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    letterSpacing: '0.5px',
                    marginLeft: '2px',
                    lineHeight: '1',
                  }}
                >
                  PRO
                </span>
              </div>
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
