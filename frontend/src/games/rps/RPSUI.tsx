import React from 'react';
import { RPSState } from './RockPaperScissors';
import { Move } from '../engine/GameEngine';

interface Props {
  state: RPSState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

const CHOICES = [
  { key: 'rock', emoji: '🪨', label: 'Rock', desc: 'Crushes Scissors', color: '#f59e0b', border: '#fbbf24' },
  { key: 'paper', emoji: '📄', label: 'Paper', desc: 'Covers Rock', color: '#06b6d4', border: '#22d3ee' },
  { key: 'scissors', emoji: '✂️', label: 'Scissors', desc: 'Cuts Paper', color: '#ec4899', border: '#f472b6' },
] as const;

type Choice = 'rock' | 'paper' | 'scissors';

function getResult(state: RPSState, playerId: string): string {
  const history = state.roundHistory || [];
  const last = history[history.length - 1];
  if (!last) return '';
  if (last.winner === 'draw') return 'DRAW';
  if (last.winner === playerId) return 'WIN';
  return 'LOSE';
}

export const RPSUI: React.FC<Props> = ({ state, onMove, currentPlayerId, playerNames }) => {
  const choices = state.choices || {};
  const myChoice = choices[currentPlayerId] ?? null;
  const hasChosen = myChoice !== null;
  const showReveal = state.phase === 'revealing' || state.phase === 'finished';
  const isWaiting = hasChosen && !showReveal;

  function handleChoice(choice: Choice) {
    if (hasChosen || state.phase !== 'choosing') return;
    onMove({ choice });
  }

  const roundResult = showReveal ? getResult(state, currentPlayerId) : '';
  const history = state.roundHistory || [];
  const last = history[history.length - 1];

  const currentDisplayRound = showReveal ? Math.max(1, state.round - 1) : Math.min(state.round, state.totalRounds);

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
        border: '1px solid rgba(124, 58, 237, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}>
        {/* Round Progress & Dots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            ROUND {currentDisplayRound} / {state.totalRounds}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: state.totalRounds }, (_, i) => {
              const histItem = history[i];
              let color = 'rgba(255,255,255,0.15)';
              let glow = 'none';
              if (histItem) {
                if (histItem.winner === currentPlayerId) {
                  color = '#10b981';
                  glow = '0 0 8px #10b981';
                } else if (histItem.winner === 'draw') {
                  color = '#f59e0b';
                  glow = '0 0 8px #f59e0b';
                } else {
                  color = '#ef4444';
                  glow = '0 0 8px #ef4444';
                }
              }
              return (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: glow,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Players & Scores */}
        <div style={{ display: 'flex', gap: '0.85rem' }}>
          {(state.players || []).map(pid => (
            <div
              key={pid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.4rem 0.8rem',
                borderRadius: '12px',
                background: pid === currentPlayerId ? 'rgba(124, 58, 237, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                border: pid === currentPlayerId ? '1px solid #8b5cf6' : '1px solid #06b6d4',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {playerNames[pid] ?? pid}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: pid === currentPlayerId ? '#a78bfa' : '#38bdf8', lineHeight: 1 }}>
                  {state.scores?.[pid] ?? 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Series Format Selector (Round 1 only) */}
      {state.round === 1 && (state.roundHistory || []).length === 0 && !hasChosen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(30, 41, 59, 0.7)',
          padding: '6px 14px',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>FORMAT:</span>
          <button
            className={`btn btn-sm ${state.totalRounds === 3 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
            onClick={() => onMove({ type: 'set_rounds', totalRounds: 3 })}
          >
            Best of 3
          </button>
          <button
            className={`btn btn-sm ${state.totalRounds === 5 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
            onClick={() => onMove({ type: 'set_rounds', totalRounds: 5 })}
          >
            Best of 5
          </button>
        </div>
      )}

      {/* Reveal Showdown Stage */}
      {showReveal && last ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          width: '100%',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          padding: '24px',
          borderRadius: '24px',
          border: '2px solid rgba(124, 58, 237, 0.3)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
            {(state.players || []).map((pid, i) => {
              const choice = last.choices?.[pid];
              const choiceObj = CHOICES.find(c => c.key === choice);
              const emoji = choiceObj?.emoji ?? '❓';
              const isWinner = last.winner === pid;
              return (
                <React.Fragment key={pid}>
                  {i > 0 && (
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', textShadow: '0 0 12px #f59e0b' }}>
                      VS
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: isWinner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: isWinner ? '2px solid #10b981' : '1.5px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '1.5rem 2rem',
                    boxShadow: isWinner ? '0 0 24px rgba(16, 185, 129, 0.4)' : 'none',
                    minWidth: '130px',
                    animation: 'flipCard 0.4s ease',
                  }}>
                    <div style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}>
                      {emoji}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9' }}>
                      {playerNames[pid] ?? pid}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isWinner ? '#10b981' : 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 700 }}>
                      {choice}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {roundResult && (
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              padding: '0.5rem 1.5rem',
              borderRadius: '999px',
              background: roundResult === 'WIN' ? 'rgba(16, 185, 129, 0.2)' : roundResult === 'LOSE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1.5px solid ${roundResult === 'WIN' ? '#10b981' : roundResult === 'LOSE' ? '#ef4444' : '#f59e0b'}`,
              color: roundResult === 'WIN' ? '#10b981' : roundResult === 'LOSE' ? '#ef4444' : '#f59e0b',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
            }}>
              {roundResult === 'WIN' ? '🎉 YOU WIN THIS ROUND!' : roundResult === 'LOSE' ? '💥 OPPONENT WINS THIS ROUND' : '🤝 DRAW!'}
            </div>
          )}

          {state.phase === 'revealing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-primary btn-md"
                style={{ padding: '8px 24px', fontSize: '0.92rem', borderRadius: '12px' }}
                onClick={() => onMove({ type: 'continue' })}
              >
                Next Round ⏭️
              </button>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', animation: 'pulse 1.5s infinite' }}>
                Auto-advancing in 2 seconds...
              </div>
            </div>
          )}
        </div>
      ) : isWaiting ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: '24px',
          border: '2px solid rgba(124, 58, 237, 0.3)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          width: '100%',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ fontSize: '4.5rem', animation: 'bounce 1s infinite' }}>
            {CHOICES.find(c => c.key === myChoice)?.emoji}
          </div>
          <div style={{ color: '#38bdf8', fontWeight: 800, marginTop: '1rem', fontSize: '1.25rem' }}>
            Weapon Primed: {CHOICES.find(c => c.key === myChoice)?.label}
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Waiting for opponent to reveal hand...
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem', color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 800 }}>
            ⚡ Select Your Weapon!
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', width: '100%' }}>
            {CHOICES.map(({ key, emoji, label, desc, border }) => (
              <button
                key={key}
                onClick={() => handleChoice(key)}
                disabled={hasChosen || state.phase !== 'choosing'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                  border: `2px solid ${border}60`,
                  borderRadius: '20px',
                  padding: '1.5rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                className="console-tile"
              >
                <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
                  {emoji}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f1f5f9' }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Round History Carousel */}
      {(state.roundHistory || []).length > 0 && (
        <div style={{ width: '100%', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ROUND HISTORY
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {(state.roundHistory || []).slice(-5).map(h => {
              const oppId = (state.players || []).find(p => p !== currentPlayerId) ?? '';
              const myChoiceKey = h.choices?.[currentPlayerId];
              const oppChoiceKey = h.choices?.[oppId];
              const myC = CHOICES.find(c => c.key === myChoiceKey)?.emoji ?? '❓';
              const oppC = CHOICES.find(c => c.key === oppChoiceKey)?.emoji ?? '❓';
              const isWonRound = h.winner === currentPlayerId;
              const isDrawRound = h.winner === 'draw';
              return (
                <div
                  key={h.round}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: `1px solid ${isWonRound ? '#10b981' : isDrawRound ? '#f59e0b' : '#ef4444'}60`,
                    borderRadius: '12px',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.88rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{myC} vs {oppC}</div>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    marginTop: '2px',
                    color: isWonRound ? '#10b981' : isDrawRound ? '#f59e0b' : '#ef4444',
                  }}>
                    {isWonRound ? 'VICTORY' : isDrawRound ? 'DRAW' : 'DEFEAT'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
