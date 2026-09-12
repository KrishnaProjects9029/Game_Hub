import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import { WinResult } from '../games/engine/GameEngine';
import { db } from '../db/database';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';

interface ResultState {
  result: WinResult | null;
  gameId: string;
  players: Array<{ id: string; name: string }>;
}

const CONFETTI_COLORS = ['#7c3aed','#06b6d4','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899'];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 3;
    const duration = 2 + Math.random() * 2;
    const size = 6 + Math.random() * 8;
    return (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          background: color,
          width: size,
          height: size,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        }}
      />
    );
  });
  return <div className="confetti-wrap">{pieces}</div>;
}

export const Results: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPlayer, updateCurrentPlayer } = usePlayerStore();
  const { activeGame, resetGame } = useGameStore();
  const statsUpdated = useRef(false);

  const state = location.state as ResultState | null;
  const result = state?.result ?? null;
  const gameId = state?.gameId ?? activeGame ?? '';
  const players = state?.players ?? [];

  const isWinner = result?.winner !== 'draw' && result?.winner === currentPlayer?.id;
  const isDraw = result?.winner === 'draw';

  useEffect(() => {
    if (statsUpdated.current || !currentPlayer || !result) return;
    statsUpdated.current = true;
    const won = result.winner === currentPlayer.id;
    updateCurrentPlayer(currentPlayer.id, won);
    if (players.length > 0 && gameId) {
      db.saveMatch({
        gameId,
        playerIds: players.map(p => p.id).filter(id => id !== '__ai__'),
        winnerId: result.winner === 'draw' ? null : result.winner,
        scores: result.scores,
      });
    }
  }, [currentPlayer, result, gameId, players, updateCurrentPlayer]);

  const xpGained = isWinner ? 50 : isDraw ? 20 : 10;
  const winnerName = result?.winner === 'draw' ? 'Draw' : players.find(p => p.id === result?.winner)?.name ?? result?.winner ?? 'Unknown';

  return (
    <div className="page">
      <Header />
      {(isWinner || isDraw) && <Confetti />}
      <div className="container" style={{ maxWidth: 520, flex: 1, paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <div className="results-winner card" style={{ textAlign: 'center', marginBottom: '1.25rem', animation: 'slideUp 0.5s ease' }}>
          <div className="results-trophy">
            {isDraw ? '🤝' : isWinner ? '🏆' : '😤'}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            {isDraw ? "It's a Draw!" : isWinner ? 'You Win!' : 'Game Over'}
          </div>
          <div className="results-name" style={{ color: isDraw ? 'var(--accent)' : isWinner ? 'var(--success)' : 'var(--text)' }}>
            {isDraw ? 'No winner this time' : `${winnerName} wins!`}
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span className="badge badge-warning">+{xpGained} XP</span>
          </div>
        </div>

        {/* Scores */}
        {result && Object.keys(result.scores).length > 0 && (
          <div className="card" style={{ marginBottom: '1.25rem', animation: 'slideUp 0.5s ease 0.1s both' }}>
            <h4 style={{ marginBottom: '1rem' }}>Score Breakdown</h4>
            <div className="results-scores">
              {Object.entries(result.scores)
                .filter(([id]) => id !== '__ai__')
                .map(([id, score]) => {
                  const playerName = players.find(p => p.id === id)?.name ?? id;
                  const isThisWinner = id === result.winner;
                  return (
                    <div key={id} className="results-score-card" style={{ borderColor: isThisWinner ? 'var(--accent)' : 'var(--border)' }}>
                      <div className="results-score-num" style={{ color: isThisWinner ? 'var(--accent)' : 'var(--text)' }}>{score}</div>
                      <div className="results-score-player">{playerName}</div>
                      {isThisWinner && <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.25rem' }}>👑 Winner</div>}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Updated stats */}
        {currentPlayer && (
          <div className="card" style={{ marginBottom: '1.25rem', animation: 'slideUp 0.5s ease 0.2s both' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Your Progress</h4>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>Lv.{currentPlayer.level}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--success)' }}>{currentPlayer.wins}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wins</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{currentPlayer.xp.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total XP</div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', animation: 'slideUp 0.5s ease 0.3s both' }}>
          <Button variant="ghost" size="md" onClick={() => { resetGame(); navigate('/'); }} style={{ flex: 1 }}>
            🏠 Home
          </Button>
          <Button variant="secondary" size="md" onClick={() => { resetGame(); navigate(-3); }} style={{ flex: 1 }}>
            ← Back to Lobby
          </Button>
          <Button variant="primary" size="md" onClick={() => { resetGame(); navigate(-2); }} style={{ flex: 1 }}>
            🔄 Rematch
          </Button>
        </div>
      </div>
    </div>
  );
};
