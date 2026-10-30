import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameDefinition, CATEGORIES } from '../../games/engine/GameDefinition';

interface FeaturedHeroProps {
  featuredGames: GameDefinition[];
  onOpenDetails: (game: GameDefinition) => void;
}

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({ featuredGames, onOpenDetails }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fallback safely if array is empty
  const total = featuredGames?.length || 0;
  const game = total > 0 ? (featuredGames[activeIndex] || featuredGames[0]) : null;
  const categoryInfo = game ? (CATEGORIES[game.category] || { name: 'Arcade', color: '#7c3aed' }) : { name: 'Arcade', color: '#7c3aed' };

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoscroll timer: cycles every 4.5 seconds unless user hovers or focuses
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 4500);

    return () => clearInterval(timer);
  }, [total, isPaused]);

  if (!game) return null;

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
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      style={{
        position: 'relative',
        borderRadius: '24px',
        padding: '2.5rem 2.25rem',
        background: `linear-gradient(135deg, ${categoryInfo.color}30 0%, #111422 65%, #0a0b12 100%)`,
        border: `1.5px solid ${categoryInfo.color}50`,
        boxShadow: `0 16px 48px ${categoryInfo.color}20`,
        overflow: 'hidden',
        marginBottom: '2.5rem',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(15, 20, 32, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #f8fafc;
          font-size: 24px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }
        .hero-nav-arrow:hover {
          background: rgba(56, 189, 248, 0.25);
          border-color: #38bdf8;
          transform: translateY(-50%) scale(1.08);
          color: #38bdf8;
        }
        @media (max-width: 640px) {
          .hero-nav-arrow {
            display: none;
          }
        }
      `}</style>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="hero-nav-arrow"
            style={{ left: '12px' }}
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous featured game"
            title="Previous game"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-nav-arrow"
            style={{ right: '12px' }}
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next featured game"
            title="Next game"
          >
            ›
          </button>
        </>
      )}

      {/* Dynamic Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: categoryInfo.color,
          filter: 'blur(100px)',
          opacity: 0.28,
          pointerEvents: 'none',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Animated Content Wrapper */}
      <div
        key={game.id}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxWidth: '680px',
          animation: 'heroFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
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
          {game.isTwoPlayer && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(20, 184, 166, 0.25)',
                color: '#14b8a6',
                border: '1px solid rgba(20, 184, 166, 0.5)',
              }}
            >
              👥 2-Player Ready
            </span>
          )}
          {game.supportsMultiplayer && !game.isTwoPlayer && (
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
            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                fontWeight: 900,
                margin: 0,
                color: '#f8fafc',
                lineHeight: 1.1,
              }}
            >
              {game.name}
            </h1>
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'block',
                marginTop: '4px',
              }}
            >
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
            style={{
              padding: '12px 28px',
              fontSize: '1.1rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <span>▶</span> Play Now
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => onOpenDetails(game)}
            style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
          >
            View Details & Rules
          </button>
        </div>

        {/* Showcase Switcher Tabs with Animated Progress Active State */}
        {total > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem', alignItems: 'center' }}>
            {featuredGames.map((g, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    width: isActive ? '36px' : '10px',
                    height: '10px',
                    borderRadius: '5px',
                    background: isActive ? categoryInfo.color : 'rgba(255, 255, 255, 0.2)',
                    boxShadow: isActive ? `0 0 10px ${categoryInfo.color}` : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    padding: 0,
                  }}
                  aria-label={`Show ${g.name}`}
                  title={`${g.name} (${idx + 1} of ${total})`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
