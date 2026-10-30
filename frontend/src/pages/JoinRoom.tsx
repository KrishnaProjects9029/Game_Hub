import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useRoomStore } from '../store/roomStore';
import { webrtcManager } from '../network/webrtc';
import { gameWS } from '../network/websocket';
import { discoverRooms, DiscoveredRoom } from '../network/discovery';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';

export const JoinRoom: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams<{ roomCode: string }>();
  const { currentPlayer, loadPlayers } = usePlayerStore();
  const { setRoom, setIsHost, setWsStatus } = useRoomStore();

  const [roomCodeInput, setRoomCodeInput] = useState(urlRoomCode ?? '');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'online' | 'lan'>('online');

  // LAN state
  const defaultHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.hostname
    : 'localhost';
  const [hostIpInput, setHostIpInput] = useState(defaultHost);
  const [discovering, setDiscovering] = useState(false);
  const [rooms, setRooms] = useState<DiscoveredRoom[]>([]);
  const webrtcUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadPlayers();
    return () => {
      if (webrtcUnsubRef.current) {
        webrtcUnsubRef.current();
        webrtcUnsubRef.current = null;
      }
    };
  }, [loadPlayers]);

  const effectivePlayer = currentPlayer || {
    id: 'player_guest',
    username: 'Guest Player',
    avatar: '🤖',
  };

  // If roomCode passed in URL, auto-join online room
  useEffect(() => {
    if (urlRoomCode) {
      handleJoinOnline(urlRoomCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRoomCode]);

  async function handleJoinOnline(codeToJoin?: string) {
    const code = (codeToJoin || roomCodeInput).trim().toUpperCase();
    if (!code) {
      setError('Please enter a valid room code (e.g. GH-8K2M9P).');
      return;
    }

    setConnecting(true);
    setError('');

    if (webrtcUnsubRef.current) {
      webrtcUnsubRef.current();
      webrtcUnsubRef.current = null;
    }

    try {
      // Subscribe to WebRTC events
      const unsub = webrtcManager.subscribeStatus((st) => {
        if (st === 'connected') {
          if (webrtcUnsubRef.current) {
            webrtcUnsubRef.current();
            webrtcUnsubRef.current = null;
          }
          setRoom(code, 'webrtc', 0);
          setIsHost(false);
          navigate(`/play/multi/${code}`, {
            state: { gameId: webrtcManager.gameId, transport: 'webrtc', isHost: false },
          });
        } else if (st === 'error' || st === 'service_unavailable') {
          if (webrtcUnsubRef.current) {
            webrtcUnsubRef.current();
            webrtcUnsubRef.current = null;
          }
          setError(webrtcManager.errorMessage || 'Failed to join room. Verify the code with the host.');
          setConnecting(false);
        }
      });
      webrtcUnsubRef.current = unsub;

      await webrtcManager.joinRoom(code, {
        id: effectivePlayer.id,
        name: effectivePlayer.username,
        avatar: effectivePlayer.avatar,
      });
    } catch (err) {
      if (webrtcUnsubRef.current) {
        webrtcUnsubRef.current();
        webrtcUnsubRef.current = null;
      }
      setError(err instanceof Error ? err.message : 'Could not connect to host. Please verify the code.');
      setConnecting(false);
    }
  }

  async function handleDiscoverLan() {
    setDiscovering(true);
    setError('');
    const targetIp = hostIpInput.trim() || 'localhost';
    const found = await discoverRooms(targetIp);
    setRooms(found);
    if (found.length === 0) setError(`No active rooms found on ${targetIp}:8000.`);
    setDiscovering(false);
  }

  async function handleJoinLan(ip: string, code: string, port: number) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid room code.');
      return;
    }
    const targetIp = ip.trim() || 'localhost';
    setConnecting(true);
    setError('');
    try {
      setRoom(cleanCode, targetIp, port);
      setIsHost(false);
      setWsStatus('connecting');
      await gameWS.connect(targetIp, port, cleanCode, effectivePlayer.id);
      gameWS.send({
        type: 'join_room',
        roomCode: cleanCode,
        playerId: effectivePlayer.id,
        playerName: effectivePlayer.username,
        avatar: effectivePlayer.avatar,
      });
      setWsStatus('connected');
      navigate(`/lobby/${cleanCode}`);
    } catch {
      setError(`Could not connect to host at ${targetIp}:${port}. Make sure start-server.ps1 is running.`);
      setWsStatus('error');
    }
    setConnecting(false);
  }

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ maxWidth: 560, flex: 1, paddingTop: '1.5rem', paddingBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔍</span> Join a Room
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Connect to a friend's room instantly via room code or local network.
        </p>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            className={`btn ${activeTab === 'online' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('online')}
            style={{ flex: 1, padding: '10px' }}
          >
            🌐 Online Code (WebRTC)
          </button>
          <button
            className={`btn ${activeTab === 'lan' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('lan')}
            style={{ flex: 1, padding: '10px' }}
          >
            🏠 Local LAN Search
          </button>
        </div>

        {activeTab === 'online' ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'slideUp 0.3s ease' }}>
            <div>
              <label className="label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Enter 6-Character Room Code
              </label>
              <input
                className="input"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. GH-8K2M9P"
                style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '3px', textAlign: 'center', textTransform: 'uppercase' }}
                maxLength={10}
              />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <Button
              variant="primary"
              size="lg"
              loading={connecting}
              onClick={() => handleJoinOnline()}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {connecting ? 'Connecting to Host...' : 'Join Online Room'}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'slideUp 0.3s ease' }}>
            <div className="card">
              <h4 style={{ marginBottom: '0.75rem' }}>Scan Local Network for Host</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  value={hostIpInput}
                  onChange={(e) => setHostIpInput(e.target.value)}
                  placeholder="Host IP e.g. 192.168.1.100 or localhost"
                  style={{ flex: 1 }}
                />
                <Button variant="secondary" size="md" loading={discovering} onClick={handleDiscoverLan}>
                  Search
                </Button>
              </div>

              {rooms.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {rooms.map((r) => (
                    <div
                      key={r.roomCode}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{r.roomCode}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {r.playerCount}/{r.maxPlayers} players {r.gameId ? `• ${r.gameId}` : ''}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={connecting}
                        onClick={() => handleJoinLan(r.hostIp, r.roomCode, r.port)}
                      >
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h4 style={{ marginBottom: '0.75rem' }}>Or Enter LAN Room Code Directly</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 7X9K2P"
                  style={{ flex: 1 }}
                />
                <Button
                  variant="primary"
                  size="md"
                  loading={connecting}
                  onClick={() => handleJoinLan(hostIpInput, roomCodeInput, 8000)}
                >
                  Join LAN
                </Button>
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
