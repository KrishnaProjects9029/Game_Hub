import React, { useEffect, useRef } from 'react';
import { FastestFingerState } from './FastestFinger';
import { Move } from '../engine/GameEngine';

interface Props {
  state: FastestFingerState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const FastestFingerUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  const myTap = state.taps[currentPlayerId];
  const hasTapped = myTap !== null;

  // When in 'ready', spawn target after random delay 1000-2500ms
  useEffect(() => {
    if (state.phase !== 'ready') return;
    const delay = 1000 + Math.random() * 1500;
    const timer = setTimeout(() => {
      onMoveRef.current({ type: 'spawn_target' });
    }, delay);
    return () => clearTimeout(timer);
  }, [state.phase, state.round]);

  function handleTileClick(index: number) {
    if (hasTapped || state.phase !== 'target_active') return;
    const elapsed = state.targetAppearanceTime ? Date.now() - state.targetAppearanceTime : 300;
    onMoveRef.current({ type: 'tap_tile', tile: index, timeMs: elapsed });
  }

  function handleNext() {
    onMoveRef.current({ type: 'next_round' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: 480 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span className="badge badge-info">
          Round {state.round} / {state.totalRounds}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {state.players.map(pid => (
            <div key={pid} className="badge badge-primary">
              <span>{playerNames[pid] ?? pid}: </span>
              <strong>{state.scores[pid] || 0} pts</strong>
            </div>
          ))}
        </div>
      </div>

      {/* State banner */}
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: state.phase === 'target_active' ? 'var(--success)' : 'var(--accent)' }}>
        {state.phase === 'ready'
          ? '⏳ Eyes on the grid... target will appear soon!'
          : state.phase === 'target_active'
          ? '⚡ TAP THE TARGET NOW!'
          : 'Round Finished!'}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.65rem',
          width: '100%',
        }}
      >
        {Array.from({ length: state.gridSize }).map((_, idx) => {
          const isTarget = state.activeTile === idx && state.phase === 'target_active';
          return (
            <button
              key={idx}
              onClick={() => handleTileClick(idx)}
              disabled={hasTapped || state.phase !== 'target_active'}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 12,
                border: isTarget
                  ? '3px solid #10b981'
                  : '1.5px solid rgba(255, 255, 255, 0.08)',
                background: isTarget
                  ? 'radial-gradient(circle, #10b981, #059669)'
                  : 'rgba(255, 255, 255, 0.03)',
                boxShadow: isTarget ? '0 0 25px rgba(16, 185, 129, 0.8)' : 'none',
                cursor: state.phase === 'target_active' && !hasTapped ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                transition: 'all 0.1s ease',
              }}
            >
              {isTarget ? '🎯' : ''}
            </button>
          );
        })}
      </div>

      {/* Waiting or results */}
      {hasTapped && state.phase === 'target_active' && (
        <div style={{ color: 'var(--accent)', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
          Tapped in {myTap?.timeMs}ms! Waiting for other players...
        </div>
      )}

      {state.phase === 'round_result' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Reaction Speeds:</div>
            {state.players.map(pid => {
              const tap = state.taps[pid];
              return (
                <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem' }}>
                  <span>{playerNames[pid] ?? pid}:</span>
                  <span style={{ color: tap?.isHit ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {tap?.isHit ? `🎯 HIT in ${tap.timeMs}ms` : '❌ Missed (-25 pts)'}
                  </span>
                </div>
              );
            })}
          </div>

          {state.round < state.totalRounds && (
            <button className="btn btn-primary btn-lg" onClick={handleNext} style={{ width: '100%' }}>
              Next Round →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
