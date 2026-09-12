import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../../store/playerStore';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPlayer = usePlayerStore((s) => s.currentPlayer);
  const isHome = location.pathname === '/';

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {!isHome && (
          <button className="header-back" onClick={() => navigate(-1)} aria-label="Go back">
            ← Back
          </button>
        )}
        <span className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          🎮 Game Hub
        </span>
      </div>

      {currentPlayer && (
        <div className="header-player">
          <span className="header-avatar">{currentPlayer.avatar}</span>
          <span className="header-name">{currentPlayer.username}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700 }}>Lv.{currentPlayer.level}</span>
        </div>
      )}
    </header>
  );
};
