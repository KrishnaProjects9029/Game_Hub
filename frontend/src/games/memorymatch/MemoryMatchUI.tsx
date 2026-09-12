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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: 560 }}>
      {/* Board Size Selector (Initial move only) */}
      {state.movesCount === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 20 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Grid Size:</span>
          <button
            className={`btn btn-sm ${currentPairCount === 6 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '2px 10px', fontSize: '0.75rem' }}
            onClick={() => onMove({ type: 'set_size', pairs: 6 })}
          >
            3x4 (Easy)
          </button>
          <button
            className={`btn btn-sm ${currentPairCount === 8 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '2px 10px', fontSize: '0.75rem' }}
            onClick={() => onMove({ type: 'set_size', pairs: 8 })}
          >
            4x4 (Medium)
          </button>
          <button
            className={`btn btn-sm ${currentPairCount === 10 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '2px 10px', fontSize: '0.75rem' }}
            onClick={() => onMove({ type: 'set_size', pairs: 10 })}
          >
            4x5 (Hard)
          </button>
        </div>
      )}

      {/* Turn, Timer and Score Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>
            ⏱️ {formatTime(elapsedSeconds)}
          </span>
          {state.players.map((pid, idx) => (
            <div
              key={pid}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 20,
                background: idx === state.currentPlayerIndex ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${idx === state.currentPlayerIndex ? 'var(--primary-hover)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <span>{playerNames[pid] ?? pid}</span>
              <span className="badge badge-accent" style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}>
                {state.scores[pid] || 0} pts
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Moves: <strong style={{ color: 'var(--text)' }}>{state.movesCount}</strong>
        </div>
      </div>

      {/* Turn indicator */}
      <div style={{ fontSize: '0.9rem', color: isTurn ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
        {state.phase === 'revealing_mismatch' ? (
          <button
            onClick={handleManualContinue}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '20px',
              padding: '6px 14px',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Not a match! Tap to continue</span>
            <span>⏭️</span>
          </button>
        ) : isTurn ? (
          '👉 Your turn to flip!'
        ) : (
          `Waiting for ${playerNames[currentTurnId] ?? currentTurnId}...`
        )}
      </div>

      {/* Card Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: state.cards.length <= 12 ? 'repeat(3, 1fr)' : state.cards.length <= 16 ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)',
          gap: '0.65rem',
          width: '100%',
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
                borderRadius: 12,
                border: card.isMatched
                  ? '2px solid var(--success)'
                  : isFlipped
                  ? '2px solid var(--primary)'
                  : '1.5px solid rgba(255,255,255,0.12)',
                background: card.isMatched
                  ? 'rgba(16, 185, 129, 0.2)'
                  : isFlipped
                  ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(6, 182, 212, 0.3))'
                  : 'linear-gradient(135deg, #1f1f38, #16162a)',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (!isFlipped && isTurn) || state.phase === 'revealing_mismatch' ? 'pointer' : 'default',
                transform: isFlipped ? 'scale(1)' : 'scale(0.98)',
                transition: 'all 0.25s ease',
                boxShadow: isFlipped ? '0 4px 16px rgba(124, 58, 237, 0.25)' : 'none',
              }}
            >
              {isFlipped ? card.emoji : '❓'}
            </button>
          );
        })}
      </div>
    </div>
  );
};
