import React, { useEffect, useRef } from 'react';
import { BombPassState } from './BombPass';
import { Move } from '../engine/GameEngine';

interface Props {
  state: BombPassState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const BombPassUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  const isHolding = state.activePlayerId === currentPlayerId;
  const activeName = playerNames[state.activePlayerId] ?? state.activePlayerId;

  // Run the fuse timer
  useEffect(() => {
    if (state.phase !== 'ticking') return;
    const interval = setInterval(() => {
      onMoveRef.current({ type: 'timer_tick' });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.bombTimerSeconds]);

  function handlePass() {
    if (!isHolding || state.phase !== 'ticking') return;
    onMoveRef.current({ type: 'pass_bomb' });
  }

  function handleNextRound() {
    onMoveRef.current({ type: 'next_round' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: 520 }}>
      {/* Player Roster & Lives */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        {state.players.map(pid => {
          const isAlive = !state.eliminated.includes(pid);
          const isCurrent = state.activePlayerId === pid && state.phase === 'ticking';
          const lives = state.lives[pid] ?? 0;
          return (
            <div
              key={pid}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 12,
                background: isCurrent ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: isCurrent ? '2px solid var(--danger)' : '1px solid var(--border)',
                opacity: isAlive ? 1 : 0.4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                minWidth: 90,
                transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{playerNames[pid] ?? pid}</div>
              <div style={{ fontSize: '0.8rem' }}>
                {isAlive ? '❤️'.repeat(lives) : '💀 OUT'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Bomb Arena */}
      <div
        className="card"
        style={{
          width: '100%',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          background: state.phase === 'exploded'
            ? 'radial-gradient(circle, rgba(239,68,68,0.3), rgba(245,158,11,0.1))'
            : 'radial-gradient(circle, rgba(255,255,255,0.05), rgba(0,0,0,0.3))',
          border: state.phase === 'exploded' ? '2px solid var(--danger)' : '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {state.phase === 'ticking' ? (
          <>
            <div
              style={{
                fontSize: '6rem',
                animation: 'shake 0.4s infinite alternate',
                filter: 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.6))',
              }}
            >
              💣
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {isHolding ? (
                <span style={{ color: 'var(--danger)' }}>🔥 YOU ARE HOLDING THE BOMB! PASS IT! 🔥</span>
              ) : (
                <span>{activeName} is holding the bomb...</span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Passed {state.passedCount} times this round
            </div>

            <button
              onClick={handlePass}
              disabled={!isHolding}
              className="btn btn-danger btn-lg"
              style={{
                fontSize: '1.4rem',
                padding: '1.25rem 2.5rem',
                fontWeight: 800,
                borderRadius: 16,
                boxShadow: isHolding ? '0 0 30px rgba(239, 68, 68, 0.8)' : 'none',
                transform: isHolding ? 'scale(1.05)' : 'none',
                animation: isHolding ? 'pulse 0.8s infinite' : 'none',
              }}
            >
              💨 PASS BOMB!
            </button>
          </>
        ) : (
          /* Explosion view */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '6rem', animation: 'bounce 0.6s ease' }}>💥</div>
            <h2 style={{ color: 'var(--danger)', margin: 0 }}>BOOM!</h2>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>
              <strong style={{ color: 'var(--accent)' }}>
                {playerNames[state.lastEliminated || ''] ?? state.lastEliminated}
              </strong> was caught holding the bomb!
            </p>

            {state.phase === 'exploded' && (
              <button className="btn btn-primary btn-lg" onClick={handleNextRound} style={{ marginTop: '1rem' }}>
                Next Round →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
