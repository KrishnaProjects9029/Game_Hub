import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameConfig } from '../../games/engine/GameEngine';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CATEGORIES } from '../../games/engine/GameDefinition';
import { useGameStore } from '../../store/gameStore';
import { localDB } from '../../db/database';

interface GameDetailsModalProps {
  game: GameConfig | null;
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'single' | 'multi' | 'all';
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isOpen,
  onClose,
  defaultMode = 'all',
}) => {
  const navigate = useNavigate();
  const { setDifficulty, setActiveGame } = useGameStore();
  const [selectedDifficulty, setSelectedDiff] = useState<'easy' | 'medium' | 'hard'>('medium');

  if (!game) return null;

  const categoryInfo = CATEGORIES[game.category] || {
    name: 'Games',
    icon: '🎮',
    color: '#6366f1',
    description: '',
  };

  const isPlayable = game.status === 'playable' || !game.status;
  const highScore = localDB.getHighScore(game.id);

  const handleStartSolo = () => {
    setDifficulty(selectedDifficulty);
    setActiveGame(game.id);
    onClose();
    navigate(`/play/single/${game.id}`);
  };

  const handleStartPassAndPlay = () => {
    setActiveGame(game.id);
    onClose();
    navigate(`/play/local?game=${game.id}`);
  };

  const handleHostLAN = () => {
    setActiveGame(game.id);
    onClose();
    navigate(`/multiplayer/create?game=${game.id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Large Game Artwork Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            background: `linear-gradient(135deg, ${categoryInfo.color}35 0%, rgba(15, 15, 26, 0.95) 100%)`,
            border: `1.5px solid ${categoryInfo.color}50`,
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            overflow: 'hidden',
            boxShadow: `0 12px 32px ${categoryInfo.color}25`,
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              width: '90px',
              height: '90px',
              borderRadius: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              border: `2px solid ${categoryInfo.color}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
            }}
          >
            {game.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <Badge label={categoryInfo.name} variant="info" />
              {isPlayable ? (
                <span className="badge badge-success">✅ Playable Now</span>
              ) : (
                <span className="badge badge-warning">Roadmap Phase {game.phase}</span>
              )}
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0 0 6px 0', color: '#f8fafc' }}>
              {game.name}
            </h2>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#94a3b8', flexWrap: 'wrap' }}>
              <span>⏱️ {game.estimatedDuration}</span>
              <span>•</span>
              <span>👥 {game.minPlayers}-{game.maxPlayers} Players</span>
              <span>•</span>
              <span>📶 100% Offline</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            color: '#cbd5e1',
          }}
        >
          {game.description}
        </div>

        {/* Stats & High Score */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Local High Score
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', marginTop: '2px' }}>
              {highScore > 0 ? `${highScore} pts` : 'No games yet'}
            </div>
          </div>
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Supported Modes
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
              {game.supportsSinglePlayer && '👤 Solo'} {game.supportsSinglePlayer && game.supportsMultiplayer && ' • '} {game.supportsMultiplayer && '👥 Multiplayer'}
            </div>
          </div>
        </div>

        {/* Controls Guide */}
        {game.controls && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🎮 Controls Guide
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
              <div><strong>⌨️ Desktop:</strong> {game.controls.desktop}</div>
              <div><strong>📱 Touch:</strong> {game.controls.touch}</div>
            </div>
          </div>
        )}

        {/* Play Options or Roadmap Banner */}
        {isPlayable ? (
          <>
            {/* Solo Mode Section */}
            {game.supportsSinglePlayer && defaultMode !== 'multi' && (
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                    👤 Single Player (vs AI)
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDiff(d)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor:
                            selectedDifficulty === d ? '#6366f1' : 'rgba(255,255,255,0.08)',
                          color: selectedDifficulty === d ? '#ffffff' : '#94a3b8',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <Button variant="primary" size="md" onClick={handleStartSolo}>
                  ▶ Play Solo ({selectedDifficulty.toUpperCase()})
                </Button>
              </div>
            )}

            {/* Multiplayer Options */}
            {game.supportsMultiplayer && defaultMode !== 'single' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  👥 Local Multiplayer Options
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleStartPassAndPlay}
                    style={{ flex: 1 }}
                  >
                    📱 Pass & Play
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleHostLAN}
                    style={{ flex: 1, backgroundColor: '#0ea5e9' }}
                  >
                    📡 Host LAN Room
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🚀</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', marginBottom: '4px' }}>
              Scheduled for Roadmap Phase {game.phase}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
              This game is currently queued in our structured multi-phase development plan. Check back as new phases roll out!
            </p>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ← Back to Library
          </Button>
        </div>
      </div>
    </Modal>
  );
};
