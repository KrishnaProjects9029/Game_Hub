import React, { useEffect, useRef } from 'react';
import { CoinFlipState, CoinChoice } from './CoinFlip';
import { Move } from '../engine/GameEngine';

interface Props {
  state: CoinFlipState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const CoinFlipUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  const myChoice = state.choices[currentPlayerId];
  const hasChosen = myChoice !== null;

  // When phase is flipping, simulate coin spin for 1.8s then resolve
  useEffect(() => {
    if (state.phase !== 'flipping') return;
    const outcome: CoinChoice = Math.random() < 0.5 ? 'heads' : 'tails';
    const timer = setTimeout(() => {
      onMoveRef.current({ type: 'resolve_flip', result: outcome });
    }, 1800);
    return () => clearTimeout(timer);
  }, [state.phase, state.round]);

  function handleChoose(choice: CoinChoice) {
    if (hasChosen || state.phase !== 'predicting') return;
    onMoveRef.current({ type: 'choose_side', choice });
  }

  function handleNext() {
    onMoveRef.current({ type: 'next_round' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: 500 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span className="badge badge-info">
          Round {state.round} / {state.totalRounds}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {state.players.map(pid => (
            <div key={pid} className="badge badge-primary">
              <span>{playerNames[pid] ?? pid}: </span>
              <strong>{state.scores[pid] || 0} pts</strong>
              {(state.streaks[pid] || 0) > 1 && <span> 🔥{state.streaks[pid]}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 3D Coin Display Area */}
      <div
        className="card"
        style={{
          width: '100%',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 220,
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1), rgba(0,0,0,0.3))',
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #b45309 100%)',
            border: '5px solid #fef3c7',
            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3.2rem',
            animation: state.phase === 'flipping' ? 'spin 0.3s linear infinite' : 'none',
            userSelect: 'none',
          }}
        >
          {state.phase === 'flipping' ? '🪙' : state.coinResult === 'tails' ? '🦅' : '👑'}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: 800 }}>
          {state.phase === 'predicting'
            ? 'Pick Heads or Tails!'
            : state.phase === 'flipping'
            ? 'Flipping through the air...'
            : `Landed on: ${state.coinResult?.toUpperCase()}!`}
        </div>
      </div>

      {/* Prediction Buttons */}
      {state.phase === 'predicting' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
          <button
            onClick={() => handleChoose('heads')}
            disabled={hasChosen}
            className={`btn btn-lg ${myChoice === 'heads' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '1.25rem', fontSize: '1.2rem', fontWeight: 800, borderRadius: 14 }}
          >
            👑 Heads
          </button>
          <button
            onClick={() => handleChoose('tails')}
            disabled={hasChosen}
            className={`btn btn-lg ${myChoice === 'tails' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '1.25rem', fontSize: '1.2rem', fontWeight: 800, borderRadius: 14 }}
          >
            🦅 Tails
          </button>
        </div>
      ) : state.phase === 'result' ? (
        /* Round Results */
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Predictions:</div>
            {state.players.map(pid => {
              const pick = state.choices[pid];
              const won = pick === state.coinResult;
              return (
                <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.9rem' }}>
                  <span>{playerNames[pid] ?? pid}: Predicted {pick}</span>
                  <span style={{ fontWeight: 700, color: won ? 'var(--success)' : 'var(--danger)' }}>
                    {won ? '✓ Correct (+100)' : '✗ Wrong (0)'}
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
      ) : (
        hasChosen && (
          <div style={{ color: 'var(--accent)', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
            Locked in: {myChoice}! Waiting for players...
          </div>
        )
      )}
    </div>
  );
};
