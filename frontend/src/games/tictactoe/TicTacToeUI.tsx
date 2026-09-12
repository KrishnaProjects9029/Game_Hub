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

  const statusText = state.phase === 'finished'
    ? state.winner?.winner === 'draw'
      ? "It's a Draw!"
      : `${playerNames[state.winner?.winner ?? ''] ?? 'Player'} wins! ${state.marks[state.winner?.winner ?? '']} 🎉`
    : isMyTurn
      ? `Your turn (${myMark})`
      : `${playerNames[currentPlayer] ?? 'Opponent'}'s turn (${currentMark})`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <div className={`turn-indicator ${state.phase === 'finished' ? 'style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" }}' : ''}`}
        style={state.phase === 'finished' ? { background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.4)', color: 'var(--accent)' } : {}}
      >
        {statusText}
      </div>

      <div className="ttt-board">
        {state.board.map((row, r) =>
          row.map((cell, c) => {
            const isWin = isWinnerCell(r, c);
            const isFilled = cell !== null;
            const mark = cell === 'X' ? '×' : cell === 'O' ? '○' : '';
            return (
              <div
                key={`${r}-${c}`}
                className={`ttt-cell ${isFilled ? 'filled' : ''} ${isWin ? 'winner-cell' : ''} ${!isFilled && !isMyTurn ? 'disabled' : ''}`}
                onClick={() => handleClick(r, c)}
                role="button"
                aria-label={`Cell ${r},${c} ${cell ?? 'empty'}`}
              >
                <span className={cell === 'X' ? 'ttt-x' : cell === 'O' ? 'ttt-o' : ''} style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>
                  {mark}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Score board */}
      <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        {state.players.map(pid => (
          <div key={pid} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: state.marks[pid] === 'X' ? 'var(--primary)' : 'var(--secondary)', fontSize: '1.25rem' }}>
              {state.marks[pid]}
            </div>
            <div>{playerNames[pid] ?? pid}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
