import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckersEngine, CheckersState } from './Checkers';
import { Move } from '../engine/GameEngine';
import { localDB } from '../../db/database';

interface CheckersUIProps {
  mode?: 'single' | 'passplay';
  difficulty?: 'easy' | 'medium' | 'hard';
  onGameOver?: (winner: string) => void;
  onExit?: () => void;
}

export const CheckersUI: React.FC<CheckersUIProps> = ({
  mode = 'single',
  difficulty = 'medium',
  onGameOver,
  onExit,
}) => {
  const engineRef = useRef(new CheckersEngine());
  const [gameState, setGameState] = useState<CheckersState>(() => {
    return engineRef.current.getInitialState(['player1', 'player2']);
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const [isAiThinking, setIsAiThinking] = useState(false);

  const applyEngineMove = useCallback((move: Move, pId: string) => {
    const s = stateRef.current;
    const engine = engineRef.current;
    if (engine.validateMove(s, move, pId)) {
      const next = engine.applyMove(s, move);
      setGameState(next);

      if (next.isGameOver && !s.isGameOver) {
        const won = next.winner === 'red';
        localDB.updatePlayerStats('player_default', won);
        localDB.saveMatch({
          gameId: 'checkers',
          playerIds: ['player1', 'player2'],
          winnerId: next.winner === 'red' ? 'player1' : 'player2',
          scores: { player1: next.redPiecesCount * 10, player2: next.blackPiecesCount * 10 },
        });
        if (onGameOver) onGameOver(next.winner || 'draw');
      }
    }
  }, [onGameOver]);

  // AI Turn Trigger (Black)
  useEffect(() => {
    if (mode !== 'single' || gameState.turn !== 'black' || gameState.isGameOver) {
      setIsAiThinking(false);
      return;
    }

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      setIsAiThinking(false);
      const s = stateRef.current;
      if (s.turn === 'black' && !s.isGameOver) {
        const aiMove = engineRef.current.getAIMove(s, 'player2', difficulty);
        applyEngineMove(aiMove, 'player2');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [gameState.turn, gameState.isGameOver, mode, difficulty, applyEngineMove]);

  const handleSquareClick = (r: number, c: number) => {
    const s = stateRef.current;
    if (s.isGameOver) return;
    if (mode === 'single' && s.turn === 'black') return; // AI's turn

    const piece = s.board[r][c];

    // If clicking own piece, select it
    if (piece && piece.color === s.turn) {
      applyEngineMove({ type: 'SELECT_PIECE', r, c }, 'player1');
      return;
    }

    // If already selected a piece and clicking a valid destination
    if (s.selectedPiece) {
      const isValid = s.validMoves.some((m) => m.toR === r && m.toC === c);
      if (isValid) {
        applyEngineMove(
          {
            type: 'MAKE_MOVE',
            fromR: s.selectedPiece.r,
            fromC: s.selectedPiece.c,
            toR: r,
            toC: c,
          },
          'player1'
        );
      }
    }
  };

  const handleRestart = () => {
    const s = engineRef.current.getInitialState(['player1', 'player2']);
    setGameState(s);
  };

  const { board, turn, selectedPiece, validMoves, redPiecesCount, blackPiecesCount, isGameOver, winner } = gameState;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '480px', margin: '0 auto', gap: '1rem' }}>
      {/* Top Console Matchup HUD */}
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
        {/* Pieces Counter */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <span className="in-game-hud-label">RED (YOU)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '1rem' }}>🔴</span>
              <span className="in-game-hud-val" style={{ color: '#ef4444' }}>{redPiecesCount}</span>
            </div>
          </div>

          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(100, 116, 139, 0.4)' }}>
            <span className="in-game-hud-label">BLACK ({mode === 'single' ? 'AI' : 'P2'})</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '1rem' }}>⚫</span>
              <span className="in-game-hud-val" style={{ color: '#94a3b8' }}>{blackPiecesCount}</span>
            </div>
          </div>
        </div>

        {/* Turn Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isAiThinking ? (
            <div className="in-game-mode-pill" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderColor: '#f59e0b' }}>
              🤖 AI Deciding...
            </div>
          ) : (
            <div className="in-game-mode-pill" style={{
              background: turn === 'red' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              color: turn === 'red' ? '#ef4444' : '#38bdf8',
              borderColor: turn === 'red' ? '#ef4444' : '#38bdf8',
            }}>
              {turn === 'red' ? '🔴 Red Turn' : '⚫ Black Turn'}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleRestart}
            title="Restart Match"
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

      {/* Luxury Checkers 8x8 Board Container */}
      <div className="checkers-luxury-frame" style={{ width: '100%', aspectRatio: '1 / 1' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            userSelect: 'none',
          }}
        >
          {board.map((row, r) =>
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedPiece?.r === r && selectedPiece?.c === c;
              const isValidTarget = validMoves.some((m) => m.toR === r && m.toC === c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className="checkers-cell-luxury"
                  style={{
                    background: isDark
                      ? (isSelected ? 'rgba(239, 68, 68, 0.35)' : '#1e2638')
                      : '#cbd5e1',
                    cursor: isDark ? 'pointer' : 'default',
                    border: isValidTarget ? '2px dashed #10b981' : undefined,
                  }}
                  aria-label={`Square ${r},${c}`}
                >
                  {/* Glowing Destination Target Dot */}
                  {isValidTarget && !piece && (
                    <div className="checkers-valid-dot" />
                  )}

                  {/* 3D Checkers Piece */}
                  {piece && (
                    <div
                      className={`${piece.color === 'red' ? 'checkers-disc-red' : 'checkers-disc-black'} ${isSelected ? 'checkers-selected-glow' : ''}`}
                    >
                      {piece.isKing && (
                        <span style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 0 6px #facc15)' }}>
                          👑
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Victory Overlay Modal */}
          {isGameOver && (
            <div className="in-game-overlay-modal">
              <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 16px #facc15)' }}>👑</div>
              <h2 style={{ fontSize: '2.2rem', color: winner === 'red' ? '#ef4444' : '#38bdf8', margin: 0, fontWeight: 900 }}>
                {winner === 'red' ? 'RED VICTORIOUS!' : 'BLACK VICTORIOUS!'}
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
                {winner === 'red' ? 'Masterful tactical maneuvers!' : 'Defend your kings in the next match!'}
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
      </div>
    </div>
  );
};
