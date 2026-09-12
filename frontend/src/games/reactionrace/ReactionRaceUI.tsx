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
    if (isMultiplayer) return; // In multiplayer, server sends reaction_go

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

  function tapAreaClass() {
    if (state.phase === 'go') return 'rr-tap-area rr-tap-go';
    if (state.phase === 'results' || state.phase === 'finished') return 'rr-tap-area rr-tap-done';
    return 'rr-tap-area rr-tap-wait';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
      {/* Round indicator */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div className="badge badge-info">
          Round {displayRound} / {state.totalRounds}
        </div>
        {/* Score pills */}
        {(state.players || []).map(pid => (
          <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{playerNames[pid] ?? pid}:</span>
            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{scores[pid] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Main tap area */}
      {state.phase === 'waiting' && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2s ease-in-out infinite' }}>⚡</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Ready to Race?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
            Wait for the countdown. When the screen turns <strong style={{ color: 'var(--success)' }}>GREEN</strong>, tap as fast as you can!
          </p>
          <button className="btn btn-primary btn-lg" onClick={startRound}>
            Start Round
          </button>
        </div>
      )}

      {state.phase === 'countdown' && (
        <div className={tapAreaClass()} onClick={handleTap} style={{ userSelect: 'none', cursor: 'pointer' }}>
          <div className="rr-countdown" key={String(displayCount)}>{displayCount}</div>
          <div style={{ color: 'var(--danger)', fontSize: '1rem', fontWeight: 600 }}>Get ready...</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>DO NOT TAP YET (tapping now is a false start)</div>
        </div>
      )}

      {state.phase === 'go' && (
        <div className={tapAreaClass()} onClick={handleTap} style={{ cursor: 'pointer', animation: 'pulse 0.5s infinite' }}>
          <div className="rr-go-text">TAP NOW!</div>
          <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginTop: '0.5rem' }}>⚡ FASTEST WINS! ⚡</div>
        </div>
      )}

      {state.phase === 'results' && lastRound && (
        <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            {falseStarts[currentPlayerId] ? (
              <div className="rr-false-start">⚠️ FALSE START! Tap only after GREEN!</div>
            ) : myTime !== null && myTime >= 0 ? (
              <div className="rr-time">{myTime} ms</div>
            ) : null}
          </div>


          {/* Results table */}
          <table className="rr-results-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Time</th>
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
                  <tr key={pid}>
                    <td className={idx === 0 ? 'rr-rank-1' : idx === 1 ? 'rr-rank-2' : 'rr-rank-3'}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </td>
                    <td style={{ fontWeight: pid === currentPlayerId ? 700 : 400 }}>{playerNames[pid] ?? pid}</td>
                    <td style={{ color: t === null || t < 0 ? 'var(--danger)' : 'var(--accent)', fontWeight: 600 }}>
                      {t === null ? '—' : t < 0 ? 'False Start' : `${t}ms`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {state.round <= state.totalRounds && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button className="btn btn-primary btn-md" onClick={nextRound}>Next Round →</button>
            </div>
          )}
        </div>
      )}

      {state.phase === 'finished' && (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏁</div>
          <h3 style={{ marginBottom: '1rem' }}>Race Finished!</h3>
          <table className="rr-results-table" style={{ maxWidth: 400, margin: '0 auto' }}>
            <thead><tr><th>Rank</th><th>Player</th><th>Points</th></tr></thead>
            <tbody>
              {state.players
                .map(pid => ({ pid, score: state.scores[pid] }))
                .sort((a, b) => b.score - a.score)
                .map(({ pid, score: sc }, idx) => (
                  <tr key={pid}>
                    <td className={idx === 0 ? 'rr-rank-1' : idx === 1 ? 'rr-rank-2' : 'rr-rank-3'}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </td>
                    <td style={{ fontWeight: pid === currentPlayerId ? 700 : 400 }}>{playerNames[pid] ?? pid}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{sc}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
