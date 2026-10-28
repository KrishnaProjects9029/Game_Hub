import { describe, it, expect } from 'vitest';
import { webrtcManager } from '../webrtc';
import { TicTacToeEngine } from '../../games/tictactoe/TicTacToe';

describe('WebRTC Network Protocol and Authoritative Validation', () => {
  it('generates unpredictable room codes in GH-XXXXXX format', () => {
    // Generate room code format test
    const code = (webrtcManager as unknown as { generateRoomCode: () => string }).generateRoomCode();
    expect(code).toMatch(/^GH-[A-Z0-9]{6}$/);
  });

  it('formats peer IDs predictably for signaling discovery', () => {
    const peerId = (webrtcManager as unknown as { getPeerId: (code: string) => string }).getPeerId('GH-7X9K2P');
    expect(peerId).toBe('gamehub-p2p-GH7X9K2P');
  });

  it('validates authoritative move logic using the game engine rules', () => {
    const engine = new TicTacToeEngine();
    const p1 = 'host_player';
    const p2 = 'guest_player';
    const state = engine.getInitialState([p1, p2], { [p1]: 'Alice', [p2]: 'Bob' });

    // Host move (legal)
    const canHostMove = engine.validateMove(state, { row: 1, col: 1 }, p1);
    expect(canHostMove).toBe(true);

    // Guest move out of turn (illegal)
    const canGuestMoveOutOfTurn = engine.validateMove(state, { row: 0, col: 0 }, p2);
    expect(canGuestMoveOutOfTurn).toBe(false);
  });
});
