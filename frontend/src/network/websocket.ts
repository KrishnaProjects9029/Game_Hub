type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

class GameWebSocket {
  private ws: WebSocket | null = null;
  private roomCode: string = '';
  private playerId: string = '';
  private messageHandlers: Map<string, (data: unknown) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private status: WsStatus = 'disconnected';
  private messageQueue: object[] = [];
  private hostIp: string = '';
  private port: number = 8000;

  connect(hostIp: string, port: number, roomCode: string, playerId: string): Promise<void> {
    this.hostIp = hostIp;
    this.port = port;
    this.roomCode = roomCode;
    this.playerId = playerId;
    this.reconnectAttempts = 0;
    return this.doConnect();
  }

  private doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = 'connecting';
      try {
        const url = `ws://${this.hostIp}:${this.port}/ws/${this.roomCode}/${this.playerId}`;
        this.ws = new WebSocket(url);
        this.ws.onopen = () => {
          this.status = 'connected';
          this.reconnectAttempts = 0;
          // Flush queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            if (msg) this.ws?.send(JSON.stringify(msg));
          }
          resolve();
        };
        this.ws.onmessage = (event: MessageEvent) => this.onMessage(event);
        this.ws.onclose = () => {
          this.status = 'disconnected';
          this.handleReconnect();
        };
        this.ws.onerror = () => {
          this.status = 'error';
          reject(new Error('WebSocket connection failed'));
        };
      } catch (err) {
        this.status = 'error';
        reject(err);
      }
    });
  }

  disconnect(): void {
    this.maxReconnects = 0; // prevent reconnect
    this.ws?.close();
    this.ws = null;
    this.status = 'disconnected';
    this.messageQueue = [];
  }

  send(message: object): void {
    if (this.status === 'connected' && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  on(messageType: string, handler: (data: unknown) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  off(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnects) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    setTimeout(() => {
      if (this.status !== 'connected') {
        this.doConnect().catch(() => {});
      }
    }, delay);
  }

  private onMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as { type: string; [key: string]: unknown };
      const handler = this.messageHandlers.get(data.type);
      if (handler) handler(data);
      const wildcardHandler = this.messageHandlers.get('*');
      if (wildcardHandler) wildcardHandler(data);
    } catch {
      // ignore malformed messages
    }
  }

  getStatus(): WsStatus {
    return this.status;
  }
}

export const gameWS = new GameWebSocket();
