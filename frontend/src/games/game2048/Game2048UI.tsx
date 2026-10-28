import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Game2048Engine, Game2048State, Direction2048 } from './Game2048';
import { localDB } from '../../db/database';

interface Game2048UIProps {
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

const TILE_STYLES: Record<number, { bg: string; text: string; glow?: string; border?: string }> = {
  2: { bg: 'linear-gradient(135deg, #334155, #1e293b)', text: '#f1f5f9', border: 'rgba(255, 255, 255, 0.1)' },
  4: { bg: 'linear-gradient(135deg, #475569, #334155)', text: '#f1f5f9', border: 'rgba(255, 255, 255, 0.15)' },
  8: { bg: 'linear-gradient(135deg, #ea580c, #c2410c)', text: '#ffffff', glow: '0 0 12px rgba(234, 88, 12, 0.5)', border: '#f97316' },
  16: { bg: 'linear-gradient(135deg, #f97316, #ea580c)', text: '#ffffff', glow: '0 0 16px rgba(249, 115, 22, 0.6)', border: '#fb923c' },
  32: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', text: '#ffffff', glow: '0 0 18px rgba(239, 68, 68, 0.6)', border: '#f87171' },
  64: { bg: 'linear-gradient(135deg, #e11d48, #be123c)', text: '#ffffff', glow: '0 0 20px rgba(225, 29, 72, 0.7)', border: '#fb7185' },
  128: { bg: 'linear-gradient(135deg, #eab308, #ca8a04)', text: '#ffffff', glow: '0 0 22px rgba(234, 179, 8, 0.8)', border: '#fde047' },
  256: { bg: 'linear-gradient(135deg, #facc15, #eab308)', text: '#0f172a', glow: '0 0 24px rgba(250, 204, 21, 0.85)', border: '#fef08a' },
  512: { bg: 'linear-gradient(135deg, #10b981, #059669)', text: '#ffffff', glow: '0 0 26px rgba(16, 185, 129, 0.9)', border: '#34d399' },
  1024: { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', text: '#ffffff', glow: '0 0 28px rgba(6, 182, 212, 0.95)', border: '#22d3ee' },
  2048: { bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', text: '#ffffff', glow: '0 0 32px rgba(139, 92, 246, 1)', border: '#a78bfa' },
  4096: { bg: 'linear-gradient(135deg, #ec4899, #be185d)', text: '#ffffff', glow: '0 0 36px rgba(236, 72, 153, 1)', border: '#f472b6' },
};

export const Game2048UI: React.FC<Game2048UIProps> = ({ onGameOver, onExit }) => {
  const engineRef = useRef(new Game2048Engine());
  const [gameState, setGameState] = useState<Game2048State>(() => {
    const s = engineRef.current.getInitialState(['player1']);
    s.bestScore = localDB.getHighScore('game2048');
    return s;
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Touch swipe handling
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleSlide = useCallback((dir: Direction2048) => {
    const s = stateRef.current;
    const engine = engineRef.current;
    if (s.isGameOver) return;

    if (engine.validateMove(s, { type: 'SLIDE', direction: dir }, 'player1')) {
      const next = engine.applyMove(s, { type: 'SLIDE', direction: dir }, 'player1');
      setGameState(next);

      if (next.score > s.score) {
        localDB.saveHighScore('game2048', next.score);
      }

      if (next.isGameOver && !s.isGameOver) {
        localDB.saveHighScore('game2048', next.score);
        localDB.saveMatch({
          gameId: 'game2048',
          playerIds: ['player1'],
          winnerId: 'player1',
          scores: { player1: next.score },
        });
        if (onGameOver) onGameOver(next.score);
      }
    }
  }, [onGameOver]);

  const handleUndo = () => {
    const s = stateRef.current;
    if (s.previousBoard) {
      const next = engineRef.current.applyMove(s, { type: 'UNDO' }, 'player1');
      setGameState(next);
    }
  };

  const handleRestart = () => {
    const s = engineRef.current.getInitialState(['player1']);
    s.bestScore = localDB.getHighScore('game2048');
    setGameState(s);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') handleSlide('UP');
      else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') handleSlide('DOWN');
      else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') handleSlide('LEFT');
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') handleSlide('RIGHT');
      else if (e.key.toLowerCase() === 'u') handleUndo();
      else if (e.key.toLowerCase() === 'r') handleRestart();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSlide]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const threshold = 35;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        handleSlide(dx > 0 ? 'RIGHT' : 'LEFT');
      }
    } else {
      if (Math.abs(dy) > threshold) {
        handleSlide(dy > 0 ? 'DOWN' : 'UP');
      }
    }
  };

  const { board, score, bestScore, previousBoard, isWon, isGameOver } = gameState;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '440px', margin: '0 auto', gap: '1rem' }}>
      {/* Top Console HUD */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: '0.85rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.9))',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 158, 11, 0.1)',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <span className="in-game-hud-label">SCORE</span>
            <span className="in-game-hud-val" style={{ color: '#f59e0b' }}>{score}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <span className="in-game-hud-label">BEST</span>
            <span className="in-game-hud-val" style={{ color: '#10b981' }}>{Math.max(score, bestScore)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleUndo}
            disabled={!previousBoard}
            title="Undo move (U)"
            style={{ borderRadius: '10px', opacity: previousBoard ? 1 : 0.4 }}
          >
            ↩ Undo
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRestart}
            title="New Game (R)"
            style={{ borderRadius: '10px', minWidth: '40px', padding: '0.4rem' }}
          >
            🔄
          </button>
          {onExit && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onExit}
              title="Exit to Hub"
              style={{ borderRadius: '10px', minWidth: '40px', padding: '0.4rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isWon && (
        <div style={{
          width: '100%',
          padding: '0.75rem 1rem',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #f59e0b, #eec22e)',
          borderRadius: '12px',
          color: '#0f172a',
          fontWeight: 900,
          fontSize: '0.92rem',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
          animation: 'cellPop 0.4s ease',
        }}>
          🏆 2048 TILE REACHED! Master of numbers! Continue playing for high score!
        </div>
      )}

      {/* 2048 Glassmorphic 4x4 Grid Container */}
      <div
        className="g2048-container"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '12px',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {board.map((row, r) =>
          row.map((val, c) => {
            const tileStyle = val > 0 ? TILE_STYLES[val] || { bg: 'linear-gradient(135deg, #64748b, #475569)', text: '#ffffff' } : null;
            return (
              <div
                key={`${r}-${c}`}
                className={val > 0 ? 'g2048-tile-card' : 'g2048-slot'}
                style={{
                  background: tileStyle ? tileStyle.bg : undefined,
                  color: tileStyle ? tileStyle.text : 'transparent',
                  border: tileStyle?.border ? `1.5px solid ${tileStyle.border}` : undefined,
                  boxShadow: tileStyle?.glow ? `${tileStyle.glow}, 0 4px 12px rgba(0,0,0,0.4)` : undefined,
                  fontSize: val >= 1024 ? '1.35rem' : val >= 128 ? '1.65rem' : '2rem',
                }}
              >
                {val > 0 ? val : ''}
              </div>
            );
          })
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="in-game-overlay-modal">
            <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 16px #ef4444)' }}>⌛</div>
            <h2 style={{ fontSize: '2.2rem', color: '#ef4444', margin: 0, fontWeight: 900 }}>NO MORE MOVES</h2>
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>SCORE</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b' }}>{score}</span>
              </div>
              <div style={{ width: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>BEST</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>{Math.max(score, bestScore)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary btn-md" onClick={handleRestart} style={{ minWidth: 130 }}>
                Try Again
              </button>
              {onExit && (
                <button className="btn btn-secondary btn-md" onClick={onExit} style={{ minWidth: 110 }}>
                  Exit
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Directional Slide Helper Controls */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => handleSlide('LEFT')} aria-label="Slide Left" style={{ borderRadius: '10px', minWidth: '55px', height: '44px', fontSize: '1.2rem' }}>
          ◀
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleSlide('UP')} aria-label="Slide Up" style={{ borderRadius: '10px', minWidth: '55px', height: '44px', fontSize: '1.2rem' }}>
          ▲
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleSlide('DOWN')} aria-label="Slide Down" style={{ borderRadius: '10px', minWidth: '55px', height: '44px', fontSize: '1.2rem' }}>
          ▼
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleSlide('RIGHT')} aria-label="Slide Right" style={{ borderRadius: '10px', minWidth: '55px', height: '44px', fontSize: '1.2rem' }}>
          ▶
        </button>
      </div>
    </div>
  );
};
