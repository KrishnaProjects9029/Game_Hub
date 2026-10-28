import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameDefinition, CATEGORIES } from '../../games/engine/GameDefinition';

interface FeaturedHeroProps {
  featuredGames: GameDefinition[];
  onOpenDetails: (game: GameDefinition) => void;
}

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({ featuredGames, onOpenDetails }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!featuredGames || featuredGames.length === 0) return null;
  const game = featuredGames[activeIndex] || featuredGames[0];
  const categoryInfo = CATEGORIES[game.category] || { name: 'Arcade', color: '#7c3aed' };

  const handlePlay = () => {
    if (game.integrationType === 'html5_hosted' || game.integrationType === 'authorized_embed') {
      navigate(`/play/${game.id}`);
    } else if (game.supportsSinglePlayer) {
      navigate(`/play/single/${game.id}`);
    } else {
      navigate(`/play/local?game=${game.id}`);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        background: `linear-gradient(135deg, ${categoryInfo.color}30 0%, #111422 65%, #0a0b12 100%)`,
        border: `1.5px solid ${categoryInfo.color}50`,
        boxShadow: `0 16px 48px ${categoryInfo.color}20`,
        overflow: 'hidden',
        marginBottom: '2.5rem',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: categoryInfo.color,
          filter: 'blur(100px)',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '680px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#f59e0b',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            🔥 FEATURED SHOWCASE
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: `${categoryInfo.color}40`,
              color: '#fff',
              border: `1px solid ${categoryInfo.color}80`,
            }}
          >
            {categoryInfo.name}
          </span>
          {game.supportsMultiplayer && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.25)',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.5)',
              }}
            >
              👥 Online & Local Duel
            </span>
          )}
        </div>

        {/* Title & Icon Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              fontSize: '3.5rem',
              width: '84px',
              height: '84px',
              borderRadius: '20px',
              background: 'rgba(0, 0, 0, 0.45)',
              border: `2px solid ${categoryInfo.color}70`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6)`,
              flexShrink: 0,
            }}
          >
            {game.icon}
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, margin: 0, color: '#f8fafc', lineHeight: 1.1 }}>
              {game.name}
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Est. Duration: {game.estimatedDuration} • 100% Playable in Browser
            </span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
          {game.description}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handlePlay}
            style={{ padding: '12px 28px', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>▶</span> Play Now
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => onOpenDetails(game)}
            style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 700 }}
          >
            View Details & Rules
          </button>
        </div>

        {/* Showcase Switcher Tabs */}
        {featuredGames.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem', alignItems: 'center' }}>
            {featuredGames.map((g, idx) => (
              <button
                key={g.id}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: idx === activeIndex ? '32px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  background: idx === activeIndex ? categoryInfo.color : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
                aria-label={`Show ${g.name}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
