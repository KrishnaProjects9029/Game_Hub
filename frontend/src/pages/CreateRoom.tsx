import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { usePlayerStore } from '../store/playerStore';
import { useRoomStore } from '../store/roomStore';
import { gameWS } from '../network/websocket';
import { createRoom } from '../network/discovery';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { GAME_LIST } from '../games/engine/GameRegistry';
import { CATEGORIES } from '../games/engine/GameDefinition';

export const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialGameId = queryParams.get('game') || '';
  const { currentPlayer } = usePlayerStore();
  const { setRoom, setIsHost, setWsStatus, setPlayers, setSelectedGame, selectedGame, roomCode } = useRoomStore();

  useEffect(() => {
    if (initialGameId && GAME_LIST.some(g => g.id === initialGameId)) {
      setSelectedGame(initialGameId);
    }
  }, [initialGameId, setSelectedGame]);
  const defaultHost = (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? window.location.hostname
    : 'localhost';
  const [serverIp, setServerIp] = useState(defaultHost);
  const [port, setPort] = useState('8000');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const [localPlayers, setLocalPlayers] = useState<Array<{ id: string; name: string; avatar: string; isReady: boolean; isHost: boolean }>>([]);

  const clientPort = typeof window !== 'undefined' && window.location.port ? window.location.port : '5173';
  const joinUrl = created && roomCode ? `http://${serverIp}:${clientPort}/join/${roomCode}` : '';

  const setupWs = useCallback((code: string, ip: string, p: number, playerId: string) => {
    setWsStatus('connecting');
    gameWS.connect(ip, p, code, playerId).then(() => {
      setWsStatus('connected');
    }).catch(() => setWsStatus('error'));

    gameWS.on('room_state', (data: unknown) => {
      const d = data as { players?: Array<{ id: string; name: string; avatar: string; isReady: boolean; isHost: boolean }> };
      if (d && Array.isArray(d.players)) {
        setLocalPlayers(d.players);
        setPlayers(d.players);
      }
    });
    gameWS.on('player_joined', (data: unknown) => {
      const d = data as { players?: Array<{ id: string; name: string; avatar: string; isReady: boolean; isHost: boolean }> };
      if (d && Array.isArray(d.players)) {
        setLocalPlayers(d.players);
        setPlayers(d.players);
      }
    });
    gameWS.on('player_left', (data: unknown) => {
      const d = data as { players?: Array<{ id: string; name: string; avatar: string; isReady: boolean; isHost: boolean }> };
      if (d && Array.isArray(d.players)) {
        setLocalPlayers(d.players);
        setPlayers(d.players);
      }
    });
    gameWS.on('game_started', (data: unknown) => {
      const d = data as { gameId?: string; game_id?: string };
      const gid = d.gameId || d.game_id || '';
      navigate(`/play/multi/${code}`, { state: { gameId: gid } });
    });
  }, [setWsStatus, setPlayers, navigate]);


  async function handleCreate() {
    if (!currentPlayer) { setError('No player profile. Please create one first.'); return; }
    setCreating(true);
    setError('');
    try {
      const result = await createRoom(serverIp, parseInt(port), currentPlayer.id, currentPlayer.username, currentPlayer.avatar);
      if (!result) {
        setError(`Could not connect to server at ${serverIp}:${port}. Make sure the backend is running.`);
        setCreating(false);
        return;
      }
      setRoom(result.roomCode, serverIp, parseInt(port));
      setIsHost(true);
      setCreated(true);
      const initPlayer = { id: currentPlayer.id, name: currentPlayer.username, avatar: currentPlayer.avatar, isReady: true, isHost: true };
      setLocalPlayers([initPlayer]);
      setPlayers([initPlayer]);
      setupWs(result.roomCode, serverIp, parseInt(port), currentPlayer.id);
    } catch {
      setError('Failed to create room.');
    }
    setCreating(false);
  }

  function handleStart() {
    if (!selectedGame) { setError('Please select a game.'); return; }
    gameWS.send({ type: 'start_game', gameId: selectedGame });
  }

  useEffect(() => () => { if (!created) gameWS.disconnect(); }, [created]);

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ maxWidth: 600, flex: 1, paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>📡 Host a Room</h2>
        <p style={{ marginBottom: '1.5rem' }}>Create a game room for others to join on your local network.</p>

        {!created ? (
          <div className="card" style={{ animation: 'slideUp 0.4s ease' }}>
            <div className="form-group">
              <label className="label">Server IP</label>
              <input className="input" value={serverIp} onChange={e => setServerIp(e.target.value)} placeholder="e.g. 192.168.1.100 or localhost" />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>Enter your machine's LAN IP address. Use 'localhost' for local testing.</div>
            </div>
            <div className="form-group">
              <label className="label">Port</label>
              <input className="input" value={port} onChange={e => setPort(e.target.value)} placeholder="8000" type="number" />
            </div>
            {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
            <Button variant="primary" size="lg" loading={creating} onClick={handleCreate} style={{ width: '100%' }}>
              Create Room
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'slideUp 0.4s ease' }}>
            {/* Room code */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room Code</div>
              <div className="room-code-display">{roomCode}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Share this code with players on your network</div>
            </div>

            {/* QR Code */}
            {joinUrl && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scan to Join</div>
                <div style={{ display: 'inline-block', background: 'white', padding: '1rem', borderRadius: 12 }}>
                  <QRCodeSVG value={joinUrl} size={160} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem', wordBreak: 'break-all' }}>{joinUrl}</div>
              </div>
            )}

            {/* Game selector */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 600 }}>Select Game</div>
                {selectedGame && (
                  <span className="badge badge-info">
                    {GAME_LIST.find(g => g.id === selectedGame)?.name}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {GAME_LIST.filter(g => g.supportsMultiplayer).map(game => {
                  const cat = CATEGORIES[game.category];
                  const isSelected = selectedGame === game.id;
                  return (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGame(game.id)}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 8,
                        padding: '0.6rem',
                        cursor: 'pointer',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{game.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {game.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: cat?.color || 'var(--text-muted)' }}>
                          {game.minPlayers}-{game.maxPlayers}P
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player list */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Players ({localPlayers.length})</div>
              <div className="player-list">
                {localPlayers.map(p => (
                  <div key={p.id} className="lobby-player">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{p.avatar}</span>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      {p.isHost && <span className="badge badge-primary">HOST</span>}
                    </div>
                    <span className="badge badge-success">✓ Ready</span>
                  </div>
                ))}
                {localPlayers.length < 2 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '0.75rem', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    Waiting for players...
                  </div>
                )}
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="danger" size="md" onClick={() => { gameWS.disconnect(); setCreated(false); }}>
                Cancel
              </Button>
              <Button
                variant="primary" size="lg"
                disabled={localPlayers.length < 2 || !selectedGame}
                onClick={handleStart}
                style={{ flex: 1 }}
              >
                Start Game →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
