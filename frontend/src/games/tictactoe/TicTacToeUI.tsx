import React from 'react';
import { TTTState } from './TicTacToe';
import { Move } from '../engine/GameEngine';

interface Props {
  state: TTTState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const TicTacToeUI: React.FC<Props> = ({ state, onMove, currentPlayerId, isMyTurn, playerNames }) => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const currentMark = state.marks[currentPlayer];
  const myMark = state.marks[currentPlayerId];

  function isWinnerCell(r: number, c: number): boolean {
    return state.winningCells?.some(([wr, wc]) => wr === r && wc === c) ?? false;
  }

  function handleClick(row: number, col: number) {
    if (!isMyTurn || state.phase !== 'playing' || state.board[row][col]) return;
    onMove({ row, col });
  }

  const isFinished = state.phase === 'finished';
  const isDraw = state.winner?.winner === 'draw';
  const winnerName = playerNames[state.winner?.winner ?? ''] ?? 'Player';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: '440px' }}>
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
        border: '1px solid rgba(124, 58, 237, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}>
        {state.players.map(pid => {
          const isTurnThisPlayer = currentPlayer === pid && !isFinished;
          const mark = state.marks[pid];
          const isPlayerX = mark === 'X';
          return (
            <div
              key={pid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.4rem 0.8rem',
                borderRadius: '12px',
                background: isTurnThisPlayer ? (isPlayerX ? 'rgba(6, 182, 212, 0.15)' : 'rgba(236, 72, 153, 0.15)') : 'transparent',
                border: isTurnThisPlayer ? (isPlayerX ? '1.5px solid #06b6d4' : '1.5px solid #ec4899') : '1px solid transparent',
                boxShadow: isTurnThisPlayer ? (isPlayerX ? '0 0 16px rgba(6, 182, 212, 0.3)' : '0 0 16px rgba(236, 72, 153, 0.3)') : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              <span style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: isPlayerX ? '#06b6d4' : '#ec4899',
                textShadow: isPlayerX ? '0 0 12px #06b6d4' : '0 0 12px #ec4899'
              }}>
                {mark}
              </span>
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

      {/* Turn Banner */}
      <div style={{
        padding: '0.5rem 1.25rem',
        borderRadius: '999px',
        fontSize: '0.88rem',
        fontWeight: 700,
        background: isFinished
          ? (isDraw ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)')
          : (isMyTurn ? 'rgba(6, 182, 212, 0.15)' : 'rgba(236, 72, 153, 0.15)'),
        border: `1px solid ${isFinished ? (isDraw ? '#f59e0b' : '#10b981') : (isMyTurn ? '#06b6d4' : '#ec4899')}`,
        color: isFinished ? (isDraw ? '#f59e0b' : '#10b981') : (isMyTurn ? '#38bdf8' : '#f472b6'),
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      }}>
        {isFinished
          ? (isDraw ? "🤝 Match Draw!" : `🎉 ${winnerName} Wins!`)
          : (isMyTurn ? `Your Turn (${myMark})` : `${playerNames[currentPlayer] ?? 'Opponent'}'s Turn (${currentMark})`)}
      </div>

      {/* 3x3 Cyber Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '340px',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          padding: '14px',
          borderRadius: '20px',
          border: '2px solid rgba(124, 58, 237, 0.3)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 24px rgba(124, 58, 237, 0.15)',
        }}
      >
        {state.board.map((row, r) =>
          row.map((cell, c) => {
            const isWin = isWinnerCell(r, c);
            const isFilled = cell !== null;
            const mark = cell === 'X' ? '×' : cell === 'O' ? '○' : '';
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                style={{
                  aspectRatio: '1',
                  background: isWin
                    ? 'rgba(245, 158, 11, 0.2)'
                    : isFilled
                    ? 'rgba(30, 41, 59, 0.6)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isWin
                    ? '2px solid #f59e0b'
                    : isFilled
                    ? '1.5px solid rgba(255, 255, 255, 0.1)'
                    : '1.5px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: !isFilled && isMyTurn && !isFinished ? 'pointer' : 'default',
                  boxShadow: isWin ? '0 0 20px rgba(245, 158, 11, 0.6)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isWin ? 'scale(1.05)' : 'none',
                }}
                role="button"
                aria-label={`Cell ${r},${c} ${cell ?? 'empty'}`}
              >
                <span
                  style={{
                    fontSize: '2.8rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: cell === 'X' ? '#06b6d4' : '#ec4899',
                    textShadow: cell === 'X' ? '0 0 16px rgba(6, 182, 212, 0.8)' : cell === 'O' ? '0 0 16px rgba(236, 72, 153, 0.8)' : 'none',
                    animation: isFilled ? 'cellPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                  }}
                >
                  {mark}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
