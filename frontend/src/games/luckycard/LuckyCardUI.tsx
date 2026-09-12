import React, { useEffect } from 'react';
import { LuckyCardState } from './LuckyCard';
import { Move } from '../engine/GameEngine';

interface Props {
  state: LuckyCardState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const LuckyCardUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  isMyTurn,
  playerNames,
}) => {
  const currentTurnId = state.players[state.currentPlayerIndex];
  const isTurn = isMyTurn && currentTurnId === currentPlayerId;

  // If busted, auto-advance after 1.5s
  useEffect(() => {
    if (state.phase === 'busted') {
      const timer = setTimeout(() => {
        onMove({ type: 'continue_turn' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, onMove]);

  function handleDraw() {
    if (!isTurn || state.phase !== 'turn_active') return;
    onMove({ type: 'draw_card' });
  }

  function handleBank() {
    if (!isTurn || state.phase !== 'turn_active' || state.currentTurnPoints <= 0) return;
    onMove({ type: 'bank_points' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: 500 }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span className="badge badge-info">
          Round {state.round} / {state.totalRounds}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {state.players.map((pid, idx) => (
            <div
              key={pid}
              className={`badge ${idx === state.currentPlayerIndex ? 'badge-primary' : 'badge-secondary'}`}
            >
              <span>{playerNames[pid] ?? pid}: </span>
              <strong>{state.bankedScores[pid] || 0} pts</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Card Display Table */}
      <div
        className="card"
        style={{
          width: '100%',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          background: state.phase === 'busted'
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.2), rgba(0,0,0,0.4))'
            : 'radial-gradient(circle, rgba(124, 58, 237, 0.15), rgba(0,0,0,0.3))',
          border: state.phase === 'busted' ? '2px solid var(--danger)' : '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {state.lastDrawnCard ? (
          <>
            <div style={{ fontSize: '5rem', animation: 'bounce 0.4s ease' }}>
              {state.lastDrawnCard.emoji}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {state.lastDrawnCard.label}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '5rem', opacity: 0.6 }}>🎴</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
              Draw your first card to start stacking points!
            </div>
          </>
        )}

        {/* Status badges */}
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
          {state.hasShield && (
            <span className="badge badge-success">🛡️ Shield Active</span>
          )}
          {state.multiplier > 1 && (
            <span className="badge badge-accent">⚡ {state.multiplier}x Multiplier</span>
          )}
        </div>
      </div>

      {/* Turn Score Box */}
      <div
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unbanked Points (at risk):</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: state.currentTurnPoints > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
            +{state.currentTurnPoints}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Player:</div>
          <div style={{ fontWeight: 700, color: isTurn ? 'var(--primary)' : 'var(--text)' }}>
            {playerNames[currentTurnId] ?? currentTurnId}
          </div>
        </div>
      </div>

      {/* Actions */}
      {state.phase === 'turn_active' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
          <button
            onClick={handleDraw}
            disabled={!isTurn}
            className="btn btn-primary btn-lg"
            style={{ fontSize: '1.15rem', padding: '1.1rem', fontWeight: 800, borderRadius: 14 }}
          >
            🎴 DRAW CARD
          </button>
          <button
            onClick={handleBank}
            disabled={!isTurn || state.currentTurnPoints <= 0}
            className="btn btn-success btn-lg"
            style={{ fontSize: '1.15rem', padding: '1.1rem', fontWeight: 800, borderRadius: 14 }}
          >
            💰 BANK POINTS
          </button>
        </div>
      )}

      {state.phase === 'busted' && (
        <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '1.2rem', animation: 'shake 0.5s ease' }}>
          💀 BUSTED! Lost unbanked points. Next player...
        </div>
      )}
    </div>
  );
};
