import React, { useState, useEffect } from 'react';
import { QuickQuizState } from './QuickQuiz';
import { Move } from '../engine/GameEngine';

interface Props {
  state: QuickQuizState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const QuickQuizUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const isSinglePlayer = state.players.includes('__ai__');
  const unansweredPid = state.players.find(p => state.playerAnswers[p] === null);
  const effectiveTurnPid = isSinglePlayer ? currentPlayerId : (unansweredPid || currentPlayerId);

  const humanAnswer = state.playerAnswers[currentPlayerId];
  const allAnswered = state.players.every(p => state.playerAnswers[p] !== null);
  const hasAnswered = isSinglePlayer ? humanAnswer !== null : state.playerAnswers[effectiveTurnPid] !== null;

  useEffect(() => {
    setSelectedIdx(null);
  }, [state.round]);

  // Failsafe auto-resolve if AI hasn't answered within 7.5s (never cut off natural AI reading/solving time)
  useEffect(() => {
    if (state.phase === 'question' && hasAnswered && !allAnswered) {
      const timer = setTimeout(() => {
        onMove({ type: 'ai_force_answer' });
      }, 7500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, hasAnswered, allAnswered, onMove]);

  function handleSelect(index: number) {
    if (hasAnswered || state.phase !== 'question') return;
    setSelectedIdx(index);
    const elapsed = Date.now() - state.questionStartTime;
    onMove({ type: 'submit_answer', optionIndex: index, timeMs: elapsed, playerId: effectiveTurnPid });
  }

  function handleNext() {
    onMove({ type: 'next_question' });
  }

  function handleForceAdvance() {
    onMove({ type: 'ai_force_answer' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: 560 }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-info">
            Question {state.round} / {state.totalRounds}
          </span>
          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
            {state.currentQuestion.category}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {state.players.map(pid => {
            const hasSubmitted = state.playerAnswers[pid] !== null;
            return (
              <div key={pid} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{playerNames[pid] ?? pid}: </span>
                <strong>{state.scores[pid] || 0} pts</strong>
                {state.phase === 'question' && hasSubmitted && (
                  <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.85rem' }} title="Answer locked in">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div
        className="card"
        style={{
          width: '100%',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(124, 58, 237, 0.15))',
          border: '1.5px solid var(--secondary)',
        }}
      >
        <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.4, color: 'var(--text)' }}>
          {state.currentQuestion.question}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        {state.currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrectAnswer = idx === state.currentQuestion.correctIndex;
          let btnStyle = {};

          if (state.phase === 'reveal') {
            if (isCorrectAnswer) {
              btnStyle = { background: 'rgba(16, 185, 129, 0.25)', border: '2px solid var(--success)', color: '#fff' };
            } else if (isSelected) {
              btnStyle = { background: 'rgba(239, 68, 68, 0.25)', border: '2px solid var(--danger)', color: '#fff' };
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={hasAnswered && state.phase === 'question'}
              className={`btn btn-lg ${isSelected && state.phase === 'question' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                fontSize: '1.05rem',
                textAlign: 'left',
                borderRadius: 12,
                ...btnStyle,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                {['A', 'B', 'C', 'D'][idx]}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
              {state.phase === 'reveal' && isCorrectAnswer && <span>✅</span>}
              {state.phase === 'reveal' && isSelected && !isCorrectAnswer && <span>❌</span>}
            </button>
          );
        })}
      </div>

      {/* Waiting or Reveal Actions */}
      {hasAnswered && state.phase === 'question' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: 'var(--accent)', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
            Answer locked! Waiting for other players...
          </div>
          <button
            onClick={handleForceAdvance}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px',
            }}
          >
            Reveal answers now ⏭️
          </button>
        </div>
      )}

      {state.phase === 'reveal' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Round Breakdown:</div>
            {state.players.map(pid => {
              const a = state.playerAnswers[pid];
              return (
                <div key={pid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>{playerNames[pid] ?? pid}:</span>
                  <span style={{ color: a?.isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {a?.isCorrect ? `✓ Correct (+${Math.max(70, 160 - Math.floor((a.timeMs || 0) / 120))} pts in ${a.timeMs}ms)` : '✗ Incorrect (0 pts)'}
                  </span>
                </div>
              );
            })}
          </div>

          {state.round < state.totalRounds && (
            <button className="btn btn-primary btn-lg" onClick={handleNext} style={{ width: '100%' }}>
              Next Question →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
