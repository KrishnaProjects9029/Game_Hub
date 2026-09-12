import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomStore, RoomPlayer } from '../store/roomStore';
import { usePlayerStore } from '../store/playerStore';
import { gameWS } from '../network/websocket';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { GAME_LIST } from '../games/engine/GameRegistry';

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { currentPlayer } = usePlayerStore();
  const { players, setPlayers, isHost, selectedGame, setSelectedGame, wsStatus, clearRoom } = useRoomStore();
  const [isReady, setIsReady] = useState(false);
  const [localPlayers, setLocalPlayers] = useState<RoomPlayer[]>(players);

  useEffect(() => {
    gameWS.on('room_state', (data: unknown) => {
      const d = data as { players?: RoomPlayer[]; room?: { game_id?: string; gameId?: string } };
      if (d?.players && Array.isArray(d.players)) {
        setLocalPlayers(d.players);
        setPlayers(d.players);
      }
      const gid = d?.room?.game_id || d?.room?.gameId;
      if (gid) setSelectedGame(gid);
    });
    gameWS.on('player_joined', (data: unknown) => {
      const d = data as { players?: RoomPlayer[] };
      if (d?.players && Array.isArray(d.players)) {
        setLocalPlayers(d.players);
        setPlayers(d.players);
      }
    });
    gameWS.on('player_left', (data: unknown) => {
      const d = data as { players?: RoomPlayer[] };
      if (d?.players && Array.isArray(d.players)) {
        setLocalPlayers(d.players);
        setPlayers(d.players);
      }
    });
    gameWS.on('player_ready', (data: unknown) => {
      const d = data as { players?: RoomPlayer[] };
      if (d?.players && Array.isArray(d.players)) {
        setLocalPlayers(d.players);
        setPlayers(d.players);
      }
    });
    gameWS.on('game_selected', (data: unknown) => {
      const d = data as { gameId?: string; game_id?: string };
      const gid = d.gameId || d.game_id || '';
      if (gid) setSelectedGame(gid);
    });
    gameWS.on('game_started', (data: unknown) => {
      const d = data as { gameId?: string; game_id?: string };
      const gid = d.gameId || d.game_id || '';
      navigate(`/play/multi/${roomCode}`, { state: { gameId: gid } });
    });
    return () => {
      gameWS.off('room_state');
      gameWS.off('player_joined');
      gameWS.off('player_left');
      gameWS.off('player_ready');
      gameWS.off('game_selected');
      gameWS.off('game_started');
    };
  }, [roomCode, navigate, setPlayers, setSelectedGame]);


  function toggleReady() {
    const next = !isReady;
    setIsReady(next);
    gameWS.send({ type: 'player_ready', playerId: currentPlayer?.id, isReady: next });
  }

  function handleSelectGame(gameId: string) {
    if (!isHost) return;
    setSelectedGame(gameId);
    gameWS.send({ type: 'select_game', gameId });
  }

  function handleStart() {
    gameWS.send({ type: 'start_game', gameId: selectedGame });
  }

  function handleLeave() {
    gameWS.disconnect();
    clearRoom();
    navigate('/multiplayer');
  }

  const allReady = localPlayers.length >= 2 && localPlayers.every(p => p.isReady || p.isHost);
  const wsColors: Record<string, string> = { connected: 'var(--success)', connecting: 'var(--accent)', disconnected: 'var(--danger)', error: 'var(--danger)' };

  return (
    <div className="page">
      <Header />
      <div className="container" style={{ maxWidth: 560, flex: 1, paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>🎮 Lobby</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: wsColors[wsStatus] || 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: wsColors[wsStatus] || 'var(--text-muted)', display: 'inline-block' }} />
            {wsStatus}
          </div>
        </div>

        {/* Room Code */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room Code</div>
          <div className="room-code-display">{roomCode}</div>
        </div>

        {/* Players */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Players ({localPlayers.length})</div>
          <div className="player-list">
            {localPlayers.map(p => (
              <div key={p.id} className="lobby-player">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{p.avatar}</span>
                  <div>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    {p.isHost && <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>HOST</span>}
                  </div>
                </div>
                <span className={`badge ${p.isReady || p.isHost ? 'badge-success' : 'badge-warning'}`}>
                  {p.isReady || p.isHost ? '✓ Ready' : '⏳ Not Ready'}
                </span>
              </div>
            ))}
            {localPlayers.length < 2 && (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic' }}>Waiting for players...</div>
            )}
          </div>
        </div>

        {/* Game select (host only) */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Game {!isHost && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>(host selects)</span>}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {GAME_LIST.filter(g => g.supportsMultiplayer).map(game => (
              <button
                key={game.id}
                disabled={!isHost}
                onClick={() => handleSelectGame(game.id)}
                style={{
                  background: selectedGame === game.id ? 'var(--primary-light)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${selectedGame === game.id ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '0.6rem 1rem', cursor: isHost ? 'pointer' : 'default',
                  color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', transition: 'all 0.2s',
                  opacity: isHost ? 1 : 0.7,
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{game.icon}</span>
                <span style={{ fontWeight: 600 }}>{game.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="danger" size="md" onClick={handleLeave}>Leave</Button>
          {!isHost && (
            <Button variant={isReady ? 'ghost' : 'success' as 'ghost'} size="md" onClick={toggleReady} style={{ flex: 1 }}>
              {isReady ? '✓ Ready!' : 'Mark Ready'}
            </Button>
          )}
          {isHost && (
            <Button variant="primary" size="lg" disabled={!allReady || !selectedGame} onClick={handleStart} style={{ flex: 1 }}>
              Start Game →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
