import Peer, { DataConnection } from 'peerjs';
import { GAME_REGISTRY } from '../games/engine/GameRegistry';
import { Move, WinResult } from '../games/engine/GameEngine';

export type WebRTCStatus =
  | 'idle'
  | 'connecting'
  | 'waiting_for_opponent'
  | 'connected'
  | 'reconnecting'
  | 'opponent_disconnected'
  | 'error'
  | 'service_unavailable';

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
}

export type WebRTCMessage =
  | { type: 'GUEST_JOIN'; player: RoomPlayer }
  | { type: 'ROOM_SYNC'; roomCode: string; gameId: string; players: RoomPlayer[]; state: unknown }
  | { type: 'MOVE_REQUEST'; move: Move; playerId: string }
  | { type: 'STATE_UPDATE'; state: unknown; isGameOver: boolean; winResult: WinResult | null }
  | { type: 'MOVE_REJECTED'; reason: string }
  | { type: 'REMATCH_REQUEST'; playerId: string }
  | { type: 'REMATCH_ACCEPTED'; state: unknown }
  | { type: 'OPPONENT_DISCONNECTED' }
  | { type: 'PING' }
  | { type: 'PONG' };

export class WebRTCGameManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;

  public roomCode: string = '';
  public gameId: string = 'tictactoe';
  public isHost: boolean = false;
  public status: WebRTCStatus = 'idle';
  public players: RoomPlayer[] = [];
  public currentGameState: unknown = null;
  public errorMessage: string = '';

  private statusListeners = new Set<(status: WebRTCStatus) => void>();
  private playersListeners = new Set<(players: RoomPlayer[]) => void>();
  private stateListeners = new Set<(state: unknown, isOver: boolean, win: WinResult | null) => void>();
  private disconnectListeners = new Set<() => void>();

  private updateStatus(newStatus: WebRTCStatus, err = '') {
    this.status = newStatus;
    this.errorMessage = err;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  public subscribeStatus(fn: (status: WebRTCStatus) => void) {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  public subscribePlayers(fn: (players: RoomPlayer[]) => void) {
    this.playersListeners.add(fn);
    fn(this.players);
    return () => this.playersListeners.delete(fn);
  }

  public subscribeState(fn: (state: unknown, isOver: boolean, win: WinResult | null) => void) {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  public subscribeDisconnect(fn: () => void) {
    this.disconnectListeners.add(fn);
    return () => this.disconnectListeners.delete(fn);
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `GH-${code}`;
  }

  private getPeerId(code: string): string {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `gamehub-p2p-${clean}`;
  }

  public createRoom(
    gameId: string,
    hostPlayer: { id: string; name: string; avatar: string }
  ): Promise<string> {
    this.cleanup();
    this.isHost = true;
    this.gameId = gameId;
    this.roomCode = this.generateRoomCode();
    this.updateStatus('connecting');

    const peerId = this.getPeerId(this.roomCode);
    const hostInfo: RoomPlayer = {
      ...hostPlayer,
      isHost: true,
      isReady: true,
    };
    this.players = [hostInfo];
    this.playersListeners.forEach((fn) => fn(this.players));

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        this.peer.on('open', () => {
          this.updateStatus('waiting_for_opponent');
          resolve(this.roomCode);
        });

        this.peer.on('connection', (connection) => {
          this.conn = connection;
          this.setupConnectionHandlers();
        });

        this.peer.on('error', (err) => {
          console.error('WebRTC Peer Error:', err);
          this.updateStatus('error', err.message || 'Connection failed');
          reject(err);
        });
      } catch (e) {
        this.updateStatus('service_unavailable', 'WebRTC signaling unavailable');
        reject(e);
      }
    });
  }

  public joinRoom(
    roomCode: string,
    guestPlayer: { id: string; name: string; avatar: string }
  ): Promise<void> {
    this.cleanup();
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase().trim();
    this.updateStatus('connecting');

    const targetPeerId = this.getPeerId(this.roomCode);

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer({
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        this.peer.on('open', () => {
          if (!this.peer) return;
          const connection = this.peer.connect(targetPeerId, { reliable: true });
          this.conn = connection;

          connection.on('open', () => {
            const guestInfo: RoomPlayer = {
              ...guestPlayer,
              isHost: false,
              isReady: true,
            };
            this.send({ type: 'GUEST_JOIN', player: guestInfo });
            this.setupConnectionHandlers();
            resolve();
          });

          connection.on('error', (err) => {
            this.updateStatus('error', 'Could not connect to host. Check room code.');
            reject(err);
          });
        });

        this.peer.on('error', (err) => {
          this.updateStatus('error', err.message || 'Join failed');
          reject(err);
        });
      } catch (e) {
        this.updateStatus('service_unavailable', 'WebRTC signaling unavailable');
        reject(e);
      }
    });
  }

  private setupConnectionHandlers() {
    if (!this.conn) return;

    this.conn.on('data', (data) => {
      this.handleIncomingMessage(data as WebRTCMessage);
    });

    this.conn.on('close', () => {
      this.updateStatus('opponent_disconnected');
      this.disconnectListeners.forEach((fn) => fn());
    });

    this.conn.on('error', () => {
      this.updateStatus('opponent_disconnected');
      this.disconnectListeners.forEach((fn) => fn());
    });
  }

  private handleIncomingMessage(msg: WebRTCMessage) {
    if (!msg || typeof msg !== 'object') return;

    // HOST AUTHORITATIVE LOGIC
    if (this.isHost) {
      if (msg.type === 'GUEST_JOIN') {
        const guest = msg.player;
        this.players = [this.players[0], guest];
        this.playersListeners.forEach((fn) => fn(this.players));

        // Initialize authoritative game state
        const engine = GAME_REGISTRY[this.gameId];
        if (engine) {
          const pIds = [this.players[0].id, guest.id];
          const pNames = {
            [this.players[0].id]: this.players[0].name,
            [guest.id]: guest.name,
          };
          this.currentGameState = engine.getInitialState(pIds, pNames);
        }

        // Send full sync to guest
        this.send({
          type: 'ROOM_SYNC',
          roomCode: this.roomCode,
          gameId: this.gameId,
          players: this.players,
          state: this.currentGameState,
        });

        this.updateStatus('connected');
        this.stateListeners.forEach((fn) => fn(this.currentGameState, false, null));
      }

      if (msg.type === 'MOVE_REQUEST') {
        const { move, playerId } = msg;
        const engine = GAME_REGISTRY[this.gameId];
        if (!engine || !this.currentGameState) return;

        // Authoritative move validation
        if (engine.validateMove(this.currentGameState, move, playerId)) {
          const nextState = engine.applyMove(this.currentGameState, move, playerId);
          this.currentGameState = nextState;

          const winResult = engine.checkWinner(nextState);
          const isGameOver = !!winResult || engine.isGameOver(nextState);

          // Broadcast authoritative state to guest
          this.send({
            type: 'STATE_UPDATE',
            state: nextState,
            isGameOver,
            winResult,
          });

          // Update host local view
          this.stateListeners.forEach((fn) => fn(nextState, isGameOver, winResult));
        } else {
          this.send({ type: 'MOVE_REJECTED', reason: 'Illegal move rejected by host authority' });
        }
      }

      if (msg.type === 'REMATCH_REQUEST') {
        this.handleRematch();
      }
    } else {
      // GUEST LOGIC
      if (msg.type === 'ROOM_SYNC') {
        this.gameId = msg.gameId;
        this.players = msg.players;
        this.currentGameState = msg.state;
        this.playersListeners.forEach((fn) => fn(this.players));
        this.updateStatus('connected');
        this.stateListeners.forEach((fn) => fn(this.currentGameState, false, null));
      }

      if (msg.type === 'STATE_UPDATE') {
        this.currentGameState = msg.state;
        this.stateListeners.forEach((fn) => fn(msg.state, msg.isGameOver, msg.winResult));
      }

      if (msg.type === 'REMATCH_ACCEPTED') {
        this.currentGameState = msg.state;
        this.stateListeners.forEach((fn) => fn(msg.state, false, null));
      }

      if (msg.type === 'OPPONENT_DISCONNECTED') {
        this.updateStatus('opponent_disconnected');
        this.disconnectListeners.forEach((fn) => fn());
      }
    }
  }

  public submitMove(move: Move, playerId: string): boolean {
    if (this.status !== 'connected') return false;

    if (this.isHost) {
      const engine = GAME_REGISTRY[this.gameId];
      if (!engine || !this.currentGameState) return false;

      if (engine.validateMove(this.currentGameState, move, playerId)) {
        const nextState = engine.applyMove(this.currentGameState, move, playerId);
        this.currentGameState = nextState;

        const winResult = engine.checkWinner(nextState);
        const isGameOver = !!winResult || engine.isGameOver(nextState);

        this.send({
          type: 'STATE_UPDATE',
          state: nextState,
          isGameOver,
          winResult,
        });

        this.stateListeners.forEach((fn) => fn(nextState, isGameOver, winResult));
        return true;
      }
      return false;
    } else {
      // Guest sends move request to authoritative host
      this.send({ type: 'MOVE_REQUEST', move, playerId });
      return true;
    }
  }

  public requestRematch(playerId: string) {
    if (this.isHost) {
      this.handleRematch();
    } else {
      this.send({ type: 'REMATCH_REQUEST', playerId });
    }
  }

  private handleRematch() {
    if (!this.isHost) return;
    const engine = GAME_REGISTRY[this.gameId];
    if (!engine || this.players.length < 2) return;

    const pIds = [this.players[0].id, this.players[1].id];
    const pNames = {
      [this.players[0].id]: this.players[0].name,
      [this.players[1].id]: this.players[1].name,
    };
    this.currentGameState = engine.getInitialState(pIds, pNames);

    this.send({
      type: 'REMATCH_ACCEPTED',
      state: this.currentGameState,
    });

    this.stateListeners.forEach((fn) => fn(this.currentGameState, false, null));
  }

  private send(msg: WebRTCMessage) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(msg);
      } catch (err) {
        console.warn('Failed to send WebRTC message:', err);
      }
    }
  }

  public cleanup() {
    if (this.conn) {
      try {
        this.conn.close();
      } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    this.players = [];
    this.currentGameState = null;
    this.updateStatus('idle');
  }
}

export const webrtcManager = new WebRTCGameManager();
