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
  { key: 'rock', emoji: '🪨', label: 'Rock' },
  { key: 'paper', emoji: '📄', label: 'Paper' },
  { key: 'scissors', emoji: '✂️', label: 'Scissors' },
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
      {/* Round counter */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div className="badge badge-info">
          Round {currentDisplayRound} / {state.totalRounds}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {Array.from({ length: state.totalRounds }, (_, i) => {
            const histItem = history[i];
            let color = 'rgba(255,255,255,0.1)';
            if (histItem) {
              if (histItem.winner === currentPlayerId) color = 'var(--success)';
              else if (histItem.winner === 'draw') color = 'var(--accent)';
              else color = 'var(--danger)';
            }
            return <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />;
          })}
        </div>
      </div>

      {/* Score */}
      <div className="rps-score-display">
        {(state.players || []).map(pid => (
          <div key={pid} className="rps-score-item">
            <div className="rps-score-num" style={{ color: pid === currentPlayerId ? 'var(--primary)' : 'var(--secondary)' }}>
              {state.scores?.[pid] ?? 0}
            </div>
            <div className="rps-score-name">{playerNames[pid] ?? pid}</div>
          </div>
        ))}
      </div>

      {/* Series Format Selector (Round 1 only) */}
      {state.round === 1 && (state.roundHistory || []).length === 0 && !hasChosen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 20 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Format:</span>
          <button
            className={`btn btn-sm ${state.totalRounds === 3 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.8rem' }}
            onClick={() => onMove({ type: 'set_rounds', totalRounds: 3 })}
          >
            Best of 3
          </button>
          <button
            className={`btn btn-sm ${state.totalRounds === 5 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.8rem' }}
            onClick={() => onMove({ type: 'set_rounds', totalRounds: 5 })}
          >
            Best of 5
          </button>
        </div>
      )}

      {/* Reveal phase */}
      {showReveal && last ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
          <div className="rps-reveal">
            {(state.players || []).map((pid, i) => {
              const choice = last.choices?.[pid];
              const emoji = CHOICES.find(c => c.key === choice)?.emoji ?? '❓';
              return (
                <React.Fragment key={pid}>
                  {i > 0 && <div className="rps-vs">VS</div>}
                  <div className="rps-reveal-card" style={{ animation: 'flipCard 0.4s ease' }}>
                    <div className="rps-reveal-emoji">{emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{playerNames[pid] ?? pid}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{choice}</div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {roundResult && (
            <div className={roundResult === 'WIN' ? 'rps-result-win' : roundResult === 'LOSE' ? 'rps-result-lose' : 'rps-result-draw'}>
              {roundResult === 'WIN' ? '🎉 You Win This Round!' : roundResult === 'LOSE' ? '😤 You Lose This Round' : '🤝 Draw!'}
            </div>
          )}
          {state.phase === 'revealing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-primary btn-sm"
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                onClick={() => onMove({ type: 'continue' })}
              >
                Next Round ⏭️
              </button>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', animation: 'pulse 1.5s infinite' }}>
                Auto-advancing...
              </div>
            </div>
          )}
        </div>
      ) : isWaiting ? (
        <div style={{ textAlign: 'center', padding: '2rem', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: '3.5rem', animation: 'bounce 1s infinite' }}>
            {CHOICES.find(c => c.key === myChoice)?.emoji}
          </div>
          <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: '0.75rem', fontSize: '1.1rem' }}>
            Weapon chosen: {CHOICES.find(c => c.key === myChoice)?.label}
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Waiting for opponent...
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>
            Choose your weapon!
          </div>
          <div className="rps-choices">
            {CHOICES.map(({ key, emoji, label }) => (
              <button
                key={key}
                className={`rps-choice-btn ${myChoice === key ? 'selected' : ''}`}
                onClick={() => handleChoice(key)}
                disabled={hasChosen || state.phase !== 'choosing'}
              >
                {emoji}
                <span className="label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* History */}
      {(state.roundHistory || []).length > 0 && (
        <div style={{ width: '100%', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Round History</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(state.roundHistory || []).slice(-5).map(h => {
              const oppId = (state.players || []).find(p => p !== currentPlayerId) ?? '';
              const myChoiceKey = h.choices?.[currentPlayerId];
              const oppChoiceKey = h.choices?.[oppId];
              const myC = CHOICES.find(c => c.key === myChoiceKey)?.emoji ?? '❓';
              const oppC = CHOICES.find(c => c.key === oppChoiceKey)?.emoji ?? '❓';
              return (
                <div key={h.round} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.85rem', textAlign: 'center' }}>
                  <div>{myC} vs {oppC}</div>
                  <div style={{ fontSize: '0.7rem', color: h.winner === currentPlayerId ? 'var(--success)' : h.winner === 'draw' ? 'var(--accent)' : 'var(--danger)' }}>
                    {h.winner === currentPlayerId ? 'W' : h.winner === 'draw' ? 'D' : 'L'}
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
