import React, { useState } from 'react';
import { C4State } from './Connect4';
import { Move } from '../engine/GameEngine';

interface Props {
  state: C4State;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

const ROWS = 6;
const COLS = 7;

export const Connect4UI: React.FC<Props> = ({ state, onMove, currentPlayerId, isMyTurn, playerNames }) => {
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const myColor = state.colors[currentPlayerId];

  function isWinCell(r: number, c: number): boolean {
    return state.winningCells?.some(([wr, wc]) => wr === r && wc === c) ?? false;
  }

  function colFull(col: number): boolean {
    return state.board[0][col] !== null;
  }

  function handleDrop(col: number) {
    if (!isMyTurn || state.phase !== 'playing' || colFull(col)) return;
    onMove({ col });
  }

  const isFinished = state.phase === 'finished';
  const isDraw = state.winner?.winner === 'draw';
  const winnerName = playerNames[state.winner?.winner ?? ''] ?? 'Player';

  const colWidth = Math.min(54, Math.floor((typeof window !== 'undefined' ? window.innerWidth - 60 : 360) / COLS));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: '480px' }}>
      {/* Top Console Matchup Card */}
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
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}>
        {state.players.map(pid => {
          const isTurnThisPlayer = currentPlayer === pid && !isFinished;
          const color = state.colors[pid];
          const isRed = color === 'red';
          return (
            <div
              key={pid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.4rem 0.8rem',
                borderRadius: '12px',
                background: isTurnThisPlayer ? (isRed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)') : 'transparent',
                border: isTurnThisPlayer ? (isRed ? '1.5px solid #ef4444' : '1.5px solid #f59e0b') : '1px solid transparent',
                boxShadow: isTurnThisPlayer ? (isRed ? '0 0 16px rgba(239, 68, 68, 0.35)' : '0 0 16px rgba(245, 158, 11, 0.35)') : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: isRed
                  ? 'radial-gradient(circle at 35% 35%, #ff6b6b, #ef4444)'
                  : 'radial-gradient(circle at 35% 35%, #fde047, #f59e0b)',
                boxShadow: isRed ? '0 0 10px #ef4444' : '0 0 10px #f59e0b',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
              }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>
                  {playerNames[pid] ?? pid}
                </div>
                <div style={{ fontSize: '0.68rem', color: isTurnThisPlayer ? '#10b981' : 'var(--text-muted)' }}>
                  {isTurnThisPlayer ? '● Active Turn' : (pid === currentPlayerId ? 'You' : 'Opponent')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Turn Indicator Banner */}
      <div style={{
        padding: '0.5rem 1.25rem',
        borderRadius: '999px',
        fontSize: '0.88rem',
        fontWeight: 700,
        background: isFinished
          ? (isDraw ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)')
          : 'rgba(6, 182, 212, 0.15)',
        border: `1px solid ${isFinished ? (isDraw ? '#f59e0b' : '#10b981') : '#06b6d4'}`,
        color: isFinished ? (isDraw ? '#f59e0b' : '#10b981') : '#38bdf8',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      }}>
        {isFinished
          ? (isDraw ? "🤝 Match Draw!" : `🎉 ${winnerName} Wins! 4 in a row!`)
          : (isMyTurn ? `Your Turn (${myColor?.toUpperCase()})` : `${playerNames[currentPlayer] ?? 'Opponent'}'s Turn`)}
      </div>

      {/* 3D Connect 4 Arcade Cabinet */}
      <div style={{
        background: 'linear-gradient(180deg, #1e3a8a, #0f172a)',
        padding: '14px',
        borderRadius: '24px',
        border: '3px solid #3b82f6',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(59, 130, 246, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
      }}>
        {/* Column Drop Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${colWidth}px)`,
          gap: '6px',
          marginBottom: '8px',
          justifyContent: 'center',
        }}>
          {Array.from({ length: COLS }, (_, c) => (
            <button
              key={c}
              disabled={!isMyTurn || state.phase !== 'playing' || colFull(c)}
              onClick={() => handleDrop(c)}
              onMouseEnter={() => setHoverCol(c)}
              onMouseLeave={() => setHoverCol(null)}
              style={{
                background: hoverCol === c && isMyTurn ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                border: hoverCol === c && isMyTurn ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: hoverCol === c && isMyTurn ? '#38bdf8' : '#94a3b8',
                padding: '4px 0',
                fontSize: '1rem',
                cursor: !isMyTurn || colFull(c) ? 'not-allowed' : 'pointer',
                opacity: colFull(c) ? 0.3 : 1,
                transition: 'all 0.15s ease',
              }}
              aria-label={`Drop piece in column ${c + 1}`}
            >
              ▼
            </button>
          ))}
        </div>

        {/* Board Holes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${colWidth}px)`,
            gridTemplateRows: `repeat(${ROWS}, ${colWidth}px)`,
            gap: '6px',
            background: '#172554',
            padding: '10px',
            borderRadius: '16px',
            boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.8)',
          }}
        >
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const cellId = state.board[r][c];
              const isWin = isWinCell(r, c);
              const isPreview = hoverCol === c && !cellId && isMyTurn && state.phase === 'playing';

              let bg = 'radial-gradient(circle, #080d1a 60%, #030712 100%)';
              let boxShadow = 'inset 0 3px 6px rgba(0, 0, 0, 0.9)';
              let border = '1px solid rgba(255, 255, 255, 0.05)';

              if (cellId) {
                const color = state.colors[cellId];
                if (color === 'red') {
                  bg = 'radial-gradient(circle at 35% 35%, #ff6b6b, #b91c1c)';
                  boxShadow = isWin
                    ? '0 0 20px #ef4444, inset 0 2px 4px rgba(255, 255, 255, 0.5)'
                    : '0 4px 8px rgba(185, 28, 28, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)';
                  border = '1.5px solid #ef4444';
                } else {
                  bg = 'radial-gradient(circle at 35% 35%, #fde047, #ca8a04)';
                  boxShadow = isWin
                    ? '0 0 20px #f59e0b, inset 0 2px 4px rgba(255, 255, 255, 0.5)'
                    : '0 4px 8px rgba(202, 138, 4, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)';
                  border = '1.5px solid #f59e0b';
                }
              } else if (isPreview) {
                const pColor = state.colors[currentPlayerId];
                bg = pColor === 'red' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)';
                border = pColor === 'red' ? '1.5px dashed #ef4444' : '1.5px dashed #f59e0b';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: colWidth,
                    height: colWidth,
                    borderRadius: '50%',
                    background: bg,
                    boxShadow,
                    border,
                    transition: 'all 0.2s ease',
                    transform: isWin ? 'scale(1.08)' : 'none',
                    animation: isWin ? 'winPulse 0.6s infinite alternate' : undefined,
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
