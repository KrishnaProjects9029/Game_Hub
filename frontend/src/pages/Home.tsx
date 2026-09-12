import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { Header } from '../components/layout/Header';
import { PlayerCard } from '../components/profile/PlayerCard';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { Button } from '../components/ui/Button';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentPlayer, loadPlayers } = usePlayerStore();

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ flex: 1, paddingTop: '1rem', paddingBottom: '2rem' }}>
        <section className="home-hero">
          <div className="home-logo-emoji">🎮</div>
          <h1 className="home-title text-gradient">Game Hub</h1>
          <p className="home-subtitle">
            Local multiplayer games for friends. Play on the same device or over LAN — no internet required.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <StatusIndicator />
          </div>
        </section>

        <section style={{ maxWidth: 480, margin: '0 auto 2rem', animation: 'slideUp 0.4s ease' }}>
          {currentPlayer ? (
            <div className="card">
              <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Profile
              </div>
              <PlayerCard player={currentPlayer} showXP />
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No Profile Found</h3>
              <p style={{ marginBottom: '1.25rem' }}>Create a profile to track your stats and progress.</p>
              <Button variant="primary" size="md" onClick={() => navigate('/setup')}>
                Create Profile
              </Button>
            </div>
          )}
        </section>

        <section className="home-actions" style={{ animation: 'slideUp 0.5s ease 0.1s both' }}>
          <button
            className="btn btn-primary btn-lg home-btn-single"
            onClick={() => navigate('/singleplayer')}
            style={{ flexDirection: 'column', height: 'auto', padding: '1.75rem 2rem', gap: '0.5rem', minWidth: 240, border: '2px solid rgba(124, 58, 237, 0.5)', boxShadow: '0 8px 30px rgba(124, 58, 237, 0.25)' }}
          >
            <span style={{ fontSize: '3rem' }}>👤</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>SINGLE PLAYER</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.85, fontWeight: 500 }}>Play Offline vs Local AI • Solo Challenges</span>
          </button>

          <button
            className="btn btn-secondary btn-lg home-btn-multi"
            onClick={() => navigate('/multiplayer')}
            style={{ flexDirection: 'column', height: 'auto', padding: '1.75rem 2rem', gap: '0.5rem', minWidth: 240, border: '2px solid rgba(6, 182, 212, 0.5)', boxShadow: '0 8px 30px rgba(6, 182, 212, 0.25)' }}
          >
            <span style={{ fontSize: '3rem' }}>👥</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>MULTIPLAYER</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.85, fontWeight: 500 }}>Local Wi-Fi • Hotspot • Same Device</span>
          </button>
        </section>

        {/* Featured Quick Play Section */}
        <section style={{ maxWidth: 840, margin: '2.5rem auto 1rem', animation: 'fadeIn 0.6s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🔥</span> Featured Classics (100% Offline)
            </h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/singleplayer')}
              style={{ fontSize: '0.8rem', color: 'var(--primary-hover)' }}
            >
              Browse All 44 Games →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {[
              { id: 'tictactoe', icon: '❌⭕', name: 'Tic-Tac-Toe', color: '#8b5cf6' },
              { id: 'connect4', icon: '🔴🟡', name: 'Connect 4', color: '#8b5cf6' },
              { id: 'reactionrush', icon: '⚡', name: 'Reaction Rush', color: '#f59e0b' },
              { id: 'memorymatch', icon: '🃏', name: 'Memory Match', color: '#8b5cf6' },
              { id: 'rps', icon: '✂️', name: 'Rock Paper Scissors', color: '#ec4899' },
            ].map(g => (
              <div
                key={g.id}
                className="card"
                onClick={() => navigate(`/play/single/${g.id}`)}
                style={{
                  padding: '14px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderTop: `3px solid ${g.color}`,
                  background: 'rgba(255,255,255,0.03)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{g.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{g.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Play vs AI →</div>
              </div>
            ))}
          </div>
        </section>

        {currentPlayer && (
          <section style={{ maxWidth: 480, margin: '2rem auto 0', animation: 'fadeIn 0.6s ease 0.2s both' }}>
            <div className="card">
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Stats</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                {[
                  { label: 'Games', value: currentPlayer.gamesPlayed, color: 'var(--text)' },
                  { label: 'Wins', value: currentPlayer.wins, color: 'var(--success)' },
                  { label: 'Losses', value: currentPlayer.losses, color: 'var(--danger)' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {currentPlayer.gamesPlayed > 0 && (
                <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Win rate: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {Math.round((currentPlayer.wins / currentPlayer.gamesPlayed) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
