import React, { useEffect, useRef, useState } from 'react';
import { RRState } from './ReactionRace';
import { Move } from '../engine/GameEngine';

interface Props {
  state: RRState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
  onStateChange?: (state: RRState) => void;
  isMultiplayer?: boolean;
}

export const ReactionRaceUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
  isMultiplayer = false,
}) => {
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  const [localCountdown, setLocalCountdown] = useState<string | number>(3);

  function startRound() {
    onMoveRef.current({ type: 'start_round' });
  }

  function nextRound() {
    onMoveRef.current({ type: 'start_round' });
  }

  // Drive countdown when phase becomes 'countdown' in single player / passplay
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    if (isMultiplayer) return;

    setLocalCountdown(3);

    const t1 = setTimeout(() => {
      setLocalCountdown(2);
    }, 800);

    const t2 = setTimeout(() => {
      setLocalCountdown(1);
    }, 1600);

    const t3 = setTimeout(() => {
      setLocalCountdown('READY...');
    }, 2400);

    const randomExtra = 500 + Math.random() * 1200;
    const tGo = setTimeout(() => {
      onMoveRef.current({ type: 'signal' });
    }, 2400 + randomExtra);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tGo);
    };
  }, [state.phase, state.round, isMultiplayer]);

  function handleTap() {
    if (state.phase === 'go') {
      const now = Date.now();
      const reactionMs = state.signalTime ? Math.max(1, now - state.signalTime) : 180;
      onMoveRef.current({ type: 'tap', reactionMs });
    } else if (state.phase === 'countdown' || state.phase === 'waiting') {
      // False start
      onMoveRef.current({ type: 'tap', reactionMs: -1 });
    }
  }

  const times = state.reactionTimes || {};
  const myTime = times[currentPlayerId] ?? null;
  const history = state.roundHistory || [];
  const lastRound = history[history.length - 1];
  const scores = state.scores || {};
  const falseStarts = state.falseStart || {};

  const displayRound = Math.min(state.round, state.totalRounds);
  const displayCount = isMultiplayer
    ? (state.countdownValue > 0 ? state.countdownValue : 'GET READY')
    : localCountdown;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: '520px' }}>
      {/* Top Console Matchup Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: '0.85rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.9))',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 800 }}>
            ROUND {displayRound} / {state.totalRounds}
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>
            ⚡ REFLEX DUEL
          </span>
        </div>

        {/* Score Chips */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(state.players || []).map(pid => (
            <div
              key={pid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.4rem 0.8rem',
                borderRadius: '12px',
                background: pid === currentPlayerId ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: pid === currentPlayerId ? '1px solid #10b981' : '1px solid #f59e0b',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {playerNames[pid] ?? pid}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: pid === currentPlayerId ? '#10b981' : '#f59e0b', lineHeight: 1 }}>
                  {scores[pid] ?? 0} pts
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Reactive Tap Arena */}
      {state.phase === 'waiting' && (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: '24px',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          width: '100%',
        }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1rem', animation: 'float 2s ease-in-out infinite', filter: 'drop-shadow(0 0 16px #10b981)' }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 900, color: '#f1f5f9' }}>
            Ready on the Throttle?
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem auto 1.5rem', maxWidth: 360, fontSize: '0.92rem' }}>
            Wait for the countdown. The moment the pod flashes <strong style={{ color: '#10b981' }}>GREEN</strong>, smash the trigger as fast as humanly possible!
          </p>
          <button className="btn btn-primary btn-lg" onClick={startRound} style={{ minWidth: 180, fontWeight: 900 }}>
            Start Round
          </button>
        </div>
      )}

      {state.phase === 'countdown' && (
        <div
          onClick={handleTap}
          style={{
            width: '100%',
            minHeight: '320px',
            borderRadius: '24px',
            background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '3px solid #ef4444',
            boxShadow: '0 0 32px rgba(239, 68, 68, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '6rem', fontWeight: 900, color: '#f87171', animation: 'countAnim 0.5s ease', lineHeight: 1 }}>
            {displayCount}
          </div>
          <div style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em' }}>
            HOLD FIRE... DO NOT TAP!
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            (Tapping now triggers an instant false start penalty!)
          </div>
        </div>
      )}

      {state.phase === 'go' && (
        <div
          onClick={handleTap}
          style={{
            width: '100%',
            minHeight: '320px',
            borderRadius: '24px',
            background: 'radial-gradient(circle at center, #10b981 0%, #047857 70%, #064e3b 100%)',
            border: '4px solid #34d399',
            boxShadow: '0 0 50px rgba(16, 185, 129, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            gap: '0.5rem',
            animation: 'greenPulse 0.4s infinite alternate',
          }}
        >
          <div style={{ fontSize: '5rem', fontWeight: 900, color: '#ffffff', textShadow: '0 0 30px #ffffff, 0 4px 10px rgba(0,0,0,0.5)', lineHeight: 1 }}>
            TAP NOW!
          </div>
          <div style={{ color: '#ecfdf5', fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.1em' }}>
            ⚡ SPEED OF LIGHT ⚡
          </div>
        </div>
      )}

      {state.phase === 'results' && lastRound && (
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          padding: '24px',
          borderRadius: '24px',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {falseStarts[currentPlayerId] ? (
              <div style={{ color: '#ef4444', fontSize: '1.3rem', fontWeight: 900, animation: 'shake 0.4s ease' }}>
                ⚠️ FALSE START! Too trigger-happy!
              </div>
            ) : myTime !== null && myTime >= 0 ? (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  YOUR REACTION VELOCITY
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#38bdf8', textShadow: '0 0 20px rgba(56, 189, 248, 0.5)' }}>
                  {myTime} ms
                </div>
              </div>
            ) : null}
          </div>

          {/* Results table */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RANK</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PILOT</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>REACTION TIME</th>
                </tr>
              </thead>
              <tbody>
                {(state.players || [])
                  .map(pid => ({ pid, t: lastRound?.times ? lastRound.times[pid] : null }))
                  .sort((a, b) => {
                    if (a.t === null || a.t < 0) return 1;
                    if (b.t === null || b.t < 0) return -1;
                    return a.t - b.t;
                  })
                  .map(({ pid, t }, idx) => (
                    <tr key={pid} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '1.2rem' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: pid === currentPlayerId ? 800 : 400, color: '#f1f5f9' }}>
                        {playerNames[pid] ?? pid}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: t === null || t < 0 ? '#ef4444' : '#10b981', fontWeight: 800 }}>
                        {t === null ? '—' : t < 0 ? 'False Start (-1)' : `${t} ms`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {state.round <= state.totalRounds && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button className="btn btn-primary btn-md" onClick={nextRound} style={{ padding: '10px 28px', fontSize: '1rem', fontWeight: 800 }}>
                Next Round →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
