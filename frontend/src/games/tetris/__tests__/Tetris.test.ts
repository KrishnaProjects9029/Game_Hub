import { describe, it, expect } from 'vitest';
import { TetrisEngine } from '../Tetris';

describe('TetrisEngine Rules and Line Clearing', () => {
  const engine = new TetrisEngine();

  it('initializes grid with 20 rows and 10 cols and valid current and next pieces', () => {
    const state = engine.getInitialState(['player1']);
    expect(state.grid.length).toBe(20);
    expect(state.grid[0].length).toBe(10);
    expect(state.currentPiece).toBeDefined();
    expect(state.nextPiece).toBeDefined();
    expect(state.score).toBe(0);
    expect(state.lines).toBe(0);
  });

  it('detects wall collision when trying to move out of bounds', () => {
    const state = engine.getInitialState(['player1']);
    state.currentPiece.x = 0;
    // Attempt move left beyond col 0
    const canMoveLeft = engine.validateMove(state, { type: 'MOVE_LEFT' });
    // If piece reaches 0, checkCollision will prevent further left movement
    if (state.currentPiece.shape.some((r) => r[0] !== 0)) {
      expect(canMoveLeft).toBe(false);
    }
  });

  it('drops piece down on DROP move', () => {
    const state = engine.getInitialState(['player1']);
    const startY = state.currentPiece.y;
    const next = engine.applyMove(state, { type: 'DROP' }, 'player1');
    expect(next.currentPiece.y).toBe(startY + 1);
  });

  it('rotates tetromino shape', () => {
    const shape = [
      [1, 0],
      [1, 1],
    ];
    const rotated = engine.rotateShape(shape);
    expect(rotated.length).toBe(2);
    expect(rotated[0]).toEqual([1, 1]);
    expect(rotated[1]).toEqual([1, 0]);
  });
});
