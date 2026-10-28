import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameDefinition } from '../../games/engine/GameDefinition';
import { CATEGORIES } from '../../games/engine/GameDefinition';
import { storage } from '../../db/storage';

interface ConsoleGameCardProps {
  game: GameDefinition;
  onOpenDetails: (game: GameDefinition) => void;
  onFavoriteToggle?: (gameId: string, isFav: boolean) => void;
  compact?: boolean;
}

export const ConsoleGameCard: React.FC<ConsoleGameCardProps> = ({
  game,
  onOpenDetails,
  onFavoriteToggle,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(() => storage.isFavorite(game.id));
  const categoryInfo = CATEGORIES[game.category] || {
    name: 'Games',
    color: '#7c3aed',
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextFav = storage.toggleFavorite(game.id);
    setIsFav(nextFav);
    if (onFavoriteToggle) onFavoriteToggle(game.id, nextFav);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className="console-tile"
      onClick={() => onOpenDetails(game)}
      role="button"
      tabIndex={0}
      aria-label={`${game.name}, ${categoryInfo.name}. Press Enter to view details.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpenDetails(game);
      }}
      style={{
        position: 'relative',
        borderRadius: '16px',
        background: 'linear-gradient(145deg, rgba(26, 29, 45, 0.95) 0%, rgba(15, 17, 26, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: compact ? '1rem' : '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        minHeight: compact ? '160px' : '220px',
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      {/* Top Banner Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: categoryInfo.color,
          boxShadow: `0 0 10px ${categoryInfo.color}`,
        }}
      />

      {/* Header Row: Icon, Category Badge & Favorite Star */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div
          style={{
            fontSize: compact ? '2rem' : '2.5rem',
            width: compact ? '48px' : '58px',
            height: compact ? '48px' : '58px',
            borderRadius: '14px',
            background: `${categoryInfo.color}25`,
            border: `1.5px solid ${categoryInfo.color}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 16px ${categoryInfo.color}20`,
          }}
        >
          {game.icon}
        </div>

        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '4px',
            color: isFav ? '#fbbf24' : 'rgba(255, 255, 255, 0.25)',
            transition: 'transform 0.15s ease, color 0.15s ease',
          }}
          title={isFav ? 'Favorited' : 'Add to Favorites'}
        >
          {isFav ? '★' : '☆'}
        </button>
      </div>

      {/* Main Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h4 style={{ margin: 0, fontSize: compact ? '1rem' : '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>
          {game.name}
        </h4>
        <span style={{ fontSize: '0.75rem', color: categoryInfo.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {categoryInfo.name}
        </span>
        {!compact && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
            }}
          >
            {game.description}
          </p>
        )}
      </div>

      {/* Footer Tags & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            Playable
          </span>
          {game.supportsMultiplayer && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              👥 Multi
            </span>
          )}
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={handlePlayClick}
          style={{ padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}
        >
          ▶ Play
        </button>
      </div>
    </div>
  );
};
