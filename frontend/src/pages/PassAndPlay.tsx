import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GAME_LIST } from '../games/engine/GameRegistry';
import { CATEGORIES, GameCategory } from '../games/engine/GameDefinition';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { v4 as uuidv4 } from 'uuid';

const AVATARS = ['🎮', '🤖', '🦊', '🐉', '🎯', '🏆', '👾', '🦁', '🐺', '🦅', '⚡', '🔥'];

interface PAPPlayer {
  id: string;
  name: string;
  avatar: string;
}

export const PassAndPlay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startGame } = useGameStore();

  const queryParams = new URLSearchParams(location.search);
  const initialGameId = queryParams.get('game') || '';

  const [selectedGame, setSelectedGame] = useState(initialGameId);
  const [activeCategory, setActiveCategory] = useState<'all' | GameCategory>('all');
  const [players, setPlayers] = useState<PAPPlayer[]>([
    { id: uuidv4(), name: 'Player 1', avatar: '🎮' },
    { id: uuidv4(), name: 'Player 2', avatar: '🤖' },
  ]);
  const [error, setError] = useState('');

  const mpGames = GAME_LIST.filter(g => g.supportsMultiplayer);
  const game = mpGames.find(g => g.id === selectedGame);

  useEffect(() => {
    if (initialGameId && mpGames.some(g => g.id === initialGameId)) {
      setSelectedGame(initialGameId);
    }
  }, [initialGameId, mpGames]);

  function addPlayer() {
    const maxAllowed = game ? Math.min(6, game.maxPlayers) : 6;
    if (players.length >= maxAllowed) return;
    setPlayers(prev => [
      ...prev,
      {
        id: uuidv4(),
        name: `Player ${prev.length + 1}`,
        avatar: AVATARS[prev.length % AVATARS.length],
      },
    ]);
  }

  function removePlayer(id: string) {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter(p => p.id !== id));
  }

  function updatePlayer(id: string, field: 'name' | 'avatar', value: string) {
    setPlayers(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function handleStart() {
    if (!selectedGame) {
      setError('Please select a game.');
      return;
    }
    if (players.some(p => !p.name.trim())) {
      setError('All players must have a name.');
      return;
    }
    if (game && players.length < game.minPlayers) {
      setError(`This game requires at least ${game.minPlayers} players.`);
      return;
    }
    if (game && players.length > game.maxPlayers) {
      setError(`This game supports at most ${game.maxPlayers} players.`);
      return;
    }
    setError('');
    startGame(selectedGame, false);
    navigate(`/play/single/${selectedGame}`, { state: { players, mode: 'passplay' } });
  }

  const filteredGames = mpGames.filter(
    g => activeCategory === 'all' || g.category === activeCategory
  );

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ maxWidth: 640, flex: 1, paddingTop: '1.5rem', paddingBottom: '2.5rem' }}>
        <div style={{ marginBottom: '1.5rem', animation: 'slideDown 0.3s ease' }}>
          <h2 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📱</span> Same Device (Pass & Play)
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Pass and play with friends on a single screen — no Wi-Fi or internet needed.
          </p>
        </div>

        {/* Game selection */}
        <div className="card" style={{ marginBottom: '1.25rem', animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0 }}>1. Choose Game</h4>
            {game && (
              <span className="badge badge-info">
                {game.minPlayers}-{game.maxPlayers} Players
              </span>
            )}
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: activeCategory === 'all' ? '#6366f1' : 'rgba(255,255,255,0.06)',
                color: activeCategory === 'all' ? '#fff' : '#94a3b8',
              }}
            >
              All
            </button>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key as GameCategory)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: activeCategory === key ? `${cat.color}40` : 'rgba(255,255,255,0.06)',
                  color: activeCategory === key ? '#fff' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Grid of games */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.6rem',
              maxHeight: '280px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {filteredGames.map(g => {
              const isSelected = selectedGame === g.id;
              const cat = CATEGORIES[g.category];
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGame(g.id)}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? '2px solid #6366f1' : '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '0.65rem',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '1.6rem' }}>{g.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {g.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: cat?.color || 'var(--text-muted)' }}>
                      {g.minPlayers}-{g.maxPlayers}P • {cat?.name.split(' ')[0]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Player setup */}
        <div className="card" style={{ marginBottom: '1.25rem', animation: 'slideUp 0.4s ease 0.1s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0 }}>2. Players ({players.length})</h4>
            {players.length < (game ? Math.min(6, game.maxPlayers) : 6) && (
              <button className="btn btn-ghost btn-sm" onClick={addPlayer}>
                + Add Player
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {players.map((p, idx) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={p.avatar}
                    onChange={e => updatePlayer(p.id, 'avatar', e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text)',
                      fontSize: '1.5rem',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      width: 52,
                      height: 52,
                      textAlign: 'center',
                    }}
                  >
                    {AVATARS.map(a => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="input"
                  value={p.name}
                  onChange={e => updatePlayer(p.id, 'name', e.target.value)}
                  placeholder={`Player ${idx + 1}`}
                  maxLength={20}
                  style={{ flex: 1 }}
                />
                {players.length > (game ? game.minPlayers : 2) && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removePlayer(p.id)}
                    style={{ flexShrink: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

        <Button
          variant="primary"
          size="lg"
          onClick={handleStart}
          disabled={!selectedGame}
          style={{ width: '100%' }}
        >
          Start Game →
        </Button>
      </div>
    </div>
  );
};
