import React from 'react';
import { Player, XP_THRESHOLDS } from '../../db/database';

interface XPBarProps {
  player: Player;
}

export const XPBar: React.FC<XPBarProps> = ({ player }) => {
  const currentLevelXP = XP_THRESHOLDS[Math.min(player.level - 1, XP_THRESHOLDS.length - 1)];
  const nextLevelXP = XP_THRESHOLDS[Math.min(player.level, XP_THRESHOLDS.length - 1)];
  const progress = nextLevelXP === currentLevelXP
    ? 100
    : Math.min(100, ((player.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);

  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="xp-bar-labels">
        <span>{player.xp.toLocaleString()} XP</span>
        <span>Level {player.level}</span>
        {player.level < 50 && <span>{nextLevelXP.toLocaleString()} XP</span>}
      </div>
    </div>
  );
};
