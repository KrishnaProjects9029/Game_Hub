import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';

export const Multiplayer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ background: '#0a0b12', minHeight: '100vh', color: '#f1f5f9' }}>
      <Header />
      <div className="container" style={{ flex: 1, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ marginBottom: '2.5rem', animation: 'slideDown 0.3s ease' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>👥</span> Multiplayer Arena
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Duel friends in real-time. Choose online room codes, local same-screen pass & play, or offline LAN.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* 1. Host Game (WebRTC & LAN) */}
          <div
            className="console-tile"
            onClick={() => navigate('/multiplayer/create')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate('/multiplayer/create');
            }}
            style={{
              padding: '1.75rem',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.2) 0%, rgba(18, 20, 32, 0.95) 100%)',
              border: '1.5px solid rgba(124, 58, 237, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ fontSize: '3rem', width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(124, 58, 237, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📡
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.3rem', fontWeight: 800 }}>Host Room</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Create an online or LAN room. Get an instant 6-character room code and QR link for friends to join.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="badge badge-primary">🌐 WebRTC Online</span>
              <span className="badge badge-success">QR Code</span>
            </div>
          </div>

          {/* 2. Join Game */}
          <div
            className="console-tile"
            onClick={() => navigate('/multiplayer/join')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate('/multiplayer/join');
            }}
            style={{
              padding: '1.75rem',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, rgba(6, 182, 212, 0.2) 0%, rgba(18, 20, 32, 0.95) 100%)',
              border: '1.5px solid rgba(6, 182, 212, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ fontSize: '3rem', width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🔍
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.3rem', fontWeight: 800 }}>Join Room</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Enter a room code or scan a host's QR code to connect and start playing immediately.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="badge badge-secondary">Join Code</span>
              <span className="badge badge-info">Zero Install</span>
            </div>
          </div>

          {/* 3. Pass & Play (Same Device) */}
          <div
            className="console-tile"
            onClick={() => navigate('/play/local')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate('/play/local');
            }}
            style={{
              padding: '1.75rem',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.2) 0%, rgba(18, 20, 32, 0.95) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ fontSize: '3rem', width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📱
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.3rem', fontWeight: 800 }}>Same Device</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Pass and play on a single screen. Take turns passing the device between players without any internet.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="badge badge-success">100% Offline</span>
              <span className="badge badge-warning">2-4 Players</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
