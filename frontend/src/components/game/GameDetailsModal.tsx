import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameDefinition, CATEGORIES } from '../../games/engine/GameDefinition';
import { GAME_LIST } from '../../games/engine/GameRegistry';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useGameStore } from '../../store/gameStore';
import { storage } from '../../db/storage';

interface GameDetailsModalProps {
  game: GameDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectGame?: (game: GameDefinition) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isOpen,
  onClose,
  onSelectGame,
}) => {
  const navigate = useNavigate();
  const { setDifficulty, setActiveGame } = useGameStore();
  const [selectedDifficulty, setSelectedDiff] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isFav, setIsFav] = useState(false);

  React.useEffect(() => {
    if (game) {
      setIsFav(storage.isFavorite(game.id));
    }
  }, [game]);

  if (!game) return null;

  const categoryInfo = CATEGORIES[game.category] || {
    name: 'Games',
    icon: '🎮',
    color: '#7c3aed',
    description: '',
  };

  const highScore = storage.getHighScore(game.id);

  const toggleFavorite = () => {
    const next = storage.toggleFavorite(game.id);
    setIsFav(next);
  };

  const handleStartSolo = () => {
    setDifficulty(selectedDifficulty);
    setActiveGame(game.id);
    onClose();
    if (game.integrationType === 'html5_hosted' || game.integrationType === 'authorized_embed') {
      navigate(`/play/${game.id}`);
    } else {
      navigate(`/play/single/${game.id}`);
    }
  };

  const handleStartPassAndPlay = () => {
    setActiveGame(game.id);
    onClose();
    navigate(`/play/local?game=${game.id}`);
  };

  const handleHostOnline = () => {
    setActiveGame(game.id);
    onClose();
    navigate(`/multiplayer/create?game=${game.id}`);
  };

  // Related games from same category
  const relatedGames = GAME_LIST.filter(
    (g) => g.id !== game.id && g.category === game.category
  ).slice(0, 3);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '80vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            padding: '1.75rem 1.5rem',
            background: `linear-gradient(135deg, ${categoryInfo.color}35 0%, rgba(15, 17, 26, 0.98) 100%)`,
            border: `1.5px solid ${categoryInfo.color}50`,
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: `0 12px 32px ${categoryInfo.color}25`,
          }}
        >
          <div
            style={{
              fontSize: '3.5rem',
              width: '80px',
              height: '80px',
              borderRadius: '18px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: `2px solid ${categoryInfo.color}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {game.icon}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge label={categoryInfo.name} variant="info" />
              <span className="badge badge-success">Playable</span>
              {game.supportsMultiplayer && <span className="badge badge-secondary">👥 2-Player</span>}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>{game.name}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Duration: {game.estimatedDuration} • 100% Offline Single Player
            </div>
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={toggleFavorite}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              fontSize: '1.3rem',
              color: isFav ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s ease',
            }}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
          >
            {isFav ? '★' : '☆'}
          </button>
        </div>

        {/* High Score / Best Stats */}
        {highScore > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>🏆 Your Personal Best</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b' }}>{highScore} pts</span>
          </div>
        )}

        {/* Description & Rules */}
        <div>
          <h4 style={{ fontSize: '0.9rem', color: '#f1f5f9', marginBottom: '0.35rem', fontWeight: 700 }}>Overview & Rules</h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {game.description}
          </p>
        </div>

        {/* Controls Breakdown */}
        {game.controls && (
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#f1f5f9', marginBottom: '0.5rem', fontWeight: 700 }}>🎮 Controls</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
              <div>
                <strong style={{ color: '#a78bfa' }}>Desktop:</strong> {game.controls.desktop}
              </div>
              <div>
                <strong style={{ color: '#38bdf8' }}>Touch & Mobile:</strong> {game.controls.touch}
              </div>
            </div>
          </div>
        )}

        {/* Game Mode Launch Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          {/* Solo Action */}
          {game.supportsSinglePlayer && (
            <div style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem' }}>Play Solo (vs AI)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Difficulty level:</div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDiff(d)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: selectedDifficulty === d ? '#7c3aed' : 'rgba(255, 255, 255, 0.05)',
                      color: selectedDifficulty === d ? '#fff' : 'var(--text-muted)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}

                <Button variant="primary" size="md" onClick={handleStartSolo}>
                  ▶ Start Solo
                </Button>
              </div>
            </div>
          )}

          {/* Pass & Play Action */}
          {game.supportsMultiplayer && (
            <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>Pass & Play (Same Device)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Take turns on this device</div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleStartPassAndPlay}>
                📱 Pass & Play
              </Button>
            </div>
          )}

          {/* Online Multiplayer Action */}
          {game.supportsMultiplayer && (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>Online Multiplayer (WebRTC)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Host a room and share code with friends</div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleHostOnline} style={{ border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}>
                🌐 Host Online
              </Button>
            </div>
          )}
        </div>

        {/* Related Games Shelf */}
        {relatedGames.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Related {categoryInfo.name} Games
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {relatedGames.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    if (onSelectGame) onSelectGame(rel);
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{rel.icon}</span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {rel.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
