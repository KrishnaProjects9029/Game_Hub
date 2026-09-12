/**
 * LocalNetworkManager.ts
 * -----------------------
 * Reusable network layer for offline-first local multiplayer:
 * - LAN Wi-Fi & Hotspot connectivity
 * - WebSocket connection pooling & reconnection
 * - Room discovery on local IP subnets
 * - Ping / Pong health monitoring
 */
import { gameWS } from '../websocket';
import { checkServerHealth, discoverRooms, DiscoveredRoom } from '../discovery';

export class LocalNetworkManager {
  private static instance: LocalNetworkManager;
  private currentHostIp: string = 'localhost';
  private currentPort: number = 8000;

  private constructor() {}

  public static getInstance(): LocalNetworkManager {
    if (!LocalNetworkManager.instance) {
      LocalNetworkManager.instance = new LocalNetworkManager();
    }
    return LocalNetworkManager.instance;
  }

  public setHost(ip: string, port: number = 8000): void {
    this.currentHostIp = ip;
    this.currentPort = port;
  }

  public getHostIp(): string {
    return this.currentHostIp;
  }

  public getPort(): number {
    return this.currentPort;
  }

  public async isServerAvailable(ip?: string, port?: number): Promise<boolean> {
    const host = ip || this.currentHostIp;
    const p = port || this.currentPort;
    return await checkServerHealth(host, p);
  }

  public async scanRooms(ip?: string, port?: number): Promise<DiscoveredRoom[]> {
    const host = ip || this.currentHostIp;
    const p = port || this.currentPort;
    return await discoverRooms(host, p);
  }

  public async connectSocket(roomCode: string, playerId: string): Promise<void> {
    await gameWS.connect(this.currentHostIp, this.currentPort, roomCode, playerId);
  }

  public disconnectSocket(): void {
    gameWS.disconnect();
  }

  public send(type: string, payload: Record<string, unknown> = {}): void {
    gameWS.send({ type, ...payload });
  }

  public on(type: string, handler: (data: unknown) => void): void {
    gameWS.on(type, handler);
  }

  public off(type: string): void {
    gameWS.off(type);
  }

  public getSocketStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    return gameWS.getStatus();
  }
}

export const localNetworkManager = LocalNetworkManager.getInstance();
