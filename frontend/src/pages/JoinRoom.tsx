import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useRoomStore } from '../store/roomStore';
import { gameWS } from '../network/websocket';
import { discoverRooms, DiscoveredRoom } from '../network/discovery';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';

export const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams<{ roomCode: string }>();
  const { currentPlayer, loadPlayers } = usePlayerStore();
  const { setRoom, setIsHost, setWsStatus } = useRoomStore();
  const defaultHost = (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? window.location.hostname
    : '192.168.1.';
  const [hostIpInput, setHostIpInput] = useState(defaultHost);
  const [roomCodeInput, setRoomCodeInput] = useState(urlRoomCode ?? '');
  const [discovering, setDiscovering] = useState(false);
  const [rooms, setRooms] = useState<DiscoveredRoom[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  async function handleDiscover() {
    setDiscovering(true);
    setError('');
    const targetIp = hostIpInput.trim() || 'localhost';
    const found = await discoverRooms(targetIp);
    setRooms(found);
    if (found.length === 0) setError(`No rooms found on ${targetIp}. Make sure the host is running.`);
    setDiscovering(false);
  }

  async function handleJoin(ip: string, code: string, port: number) {
    if (!currentPlayer) { setError('Create a profile first.'); return; }
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) { setError('Please enter a valid room code.'); return; }
    const targetIp = ip.trim() || 'localhost';
    setConnecting(true);
    setError('');
    try {
      setRoom(cleanCode, targetIp, port);
      setIsHost(false);
      setWsStatus('connecting');
      await gameWS.connect(targetIp, port, cleanCode, currentPlayer.id);
      gameWS.send({
        type: 'join_room',
        roomCode: cleanCode,
        playerId: currentPlayer.id,
        playerName: currentPlayer.username,
        avatar: currentPlayer.avatar,
      });
      setWsStatus('connected');
      navigate(`/lobby/${cleanCode}`);
    } catch {
      setError(`Could not connect to host at ${targetIp}:${port}. Make sure you are on the same network.`);
      setWsStatus('error');
    }
    setConnecting(false);
  }


  return (
    <div className="page">
      <Header />
      <div className="container" style={{ maxWidth: 560, flex: 1, paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>🔍 Join a Room</h2>
        <p style={{ marginBottom: '1.5rem' }}>Find or enter a room to join.</p>

        {/* Discover */}
        <div className="card" style={{ marginBottom: '1.25rem', animation: 'slideUp 0.3s ease' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Discover Rooms</h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input"
              value={hostIpInput}
              onChange={e => setHostIpInput(e.target.value)}
              placeholder="Host IP e.g. 192.168.1.100"
              style={{ flex: 1 }}
            />
            <Button variant="secondary" size="md" loading={discovering} onClick={handleDiscover}>
              Search
            </Button>
          </div>

          {rooms.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rooms.map(r => (
                <div key={r.roomCode} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.roomCode}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.playerCount}/{r.maxPlayers} players {r.gameId ? `• ${r.gameId}` : ''}</div>
                  </div>
                  <Button variant="primary" size="sm" loading={connecting} onClick={() => handleJoin(r.hostIp, r.roomCode, r.port)}>
                    Join
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual join */}
        <div className="card" style={{ animation: 'slideUp 0.4s ease 0.1s both' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Enter Room Code Manually</h4>
          <div className="form-group">
            <label className="label">Host IP</label>
            <input className="input" value={hostIpInput} onChange={e => setHostIpInput(e.target.value)} placeholder="192.168.1.100" />
          </div>
          <div className="form-group">
            <label className="label">Room Code</label>
            <input
              className="input"
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. ABCD"
              maxLength={6}
              style={{ letterSpacing: '0.15em', fontFamily: 'monospace', fontSize: '1.25rem' }}
            />
          </div>
          {error && <div className="error-msg" style={{ marginBottom: '0.75rem' }}>{error}</div>}
          <Button
            variant="primary" size="lg"
            loading={connecting}
            disabled={!roomCodeInput || !hostIpInput}
            onClick={() => handleJoin(hostIpInput, roomCodeInput, 8000)}
            style={{ width: '100%' }}
          >
            Join Room →
          </Button>
        </div>
      </div>
    </div>
  );
};
