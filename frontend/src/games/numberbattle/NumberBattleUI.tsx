import React, { useState, useEffect } from 'react';
import { NumberBattleState } from './NumberBattle';
import { Move } from '../engine/GameEngine';

interface Props {
  state: NumberBattleState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const NumberBattleUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  const isSinglePlayer = state.players.includes('__ai__');
  // In pass-and-play, find which player needs to answer next; in single player, human answers for themselves
  const unansweredPid = state.players.find(p => state.playerAnswers[p] === null);
  const effectiveTurnPid = isSinglePlayer ? currentPlayerId : (unansweredPid || currentPlayerId);

  const humanAnswer = state.playerAnswers[currentPlayerId];
  const allAnswered = state.players.every(p => state.playerAnswers[p] !== null);
  const hasAnswered = isSinglePlayer ? humanAnswer !== null : state.playerAnswers[effectiveTurnPid] !== null;

  // Reset local option when round changes
  useEffect(() => {
    setSelectedOpt(null);
  }, [state.round]);

  // Failsafe auto-resolve if AI hasn't answered within 6.5s in single player (never cut off natural AI solve time)
  useEffect(() => {
    if (state.phase === 'answering' && hasAnswered && !allAnswered) {
      const timer = setTimeout(() => {
        onMove({ type: 'ai_force_answer' });
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, hasAnswered, allAnswered, onMove]);

  function handleSelect(option: number) {
    if (hasAnswered || state.phase !== 'answering') return;
    setSelectedOpt(option);
    const elapsed = Date.now() - state.roundStartTime;
    onMove({ type: 'submit_answer', answer: option, timeMs: elapsed, playerId: effectiveTurnPid });
  }

  function handleNextRound() {
    onMove({ type: 'next_round' });
  }

  function handleForceAdvance() {
    onMove({ type: 'ai_force_answer' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: 520 }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span className="badge badge-info">
          Round {state.round} / {state.totalRounds}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {state.players.map(pid => {
            const hasSubmitted = state.playerAnswers[pid] !== null;
            return (
              <div key={pid} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{playerNames[pid] ?? pid}:</span>
                <strong>{state.scores[pid] || 0} pts</strong>
                {state.phase === 'answering' && hasSubmitted && (
                  <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.9rem' }} title="Answer submitted">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenge Card */}
      <div
        className="card"
        style={{
          width: '100%',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(6, 182, 212, 0.15))',
          border: '1.5px solid var(--primary)',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {state.phase === 'answering'
            ? isSinglePlayer
              ? (hasAnswered ? '⏳ Waiting for opponent to solve...' : '⚡ Calculate & Tap Fast!')
              : `Turn: ${playerNames[effectiveTurnPid] ?? effectiveTurnPid}`
            : 'Round Results'}
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '1px' }}>
          {state.currentChallenge.question}
        </div>
      </div>

      {/* Options Grid */}
      {state.phase === 'answering' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', width: '100%' }}>
          {state.currentChallenge.options.map(opt => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={hasAnswered}
              className={`btn btn-lg ${selectedOpt === opt ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                padding: '1.25rem',
                borderRadius: 14,
                opacity: hasAnswered && selectedOpt !== opt ? 0.6 : 1,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        /* Round Results View */
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Correct Answer:</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--success)' }}>
              {state.currentChallenge.correctAnswer}
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {state.players.map(pid => {
                const ans = state.playerAnswers[pid];
                return (
                  <div
                    key={pid}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 8,
                      background: ans?.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    }}
                  >
                    <span>{playerNames[pid] ?? pid}</span>
                    <span style={{ fontWeight: 700, color: ans?.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                      {ans?.isCorrect ? `✓ Correct (${ans.timeMs}ms)` : `✗ Wrong (${ans?.answer ?? 'No answer'})`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {state.round < state.totalRounds && (
            <button className="btn btn-primary btn-lg" onClick={handleNextRound} style={{ width: '100%' }}>
              Next Challenge →
            </button>
          )}
        </div>
      )}

      {hasAnswered && state.phase === 'answering' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: 'var(--accent)', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
            Answer locked! Waiting for others...
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
            Reveal results now ⏭️
          </button>
        </div>
      )}
    </div>
  );
};
