import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';

const AVATARS = ['🎮','🤖','🦊','🐉','🎯','🏆','👾','🦁','🐺','🦅','⚡','🔥','🌟','💎','🎲'];

export const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { createPlayer } = usePlayerStore();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🎮');
  const [error, setError] = useState('');

  function handleCreate() {
    const trimmed = username.trim();
    if (trimmed.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (trimmed.length > 20) { setError('Username must be at most 20 characters.'); return; }
    setError('');
    createPlayer(trimmed, avatar);
    navigate('/');
  }

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ maxWidth: 480, flex: 1, paddingTop: '2rem', paddingBottom: '2rem', animation: 'slideUp 0.4s ease' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✨</div>
            <h2>Create Your Profile</h2>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Set up your player identity to track stats</p>
          </div>

          {/* Avatar preview */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
              background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))',
              border: '3px solid var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', animation: 'cellPop 0.3s ease',
            }}>
              {avatar}
            </div>
          </div>

          {/* Avatar selection */}
          <div className="form-group">
            <label className="label">Choose Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map(a => (
                <button
                  key={a}
                  className={`avatar-btn ${avatar === a ? 'selected' : ''}`}
                  onClick={() => setAvatar(a)}
                  aria-label={`Avatar ${a}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Username input */}
          <div className="form-group">
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              className={`input ${error ? 'input-error' : ''}`}
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter your name..."
              maxLength={20}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              autoFocus
            />
            {error && <div className="error-msg">{error}</div>}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              {username.length}/20 characters
            </div>
          </div>

          <Button variant="primary" size="lg" onClick={handleCreate} style={{ width: '100%' }}>
            Create Profile →
          </Button>
        </div>
      </div>
    </div>
  );
};
