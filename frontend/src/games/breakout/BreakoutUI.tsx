import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BreakoutEngine, BreakoutState } from './Breakout';
import { localDB } from '../../db/database';

interface BreakoutUIProps {
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

export const BreakoutUI: React.FC<BreakoutUIProps> = ({ onGameOver, onExit }) => {
  const engineRef = useRef(new BreakoutEngine());
  const [gameState, setGameState] = useState<BreakoutState>(() => {
    return engineRef.current.getInitialState(['player1']);
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const [highScore, setHighScore] = useState(() => localDB.getHighScore('breakout'));
  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;
  const containerRef = useRef<HTMLDivElement>(null);

  const movePaddle = useCallback((x: number) => {
    const s = stateRef.current;
    if (s.isGameOver || s.isPaused) return;
    const next = engineRef.current.applyMove(s, { type: 'MOVE_PADDLE', x }, 'player1');
    setGameState(next);
  }, []);

  const launchBall = useCallback(() => {
    const s = stateRef.current;
    if (!s.isBallLaunched && !s.isGameOver) {
      const next = engineRef.current.applyMove(s, { type: 'LAUNCH_BALL' }, 'player1');
      setGameState(next);
    }
  }, []);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    const next = engineRef.current.applyMove(s, { type: 'PAUSE' }, 'player1');
    setGameState(next);
  }, []);

  const handleRestart = useCallback(() => {
    const s = engineRef.current.getInitialState(['player1']);
    setGameState(s);
  }, []);

  // Animation Frame loop
  useEffect(() => {
    if (gameState.isPaused || gameState.isGameOver) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (currentTime - lastTime >= 16) {
        lastTime = currentTime;
        const s = stateRef.current;
        if (!s.isPaused && !s.isGameOver) {
          const next = engineRef.current.applyMove(s, { type: 'TICK' }, 'player1');
          setGameState(next);

          if (next.score > highScoreRef.current) {
            setHighScore(next.score);
            localDB.saveHighScore('breakout', next.score);
          }

          if (next.isGameOver && !s.isGameOver) {
            localDB.saveHighScore('breakout', next.score);
            localDB.saveMatch({
              gameId: 'breakout',
              playerIds: ['player1'],
              winnerId: next.isWon ? 'player1' : null,
              scores: { player1: next.score },
            });
            if (onGameOver) onGameOver(next.score);
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState.isPaused, gameState.isGameOver, onGameOver]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const s = stateRef.current;
      const step = 32;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        movePaddle(s.paddleX - step);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        movePaddle(s.paddleX + step);
      } else if (e.key === ' ') {
        launchBall();
      } else if (e.key.toLowerCase() === 'p') {
        togglePause();
      } else if (e.key.toLowerCase() === 'r') {
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePaddle, launchBall, togglePause, handleRestart]);

  // Mouse & Touch tracking relative to game container
  const handlePointerMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = engineRef.current.BOARD_WIDTH / rect.width;
    const relativeX = (clientX - rect.left) * scale;
    movePaddle(relativeX - gameState.paddleWidth / 2);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handlePointerMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const { paddleX, paddleWidth, paddleHeight, ballX, ballY, ballRadius, bricks, score, lives, isBallLaunched, isPaused, isGameOver, isWon } = gameState;
  const { BOARD_WIDTH, BOARD_HEIGHT } = engineRef.current;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '520px', margin: '0 auto', gap: '1rem' }}>
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
            <span className="in-game-hud-val" style={{ color: '#10b981' }}>{Math.max(score, highScore)}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <span className="in-game-hud-label">SHIELDS</span>
            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ fontSize: '1rem', opacity: i < lives ? 1 : 0.2, filter: i < lives ? 'drop-shadow(0 0 4px #ef4444)' : 'none' }}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={togglePause}
            disabled={isGameOver}
            style={{ borderRadius: '10px', minWidth: '40px', padding: '0.4rem' }}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRestart}
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

      {/* Breakout Neon Arcade Arena */}
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        onClick={launchBall}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
          background: 'radial-gradient(circle at center, #0e1626 0%, #060911 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          cursor: isBallLaunched ? 'none' : 'pointer',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <svg viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} style={{ width: '100%', height: '100%' }}>
          <defs>
            <filter id="brickGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="paddleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>

          {/* Destructible Neon Bricks */}
          {bricks.map((brick, idx) =>
            !brick.isDestroyed ? (
              <g key={idx}>
                <rect
                  x={brick.x}
                  y={brick.y}
                  width={brick.width}
                  height={brick.height}
                  rx={4}
                  fill={brick.color}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1}
                  filter="url(#brickGlow)"
                />
                <rect
                  x={brick.x + 2}
                  y={brick.y + 2}
                  width={brick.width - 4}
                  height={brick.height / 3}
                  rx={2}
                  fill="rgba(255, 255, 255, 0.3)"
                />
              </g>
            ) : null
          )}

          {/* Metallic Cyan Paddle */}
          <rect
            x={paddleX}
            y={BOARD_HEIGHT - 24}
            width={paddleWidth}
            height={paddleHeight}
            rx={6}
            fill="url(#paddleGrad)"
            stroke="#e0f2fe"
            strokeWidth={1.5}
            filter="drop-shadow(0 0 10px #38bdf8)"
          />

          {/* Radiant Energy Ball */}
          <circle
            cx={ballX}
            cy={ballY}
            r={ballRadius}
            fill="#ffffff"
            stroke="#bae6fd"
            strokeWidth={1.5}
            filter="drop-shadow(0 0 12px #38bdf8) drop-shadow(0 0 4px #ffffff)"
          />
        </svg>

        {/* Launch prompt if ball not launched */}
        {!isBallLaunched && !isGameOver && !isPaused && (
          <div
            style={{
              position: 'absolute',
              bottom: '55px',
              left: 0,
              right: 0,
              textAlign: 'center',
              color: '#38bdf8',
              fontSize: '0.9rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              pointerEvents: 'none',
              animation: 'pulse 1s infinite alternate',
              textShadow: '0 0 12px #0284c7',
            }}
          >
            🚀 Click, Tap or Press Space to Launch!
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="in-game-overlay-modal">
            <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 12px #38bdf8)' }}>⏸️</span>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.8rem' }}>GAME PAUSED</h3>
            <button className="btn btn-primary btn-md" onClick={togglePause} style={{ minWidth: 140 }}>
              Resume
            </button>
          </div>
        )}

        {/* Game Over / Win Overlay */}
        {isGameOver && (
          <div className="in-game-overlay-modal">
            <div style={{ fontSize: '3.5rem', filter: isWon ? 'drop-shadow(0 0 16px #10b981)' : 'drop-shadow(0 0 16px #ef4444)' }}>
              {isWon ? '🏆' : '💥'}
            </div>
            <h2 style={{ fontSize: '2.2rem', color: isWon ? '#10b981' : '#ef4444', margin: 0, fontWeight: 900 }}>
              {isWon ? 'ALL BRICKS SMASHED!' : 'OUT OF SHIELDS'}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
              Final Score: <strong style={{ color: '#f59e0b' }}>{score}</strong>
            </p>
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

      {/* Ergonomic Arcade Touch Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%', marginTop: '0.25rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => movePaddle(paddleX - 40)}
          style={{ minWidth: '70px', height: '44px', fontSize: '1rem', borderRadius: '10px' }}
          aria-label="Paddle Left"
        >
          ◀ Left
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={launchBall}
          style={{ minWidth: '95px', height: '44px', fontWeight: 800, borderRadius: '10px' }}
          disabled={isBallLaunched}
        >
          🚀 Launch
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => movePaddle(paddleX + 40)}
          style={{ minWidth: '70px', height: '44px', fontSize: '1rem', borderRadius: '10px' }}
          aria-label="Paddle Right"
        >
          Right ▶
        </button>
      </div>
    </div>
  );
};
