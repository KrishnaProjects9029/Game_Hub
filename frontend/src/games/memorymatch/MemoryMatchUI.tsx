import React, { useEffect, useState } from 'react';
import { MemoryMatchState } from './MemoryMatch';
import { Move } from '../engine/GameEngine';

interface Props {
  state: MemoryMatchState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const MemoryMatchUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  isMyTurn,
  playerNames,
}) => {
  const currentTurnId = state.players[state.currentPlayerIndex];
  const isTurn = isMyTurn && currentTurnId === currentPlayerId;
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live stopwatch timer
  useEffect(() => {
    if (state.phase === 'finished') return;
    const interval = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.phase]);

  // Auto-advance after 1.2s delay if mismatch
  useEffect(() => {
    if (state.phase === 'revealing_mismatch') {
      const timer = setTimeout(() => {
        onMove({ type: 'continue' });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.phase, onMove]);

  function handleCardClick(cardId: number) {
    if (state.phase === 'revealing_mismatch') {
      onMove({ type: 'continue' });
      return;
    }
    if (!isTurn || state.phase !== 'playing') return;
    if (state.flippedCardIds.length >= 2) return;
    onMove({ type: 'flip', cardId });
  }

  function handleManualContinue() {
    if (state.phase === 'revealing_mismatch') {
      onMove({ type: 'continue' });
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentPairCount = state.pairCount || state.cards.length / 2;
  const matchedCount = state.cards.filter(c => c.isMatched).length / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: 560 }}>
      {/* Board Size Selector (Initial move only) */}
      {state.movesCount === 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(30, 41, 59, 0.7)',
          padding: '6px 14px',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>GRID:</span>
          <button
            className={`btn btn-sm ${currentPairCount === 6 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
            onClick={() => onMove({ type: 'set_size', pairs: 6 })}
          >
            3x4 (Easy)
          </button>
          <button
            className={`btn btn-sm ${currentPairCount === 8 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
            onClick={() => onMove({ type: 'set_size', pairs: 8 })}
          >
            4x4 (Medium)
          </button>
          <button
            className={`btn btn-sm ${currentPairCount === 10 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
            onClick={() => onMove({ type: 'set_size', pairs: 10 })}
          >
            4x5 (Hard)
          </button>
        </div>
      )}

      {/* Top Console Matchup & Stats HUD */}
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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
            <span className="in-game-hud-label">TIME</span>
            <span className="in-game-hud-val" style={{ color: '#38bdf8' }}>{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <span className="in-game-hud-label">MOVES</span>
            <span className="in-game-hud-val" style={{ color: '#f59e0b' }}>{state.movesCount}</span>
          </div>
          <div className="in-game-hud-chip" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <span className="in-game-hud-label">PAIRS</span>
            <span className="in-game-hud-val" style={{ color: '#10b981' }}>{matchedCount}/{currentPairCount}</span>
          </div>
        </div>

        {/* Players List */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {state.players.map((pid, idx) => (
            <div
              key={pid}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '10px',
                background: idx === state.currentPlayerIndex ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: idx === state.currentPlayerIndex ? '1.5px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: idx === state.currentPlayerIndex ? '0 0 12px rgba(124, 58, 237, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              <span>{playerNames[pid] ?? pid}</span>
              <span style={{ color: '#38bdf8' }}>({state.scores[pid] || 0} pts)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Turn Action Banner */}
      <div style={{
        padding: '0.45rem 1.25rem',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 700,
        background: state.phase === 'revealing_mismatch'
          ? 'rgba(245, 158, 11, 0.15)'
          : isTurn
          ? 'rgba(16, 185, 129, 0.15)'
          : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${state.phase === 'revealing_mismatch' ? '#f59e0b' : isTurn ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
        color: state.phase === 'revealing_mismatch' ? '#f59e0b' : isTurn ? '#10b981' : 'var(--text-muted)',
      }}>
        {state.phase === 'revealing_mismatch' ? (
          <button
            onClick={handleManualContinue}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f59e0b',
              cursor: 'pointer',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Not a match! Click to continue</span>
            <span>⏭️</span>
          </button>
        ) : isTurn ? (
          '👉 Your turn to flip cards!'
        ) : (
          `Waiting for ${playerNames[currentTurnId] ?? currentTurnId}...`
        )}
      </div>

      {/* 3D Concentration Card Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: state.cards.length <= 12 ? 'repeat(3, 1fr)' : state.cards.length <= 16 ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)',
          gap: '10px',
          width: '100%',
          background: '#090d16',
          padding: '14px',
          borderRadius: '20px',
          border: '2px solid rgba(124, 58, 237, 0.3)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        {state.cards.map(card => {
          const isFlipped = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched || (card.isFlipped && state.phase !== 'revealing_mismatch')}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: '14px',
                border: card.isMatched
                  ? '2px solid #10b981'
                  : isFlipped
                  ? '2px solid #8b5cf6'
                  : '1.5px solid rgba(255, 255, 255, 0.12)',
                background: card.isMatched
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.5))'
                  : isFlipped
                  ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(6, 182, 212, 0.4))'
                  : 'linear-gradient(145deg, #1e293b, #0f172a)',
                fontSize: '2.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (!isFlipped && isTurn) || state.phase === 'revealing_mismatch' ? 'pointer' : 'default',
                transform: isFlipped ? 'scale(1)' : 'scale(0.96)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: card.isMatched
                  ? '0 0 16px rgba(16, 185, 129, 0.5), inset 0 1px 2px rgba(255,255,255,0.4)'
                  : isFlipped
                  ? '0 0 16px rgba(124, 58, 237, 0.5), inset 0 1px 2px rgba(255,255,255,0.4)'
                  : '0 4px 8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
              aria-label={`Card ${card.id} ${isFlipped ? card.emoji : 'hidden'}`}
            >
              {isFlipped ? (
                <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                  {card.emoji}
                </span>
              ) : (
                <span style={{ fontSize: '1.4rem', opacity: 0.35, filter: 'drop-shadow(0 0 4px #7c3aed)' }}>
                  🎮
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
