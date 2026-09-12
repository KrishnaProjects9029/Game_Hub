import React from 'react';
import { Player } from '../../db/database';
import { XPBar } from './XPBar';

interface PlayerCardProps {
  player: Player;
  showXP?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, showXP = true, size = 'md' }) => {
  const avatarClass = size === 'lg' ? 'player-avatar player-avatar-lg' : 'player-avatar';
  return (
    <div className="player-card">
      <div className="player-avatar-wrap">
        <div className={avatarClass}>{player.avatar}</div>
        <div className="player-level-badge">L{player.level}</div>
      </div>
      <div className="player-info">
        <div className="player-name">{player.username}</div>
        <div className="player-stats">
          <span>🎮 {player.gamesPlayed} games</span>
          <span className="stat-win">✓ {player.wins}W</span>
          <span className="stat-loss">✗ {player.losses}L</span>
        </div>
        {showXP && <div style={{ marginTop: '0.4rem' }}><XPBar player={player} /></div>}
      </div>
    </div>
  );
};
