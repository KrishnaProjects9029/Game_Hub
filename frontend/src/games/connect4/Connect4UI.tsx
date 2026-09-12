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

  const statusText = state.phase === 'finished'
    ? state.winner?.winner === 'draw'
      ? "It's a Draw!"
      : `${playerNames[state.winner?.winner ?? ''] ?? 'Player'} wins! 🎉`
    : isMyTurn
      ? `Your turn (${myColor})`
      : `${playerNames[currentPlayer] ?? 'Opponent'}'s turn`;

  const colWidth = Math.min(56, Math.floor((window.innerWidth - 40) / COLS));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div className="turn-indicator" style={state.phase === 'finished' ? { background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.4)', color: 'var(--accent)' } : {}}>
        {statusText}
      </div>

      <div className="c4-board-wrap">
        {/* Drop buttons */}
        <div className="c4-col-buttons" style={{ gridTemplateColumns: `repeat(${COLS}, ${colWidth}px)` }}>
          {Array.from({ length: COLS }, (_, c) => (
            <button
              key={c}
              className="c4-col-btn"
              disabled={!isMyTurn || state.phase !== 'playing' || colFull(c)}
              onClick={() => handleDrop(c)}
              onMouseEnter={() => setHoverCol(c)}
              onMouseLeave={() => setHoverCol(null)}
              aria-label={`Drop in column ${c + 1}`}
            >
              ▼
            </button>
          ))}
        </div>

        {/* Board */}
        <div
          className="c4-board"
          style={{ gridTemplateColumns: `repeat(${COLS}, ${colWidth}px)`, gridTemplateRows: `repeat(${ROWS}, ${colWidth}px)` }}
        >
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const cellId = state.board[r][c];
              const isWin = isWinCell(r, c);
              const isPreview = hoverCol === c && !cellId && isMyTurn && state.phase === 'playing';
              let cellClass = 'c4-cell c4-cell-empty';
              if (cellId) {
                const color = state.colors[cellId];
                cellClass = `c4-cell ${color === 'red' ? 'c4-cell-red' : 'c4-cell-yellow'}`;
                if (isWin) cellClass += ' c4-cell-win';
                if (state.lastDrop && state.lastDrop.row === r && state.lastDrop.col === c) cellClass += ' c4-drop-anim';
              } else if (isPreview) {
                const previewColor = state.colors[currentPlayerId];
                cellClass = `c4-cell ${previewColor === 'red' ? 'c4-cell-red' : 'c4-cell-yellow'}`;
              }
              return (
                <div
                  key={`${r}-${c}`}
                  className={cellClass}
                  style={{ width: colWidth, height: colWidth, opacity: isPreview ? 0.35 : 1 }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
        {state.players.map(pid => (
          <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: state.colors[pid] === 'red' ? 'var(--danger)' : 'var(--accent)',
            }} />
            <span style={{ color: pid === currentPlayerId ? 'var(--text)' : 'var(--text-muted)', fontWeight: pid === currentPlayerId ? 700 : 400 }}>
              {playerNames[pid] ?? pid}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
