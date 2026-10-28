import { describe, it, expect } from 'vitest';
import { CheckersEngine } from '../Checkers';

describe('CheckersEngine Rules and Piece Movement', () => {
  const engine = new CheckersEngine();

  it('initializes board with 12 red pieces and 12 black pieces on dark squares', () => {
    const state = engine.getInitialState(['player1', 'player2']);
    expect(state.redPiecesCount).toBe(12);
    expect(state.blackPiecesCount).toBe(12);
    expect(state.turn).toBe('red');
    expect(state.isGameOver).toBe(false);
  });

  it('allows red piece to move diagonally forward (-1 row)', () => {
    const state = engine.getInitialState(['player1', 'player2']);
    // Red piece at (5, 0) or (5, 2)
    const validMoves = engine.getLegalMovesForPiece(state.board, 5, 2);
    expect(validMoves.length).toBeGreaterThan(0);
    // Target should be row 4
    expect(validMoves.every((m) => m.toR === 4)).toBe(true);
  });

  it('promotes piece to King when reaching the opposing back row', () => {
    const state = engine.getInitialState(['player1', 'player2']);
    state.board[1][2] = { id: 'test_red', color: 'red', isKing: false };
    state.board[0][1] = null; // empty landing square

    const next = engine.applyMove(
      state,
      {
        type: 'MAKE_MOVE',
        fromR: 1,
        fromC: 2,
        toR: 0,
        toC: 1,
      },
      'player1'
    );

    const promoted = next.board[0][1];
    expect(promoted).not.toBeNull();
    expect(promoted?.isKing).toBe(true);
  });

  it('performs jump capture and decrements opponent piece count', () => {
    const state = engine.getInitialState(['player1', 'player2']);
    // Setup capture: Red at (5, 2), Black at (4, 3), Empty at (3, 4)
    state.board[5][2] = { id: 'r_jumper', color: 'red', isKing: false };
    state.board[4][3] = { id: 'b_target', color: 'black', isKing: false };
    state.board[3][4] = null;

    const moves = engine.getLegalMovesForPiece(state.board, 5, 2);
    const jumpMove = moves.find((m) => m.isCapture && m.toR === 3 && m.toC === 4);
    expect(jumpMove).toBeDefined();

    const afterJump = engine.applyMove(
      state,
      {
        type: 'MAKE_MOVE',
        fromR: 5,
        fromC: 2,
        toR: 3,
        toC: 4,
      },
      'player1'
    );

    expect(afterJump.blackPiecesCount).toBe(11);
    expect(afterJump.board[4][3]).toBeNull();
    expect(afterJump.board[3][4]?.color).toBe('red');
  });
});
