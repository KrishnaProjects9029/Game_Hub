import React, { useState, useEffect } from 'react';
import { ColorClashState } from './ColorClash';
import { Move } from '../engine/GameEngine';

interface Props {
  state: ColorClashState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const ColorClashUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const myAnswer = state.playerAnswers[currentPlayerId];
  const hasAnswered = myAnswer !== null;

  useEffect(() => {
    setSelected(null);
  }, [state.round]);

  function handleChoice(color: string) {
    if (hasAnswered || state.phase !== 'active') return;
    setSelected(color);
    const elapsed = Date.now() - state.startTime;
    onMove({ type: 'submit_color', answer: color, timeMs: elapsed });
  }

  function handleNext() {
    onMove({ type: 'next_round' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: 520 }}>
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

      {/* Instruction banner */}
      <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        ⚠️ Pick the FONT COLOR, NOT the word!
      </div>

      {/* The Stroop Word Card */}
      <div
        className="card"
        style={{
          width: '100%',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span
          style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            color: state.currentPrompt.textColor,
            letterSpacing: '2px',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            userSelect: 'none',
          }}
        >
          {state.currentPrompt.word}
        </span>
      </div>

      {/* Color options */}
      {state.phase === 'active' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', width: '100%' }}>
          {state.currentPrompt.options.map(color => (
            <button
              key={color}
              onClick={() => handleChoice(color)}
              disabled={hasAnswered}
              className={`btn btn-lg ${selected === color ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                padding: '1.2rem',
                borderRadius: 12,
                opacity: hasAnswered && selected !== color ? 0.6 : 1,
              }}
            >
              {color}
            </button>
          ))}
        </div>
      ) : (
        /* Round result reveal */
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>The font color was:</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: state.currentPrompt.textColor, marginTop: '0.25rem' }}>
              {state.currentPrompt.correctAnswer}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {state.players.map(pid => {
                const ans = state.playerAnswers[pid];
                return (
                  <div
                    key={pid}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 6,
                      background: ans?.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>{playerNames[pid] ?? pid}</span>
                    <span style={{ fontWeight: 700, color: ans?.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                      {ans?.isCorrect ? `✓ Correct (${ans.timeMs}ms)` : `✗ Picked ${ans?.answer}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {state.round < state.totalRounds && (
            <button className="btn btn-primary btn-lg" onClick={handleNext} style={{ width: '100%' }}>
              Next Round →
            </button>
          )}
        </div>
      )}

      {hasAnswered && state.phase === 'active' && (
        <div style={{ color: 'var(--accent)', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
          Color chosen! Waiting for opponent...
        </div>
      )}
    </div>
  );
};
