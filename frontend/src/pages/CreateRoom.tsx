import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { usePlayerStore } from '../store/playerStore';
import { useRoomStore } from '../store/roomStore';
import { gameWS } from '../network/websocket';
import { createRoom as createLanRoom } from '../network/discovery';
import { webrtcManager, WebRTCStatus } from '../network/webrtc';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { GAME_LIST } from '../games/engine/GameRegistry';
import { CATEGORIES } from '../games/engine/GameDefinition';

export const CreateRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialGameId = queryParams.get('game') || 'tictactoe';

  const { currentPlayer, loadPlayers } = usePlayerStore();
  const { setRoom, setIsHost, setWsStatus, setPlayers, setSelectedGame, selectedGame } = useRoomStore();

  const [mode, setMode] = useState<'webrtc' | 'lan'>('webrtc');
  const [chosenGameId, setChosenGameId] = useState(initialGameId);
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [webrtcStatus, setWebrtcStatus] = useState<WebRTCStatus>('idle');

  // LAN Mode settings
  const defaultHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.hostname
    : 'localhost';
  const [serverIp, setServerIp] = useState(defaultHost);
  const [port, setPort] = useState('8000');
  const [localPlayers, setLocalPlayers] = useState<Array<{ id: string; name: string; avatar: string; isReady: boolean; isHost: boolean }>>([]);

  useEffect(() => {
    loadPlayers();
    setSelectedGame(chosenGameId);
  }, [chosenGameId, loadPlayers, setSelectedGame]);

  // Subscribe to WebRTC events
  useEffect(() => {
    if (mode !== 'webrtc') return;

    const unsubStatus = webrtcManager.subscribeStatus((st) => {
      setWebrtcStatus(st);
      if (st === 'connected') {
        // Player joined! Navigate directly to game play
        navigate(`/play/multi/${webrtcManager.roomCode}`, {
          state: { gameId: webrtcManager.gameId, transport: 'webrtc', isHost: true },
        });
      }
    });

    const unsubPlayers = webrtcManager.subscribePlayers((plist) => {
      setLocalPlayers(plist);
    });

    return () => {
      unsubStatus();
      unsubPlayers();
    };
  }, [mode, navigate]);

  const effectivePlayer = currentPlayer || {
    id: 'player_host',
    username: 'Host Player',
    avatar: '🎮',
  };

  const getJoinUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = `${window.location.origin}${window.location.pathname}#/join/${createdRoomCode}`;
    return base;
  };

  // Create Online WebRTC Room
  const handleCreateWebRTC = async () => {
    setCreating(true);
    setError('');
    try {
      const code = await webrtcManager.createRoom(chosenGameId, {
        id: effectivePlayer.id,
        name: effectivePlayer.username,
        avatar: effectivePlayer.avatar,
      });
      setCreatedRoomCode(code);
      setRoom(code, 'webrtc', 0);
      setIsHost(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize WebRTC room.');
    } finally {
      setCreating(false);
    }
  };

  // Create LAN Room
  const handleCreateLAN = async () => {
    setCreating(true);
    setError('');
    try {
      const result = await createLanRoom(
        serverIp,
        parseInt(port, 10),
        effectivePlayer.id,
        effectivePlayer.username,
        effectivePlayer.avatar
      );
      if (!result) {
        setError(`Could not connect to server at ${serverIp}:${port}. Make sure start-server.ps1 is running.`);
        setCreating(false);
        return;
      }
      setCreatedRoomCode(result.roomCode);
      setRoom(result.roomCode, serverIp, parseInt(port, 10));
      setIsHost(true);

      const initPlayer = {
        id: effectivePlayer.id,
        name: effectivePlayer.username,
        avatar: effectivePlayer.avatar,
        isReady: true,
        isHost: true,
      };
      setLocalPlayers([initPlayer]);
      setPlayers([initPlayer]);

      // Connect WebSocket
      setWsStatus('connecting');
      gameWS.connect(serverIp, parseInt(port, 10), result.roomCode, effectivePlayer.id).then(() => {
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
      gameWS.on('game_started', (data: unknown) => {
        const d = data as { gameId?: string };
        const gid = d.gameId || chosenGameId;
        navigate(`/play/multi/${result.roomCode}`, { state: { gameId: gid, transport: 'ws' } });
      });
    } catch {
      setError('Failed to create LAN room.');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = () => {
    if (!createdRoomCode) return;
    navigator.clipboard.writeText(createdRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    const url = getJoinUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartLanGame = () => {
    gameWS.send({ type: 'start_game', gameId: chosenGameId });
  };

  const playableGames = GAME_LIST.filter((g) => g.supportsMultiplayer);

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ maxWidth: 640, flex: 1, paddingTop: '1.5rem', paddingBottom: '3rem' }}>
        <h2 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📡</span> Host a Room
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Host a multiplayer duel online with friends or over your local network.
        </p>

        {/* Mode Selector */}
        {!createdRoomCode && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            <button
              className={`btn ${mode === 'webrtc' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMode('webrtc')}
              style={{ flex: 1, padding: '12px' }}
            >
              🌐 Online Room (WebRTC)
            </button>
            <button
              className={`btn ${mode === 'lan' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMode('lan')}
              style={{ flex: 1, padding: '12px' }}
            >
              🏠 Local LAN Server
            </button>
          </div>
        )}

        {!createdRoomCode ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Game Selector */}
            <div>
              <label className="label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Select Game to Host
              </label>
              <select
                className="input"
                value={chosenGameId}
                onChange={(e) => setChosenGameId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)' }}
              >
                {playableGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.icon} {g.name} ({CATEGORIES[g.category]?.name || g.category})
                  </option>
                ))}
              </select>
            </div>

            {mode === 'lan' && (
              <>
                <div className="form-group">
                  <label className="label">Server LAN IP</label>
                  <input
                    className="input"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    placeholder="e.g. 192.168.1.100 or localhost"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    IP where start-server.ps1 is running.
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Port</label>
                  <input
                    className="input"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="8000"
                    type="number"
                  />
                </div>
              </>
            )}

            {error && <div className="error-msg">{error}</div>}

            <Button
              variant="primary"
              size="lg"
              loading={creating}
              onClick={mode === 'webrtc' ? handleCreateWebRTC : handleCreateLAN}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {mode === 'webrtc' ? 'Create Online Room (WebRTC)' : 'Create LAN Room'}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
            {/* Room Code Card */}
            <div className="card" style={{ textAlign: 'center', padding: '1.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                ROOM CODE
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '4px', color: '#7c3aed', marginBottom: '0.75rem' }}>
                {createdRoomCode}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={copyCode}>
                  {copiedCode ? '✓ Copied Code!' : '📋 Copy Room Code'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={copyLink}>
                  {copiedLink ? '✓ Copied Link!' : '🔗 Copy Invite Link'}
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>
                SCAN TO JOIN FROM MOBILE
              </div>
              <div style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '12px' }}>
                <QRCodeSVG value={getJoinUrl()} size={180} level="M" />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Point any phone camera at this code to connect instantly
              </div>
            </div>

            {/* Waiting Status */}
            <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', animation: 'pulse 1.2s infinite' }}>
                ⏳ Waiting for Opponent to Connect...
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Players in room: <strong>{localPlayers.length} / 2</strong>
              </p>
              {mode === 'lan' && localPlayers.length >= 2 && (
                <Button variant="primary" size="md" onClick={handleStartLanGame} style={{ marginTop: '1rem' }}>
                  Start LAN Game
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
