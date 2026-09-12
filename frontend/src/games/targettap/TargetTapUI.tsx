import React, { useEffect, useRef } from 'react';
import { TargetTapState } from './TargetTap';
import { Move } from '../engine/GameEngine';

interface Props {
  state: TargetTapState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const TargetTapUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  // Timer countdown tick
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      onMoveRef.current({ type: 'time_tick' });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.phase]);

  function handleHit(targetId: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (state.phase !== 'playing') return;
    onMoveRef.current({ type: 'hit_target', targetId });
  }

  function handleArenaMiss() {
    if (state.phase !== 'playing') return;
    onMoveRef.current({ type: 'miss_tap' });
  }

  const combo = state.combos[currentPlayerId] || 0;
  const score = state.scores[currentPlayerId] || 0;
  const hits = state.hits[currentPlayerId] || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: 540 }}>
      {/* Top HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`badge ${state.timeLeft <= 5 ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '1.1rem', padding: '0.4rem 0.8rem' }}>
            ⏱ {state.timeLeft}s
          </span>
          {combo > 2 && (
            <span className="badge badge-accent" style={{ animation: 'bounce 0.8s infinite' }}>
              ⚡ {combo}x COMBO!
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {state.players.map(pid => (
            <div key={pid} className="badge badge-primary">
              <span>{playerNames[pid] ?? pid}: </span>
              <strong>{state.scores[pid] || 0} pts</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Target Arena */}
      <div
        onClick={handleArenaMiss}
        style={{
          width: '100%',
          height: 380,
          position: 'relative',
          borderRadius: 16,
          background: 'radial-gradient(circle at center, #1b1b36 0%, #101020 100%)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          cursor: 'crosshair',
          userSelect: 'none',
        }}
      >
        {state.phase === 'playing' ? (
          state.targets.map(target => (
            <button
              key={target.id}
              onClick={(e) => handleHit(target.id, e)}
              style={{
                position: 'absolute',
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: target.size,
                height: target.size,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, #fff, ${target.color})`,
                border: '3px solid rgba(255,255,255,0.8)',
                boxShadow: `0 0 20px ${target.color}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.9rem',
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                animation: 'pulse 1s infinite alternate',
              }}
            >
              +{target.points}
            </button>
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎯</div>
            <h3>Time's Up!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Calculating results...</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <div>Score: <strong style={{ color: 'var(--text)' }}>{score}</strong></div>
        <div>Hits: <strong style={{ color: 'var(--success)' }}>{hits}</strong></div>
        <div>Multiplier: <strong style={{ color: 'var(--accent)' }}>{combo > 10 ? '3x' : combo > 5 ? '2x' : '1x'}</strong></div>
      </div>
    </div>
  );
};
