import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TetrisEngine, TetrisState } from './Tetris';
import { localDB } from '../../db/database';

interface TetrisUIProps {
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

export const TetrisUI: React.FC<TetrisUIProps> = ({ onGameOver, onExit }) => {
  const engineRef = useRef(new TetrisEngine());
  const [gameState, setGameState] = useState<TetrisState>(() => {
    return engineRef.current.getInitialState(['player1']);
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const [highScore, setHighScore] = useState(() => localDB.getHighScore('tetris'));

  const handleAction = useCallback((type: 'MOVE_LEFT' | 'MOVE_RIGHT' | 'ROTATE' | 'DROP' | 'HARD_DROP' | 'PAUSE' | 'RESTART') => {
    const s = stateRef.current;
    const engine = engineRef.current;
    if (s.isGameOver && type !== 'RESTART') return;

    if (engine.validateMove(s, { type }, 'player1')) {
      const next = engine.applyMove(s, { type }, 'player1');
      setGameState(next);

      if (next.score > highScore) {
        setHighScore(next.score);
        localDB.saveHighScore('tetris', next.score);
      }

      if (next.isGameOver && !s.isGameOver) {
        localDB.saveHighScore('tetris', next.score);
        localDB.saveMatch({
          gameId: 'tetris',
          playerIds: ['player1'],
          winnerId: 'player1',
          scores: { player1: next.score },
        });
        if (onGameOver) onGameOver(next.score);
      }
    }
  }, [highScore, onGameOver]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') handleAction('MOVE_LEFT');
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') handleAction('MOVE_RIGHT');
      else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') handleAction('ROTATE');
      else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') handleAction('DROP');
      else if (e.key === ' ') handleAction('HARD_DROP');
      else if (e.key.toLowerCase() === 'p') handleAction('PAUSE');
      else if (e.key.toLowerCase() === 'r') handleAction('RESTART');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  // Drop ticker
  useEffect(() => {
    if (gameState.isPaused || gameState.isGameOver) return;

    const baseSpeed = Math.max(100, 800 - (gameState.level - 1) * 70);
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      const engine = engineRef.current;
      const next = engine.applyMove(s, { type: 'TICK' }, 'player1');
      setGameState(next);

      if (next.isGameOver && !s.isGameOver) {
        localDB.saveHighScore('tetris', next.score);
        localDB.saveMatch({
          gameId: 'tetris',
          playerIds: ['player1'],
          winnerId: 'player1',
          scores: { player1: next.score },
        });
        if (onGameOver) onGameOver(next.score);
      }
    }, baseSpeed);

    return () => clearInterval(interval);
  }, [gameState.isPaused, gameState.isGameOver, gameState.level, onGameOver]);

  const { grid, currentPiece, nextPiece, score, lines, level, isPaused, isGameOver } = gameState;

  // Calculate Ghost Piece (drop shadow preview)
  const ghostY = React.useMemo(() => {
    if (isGameOver) return currentPiece.y;
    let offset = 0;
    const engine = engineRef.current;
    while (!engine.checkCollision(grid, currentPiece, 0, offset + 1)) {
      offset++;
    }
    return currentPiece.y + offset;
  }, [grid, currentPiece, isGameOver]);

  // Combine matrix + ghost + current falling piece
  const displayGrid = grid.map((r) => [...r]);
  const ghostGrid = Array.from({ length: 20 }, () => Array(10).fill(null));

  if (!isGameOver) {
    const { shape, color, x, y } = currentPiece;
    // Mark ghost
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const gy = ghostY + r;
          const gx = x + c;
          if (gy >= 0 && gy < 20 && gx >= 0 && gx < 10) {
            ghostGrid[gy][gx] = color;
          }
        }
      }
    }
    // Mark current piece
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const py = y + r;
          const px = x + c;
          if (py >= 0 && py < 20 && px >= 0 && px < 10) {
            displayGrid[py][px] = color;
          }
        }
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '460px', margin: '0 auto', gap: '0.85rem' }}>
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
        border: '1px solid rgba(6, 182, 212, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(6, 182, 212, 0.1)',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            <span className="in-game-hud-label">SCORE</span>
            <span className="in-game-hud-val" style={{ color: '#06b6d4' }}>{score}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <span className="in-game-hud-label">LINES</span>
            <span className="in-game-hud-val" style={{ color: '#f59e0b' }}>{lines}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            <span className="in-game-hud-label">LEVEL</span>
            <span className="in-game-hud-val" style={{ color: '#c084fc' }}>{level}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleAction('PAUSE')}
            disabled={isGameOver}
            style={{ borderRadius: '10px', minWidth: '40px', padding: '0.4rem' }}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleAction('RESTART')}
            title="Restart"
            style={{ borderRadius: '10px', minWidth: '40px', padding: '0.4rem' }}
          >
            🔄
          </button>
          {onExit && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onExit}
              title="Exit"
              style={{ borderRadius: '10px', minWidth: '40px', padding: '0.4rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Play Area with Matrix and Next Piece */}
      <div className="tetris-cabinet-wrap">
        {/* Tetris Board */}
        <div
          className="tetris-playfield"
          style={{
            position: 'relative',
            width: '250px',
            height: '500px',
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gridTemplateRows: 'repeat(20, 1fr)',
            gap: '1px',
            overflow: 'hidden',
          }}
        >
          {displayGrid.map((row, r) =>
            row.map((color, c) => {
              const isGhost = !color && ghostGrid[r][c];
              const ghostColor = ghostGrid[r][c];
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    background: color
                      ? `linear-gradient(135deg, ${color}, rgba(0,0,0,0.3))`
                      : isGhost
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(255, 255, 255, 0.015)',
                    border: color
                      ? '1px solid rgba(255, 255, 255, 0.4)'
                      : isGhost
                      ? `1px dashed ${ghostColor}80`
                      : '1px solid rgba(255, 255, 255, 0.025)',
                    borderRadius: color ? '3px' : '1px',
                    boxShadow: color ? `0 0 8px ${color}90, inset 0 1px 1px rgba(255,255,255,0.4)` : 'none',
                    transition: 'background 0.05s ease',
                  }}
                />
              );
            })
          )}

          {/* Pause overlay */}
          {isPaused && !isGameOver && (
            <div className="in-game-overlay-modal">
              <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 12px #38bdf8)' }}>⏸️</span>
              <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.8rem' }}>PAUSED</h3>
              <button className="btn btn-primary btn-md" onClick={() => handleAction('PAUSE')} style={{ minWidth: 140 }}>
                Resume
              </button>
            </div>
          )}

          {/* Game Over overlay */}
          {isGameOver && (
            <div className="in-game-overlay-modal">
              <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 16px #ef4444)' }}>🧱</div>
              <h3 style={{ color: '#ef4444', margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>GAME OVER</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                Final Score: <strong style={{ color: '#06b6d4' }}>{score}</strong>
              </p>
              <button className="btn btn-primary btn-md" onClick={() => handleAction('RESTART')} style={{ minWidth: 130 }}>
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Side Panel: Next Piece + Best Score */}
        <div className="tetris-side-rack">
          {/* Next Piece Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))',
            padding: '12px',
            borderRadius: '16px',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              NEXT PIECE
            </span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 20px)`,
                gridTemplateRows: `repeat(${nextPiece.shape.length}, 20px)`,
                gap: '2px',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '64px',
              }}
            >
              {nextPiece.shape.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: '20px',
                      height: '20px',
                      background: cell ? `linear-gradient(135deg, ${nextPiece.color}, rgba(0,0,0,0.3))` : 'transparent',
                      borderRadius: cell ? '3px' : '0',
                      border: cell ? '1px solid rgba(255, 255, 255, 0.5)' : 'none',
                      boxShadow: cell ? `0 0 8px ${nextPiece.color}90` : 'none',
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* High Score Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))',
            padding: '12px',
            borderRadius: '16px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
              RECORD
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b' }}>{Math.max(score, highScore)}</span>
          </div>

          {/* Controls Mini Guide */}
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.5,
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '8px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <span style={{ color: '#38bdf8' }}>Space:</span> Hard Drop<br />
            <span style={{ color: '#38bdf8' }}>↑ / W:</span> Rotate<br />
            <span style={{ color: '#38bdf8' }}>← →:</span> Move<br />
            <span style={{ color: '#38bdf8' }}>↓:</span> Soft Drop
          </div>
        </div>
      </div>

      {/* Arcade Touch Buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: '0.4rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('MOVE_LEFT')} style={{ minWidth: '48px', height: '42px', fontSize: '1.1rem' }} aria-label="Move Left">
          ◀
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('ROTATE')} style={{ minWidth: '60px', height: '42px', fontWeight: 800 }} aria-label="Rotate">
          ↻ Rot
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('MOVE_RIGHT')} style={{ minWidth: '48px', height: '42px', fontSize: '1.1rem' }} aria-label="Move Right">
          ▶
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('DROP')} style={{ minWidth: '48px', height: '42px', fontSize: '1.1rem' }} aria-label="Soft Drop">
          ▼
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => handleAction('HARD_DROP')} style={{ minWidth: '78px', height: '42px', fontWeight: 800 }} aria-label="Hard Drop">
          ⚡ Drop
        </button>
      </div>
    </div>
  );
};
