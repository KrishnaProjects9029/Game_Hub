import React, { useRef } from 'react';
import { GameDefinition } from '../../games/engine/GameDefinition';
import { ConsoleGameCard } from '../game/ConsoleGameCard';

interface GameShelfProps {
  title: string;
  icon: string;
  games: GameDefinition[];
  onOpenDetails: (game: GameDefinition) => void;
  onFavoriteToggle?: (gameId: string, isFav: boolean) => void;
  onViewAll?: () => void;
  emptyMessage?: string;
}

export const GameShelf: React.FC<GameShelfProps> = ({
  title,
  icon,
  games,
  onOpenDetails,
  onFavoriteToggle,
  onViewAll,
  emptyMessage,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!games || games.length === 0) {
    if (!emptyMessage) return null;
    return (
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.4rem' }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{title}</h3>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
          {emptyMessage}
        </div>
      </section>
    );
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const distance = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{title}</h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
            {games.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onViewAll && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onViewAll}
              style={{ fontSize: '0.8rem', color: '#a78bfa' }}
            >
              View All →
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => scroll('left')}
            style={{ width: '32px', height: '32px', padding: 0 }}
            aria-label="Scroll left"
          >
            ◀
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => scroll('right')}
            style={{ width: '32px', height: '32px', padding: 0 }}
            aria-label="Scroll right"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Horizontal Shelving Track */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(220px, 260px)',
          gap: '16px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: '8px',
          scrollbarWidth: 'thin',
        }}
      >
        {games.map((game) => (
          <div key={game.id} style={{ scrollSnapAlign: 'start' }}>
            <ConsoleGameCard
              game={game}
              onOpenDetails={onOpenDetails}
              onFavoriteToggle={onFavoriteToggle}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
