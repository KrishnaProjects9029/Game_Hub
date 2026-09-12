import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';

export const Multiplayer: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="page">
      <Header />
      <div className="container" style={{ flex: 1, paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <div style={{ marginBottom: '2rem', animation: 'slideDown 0.3s ease' }}>
          <h2 style={{ marginBottom: '0.25rem' }}>👥 Multiplayer</h2>
          <p>Play with friends — choose your mode below.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', animation: 'slideUp 0.4s ease' }}>
          <div className="game-card" onClick={() => navigate('/play/local')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') navigate('/play/local'); }}>
            <div className="game-card-icon">📱</div>
            <div className="game-card-name">Same Device</div>
            <div className="game-card-desc">Pass and play on a single screen. Take turns passing the device to each player.</div>
            <div className="game-card-meta">
              <span className="badge badge-success">2-4 Players</span>
              <span className="badge badge-info">No Network</span>
            </div>
          </div>
          <div className="game-card" onClick={() => navigate('/multiplayer/create')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') navigate('/multiplayer/create'); }}>
            <div className="game-card-icon">📡</div>
            <div className="game-card-name">Host Game</div>
            <div className="game-card-desc">Create a room and invite others on your local network. Share the QR code or room code.</div>
            <div className="game-card-meta">
              <span className="badge badge-primary">Host</span>
              <span className="badge badge-warning">LAN Required</span>
            </div>
          </div>
          <div className="game-card" onClick={() => navigate('/multiplayer/join')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') navigate('/multiplayer/join'); }}>
            <div className="game-card-icon">🔍</div>
            <div className="game-card-name">Join Game</div>
            <div className="game-card-desc">Find and join an existing room on your local network. Scan a QR code or enter the room code.</div>
            <div className="game-card-meta">
              <span className="badge badge-secondary">Join</span>
              <span className="badge badge-warning">LAN Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
