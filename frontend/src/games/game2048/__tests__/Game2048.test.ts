import { describe, it, expect } from 'vitest';
import { Game2048Engine } from '../Game2048';

describe('Game2048Engine Rules and Merging Logic', () => {
  const engine = new Game2048Engine();

  it('slides and merges a single row correctly to the left', () => {
    // [2, 2, 0, 0] => [4, 0, 0, 0]
    const r1 = engine.slideLeft([2, 2, 0, 0]);
    expect(r1.newRow).toEqual([4, 0, 0, 0]);
    expect(r1.scoreGained).toBe(4);

    // [2, 2, 2, 2] => [4, 4, 0, 0]
    const r2 = engine.slideLeft([2, 2, 2, 2]);
    expect(r2.newRow).toEqual([4, 4, 0, 0]);
    expect(r2.scoreGained).toBe(8);

    // [0, 4, 0, 4] => [8, 0, 0, 0]
    const r3 = engine.slideLeft([0, 4, 0, 4]);
    expect(r3.newRow).toEqual([8, 0, 0, 0]);
    expect(r3.scoreGained).toBe(8);

    // [2, 0, 4, 8] => [2, 4, 8, 0]
    const r4 = engine.slideLeft([2, 0, 4, 8]);
    expect(r4.newRow).toEqual([2, 4, 8, 0]);
    expect(r4.scoreGained).toBe(0);
  });

  it('detects when board has changed on move', () => {
    const board = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    // Sliding LEFT when tile is already leftmost => no change
    const resLeft = engine.moveBoard(board, 'LEFT');
    expect(resLeft.changed).toBe(false);

    // Sliding RIGHT => changes
    const resRight = engine.moveBoard(board, 'RIGHT');
    expect(resRight.changed).toBe(true);
    expect(resRight.newBoard[0][3]).toBe(2);
  });

  it('detects game over state when board is full and no adjacent tiles match', () => {
    const fullBoard = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(engine.hasLegalMoves(fullBoard)).toBe(false);

    // But if one adjacent matches:
    fullBoard[0][0] = 4;
    expect(engine.hasLegalMoves(fullBoard)).toBe(true);
  });

  it('supports undoing a move', () => {
    const state = engine.getInitialState(['player1']);
    // Apply valid slide
    const next = engine.applyMove(state, { type: 'SLIDE', direction: 'DOWN' }, 'player1');
    expect(next.previousBoard).not.toBeNull();

    // Undo
    const undone = engine.applyMove(next, { type: 'UNDO' }, 'player1');
    expect(undone.board).toEqual(state.board);
    expect(undone.score).toBe(state.score);
  });
});
