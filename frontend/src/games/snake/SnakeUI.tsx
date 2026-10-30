import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SnakeEngine, SnakeState } from './Snake';
import { localDB } from '../../db/database';

interface SnakeUIProps {
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

export const SnakeUI: React.FC<SnakeUIProps> = ({ onGameOver, onExit }) => {
  const engineRef = useRef(new SnakeEngine());
  const [gameState, setGameState] = useState<SnakeState>(() => {
    const s = engineRef.current.getInitialState(['player1']);
    s.highScore = localDB.getHighScore('snake');
    return s;
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const [tickSpeed, setTickSpeed] = useState(120);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const engine = engineRef.current;
      const s = stateRef.current;

      if (e.key === ' ' || e.key.toLowerCase() === 'p') {
        const next = engine.applyMove(s, { type: 'PAUSE' }, 'player1');
        setGameState(next);
        return;
      }

      let dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') dir = 'UP';
      else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') dir = 'DOWN';
      else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') dir = 'LEFT';
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') dir = 'RIGHT';

      if (dir) {
        const move = { type: 'CHANGE_DIRECTION', direction: dir };
        if (engine.validateMove(s, move, 'player1')) {
          const next = engine.applyMove(s, move, 'player1');
          setGameState(next);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game loop ticker
  useEffect(() => {
    if (gameState.isPaused || gameState.isGameOver) return;

    // Adjust speed based on score: every 30 points speeds up
    const speedTier = Math.floor(gameState.score / 30);
    const currentSpeed = Math.max(65, 130 - speedTier * 10);
    setTickSpeed(currentSpeed);

    const timer = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      const engine = engineRef.current;
      const next = engine.applyMove(s, { type: 'TICK' }, 'player1');
      setGameState(next);

      if (next.isGameOver && !s.isGameOver) {
        localDB.saveHighScore('snake', next.score);
        localDB.saveMatch({
          gameId: 'snake',
          playerIds: ['player1'],
          winnerId: 'player1',
          scores: { player1: next.score },
        });
        if (onGameOver) onGameOver(next.score);
      }
    }, currentSpeed);

    return () => clearInterval(timer);
  }, [gameState.isPaused, gameState.isGameOver, Math.floor(gameState.score / 30), onGameOver]);

  const handleDirButton = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const engine = engineRef.current;
    const s = stateRef.current;
    const move = { type: 'CHANGE_DIRECTION', direction: dir };
    if (engine.validateMove(s, move, 'player1')) {
      const next = engine.applyMove(s, move, 'player1');
      setGameState(next);
    }
  }, []);

  const handleRestart = () => {
    const s = engineRef.current.getInitialState(['player1']);
    s.highScore = localDB.getHighScore('snake');
    setGameState(s);
  };

  const togglePause = () => {
    const s = stateRef.current;
    const next = engineRef.current.applyMove(s, { type: 'PAUSE' }, 'player1');
    setGameState(next);
  };

  const { snake, food, gridSize, score, highScore, direction, isPaused, isGameOver } = gameState;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '480px', margin: '0 auto', gap: '1rem' }}>
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
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(16, 185, 129, 0.1)',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <span className="in-game-hud-label">SCORE</span>
            <span className="in-game-hud-val" style={{ color: '#10b981' }}>{score}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <span className="in-game-hud-label">BEST</span>
            <span className="in-game-hud-val" style={{ color: '#f59e0b' }}>{Math.max(score, highScore)}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            <span className="in-game-hud-label">LENGTH</span>
            <span className="in-game-hud-val" style={{ color: '#06b6d4' }}>{snake.length}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={togglePause}
            disabled={isGameOver}
            style={{ borderRadius: '10px', minWidth: '42px', padding: '0.4rem' }}
            aria-label={isPaused ? "Resume Game" : "Pause Game"}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRestart}
            title="Restart Game"
            style={{ borderRadius: '10px', minWidth: '42px', padding: '0.4rem' }}
            aria-label="Restart Game"
          >
            🔄
          </button>
          {onExit && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onExit}
              title="Exit to Hub"
              style={{ borderRadius: '10px', minWidth: '42px', padding: '0.4rem' }}
              aria-label="Exit Game"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Cyber-Arcade Game Board */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'radial-gradient(circle at center, #0e1726 0%, #060910 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {/* Subtle grid pattern background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)',
          backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`,
          pointerEvents: 'none',
        }} />

        {/* Pulsing Energy Food */}
        <div
          style={{
            gridColumnStart: food.x + 1,
            gridRowStart: food.y + 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            filter: 'drop-shadow(0 0 8px #ef4444) drop-shadow(0 0 16px #f59e0b)',
            animation: 'pulse 0.8s infinite alternate ease-in-out',
            zIndex: 5,
          }}
        >
          🍎
        </div>

        {/* Stylized Snake with Eyes on Head */}
        {snake.map((seg, idx) => {
          const isHead = idx === 0;
          return (
            <div
              key={`${seg.x}-${seg.y}-${idx}`}
              style={{
                gridColumnStart: seg.x + 1,
                gridRowStart: seg.y + 1,
                background: isHead
                  ? 'linear-gradient(135deg, #34d399, #10b981)'
                  : `rgba(16, 185, 129, ${Math.max(0.45, 1 - (idx / snake.length) * 0.5)})`,
                borderRadius: isHead ? '8px' : '4px',
                border: isHead ? '1.5px solid #6ee7b7' : '1px solid rgba(5, 150, 105, 0.6)',
                boxShadow: isHead ? '0 0 14px #10b981, inset 0 1px 2px #a7f3d0' : 'none',
                transform: isHead ? 'scale(0.96)' : 'scale(0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: isHead ? 10 : 2,
                position: 'relative',
              }}
            >
              {isHead && (
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  transform: direction === 'UP' ? 'rotate(-90deg)' : direction === 'DOWN' ? 'rotate(90deg)' : direction === 'LEFT' ? 'rotate(180deg)' : 'none'
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#0f172a', boxShadow: '0 0 2px white' }} />
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#0f172a', boxShadow: '0 0 2px white' }} />
                </div>
              )}
            </div>
          );
        })}

        {/* In-Game Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="in-game-overlay-modal">
            <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 12px #38bdf8)' }}>⏸️</span>
            <h2 style={{ fontSize: '2rem', margin: 0, color: '#f1f5f9' }}>GAME PAUSED</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Take a breath, snake master!</p>
            <button className="btn btn-primary btn-lg" onClick={togglePause} style={{ minWidth: 160 }}>
              Resume Game
            </button>
          </div>
        )}

        {/* In-Game Game Over Modal */}
        {isGameOver && (
          <div className="in-game-overlay-modal">
            <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 16px #ef4444)' }}>💥</div>
            <h2 style={{ fontSize: '2.2rem', color: '#ef4444', margin: 0, fontWeight: 900 }}>GAME OVER</h2>
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
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>{score}</span>
              </div>
              <div style={{ width: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>RECORD</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b' }}>{Math.max(score, highScore)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary btn-md" onClick={handleRestart} style={{ minWidth: 130 }}>
                Play Again
              </button>
              {onExit && (
                <button className="btn btn-secondary btn-md" onClick={onExit} style={{ minWidth: 110 }}>
                  Exit to Hub
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ergonomic Cyber Touch Controller */}
      <div className="game-dpad-matrix" aria-label="Touch Directional Controller">
        <div />
        <button
          className="game-dpad-key"
          onClick={() => handleDirButton('UP')}
          aria-label="Up Direction"
        >
          ▲
        </button>
        <div />
        <button
          className="game-dpad-key"
          onClick={() => handleDirButton('LEFT')}
          aria-label="Left Direction"
        >
          ◀
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#334155', border: '1px solid #475569' }} />
        </div>
        <button
          className="game-dpad-key"
          onClick={() => handleDirButton('RIGHT')}
          aria-label="Right Direction"
        >
          ▶
        </button>
        <div />
        <button
          className="game-dpad-key"
          onClick={() => handleDirButton('DOWN')}
          aria-label="Down Direction"
        >
          ▼
        </button>
        <div />
      </div>
    </div>
  );
};
