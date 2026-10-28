import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MinesweeperEngine, MinesweeperState, MinesweeperDifficulty } from './Minesweeper';
import { localDB } from '../../db/database';

interface MinesweeperUIProps {
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

const NUMBER_COLORS: Record<number, string> = {
  1: '#38bdf8',
  2: '#4ade80',
  3: '#f87171',
  4: '#c084fc',
  5: '#fb923c',
  6: '#2dd4bf',
  7: '#facc15',
  8: '#f472b6',
};

export const MinesweeperUI: React.FC<MinesweeperUIProps> = ({ onGameOver, onExit }) => {
  const engineRef = useRef(new MinesweeperEngine());
  const [gameState, setGameState] = useState<MinesweeperState>(() => {
    return engineRef.current.getInitialState(['player1'], 'medium');
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const [flagMode, setFlagMode] = useState(false); // Mobile tap flag switch

  // Timer ticker
  useEffect(() => {
    if (gameState.isFirstClick || gameState.isGameOver) return;

    const timer = setInterval(() => {
      const s = stateRef.current;
      if (s.isGameOver || s.isFirstClick) return;
      const next = engineRef.current.applyMove(s, { type: 'TICK' }, 'player1');
      setGameState(next);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isFirstClick, gameState.isGameOver]);

  const handleCellClick = useCallback((r: number, c: number, forceFlag = false) => {
    const s = stateRef.current;
    const engine = engineRef.current;
    if (s.isGameOver) return;

    const actionType = forceFlag || flagMode ? 'FLAG' : 'REVEAL';
    if (engine.validateMove(s, { type: actionType, r, c }, 'player1')) {
      const next = engine.applyMove(s, { type: actionType, r, c }, 'player1');
      setGameState(next);

      if (next.isGameOver && !s.isGameOver) {
        const score = next.isWon ? Math.max(10, 1000 - next.secondsElapsed * 2) : 0;
        if (next.isWon) {
          localDB.saveHighScore('minesweeper', score);
        }
        localDB.saveMatch({
          gameId: 'minesweeper',
          playerIds: ['player1'],
          winnerId: next.isWon ? 'player1' : null,
          scores: { player1: score },
        });
        if (onGameOver) onGameOver(score);
      }
    }
  }, [flagMode, onGameOver]);

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    handleCellClick(r, c, true);
  };

  const handleRestart = (diff?: MinesweeperDifficulty) => {
    const d = diff || stateRef.current.difficulty;
    const s = engineRef.current.getInitialState(['player1'], d);
    setGameState(s);
  };

  const { rows, cols, grid, isGameOver, isWon, secondsElapsed, flagsRemaining, difficulty } = gameState;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '540px', margin: '0 auto', gap: '1rem' }}>
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
        border: '1px solid rgba(239, 68, 68, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(239, 68, 68, 0.1)',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <span className="in-game-hud-label">MINES</span>
            <span className="in-game-hud-val" style={{ color: '#ef4444' }}>{flagsRemaining}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
            <span className="in-game-hud-label">TIME</span>
            <span className="in-game-hud-val" style={{ color: '#38bdf8' }}>{secondsElapsed}s</span>
          </div>
        </div>

        {/* Difficulty Selector and Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {(['easy', 'medium', 'hard'] as MinesweeperDifficulty[]).map((d) => (
            <button
              key={d}
              className={`btn btn-sm ${difficulty === d ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleRestart(d)}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '8px' }}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleRestart()}
            title="Reset Field"
            style={{ borderRadius: '8px', minWidth: '38px', padding: '0.35rem' }}
          >
            🔄
          </button>
          {onExit && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onExit}
              title="Exit"
              style={{ borderRadius: '8px', minWidth: '38px', padding: '0.35rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Flag Mode Action Bar for Mobile Touch */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: '0.5rem 0.85rem',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Right-click or toggle action mode:
        </span>
        <button
          className={`btn btn-sm ${flagMode ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setFlagMode(!flagMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '10px',
            border: flagMode ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: flagMode ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
          }}
        >
          {flagMode ? '🚩 Mode: Flagging' : '⛏️ Mode: Revealing'}
        </button>
      </div>

      {/* Minesweeper Tactile Grid */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflowX: 'auto',
          background: '#090d16',
          padding: '14px',
          borderRadius: '20px',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(239, 68, 68, 0.15)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: cols > 12 ? '3px' : '6px',
            width: '100%',
            maxWidth: cols > 12 ? '490px' : '390px',
            aspectRatio: `${cols} / ${rows}`,
            userSelect: 'none',
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              let content: React.ReactNode = '';
              const isRev = cell.isRevealed;

              if (isRev) {
                if (cell.isMine) {
                  content = <span style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }}>💣</span>;
                } else if (cell.adjacentMines > 0) {
                  content = (
                    <span style={{ color: NUMBER_COLORS[cell.adjacentMines] || '#f1f5f9', filter: `drop-shadow(0 0 6px ${NUMBER_COLORS[cell.adjacentMines]}80)` }}>
                      {cell.adjacentMines}
                    </span>
                  );
                }
              } else if (cell.isFlagged) {
                content = <span style={{ filter: 'drop-shadow(0 0 6px #f59e0b)' }}>🚩</span>;
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleContextMenu(e, r, c)}
                  className={`msw-tactile-cell ${isRev ? 'msw-cell-revealed' : 'msw-cell-unrevealed'}`}
                  style={{
                    fontSize: cols > 12 ? '0.85rem' : '1.15rem',
                    border: isRev && cell.isMine ? '1.5px solid #ef4444' : undefined,
                    background: isRev && cell.isMine ? 'rgba(239, 68, 68, 0.35)' : undefined,
                  }}
                  disabled={isGameOver && !cell.isMine}
                  aria-label={`Cell ${r},${c} ${isRev ? (cell.isMine ? 'Mine' : cell.adjacentMines) : (cell.isFlagged ? 'Flagged' : 'Unrevealed')}`}
                >
                  {content}
                </button>
              );
            })
          )}
        </div>

        {/* Victory / Defeat Overlay Modal */}
        {isGameOver && (
          <div className="in-game-overlay-modal">
            <div style={{ fontSize: '3.5rem', filter: isWon ? 'drop-shadow(0 0 16px #10b981)' : 'drop-shadow(0 0 16px #ef4444)' }}>
              {isWon ? '🏆' : '💥'}
            </div>
            <h2 style={{ fontSize: '2.2rem', color: isWon ? '#10b981' : '#ef4444', margin: 0, fontWeight: 900 }}>
              {isWon ? 'FIELD SECURED!' : 'MINE DETONATED!'}
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
              {isWon ? `Superb tactical skill! Cleared in ${secondsElapsed} seconds!` : 'Watch your step on the next patrol!'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-primary btn-md" onClick={() => handleRestart()} style={{ minWidth: 130 }}>
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
    </div>
  );
};
