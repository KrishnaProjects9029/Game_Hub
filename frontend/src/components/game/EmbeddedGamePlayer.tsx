import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameDefinition, CATEGORIES } from '../../games/engine/GameDefinition';
import { storage } from '../../db/storage';

interface EmbeddedGamePlayerProps {
  game: GameDefinition;
  onExit?: () => void;
}

export const EmbeddedGamePlayer: React.FC<EmbeddedGamePlayerProps> = ({ game, onExit }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(() => storage.isFavorite(game.id));

  const categoryInfo = CATEGORIES[game.category] || {
    name: 'Games',
    color: '#06b6d4',
    icon: '🎮',
  };

  // Record recently played upon mounting
  useEffect(() => {
    storage.recordPlayed(game.id);
  }, [game.id]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Prevent Space and Arrow keys from scrolling outer window when game is loaded
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        // If target is within game container, prevent scrolling
        if (containerRef.current?.contains(document.activeElement) || document.activeElement === iframeRef.current) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    setLoadError(false);
    if (iframeRef.current) {
      // Reload iframe src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 50);
    }
  };

  const handleFavoriteToggle = () => {
    const nextFav = storage.toggleFavorite(game.id);
    setIsFavorite(nextFav);
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (onExit) {
      onExit();
    } else {
      navigate('/single');
    }
  };

  const playSrc = game.playUrl || (game.id ? `/games/${game.id}/index.html` : '');

  return (
    <div
      ref={containerRef}
      className="embedded-game-player"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
        backgroundColor: '#070a12',
        position: 'relative',
        borderRadius: isFullscreen ? '0' : '16px',
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Top Arcade Command Cockpit Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          background: 'linear-gradient(180deg, #121626 0%, #0d101c 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 20,
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {/* Left: Back button & Title Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExit}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
            }}
            title="Exit to Hub"
          >
            ◀ Hub
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{game.icon}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  {game.name}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: `${categoryInfo.color}25`,
                    color: categoryInfo.color,
                    border: `1px solid ${categoryInfo.color}60`,
                  }}
                >
                  {categoryInfo.name}
                </span>
                {game.isTwoPlayer && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(20, 184, 166, 0.2)',
                      color: '#14b8a6',
                      border: '1px solid rgba(20, 184, 166, 0.4)',
                    }}
                  >
                    2-PLAYER
                  </span>
                )}
              </div>
              {game.publisher && (
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  By {game.publisher} • {game.license || 'Open Source'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions (Favorite, Reload, New Tab Fallback, Fullscreen) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleFavoriteToggle}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: isFavorite ? '#f59e0b' : '#94a3b8',
              fontSize: '14px',
            }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
          >
            {isFavorite ? '★' : '☆'}
          </button>

          <button
            onClick={handleReload}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
            }}
            title="Reload game instance"
          >
            🔄 Reload
          </button>

          {playSrc && (
            <a
              href={playSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Open game in isolated window / tab"
            >
              ↗ Tab
            </a>
          )}

          <button
            onClick={toggleFullscreen}
            className="btn btn-primary btn-sm"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
              color: '#04101e',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '🗗 Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </header>

      {/* Main Game Stage / Iframe Viewport */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#030508',
        }}
      >
        {/* Loading Overlay */}
        {isLoading && !loadError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#070a12',
              zIndex: 10,
              gap: '14px',
            }}
          >
            <div style={{ fontSize: '42px', animation: 'bounce 1s infinite' }}>{game.icon}</div>
            <div
              className="spinner"
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(56, 189, 248, 0.2)',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
              }}
            />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
              Launching {game.name}...
            </div>
          </div>
        )}

        {/* Load Error State */}
        {loadError && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '48px' }}>⚠️</div>
            <h3 style={{ color: '#ef4444', margin: 0 }}>Unable to Load Embedded Game</h3>
            <p style={{ color: '#94a3b8', maxWidth: '400px', fontSize: '14px' }}>
              The game content could not be displayed directly in this frame. You can launch it in a separate window or tab.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={handleReload} className="btn btn-secondary btn-md">
                Try Reloading
              </button>
              {playSrc && (
                <a
                  href={playSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-md"
                  style={{ textDecoration: 'none' }}
                >
                  Open in New Window
                </a>
              )}
            </div>
          </div>
        )}

        {/* The Sandboxed IFrame */}
        {playSrc && (
          <iframe
            ref={iframeRef}
            src={playSrc}
            title={game.name}
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
            allow="fullscreen; gamepad; autoplay"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: loadError ? 'none' : 'block',
              backgroundColor: '#000',
            }}
          />
        )}
      </div>

      {/* Bottom Controls & Info Bar */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 1rem',
          background: 'rgba(10, 14, 24, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '12px',
          color: '#94a3b8',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {game.controls?.desktop && (
            <div>
              <strong style={{ color: '#cbd5e1' }}>Desktop:</strong> {game.controls.desktop}
            </div>
          )}
          {game.controls?.touch && (
            <div>
              <strong style={{ color: '#cbd5e1' }}>Mobile:</strong> {game.controls.touch}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {game.license && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#64748b',
              }}
            >
              {game.license}
            </span>
          )}
          <span>Game Hub Verified Browser Library</span>
        </div>
      </footer>
    </div>
  );
};
